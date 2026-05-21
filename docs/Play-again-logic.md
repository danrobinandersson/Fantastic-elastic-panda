# Play Again Logic — Fantastic Elastic Panda

## Overview

The Tivoli Centralbank API supports "Play Again" without redirecting the player back to Tivoli.
The same `identity_token` can be reused for multiple plays in the same session.

Token reuse only affects **stamps** — not payment or payout eligibility.

---

## Key Rules

| Rule | Detail |
|---|---|
| Identity token reuse | ✅ Allowed for multiple plays |
| Payment per play | ✅ Always deducted, every play |
| Stamp per play | ❌ First play only |
| Payout per play | ✅ Every play is eligible if player wins |
| New `transactionId` per play | ✅ Always — required for each payout |
| 3-minute stamp cooldown | Applies to getting a new stamp, not to playing again |

---

## What Changes Between Plays

```
Play 1  →  POST /transactions  →  costs €X  →  gets stamp  →  gets transactionId A
Play 2  →  POST /transactions  →  costs €X  →  no stamp    →  gets transactionId B
Play 3  →  POST /transactions  →  costs €X  →  no stamp    →  gets transactionId C
```

Each play produces a **new unique `transactionId`** which is required for that play's payout call.
Never reuse a `transactionId` across plays.

---

## Identity Token Lifecycle

```
Page load
  → Read identity_token from URL query param
  → Store in React state (never discard)
  → Scrub from URL: window.history.replaceState({}, "", window.location.pathname)
  → Optionally resolve player name: GET /identity-tokens/{token}

Play 1, 2, 3...
  → Use same identity_token for every POST /transactions call
  → Token is NOT consumed — it remains valid for the session
```

---

## State to Track

```ts
// Must persist across plays — never reset these between rounds
const [identityToken, setIdentityToken] = useState<string | null>(null);
const [player, setPlayer] = useState<{ id: string; name: string } | null>(null);

// Must reset between plays — these are per-round values
const [transactionId, setTransactionId] = useState<number>(0);
const [stamp, setStamp] = useState<Stamp | null>(null);
const [score, setScore] = useState<number | null>(null);
const [sessionId, setSessionId] = useState<string | null>(null);
const [target, setTarget] = useState<BlendshapeValues>({} as BlendshapeValues);
```

---

## Play / Play Again Handler

The same function handles both first play and subsequent plays.
The only difference is whether the API returns a stamp.

```ts
const handlePlay = async () => {
  if (!identityToken) {
    setApiError("Missing identity token.");
    return;
  }

  if (isStarting) return;

  try {
    setIsStarting(true);

    // Reset per-round state before starting
    setScore(null);
    setStamp(null);
    setTransactionId(0);
    setSessionId(null);

    // Always use the same identity_token
    const transaction = await api.createTransaction({
      identity_token: identityToken,
      amount: config.price,
      api_key: import.meta.env.VITE_AMUSEMENT_API_KEY,
    });

    // Save new transactionId — this is unique per play
    setTransactionId(transaction.id);

    // Stamp is only present on the first play
    // On subsequent plays, transaction.stamp may be null
    if (transaction.stamp) {
      setStamp(transaction.stamp);
    }

    // Create a new Supabase game session for this play
    const sessionResult = await createGameSession(
      identityToken,
      blendshapesRef.current,
    );

    if (sessionResult) {
      setSessionId(sessionResult.sessionId);
    }

    // Generate new target face
    const newTarget = randomFace();
    setTarget(newTarget);
    targetRef.current = newTarget;

    // Reset player face
    handleReset();

    // Trigger target spin animation
    setTargetSpinTrigger((v) => v + 1);

    // Start the game
    startGame();

  } catch (err) {
    console.error("Play error:", err);

    // Distinguish error types for better UX
    if (err?.status === 402) {
      setApiError("Insufficient balance.");
    } else if (err?.status === 401) {
      setApiError("Session expired. Please return to Tivoli.");
    } else {
      setApiError("Could not start game. Please try again.");
    }

    setIsStarting(false);
  }
};
```

---

## Finish Game / Payout Handler

Each play has its own `transactionId`. Always use the current play's `transactionId` for payout.

