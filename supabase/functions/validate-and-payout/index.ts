import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SB_URL = Deno.env.get("SB_URL") ?? Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY =
  Deno.env.get("SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SB_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(SB_URL, SERVICE_ROLE_KEY);

const CONTROLLABLE_MORPH_KEYS = [
  "L_Brow_Down", "L_Brow_Left", "L_Brow_Right", "L_Brow_Up",
  "L_Cheek_Down", "L_Cheek_Left", "L_Cheek_Up",
  "L_Ear_Down", "L_Ear_Left", "L_Ear_Right", "L_Ear_Up",
  "Mouth_Down", "Mouth_Left", "Mouth_Right", "Mouth_Up",
  "Nose_Down", "Nose_Left", "Nose_Right", "Nose_Up",
  "R_Brow_Down", "R_Brow_Left", "R_Brow_Right", "R_Brow_Up",
  "R_Cheek_Down", "R_Cheek_Right", "R_Cheek_Up",
  "R_Ear_Down", "R_Ear_Left", "R_Ear_Right", "R_Ear_Up",
] as const;

const BLENDSHAPE_MAX_VALUES: Record<string, number> = {
  R_Ear_Right: 0.5,
  R_Ear_Left: 0.5,
  R_Ear_Up: 0.5,
  R_Ear_Down: 0.5,
  L_Ear_Right: 0.5,
  L_Ear_Left: 0.5,
  L_Ear_Up: 0.5,
  L_Ear_Down: 0.5,

  R_Cheek_Right: 0.7,
  R_Cheek_Up: 0.7,
  R_Cheek_Down: 0.7,

  L_Cheek_Left: 0.65,
  L_Cheek_Up: 0.65,
  L_Cheek_Down: 0.65,

  Nose_Right: 0.5,
  Nose_Left: 0.5,
  Nose_Up: 0.5,
  Nose_Down: 0.5,

  Mouth_Right: 0.75,
  Mouth_Left: 0.75,
  Mouth_Up: 0.75,
  Mouth_Down: 0.75,
};

function getBlendshapeMaxValue(key: string): number {
  return BLENDSHAPE_MAX_VALUES[key] ?? 1.0;
}

interface Constraint {
  target: string;
  min?: (current: Record<string, number>) => number;
  max?: (current: Record<string, number>) => number;
}

const CONSTRAINTS: Constraint[] = [
  { target: "Mouth_Up", max: (bs) => bs["Mouth_Down"] > 0 ? 0 : 1 },
  { target: "Mouth_Down", max: (bs) => bs["Mouth_Up"] > 0 ? 0 : 1 },
  { target: "Mouth_Left", max: (bs) => bs["Mouth_Right"] > 0 ? 0 : 1 },
  { target: "Mouth_Right", max: (bs) => bs["Mouth_Left"] > 0 ? 0 : 1 },

  { target: "L_Brow_Up", max: (bs) => bs["L_Brow_Down"] > 0 ? 0 : 1 },
  { target: "L_Brow_Down", max: (bs) => bs["L_Brow_Up"] > 0 ? 0 : 1 },
  { target: "R_Brow_Up", max: (bs) => bs["R_Brow_Down"] > 0 ? 0 : 1 },
  { target: "R_Brow_Down", max: (bs) => bs["R_Brow_Up"] > 0 ? 0 : 1 },

  { target: "L_Brow_Left", max: (bs) => bs["L_Brow_Right"] > 0 ? 0 : 1 },
  { target: "L_Brow_Right", max: (bs) => bs["L_Brow_Left"] > 0 ? 0 : 1 },
  { target: "R_Brow_Left", max: (bs) => bs["R_Brow_Right"] > 0 ? 0 : 1 },
  { target: "R_Brow_Right", max: (bs) => bs["R_Brow_Left"] > 0 ? 0 : 1 },

  { target: "L_Cheek_Up", max: (bs) => bs["L_Cheek_Down"] > 0 ? 0 : 1 },
  { target: "L_Cheek_Down", max: (bs) => bs["L_Cheek_Up"] > 0 ? 0 : 1 },
  { target: "R_Cheek_Up", max: (bs) => bs["R_Cheek_Down"] > 0 ? 0 : 1 },
  { target: "R_Cheek_Down", max: (bs) => bs["R_Cheek_Up"] > 0 ? 0 : 1 },

  { target: "L_Ear_Up", max: (bs) => bs["L_Ear_Down"] > 0 ? 0 : 1 },
  { target: "L_Ear_Down", max: (bs) => bs["L_Ear_Up"] > 0 ? 0 : 1 },
  { target: "R_Ear_Up", max: (bs) => bs["R_Ear_Down"] > 0 ? 0 : 1 },
  { target: "R_Ear_Down", max: (bs) => bs["R_Ear_Up"] > 0 ? 0 : 1 },

  { target: "L_Ear_Left", max: (bs) => bs["L_Ear_Right"] > 0 ? 0 : 1 },
  { target: "L_Ear_Right", max: (bs) => bs["L_Ear_Left"] > 0 ? 0 : 1 },
  { target: "R_Ear_Left", max: (bs) => bs["R_Ear_Right"] > 0 ? 0 : 1 },
  { target: "R_Ear_Right", max: (bs) => bs["R_Ear_Left"] > 0 ? 0 : 1 },

  { target: "Nose_Up", max: (bs) => bs["Nose_Down"] > 0 ? 0 : 1 },
  { target: "Nose_Down", max: (bs) => bs["Nose_Up"] > 0 ? 0 : 1 },
  { target: "Nose_Left", max: (bs) => bs["Nose_Right"] > 0 ? 0 : 1 },
  { target: "Nose_Right", max: (bs) => bs["Nose_Left"] > 0 ? 0 : 1 },
];

function applyConstraints(values: Record<string, number>): Record<string, number> {
  for (const constraint of CONSTRAINTS) {
    const currentValue = values[constraint.target] ?? 0;
    let clampedValue = currentValue;

    if (constraint.min) {
      clampedValue = Math.max(clampedValue, constraint.min(values));
    }

    if (constraint.max) {
      clampedValue = Math.min(clampedValue, constraint.max(values));
    }

    values[constraint.target] = clampedValue;
  }

  return values;
}

function sanitizeBlendshapes(input: unknown): Record<string, number> {
  const source =
    typeof input === "object" && input !== null
      ? input as Record<string, unknown>
      : {};

  const result: Record<string, number> = {};

  for (const key of CONTROLLABLE_MORPH_KEYS) {
    const raw = Number(source[key]);
    const max = getBlendshapeMaxValue(key);

    if (!Number.isFinite(raw)) {
      result[key] = 0;
    } else {
      result[key] = Math.max(0, Math.min(max, raw));
    }
  }

  return applyConstraints(result);
}

function remapScore(raw: number): number {
  const points: [number, number][] = [
    [0, 0],
    [90, 85],
    [93, 90],
    [98, 95],
    [100, 100],
  ];

  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i - 1];
    const [x2, y2] = points[i];

    if (raw <= x2) {
      const t = (raw - x1) / (x2 - x1);
      return Number((y1 + t * (y2 - y1)).toFixed(2));
    }
  }

  return Number(raw.toFixed(2));
}

