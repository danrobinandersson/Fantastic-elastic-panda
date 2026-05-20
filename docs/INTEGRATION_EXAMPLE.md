/**
 * Integration Example: Wiring Supabase Edge Function into App.tsx
 * 
 * This shows how to update the finishGame flow to call the Edge Function
 * for authoritative score validation and payout orchestration.
 */

// In src/App.tsx, add this after the imports:

import { validateAndPayout, isRateLimitError, formatRateLimitError } from "./api/supabaseGameClient";

// Inside the App component, in the finishGame effect:

useEffect(() => {
  if (!transactionId || !identityToken) return;

  // Set a timeout to process payout
  const finalizeTimeoutRef = setTimeout(async () => {
    try {
      // Compute final score locally
      const finalScore = scoreMatch(playerBlendshapes, targetBlendshapes);
      
      // Determine if user won (you can adjust this threshold)
      const WIN_THRESHOLD = 60;
      const didWin = finalScore >= WIN_THRESHOLD;
      
      // Calculate payout if user won
      const finalPayout = didWin ? config.timerSeconds * 2 : 0; // Example payout logic

      // ============ NEW: Call Supabase Edge Function ============
      const result = await validateAndPayout({
        sessionId: `session-${transactionId}`, // Generate or store session ID
        identityToken,
        playerBlendshapes,
        targetBlendshapes,
        tivoliTransactionId: transactionId,
        payoutAmount: finalPayout,
      });

      // Handle rate-limit error
      if (result.error) {
        if (isRateLimitError(result.error)) {
          console.warn(`Rate limited: ${formatRateLimitError(result.error)}`);
          setApiError(`Rate limited. Try again in ${result.error.resetSeconds}s`);
          
          // Retry after cooldown
          setTimeout(() => {
            setApiError(null);
            // Optionally show message to user
          }, result.error.resetSeconds * 1000);
          
          return;
        } else {
          console.error("Validation error:", result.error);
          setApiError(`Validation failed: ${result.error}`);
          return;
        }
      }

      // Success: Use server-validated score
      if (result.data) {
        console.log("Server-validated score:", result.data.validatedScore);
        console.log("Payout result:", {
          requested: result.data.payoutRequested,
          success: result.data.payoutSuccess,
          error: result.data.payoutError,
        });

        // Update game store with validated score
        finishGame(result.data.validatedScore);

        // Store payout status if needed
        if (!result.data.payoutSuccess && result.data.payoutError) {
          setApiError(`Payout failed: ${result.data.payoutError}`);
        }
      }
    } catch (error) {
      console.error("Finalize error:", error);
      setApiError(`Game completion error: ${error}`);
      finishGame(finalScore); // Still finish game even if validation fails
    }
  }, 600); // 600ms delay after timer ends

  return () => clearTimeout(finalizeTimeoutRef);
}, [
  transactionId,
  identityToken,
  playerBlendshapes,
  targetBlendshapes,
  config,
  finishGame,
]);

// ============ OPTIONAL: Create session on game start ============

// When user clicks Play button:
const handlePlayClick = async () => {
  try {
    // Create transaction via Tivoli proxy
    const transaction = await api.createTransaction({
      identity_token: identityToken!,
      amount: config.price ?? 0,
      amusement_uuid: "your-amusement-uuid", // Get this from config
    });

    setTransactionId(transaction.id);
    
    // Optionally create session record in Supabase
    // const session = await createGameSession(identityToken, playerBlendshapes);
    // Store session ID for later use in validateAndPayout

    startGame();
  } catch (error) {
    console.error("Failed to start game:", error);
    setApiError("Could not start game. Please try again.");
  }
};