```ts
const handleGameComplete = useCallback(() => {
  setFreezeControls(true);

  finalizeTimeoutRef.current = window.setTimeout(async () => {
    const finalScore = scoreMatch(targetRef.current, blendshapesRef.current);
    setScore(finalScore);

    // Calculate payout based on score
    const payoutAmount = calculatePayout(finalScore, config.price);

    // Validate score and process payout via Supabase Edge Function
    if (sessionId && identityToken) {
      try {
        const result = await validateAndPayout({
          sessionId,
          identityToken,
          playerBlendshapes: blendshapesRef.current,
          targetBlendshapes: targetRef.current,
          tivoliTransactionId: transactionId,  // current play's transactionId
          payoutAmount,
        });

        if (result.data?.validatedScore !== undefined) {
          setValidatedScore(result.data.validatedScore);
        }
      } catch (err) {
        console.error("Payout error:", err);
      }
    }

    finishGame(finalScore);
    setFreezeControls(false);
    setIsStarting(false); // Allow Play Again button to appear
  }, 600);
}, [finishGame, transactionId, identityToken, sessionId, config]);
```

---

## Payout Tier Logic

```ts
function calculatePayout(score: number, price: number): number {
  if (score >= 98) return price * 5;  // near-perfect
  if (score >= 93) return price * 2;  // great match
  if (score >= 85) return price;      // money back
  return 0;                           // no payout
}
```

> Only call `POST /transactions/{id}/payout` if `payoutAmount > 0`.
> The Supabase Edge Function handles this check and makes the payout call server-side.

---

## Result Modal — Play Again Button

After the game ends, show the result and offer Play Again.
No redirect to Tivoli is needed.

```tsx
<GameResultModal
  score={score}
  stamp={stamp}           // null on plays 2, 3, etc.
  config={config}
  onExit={handleExitGame}
  onPlayAgain={() => {
    exitGame();           // reset phase to "idle"
    handlePlay();         // start next round immediately
  }}
  onShowHighScores={() => setShowScoreboard(true)}
/>
```

---

## Stamp Display Logic

Only show the stamp UI if a stamp was returned.
On Play Again, the stamp will be null — don't show a placeholder or "generating" message.

```tsx
// In GameResultModal
{stamp ? (
  <div className={styles.stamp}>
    <img src={stamp.image_url} alt={`${stamp.stamptype.animal} stamp`} />
    <p>
      You received a {stamp.stamptype.metal
        ? `${stamp.stamptype.metal} `
        : ""
      }{stamp.stamptype.animal} stamp!
    </p>
  </div>
) : (
  // Play Again — no stamp this round, don't mention it
  null
)}
```

---

## Error Handling

| Error | Code | Action |
|---|---|---|
| Token expired or invalid | `401` | Show message, offer link back to Tivoli |
| Insufficient balance | `402` | Show message, don't offer Play Again |
| Already paid out | `409` | Ignore silently or log |
| Validation error | `422` | Log and show generic error |

```ts
// After a 401, the identity_token is no longer usable
// Clear it and prompt the player to return to Tivoli
if (err?.status === 401) {
  setIdentityToken(null);
  setPlayer(null);
  setApiError("Your session has expired. Please return to Tivoli to play again.");
}
```

---

## What to Reset Between Plays

```ts
// On Play Again — reset these
setScore(null);
setValidatedScore(null);
setStamp(null);           // stamp only shows if new one is returned
setTransactionId(0);
setSessionId(null);
setTarget({} as BlendshapeValues);
setIsStarting(false);

// Do NOT reset these — they persist for the whole session
// identityToken
// player
```

---

## Full Round Lifecycle

```
Session start (page load)
  → Read + store identity_token
  → Scrub URL
  → Load player name

Round start (Play / Play Again)
  → Reset per-round state
  → POST /transactions (same token, new transactionId)
  → Create Supabase session
  → Generate target face
  → Start timer

Round end (timer expires)
  → Freeze controls
  → Calculate score
  → POST Supabase Edge Function (validate + payout)
  → Show result modal
  → Enable Play Again

Play Again
  → exitGame() to reset phase
  → handlePlay() — loops back to Round start

Exit
  → exitGame()
  → Optionally redirect to Tivoli
```

---

## Important: VP Risk

If your game's **total winnings exceed total stakes**, amusement owners receive **0 VP**.

Design your payout thresholds carefully so the house has a mathematical edge over time.
A 5x payout tier requires high score thresholds to remain sustainable.