function scoreMatch(
  playerShapes: Record<string, number>,
  targetShapes: Record<string, number>,
): number {
  let sumError = 0;

  for (const key of CONTROLLABLE_MORPH_KEYS) {
    const max = getBlendshapeMaxValue(key);
    const targetVal = (targetShapes[key] ?? 0) / max;
    const playerVal = (playerShapes[key] ?? 0) / max;

    sumError += Math.abs(targetVal - playerVal) * 0.78;
  }

  const avgError = sumError / CONTROLLABLE_MORPH_KEYS.length;
  const rawScore = Math.max(0, Number(((1 - avgError) * 100).toFixed(2)));

  return remapScore(rawScore);
}

const RATE_LIMIT_WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_MINUTE = 10;

interface ValidateScoreRequest {
  sessionId: string;
  identityToken: string;
  playerName: string;
  playerBlendshapes: Record<string, number>;
  targetBlendshapes: Record<string, number>;
}

interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetSeconds: number;
}

async function checkRateLimit(
  userId: string,
  requestType: string,
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_SECONDS * 1000);

  const { data, error } = await supabase
    .from("rate_limit_log")
    .select("id")
    .eq("user_id", userId)
    .eq("request_type", requestType)
    .gte("created_at", windowStart.toISOString());

  if (error) {
    console.error("Rate limit check error:", error);
    return {
      allowed: false,
      remainingRequests: 0,
      resetSeconds: RATE_LIMIT_WINDOW_SECONDS,
    };
  }

  const requestCount = data?.length ?? 0;

  return {
    allowed: requestCount < MAX_REQUESTS_PER_MINUTE,
    remainingRequests: Math.max(0, MAX_REQUESTS_PER_MINUTE - requestCount),
    resetSeconds: RATE_LIMIT_WINDOW_SECONDS,
  };
}

