import { useState, useRef, useCallback, useEffect } from "react";

import { PlayerPanda } from "./components/scene/PlayerPanda";
import { TargetPanda } from "./components/scene/TargetPanda";
import { FaceControls } from "./components/controls/FaceControls";
import { randomFace, scoreMatch } from "./utils/faceUtils";
import type { BlendshapeValues } from "./types/blendshape";
import { SceneLayout } from "./components/scene/SceneLayout";
import PlayButton from "./components/ui/PlayButton";
import Timer from "./components/ui/Timer";
import HighscoreButton from "./components/ui/HighscoreButton";
import GameResultModal from "./components/ui/GameResultModal";
import ScoreboardModal from "./components/ui/ScoreboardModal";
import TutorialModal from "./components/ui/TutorialModal";

import { useGameStore } from "./store/gameStore";

import styles from "./App.module.css";
import "./App.css";

import { defaultSceneConfig } from "./config/sceneConfig";
import { api } from "./api";
import ControlsHint from "./components/ui/ControlsHint";
import { validateAndPayout, createGameSession } from "./api/supabaseGameClient";
import ResetButton from "./components/ui/ResetButton";

import type { IdentityUser } from "./api/types";

export default function App() {
  /*
    GAME STORE
  */
  const phase = useGameStore((state) => state.phase);
  const config = useGameStore((state) => state.config);
  const startGame = useGameStore((state) => state.startGame);
  const finishGame = useGameStore((state) => state.finishGame);
  const exitGame = useGameStore((state) => state.exitGame);

  /* Add player / token / transaction state */

  const [identityToken, setIdentityToken] = useState<string | null>(null);
  const [_player, setPlayer] = useState<IdentityUser | null>(null);
  const [transactionId, setTransactionId] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [_apiError, setApiError] = useState<string | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [stamp, setStamp] = useState<{
  animal: string | null;
  metal: string | null;
  image_url: string | null;
} | null>(null);




  /* Read identity token when app loads */
  useEffect(() => {
    async function loadPlayer() {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get("identity_token");

        console.log("URL token:", tokenFromUrl);

        if (!tokenFromUrl) {
          setApiError("No identity token found. Using mock player.");

          // Use mock identity if VITE_USE_MOCK_API is true
          if (import.meta.env.VITE_USE_MOCK_API === "true") {
            const mockIdentity = {
              user: { id: 9999, name: "Test Player" },
            };
            setPlayer(mockIdentity.user);
            // Generate unique mock token for each session (to satisfy UNIQUE constraint on identity_token)
            setIdentityToken(`mock-token-${crypto.randomUUID()}`);
            return;
          }

          // Guest mode
          setIsGuestMode(true);

        setPlayer({
        id: 0,
        name: "Guest Player",
        });

        setIdentityToken(null);

return;
        }

        setIdentityToken(tokenFromUrl);

        const identity = await api.getIdentity(tokenFromUrl);

        console.log("Real identity:", identity);

        setPlayer(identity.user);

        window.history.replaceState({}, "", window.location.pathname);
      } catch (error) {
        console.error("Identity error:", error);
        setApiError("Could not load player identity.");
      }
    }

    loadPlayer();
  }, []);

  /*
    SCENE CONFIG
  */
  const [sceneConfig, setSceneConfig] = useState(defaultSceneConfig);

  /*
    PLAYER FACE
  */
  const [blendshapes, setBlendshapes] = useState<BlendshapeValues>(
    {} as BlendshapeValues,
  );

  /*
    TARGET FACE
  */
  const [target, setTarget] = useState<BlendshapeValues>(
    {} as BlendshapeValues,
  );

  /*
    SCORE
  */
  const [score, setScore] = useState<number | null>(null);

  /*
    REWARD TOKEN
  */
  const [rewardToken, setRewardToken] = useState<string | null>(null);

  /*
    RESET
  */
  const [resetTrigger, setResetTrigger] = useState(0);

  /* Tutorial modal */
  const [showTutorial, setShowTutorial] = useState(false);

  /*
    SPRING SETTINGS
  */
  const [springConfig, setSpringConfig] = useState({
    stiffness: 400,
    damping: 32,
    mass: 1,
  });

  /*
    TARGET OFFSETS
  */
  const yOffset = -0.25 + (target.Mouth_Down ?? 0) * 0.35;

  const zOffset =
    0 + ((target.L_Cheek_Down || target.R_Cheek_Right) ?? 0) * -0.1;

  /*
    REFS
  */
  const blendshapesRef = useRef(blendshapes);

  const targetRef = useRef(target);

  blendshapesRef.current = blendshapes;
  targetRef.current = target;

  /*
    TARGET SPIN
  */
  const [targetSpinTrigger, setTargetSpinTrigger] = useState(0);

  const TARGET_SPIN_START_DEGREES = -720;

  const TARGET_SPIN_DURATION_MS = 1200;

  /*
    RESET PLAYER FACE
  */
  const handleReset = () => {
    setResetTrigger((v) => v + 1);

    setSpringConfig({
      stiffness: 180,
      damping: 8,
      mass: 1.4,
    });

    setTimeout(() => {
      setSpringConfig({
        stiffness: 100,
        damping: 12,
        mass: 1,
      });
    }, 1500);
  };

  /*
    FINISH GAME
  */
  /*
  FINISH GAME
*/
  const finalizeTimeoutRef = useRef<number | null>(null);

  const [showScoreboard, setShowScoreboard] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [freezeControls, setFreezeControls] = useState(false);

