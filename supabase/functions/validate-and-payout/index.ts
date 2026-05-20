// Supabase Edge Function: validate-and-payout
// Purpose: Authoritative server-side game validation + orchestrated payout flow
// URL: POST /functions/v1/validate-and-payout
// Features: Rate-limiting, score validation, payout orchestration, error recovery

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const CENTRALBANK_BASE_URL = Deno.env.get("CENTRALBANK_BASE_URL") || "https://api-develop-b059.up.railway.app";
const AMUSEMENT_API_KEY = Deno.env.get("AMUSEMENT_API_KEY");
const SB_URL = Deno.env.get("SB_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

if (!AMUSEMENT_API_KEY || !SB_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing required environment variables");
}

const supabase = createClient(SB_URL, SERVICE_ROLE_KEY);

// Controllable blendshapes (from frontend config)
const CONTROLLABLE_MORPH_KEYS = [
  'L_Brow_Down', 'L_Brow_Left', 'L_Brow_Right', 'L_Brow_Up',
  'L_Cheek_Down', 'L_Cheek_Left', 'L_Cheek_Up',
  'L_Ear_Down', 'L_Ear_Left', 'L_Ear_Right', 'L_Ear_Up',
  'Mouth_Down', 'Mouth_Left', 'Mouth_Right', 'Mouth_Up',
  'Nose_Down', 'Nose_Left', 'Nose_Right', 'Nose_Up',
  'R_Brow_Down', 'R_Brow_Left', 'R_Brow_Right', 'R_Brow_Up',
  'R_Cheek_Down', 'R_Cheek_Right', 'R_Cheek_Up',
  'R_Ear_Down', 'R_Ear_Left', 'R_Ear_Right', 'R_Ear_Up',
] as const;

// Blendshape max values (default 1.0, can be overridden per key)
const BLENDSHAPE_MAX_VALUES: Record<string, number> = {
  // Ears (maxValue: 0.5)
  R_Ear_Right: 0.5, R_Ear_Left: 0.5, R_Ear_Up: 0.5, R_Ear_Down: 0.5,
  L_Ear_Right: 0.5, L_Ear_Left: 0.5, L_Ear_Up: 0.5, L_Ear_Down: 0.5,
  // Right cheek (maxValue: 0.70)
  R_Cheek_Right: 0.70, R_Cheek_Up: 0.70, R_Cheek_Down: 0.70,
  // Left cheek (maxValue: 0.65)
  L_Cheek_Left: 0.65, L_Cheek_Up: 0.65, L_Cheek_Down: 0.65,
  // Nose (maxValue: 0.5)
  Nose_Right: 0.5, Nose_Left: 0.5, Nose_Up: 0.5, Nose_Down: 0.5,
  // Mouth (maxValue: 0.75)
  Mouth_Right: 0.75, Mouth_Left: 0.75, Mouth_Up: 0.75, Mouth_Down: 0.75,
  // Brows default to 1.0, no entry needed
};

function getBlendshapeMaxValue(key: string): number {
  return BLENDSHAPE_MAX_VALUES[key] ?? 1.0;
}

// Constraint interface
interface Constraint {
  target: string;
  min?: (current: Record<string, number>) => number;
  max?: (current: Record<string, number>) => number;
}

// Constraints from frontend controlConstraints.ts
// Enforces mutually exclusive movements (up/down, left/right)
const CONSTRAINTS: Constraint[] = [
  // Mouth: Up and Down are mutually exclusive
  { target: 'Mouth_Up', max: (bs) => bs['Mouth_Down'] > 0 ? 0 : 1 },
  { target: 'Mouth_Down', max: (bs) => bs['Mouth_Up'] > 0 ? 0 : 1 },
  // Mouth: Left and Right are mutually exclusive
  { target: 'Mouth_Left', max: (bs) => bs['Mouth_Right'] > 0 ? 0 : 1 },
  { target: 'Mouth_Right', max: (bs) => bs['Mouth_Left'] > 0 ? 0 : 1 },

  // Brows: Up and Down are mutually exclusive per side
  { target: 'L_Brow_Up', max: (bs) => bs['L_Brow_Down'] > 0 ? 0 : 1 },
  { target: 'L_Brow_Down', max: (bs) => bs['L_Brow_Up'] > 0 ? 0 : 1 },
  { target: 'R_Brow_Up', max: (bs) => bs['R_Brow_Down'] > 0 ? 0 : 1 },
  { target: 'R_Brow_Down', max: (bs) => bs['R_Brow_Up'] > 0 ? 0 : 1 },
  // Brows: Left and Right are mutually exclusive per side
  { target: 'L_Brow_Left', max: (bs) => bs['L_Brow_Right'] > 0 ? 0 : 1 },
  { target: 'L_Brow_Right', max: (bs) => bs['L_Brow_Left'] > 0 ? 0 : 1 },
  { target: 'R_Brow_Left', max: (bs) => bs['R_Brow_Right'] > 0 ? 0 : 1 },
  { target: 'R_Brow_Right', max: (bs) => bs['R_Brow_Left'] > 0 ? 0 : 1 },

  // Cheeks: Up and Down are mutually exclusive per side
  { target: 'L_Cheek_Up', max: (bs) => bs['L_Cheek_Down'] > 0 ? 0 : 1 },
  { target: 'L_Cheek_Down', max: (bs) => bs['L_Cheek_Up'] > 0 ? 0 : 1 },
  { target: 'R_Cheek_Up', max: (bs) => bs['R_Cheek_Down'] > 0 ? 0 : 1 },
  { target: 'R_Cheek_Down', max: (bs) => bs['R_Cheek_Up'] > 0 ? 0 : 1 },

  // Ears: Up and Down are mutually exclusive per side
  { target: 'L_Ear_Up', max: (bs) => bs['L_Ear_Down'] > 0 ? 0 : 1 },
  { target: 'L_Ear_Down', max: (bs) => bs['L_Ear_Up'] > 0 ? 0 : 1 },
  { target: 'R_Ear_Up', max: (bs) => bs['R_Ear_Down'] > 0 ? 0 : 1 },
  { target: 'R_Ear_Down', max: (bs) => bs['R_Ear_Up'] > 0 ? 0 : 1 },
  // Ears: Left and Right are mutually exclusive per side
  { target: 'L_Ear_Left', max: (bs) => bs['L_Ear_Right'] > 0 ? 0 : 1 },
  { target: 'L_Ear_Right', max: (bs) => bs['L_Ear_Left'] > 0 ? 0 : 1 },
  { target: 'R_Ear_Left', max: (bs) => bs['R_Ear_Right'] > 0 ? 0 : 1 },
  { target: 'R_Ear_Right', max: (bs) => bs['R_Ear_Left'] > 0 ? 0 : 1 },

  // Nose: Up and Down are mutually exclusive
  { target: 'Nose_Up', max: (bs) => bs['Nose_Down'] > 0 ? 0 : 1 },
  { target: 'Nose_Down', max: (bs) => bs['Nose_Up'] > 0 ? 0 : 1 },
  // Nose: Left and Right are mutually exclusive
  { target: 'Nose_Left', max: (bs) => bs['Nose_Right'] > 0 ? 0 : 1 },
  { target: 'Nose_Right', max: (bs) => bs['Nose_Left'] > 0 ? 0 : 1 },
];

// Apply all constraints to a blendshape values object
function applyConstraints(values: Record<string, number>): Record<string, number> {
  for (const constraint of CONSTRAINTS) {
    const currentValue = values[constraint.target] ?? 0;
    let clampedValue = currentValue;

    if (constraint.min) {
      const minAllowed = constraint.min(values);
      if (clampedValue < minAllowed) {
        clampedValue = minAllowed;
      }
    }

    if (constraint.max) {
      const maxAllowed = constraint.max(values);
      if (clampedValue > maxAllowed) {
        clampedValue = maxAllowed;
      }
    }

    values[constraint.target] = clampedValue;
  }

  return values;
}

// Rate limit constants (tunable)
const RATE_LIMIT_WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_MINUTE = 10;
const COOLDOWN_AFTER_PAYOUT_SECONDS = 5;

interface ValidatePayoutRequest {
  sessionId: string;
  identityToken: string;
  playerBlendshapes: Record<string, number>;
  targetBlendshapes: Record<string, number>;
  tivoliTransactionId: number;
  payoutAmount: number;
}

interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetSeconds: number;
}