async function recordRateLimitAttempt(
  userId: string,
  requestType: string,
): Promise<void> {
  const { error } = await supabase
    .from("rate_limit_log")
    .insert({ user_id: userId, request_type: requestType });

  if (error) {
    console.error("Failed to record rate limit attempt:", error);
  }
}

function hashIdentityToken(identityToken: string): string {
  return identityToken.slice(0, 32);
}

function sanitizePlayerName(playerName: unknown): string {
  if (typeof playerName !== "string") return "Anonymous";

  const cleaned = playerName
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 32);

  return cleaned || "Anonymous";
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
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders },
    );
  }

  try {
    const body = await req.json() as ValidateScoreRequest;

    const {
      sessionId,
      identityToken,
      playerName,
      playerBlendshapes,
      targetBlendshapes,
    } = body;

    if (
      !sessionId ||
      !identityToken ||
      !playerBlendshapes ||
      !targetBlendshapes
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders },
      );
    }

    const safePlayerName = sanitizePlayerName(playerName);
    const identityHash = hashIdentityToken(identityToken);

    let userId: string;

    const { data: existingUser, error: userLookupError } = await supabase
      .from("game_users")
      .select("id")
      .eq("identity_token_hash", identityHash)
      .limit(1);

    if (userLookupError) {
      console.error("User lookup error:", userLookupError);
      throw new Error("Could not query user");
    }

    if (existingUser && existingUser.length > 0) {
      userId = existingUser[0].id;
    } else {
      const { data: newUser, error: createUserError } = await supabase
        .from("game_users")
        .insert({
          name: safePlayerName,
          identity_token_hash: identityHash,
        })
        .select("id")
        .single();

      if (createUserError || !newUser) {
        console.error("Failed to create user:", createUserError);
        throw new Error("Could not create user record");
      }

      userId = newUser.id;
    }

    const rateLimit = await checkRateLimit(userId, "submit_score");

    if (!rateLimit.allowed) {
      await recordRateLimitAttempt(userId, "submit_score");

      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Too many score submissions.",
          remainingRequests: rateLimit.remainingRequests,
          resetSeconds: rateLimit.resetSeconds,
        }),
        { status: 429, headers: corsHeaders },
      );
    }

    await recordRateLimitAttempt(userId, "submit_score");

    const constrainedPlayer = sanitizeBlendshapes(playerBlendshapes);
    const constrainedTarget = sanitizeBlendshapes(targetBlendshapes);

    const validatedScore = scoreMatch(constrainedPlayer, constrainedTarget);

    const { data: existingSession, error: sessionLookupError } = await supabase
      .from("game_sessions")
      .select("id, game_state")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionLookupError) {
      console.error("Session lookup error:", sessionLookupError);
      throw new Error("Could not query game session");
    }

    if (!existingSession) {
      const { error: createSessionError } = await supabase
        .from("game_sessions")
        .insert({
          id: sessionId,
          user_id: userId,
          identity_token: identityToken,
          game_state: "completed",
          player_blendshapes: constrainedPlayer,
          target_blendshapes: constrainedTarget,
          score_validated: validatedScore,
          completed_at: new Date().toISOString(),
        });

      if (createSessionError) {
        console.error("Failed to create session:", createSessionError);
        throw new Error("Failed to create game session");
      }
    } else {
      const { error: updateSessionError } = await supabase
        .from("game_sessions")
        .update({
          user_id: userId,
          identity_token: identityToken,
          game_state: "completed",
          player_blendshapes: constrainedPlayer,
          target_blendshapes: constrainedTarget,
          score_validated: validatedScore,
          completed_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (updateSessionError) {
        console.error("Failed to update session:", updateSessionError);
        throw new Error("Failed to update game session");
      }
    }

    const { error: scoreInsertError } = await supabase
      .from("scores")
      .insert({
        player_name: safePlayerName,
        score: validatedScore,
        session_id: sessionId,
        user_id: userId,
      });

    if (scoreInsertError) {
      console.error("Failed to insert score:", scoreInsertError);
      throw new Error("Failed to save score");
    }

    return new Response(
      JSON.stringify({
        sessionId,
        userId,
        playerName: safePlayerName,
        validatedScore,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Edge Function error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});