const handleGameComplete = useCallback(() => {
  setFreezeControls(true);

  if (finalizeTimeoutRef.current) {
    window.clearTimeout(finalizeTimeoutRef.current);
    finalizeTimeoutRef.current = null;
  }

  finalizeTimeoutRef.current = window.setTimeout(async () => {
    const finalScore = scoreMatch(targetRef.current, blendshapesRef.current);

    setScore(finalScore);
    await saveScore(finalScore);

    console.log("Final score:", finalScore);

    if (
      !isGuestMode &&
      sessionId &&
      identityToken &&
      finalScore >= config.moneyBackThreshold
    ) {
      const payoutAmount =
        finalScore >= 95
          ? config.price * 5
          : finalScore >= 90
            ? config.price * 2
            : config.price;

      try {
        const result = await validateAndPayout({
          sessionId,
          identityToken,
          playerBlendshapes: blendshapesRef.current,
          targetBlendshapes: targetRef.current,
          tivoliTransactionId: transactionId || 0,
          payoutAmount,
        });

        console.log("Edge Function response:", result);

        if (result.error) {
          console.error("Edge Function error:", result.error);
        } else {
          if (result.data?.payoutSuccess) {
            setRewardToken(`💰 +€${payoutAmount.toFixed(2)}`);
          }

          if (result.data?.stamp) {
            setStamp(result.data.stamp);
          }
        }
      } catch (err) {
        console.error("Edge Function call error", err);
        setRewardToken("Payment processing...");
      }
    }

    finishGame(finalScore);
    setFreezeControls(false);
    finalizeTimeoutRef.current = null;
  }, 600);
}, [
  finishGame,
  transactionId,
  identityToken,
  sessionId,
  config,
  _player,
  isGuestMode,
]);


  /* Scoreboard */

  async function saveScore(finalScore: number) {
    if (!_player) {
      console.error("No player found, cannot save score");
      return;
    }

    await fetch(`${import.meta.env.VITE_SCOREBOARD_API_URL}/scores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        centralbankUserId: String(_player.id),
        playerName: _player.name,
        score: finalScore,
      }),
    });
  }

  /*
    EXIT GAME

  const handleExitGame = useCallback(() => {
    setScore(null);
    setRewardToken(null);
    setTransactionId(0);
    setSessionId(null);
    setTarget({} as BlendshapeValues);

    exitGame();
  }, [exitGame]);
    */

  /*
    RETURN TO TIVOLI
  */
  const handleReturnToTivoli = useCallback(() => {
  // Reset game state
  setScore(null);
  setRewardToken(null);
  setTransactionId(0);
  setSessionId(null);
  setTarget({} as BlendshapeValues);
  setIdentityToken(null);
  setPlayer(null);

  exitGame();

  // If running inside iframe → ask parent to close modal
  if (window.parent !== window) {
    window.parent.postMessage(
      { type: "AMUSEMENT_CLOSE" },
      "https://loopland.se"
    );
    return;
  }

  // Fallback if opened directly
  const tivoliUrl =
    import.meta.env.VITE_TIVOLI_REDIRECT_URL || "https://loopland.se/";

  window.location.href = tivoliUrl;
}, [exitGame]);

  /*
    PLAY AGAIN
  */
  const handlePlayAgain = useCallback(async () => {
  // Reset per-round state
  setScore(null);
  setRewardToken(null);
  setTransactionId(0);
  setSessionId(null);
  setTarget({} as BlendshapeValues);
  setStamp(null);

  if (!identityToken && !isGuestMode) {
    setApiError("Missing identity token.");
    return;
  }

  try {
    setIsStarting(true);

    // ONLY create transaction in paid mode
    if (!isGuestMode && identityToken) {
      const transaction = await api.createTransaction({
        identity_token: identityToken,
        amount: config.price,
      });

      setTransactionId(transaction.transaction_id);

      setStamp(transaction.stamp ?? null);

      if (transaction.stamp) {
        const stampText = transaction.stamp.metal
          ? `${transaction.stamp.metal} ${transaction.stamp.animal}`
          : transaction.stamp.animal;

        setRewardToken(stampText);
      } else {
        setRewardToken("No stamp this round");
      }

      // Create Supabase session
      const sessionResult = await createGameSession(
        identityToken,
        blendshapesRef.current,
      );

      if (sessionResult) {
        setSessionId(sessionResult.sessionId);
      }
    }

    // Generate target
    const newTarget = randomFace();

    setTarget(newTarget);
    targetRef.current = newTarget;

    handleReset();

    setTargetSpinTrigger((v) => v + 1);

    startGame();

    setIsStarting(false);
  } catch (err) {
    console.error("Play again error:", err);
    setApiError("Could not start new game.");
    setIsStarting(false);
  }
}, [
  identityToken,
  config.price,
  startGame,
  isGuestMode,
]);

  /* Show tutorial on first visit */
  useEffect(() => {
    try {
      const seen = window.localStorage.getItem("tutorialSeen");
      if (!seen) setShowTutorial(true);
    } catch (_) {}
  }, []);

  useEffect(() => {
    return () => {
      if (finalizeTimeoutRef.current) {
        window.clearTimeout(finalizeTimeoutRef.current);
        finalizeTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <main>
      {phase === "finished" && (
<GameResultModal
  score={score}
  token={rewardToken}
  stamp={stamp}
  isGuestMode={isGuestMode}
  config={config}
  onPlayAgain={handlePlayAgain}
  onReturnToTivoli={handleReturnToTivoli}
  onShowHighScores={() => setShowScoreboard(true)}
  
/>
      )}

      {showScoreboard && (
        <ScoreboardModal onClose={() => setShowScoreboard(false)} />
      )}

      {showTutorial && (
        <TutorialModal
          onClose={() => {
            setShowTutorial(false);
            try {
              window.localStorage.setItem("tutorialSeen", "true");
            } catch (_) {}
          }}
        />
      )}

      <div className="scene-wrapper">
        <div className="gameplay-frame">
          {/* =========================
              PLAYER PANDA
          ========================= */}

          <div className="panda-stage">
            <div className="panda-canvas-area">
              <SceneLayout
                config={sceneConfig}
                setConfig={setSceneConfig}
                className="main-canvas"
              >
                <PlayerPanda values={blendshapes} springConfig={springConfig} />
              </SceneLayout>
            </div>

            <FaceControls
              onBlendshapesChange={setBlendshapes}
              resetTrigger={resetTrigger}
              disabled={freezeControls}
            />
          </div>

          {/* =========================
              UI OVERLAY
          ========================= */}

          <div className="overlay-ui">
            <div className="UI-top-row">
              {/* TIMER / HIGHSCORE BUTTON */}

              {phase === "playing" ? (
                <Timer
                  duration={config.timerSeconds ?? 15}
                  isRunning={phase === "playing"}
                  onComplete={handleGameComplete}
                  compact
                />
              ) : (
                <HighscoreButton onClick={() => setShowScoreboard(true)} />
              )}
              <ResetButton onClick={handleReset} />
            </div>
            {/* TARGET WINDOW */}
            <div className={styles.targetWindow}>
              <h2 className={styles.windowText}>TARGET</h2>

              <div className={styles.targetCanvasWrapper}>
                {/* RADIAL BACKGROUND */}

                <div className={styles.targetBackground} />

                <SceneLayout
                  config={sceneConfig}
                  background={null}
                  cameraOverride={{
                    /* Slightly higher framing */
                    y: sceneConfig.camera.y * 1.1,
                    /* Closer zoom */
                    z: sceneConfig.camera.z * 0.65,
                  }}
                >
                  <group position={[0, yOffset, zOffset]}>
                    <TargetPanda
                      values={target}
                      spinTrigger={targetSpinTrigger}
                      spinStartDegrees={TARGET_SPIN_START_DEGREES}
                      spinDurationMs={TARGET_SPIN_DURATION_MS}
                      onSpinCovered={() => setTarget(randomFace())}
                    />
                  </group>
                </SceneLayout>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* BUTTONS */}

      <div className="bottom-controls">
        {phase !== "playing" && !isStarting && (
<PlayButton
  disabled={isStarting}
  cost={config.price}
  onClick={async () => {
    handleReset();

    if (showTutorial) {
      setShowTutorial(true);
      return;
    }

    if (isStarting) return;

    try {
      setIsStarting(true);

      // Paid mode only
      if (!isGuestMode && identityToken) {
        const transaction = await api.createTransaction({
          identity_token: identityToken,
          amount: config.price,
        });

        setTransactionId(transaction.transaction_id);

        setStamp(transaction.stamp ?? null);

        if (transaction.stamp) {
          const stampText = transaction.stamp.metal
            ? `${transaction.stamp.metal} ${transaction.stamp.animal}`
            : transaction.stamp.animal;

          setRewardToken(stampText);
        } else {
          setRewardToken("No stamp this round");
        }

        const sessionResult = await createGameSession(
          identityToken,
          blendshapesRef.current,
        );

        if (sessionResult) {
          setSessionId(sessionResult.sessionId);
        }
      }

      const newTarget = randomFace();

      setTarget(newTarget);
      targetRef.current = newTarget;

      setScore(null);

      setTargetSpinTrigger((v) => v + 1);

      startGame();

      setIsStarting(false);
    } catch (err) {
      console.error("Transaction/create error", err);
      setApiError("Could not create transaction.");
      setIsStarting(false);
    }
  }}
/>
        )}
        <ControlsHint onOpenTutorial={() => setShowTutorial(true)} />
      </div>
    </main>
  );
}