function scoreMatch(
  playerShapes: Record<string, number>,
  targetShapes: Record<string, number>,
): number {
  let sumError = 0;

  for (const key of CONTROLLABLE_MORPH_KEYS) {
    const max = getBlendshapeMaxValue(key);
    const targetVal = ((targetShapes[key] ?? 0) / max);
    const playerVal = ((playerShapes[key] ?? 0) / max);
    sumError += Math.abs(targetVal - playerVal);
  }

  const avgError = sumError / CONTROLLABLE_MORPH_KEYS.length;
  return Math.max(0, Math.round((1 - avgError) * 100));
}

async function checkRateLimit(userId: string, requestType: string): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_SECONDS * 1000);

  const { data: recentRequests, error: countError } = await supabase
    .from("rate_limit_log")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .eq("request_type", requestType)
    .gte("created_at", windowStart.toISOString());

  if (countError) {
    console.error("Rate limit check error:", countError);
    return { allowed: false, remainingRequests: 0, resetSeconds: RATE_LIMIT_WINDOW_SECONDS };
  }

  const requestCount = recentRequests?.length || 0;
  const allowed = requestCount < MAX_REQUESTS_PER_MINUTE;
  const remainingRequests = Math.max(0, MAX_REQUESTS_PER_MINUTE - requestCount);

  return {
    allowed,
    remainingRequests,
    resetSeconds: RATE_LIMIT_WINDOW_SECONDS,
  };
}

