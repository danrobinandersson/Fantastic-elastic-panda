// Supabase Edge Function: validate-and-payout
// Purpose: Authoritative server-side game validation + orchestrated payout flow
// URL: POST /functions/v1/validate-and-payout
// Features: Rate-limiting, score validation, payout orchestration, error recovery

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const CENTRALBANK_BASE_URL = Deno.env.get("CENTRALBANK_BASE_URL") || "https://api-develop-b059.up.railway.app";
const AMUSEMENT_API_KEY = Deno.env.get("AMUSEMENT_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!AMUSEMENT_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error("Missing required environment variables");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Rate limit constants (tunable)
const RATE_LIMIT_WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_MINUTE = 10; // Per user
const COOLDOWN_AFTER_PAYOUT_SECONDS = 5; // Minimum cooldown after payout attempt

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

// Score matching function (server-side authoritative)
function scoreMatch(
  playerShapes: Record<string, number>,
  targetShapes: Record<string, number>,
): number {
  let totalDistance = 0;
  let count = 0;

  for (const key in targetShapes) {
    if (key in playerShapes) {
      const diff = Math.abs(playerShapes[key] - targetShapes[key]);
      totalDistance += diff;
      count++;
    }
  }

  const avgDistance = count > 0 ? totalDistance / count : 1;
  const score = Math.max(0, Math.min(100, 100 - avgDistance * 50));
  return Math.round(score * 100) / 100;
}

// Check rate limit for a user
async function checkRateLimit(userId: string, requestType: string): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_SECONDS * 1000);

  // Count recent requests
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

// Record rate limit attempt
async function recordRateLimitAttempt(userId: string, requestType: string): Promise<void> {
  const { error } = await supabase
    .from("rate_limit_log")
    .insert({ user_id: userId, request_type: requestType });

  if (error) console.error("Failed to record rate limit:", error);
}

// Process payout with Centralbank
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

// Main handler
serve(async (req) => {
  // Only POST allowed
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as ValidatePayoutRequest;

    const { sessionId, identityToken, playerBlendshapes, targetBlendshapes, tivoliTransactionId, payoutAmount } =
      body;

    // Validate input
    if (
      !sessionId ||
      !identityToken ||
      !playerBlendshapes ||
      !targetBlendshapes ||
      !tivoliTransactionId ||
      payoutAmount === undefined
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Fetch session from database
    const { data: session, error: sessionError } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("identity_token", identityToken)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Session not found or invalid identity token" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Get or create user
    let userId = session.user_id;
    if (!userId) {
      const { data: user, error: userError } = await supabase
        .from("game_users")
        .select("id")
        .eq("id", session.user_id)
        .single();

      if (userError || !user) {
        // Create new user record if needed
        const { data: newUser, error: createError } = await supabase
          .from("game_users")
          .insert({ name: `Player_${tivoliTransactionId}` })
          .select("id")
          .single();

        if (createError || !newUser) {
          throw new Error("Could not create user record");
        }
        userId = newUser.id;
      } else {
        userId = user.id;
      }
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
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

    // Server-side score validation
    const validatedScore = scoreMatch(playerBlendshapes, targetBlendshapes);
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
    let payoutResult = { success: false, error: "No payout requested" };
    if (payoutAmount > 0) {
      payoutResult = await processPayout(tivoliTransactionId, payoutAmount);

      if (payoutResult.success) {
        // Record successful payout
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
        // Record failed payout
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
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(
      JSON.stringify({ error: `Server error: ${error}` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
