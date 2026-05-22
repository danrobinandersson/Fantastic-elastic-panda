/**
 * Supabase Game Client
 * 
 * Handles communication with Supabase Edge Function for:
 * - Authoritative score validation
 * - Payout orchestration
 * - Rate-limit tracking
 */

export interface ValidatePayoutRequest {
  sessionId: string;
  identityToken: string;
  playerBlendshapes: Record<string, number>;
  targetBlendshapes: Record<string, number>;
  tivoliTransactionId: number;
  payoutAmount: number;
}

export interface ValidatePayoutResponse {
  sessionId: string;
  validatedScore: number;
  payoutRequested: number;
  payoutSuccess: boolean;
  payoutError?: string;
}

export interface RateLimitError {
  error: string;
  remainingRequests: number;
  resetSeconds: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "Supabase credentials not configured. Score validation will be disabled.",
  );
}

// Track client-side rate limit state to avoid hammering the API
let lastPayoutAttempt = 0;
const COOLDOWN_MILLISECONDS = 5000; // 5 seconds

export async function validateAndPayout(
  request: ValidatePayoutRequest,
): Promise<{ data?: ValidatePayoutResponse; error?: RateLimitError | string }> {
  // Client-side cooldown check (prevents excessive requests)
  const now = Date.now();
  const timeSinceLastAttempt = now - lastPayoutAttempt;

  if (timeSinceLastAttempt < COOLDOWN_MILLISECONDS) {
    const remainingCooldown = Math.ceil(
      (COOLDOWN_MILLISECONDS - timeSinceLastAttempt) / 1000,
    );
    return {
      error: `Please wait ${remainingCooldown}s before next payout attempt`,
    };
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return {
      error: "Supabase not configured. Validation disabled.",
    };
  }

  try {
    lastPayoutAttempt = now;

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/validate-and-payout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(request),
      },
    );

    const responseData = await response.json();

    // Handle rate-limit (429)
    if (response.status === 429) {
      return {
        error: {
          error: responseData.error || "Rate limit exceeded",
          remainingRequests: responseData.remainingRequests || 0,
          resetSeconds: responseData.resetSeconds || 60,
        },
      };
    }

    // Handle client error (4xx)
    if (response.status >= 400 && response.status < 500) {
      return {
        error: responseData.error || `Client error: ${response.status}`,
      };
    }

    // Handle server error (5xx)
    if (response.status >= 500) {
      return {
        error: responseData.error || `Server error: ${response.status}`,
      };
    }

    // Success (200)
    if (response.ok) {
      return {
        data: responseData as ValidatePayoutResponse,
      };
    }

    return {
      error: "Unknown response status",
    };
  } catch (err) {
    console.error("Supabase Edge Function error:", err);
    return {
      error: `Network error: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

/**
 * Create a game session in Supabase for tracking
 * Call this when the game starts (after receiving identity token)
 */
export async function createGameSession(
  _identityToken: string,
  _initialBlendshapes: Record<string, number>,
): Promise<{ sessionId: string } | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase not configured. Session creation disabled.");
    return null;
  }

  try {
    // Generate a unique session ID (UUID v4 format)
    const sessionId = crypto.randomUUID();

    // For now, we'll rely on the Edge Function to create the session record
    // when validateAndPayout is called. We just return the sessionId here.
    console.log("Session ID created:", sessionId);
    return { sessionId };
  } catch (err) {
    console.error("Failed to create game session:", err);
    return null;
  }
}

/**
 * Helper to format rate-limit error for UI display
 */
export function formatRateLimitError(error: RateLimitError): string {
  return `Rate limited. ${error.remainingRequests} requests remaining. Reset in ${error.resetSeconds}s.`;
}

/**
 * Helper to check if error is a rate-limit error
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return (
    typeof error === "object" &&
    error !== null &&
    "remainingRequests" in error &&
    "resetSeconds" in error
  );
}