async function recordRateLimitAttempt(userId: string, requestType: string): Promise<void> {
  const { error } = await supabase
    .from("rate_limit_log")
    .insert({ user_id: userId, request_type: requestType });

  if (error) console.error("Failed to record rate limit:", error);
}

async function processPayout(
  tivoliTransactionId: number,
  payoutAmount: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${CENTRALBANK_BASE_URL}/transactions/${tivoliTransactionId}/payout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: payoutAmount,
        api_key: AMUSEMENT_API_KEY,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Centralbank payout failed: ${error}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: `Payout network error: ${error}` };
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = (await req.json()) as ValidatePayoutRequest;

    const { sessionId, identityToken, playerBlendshapes, targetBlendshapes, tivoliTransactionId, payoutAmount } =
      body;

    if (
      !sessionId ||
      !identityToken ||
      !playerBlendshapes ||
      !targetBlendshapes ||
      tivoliTransactionId === null ||
      tivoliTransactionId === undefined ||
      payoutAmount === undefined
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Fetch or create session in database
    // Get or create user first
    let userId: string;
    
    // In mock mode (tivoliTransactionId = 0), create a mock user
    if (tivoliTransactionId === 0) {
      const mockUserName = `MockPlayer_${identityToken.substring(0, 8)}`;
      
      // Try to find existing mock user first
      const { data: existingMockUser, error: lookupError } = await supabase
        .from("game_users")
        .select("id")
        .eq("name", mockUserName)
        .single();
      
      if (existingMockUser) {
        userId = existingMockUser.id;
        console.log(`Using existing mock user: ${userId}`);
      } else if (lookupError?.code === "PGRST116") {
        // User doesn't exist, create it
        const { data: newUser, error: createUserError } = await supabase
          .from("game_users")
          .insert({ 
            name: mockUserName
          })
          .select("id")
          .single();

        if (createUserError || !newUser) {
          console.error("Failed to create mock user:", createUserError);
          throw new Error("Could not create user record");
        }
        userId = newUser.id;
        console.log(`Created new mock user: ${userId}`);
      } else if (lookupError) {
        console.error("Failed to lookup mock user:", lookupError);
        throw new Error("Could not lookup user record");
      } else {
        throw new Error("Could not determine mock user");
      }
    } else {
      // Real mode: look up by centralbank_user_id
      const { data: existingUser, error: userError } = await supabase
        .from("game_users")
        .select("id")
        .eq("centralbank_user_id", tivoliTransactionId)
        .single();

      if (existingUser) {
        userId = existingUser.id;
      } else if (userError?.code === "PGRST116") {
        // User doesn't exist, create it
        const { data: newUser, error: createUserError } = await supabase
          .from("game_users")
          .insert({ 
            name: `Player_${tivoliTransactionId}`,
            centralbank_user_id: tivoliTransactionId
          })
          .select("id")
          .single();

        if (createUserError || !newUser) {
          console.error("Failed to create user:", createUserError);
          throw new Error("Could not create user record");
        }
        userId = newUser.id;
      } else if (userError) {
        console.error("User query error:", userError);
        throw new Error("Could not query user");
      } else {
        throw new Error("User lookup failed");
      }
    }

    // Now get or create session
    let session;
    const { data: existingSession, error: sessionError } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("identity_token", identityToken)
      .single();

    if (existingSession) {
      session = existingSession;
    } else if (sessionError?.code === "PGRST116") {
      // Session doesn't exist, create it with the user_id
      const { data: newSession, error: createError } = await supabase
        .from("game_sessions")
        .insert({
          id: sessionId,
          user_id: userId,
          identity_token: identityToken,
          game_state: "in_progress",
          player_blendshapes: playerBlendshapes,
          target_blendshapes: targetBlendshapes,
        })
        .select()
        .single();

      if (createError || !newSession) {
        console.error("Failed to create session:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create game session" }),
          { status: 500, headers: corsHeaders },
        );
      }
      session = newSession;
    } else if (sessionError) {
      console.error("Session query error:", sessionError);
      return new Response(
        JSON.stringify({ error: "Session not found or invalid identity token" }),
        { status: 404, headers: corsHeaders },
      );
    }

    // Rate limit check: payout requests
    const rateLimit = await checkRateLimit(userId, "request_payout");
    if (!rateLimit.allowed) {
      await recordRateLimitAttempt(userId, "request_payout");
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Too many payout requests.",
          remainingRequests: rateLimit.remainingRequests,
          resetSeconds: rateLimit.resetSeconds,
        }),
        { status: 429, headers: corsHeaders },
      );
    }

    // Server-side score validation: Apply constraints first, then score
    // Make copies to avoid mutating original data
    const constrainedTarget = applyConstraints({ ...targetBlendshapes });
    const constrainedPlayer = applyConstraints({ ...playerBlendshapes });
    
    const validatedScore = scoreMatch(constrainedTarget, constrainedPlayer);
    console.log(`Validated score: ${validatedScore}`);

    // Update session with validated score and mark as completed
    const { error: updateError } = await supabase
      .from("game_sessions")
      .update({
        game_state: "completed",
        score_validated: validatedScore,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Failed to update session:", updateError);
      throw new Error("Failed to update game session");
    }

    // Record rate limit attempt for payout
    await recordRateLimitAttempt(userId, "request_payout");

    // If payout amount > 0, process payout
    let payoutResult: { success: boolean; error?: string } = { success: false, error: "No payout requested" };
    if (payoutAmount > 0) {
      payoutResult = await processPayout(tivoliTransactionId, payoutAmount);

      if (payoutResult.success) {
        const { error: payoutRecordError } = await supabase
          .from("payout_history")
          .insert({
            session_id: sessionId,
            user_id: userId,
            tivoli_transaction_id: tivoliTransactionId,
            amount: payoutAmount,
            status: "success",
            completed_at: new Date().toISOString(),
          });

        if (payoutRecordError) {
          console.error("Failed to record payout:", payoutRecordError);
        }
      } else {
        const { error: payoutRecordError } = await supabase
          .from("payout_history")
          .insert({
            session_id: sessionId,
            user_id: userId,
            tivoli_transaction_id: tivoliTransactionId,
            amount: payoutAmount,
            status: "failed",
            error_message: payoutResult.error,
            completed_at: new Date().toISOString(),
          });

        if (payoutRecordError) {
          console.error("Failed to record failed payout:", payoutRecordError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        sessionId,
        validatedScore,
        payoutRequested: payoutAmount,
        payoutSuccess: payoutResult.success,
        payoutError: payoutResult.error,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(
      JSON.stringify({ error: `Server error: ${error}` }),
      { status: 500, headers: corsHeaders },
    );
  }
});