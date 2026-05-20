import { useState, useRef, useCallback, useEffect } from "react";

import { PlayerPanda } from "./components/scene/PlayerPanda";
import { TargetPanda } from "./components/scene/TargetPanda";
import { FaceControls } from "./components/controls/FaceControls";

import Timer from "./components/ui/Timer";
import HighscoreButton from "./components/ui/HighscoreButton";
import Button from "./components/ui/Button";
import GameResultModal from "./components/ui/GameResultModal";
import TutorialModal from "./components/ui/TutorialModal";

import { randomFace, scoreMatch } from "./utils/faceUtils";

import type { BlendshapeValues } from "./types/blendshape";

import { useGameStore } from "./store/gameStore";

import styles from "./App.module.css";
import "./App.css";

import { SceneLayout } from "./components/scene/SceneLayout";
import { defaultSceneConfig } from "./config/sceneConfig";
import { api } from "./api";

import ScoreboardModal from "./components/ui/ScoreboardModal";

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
  const [player, setPlayer] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  /* Read identity token when app loads */
  useEffect(() => {
    async function loadPlayer() {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get("identity_token");

        console.log("URL token:", tokenFromUrl);

        if (!tokenFromUrl) {
          setApiError("No identity token found. Using mock player.");
          const identity = await api.getIdentity("mock-token");

          console.log("Mock identity:", identity);

          setPlayer(identity.user);
          setIdentityToken("mock-token");
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
    stiffness: 100,
    damping: 12,
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

      console.log("Final score:", finalScore);

      if (transactionId && finalScore >= config.moneyBackThreshold) {
        const payoutAmount =
          finalScore >= config.doubleWinThreshold ? config.price * 2 : config.price;

        try {
          await api.payOut(transactionId, {
            amount: payoutAmount,
          });
        } catch (err) {
          console.error("Payout error", err);
        }
      }

      console.log("Payout complete");

      finishGame(finalScore);
      setFreezeControls(false);
      finalizeTimeoutRef.current = null;
    }, 600);
  }, [finishGame, transactionId, config]);

  /* Scoreboard */

  /*
    EXIT GAME
  */
  const handleExitGame = useCallback(() => {
    setScore(null);

    exitGame();
  }, [exitGame]);

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
          config={config}
          onExit={handleExitGame}
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
            {/* TIMER / HIGHSCORE BUTTON */}

            {phase === "playing" ? (
              <Timer
                duration={config.timerSeconds ?? 20}
                isRunning={phase === "playing"}
                onComplete={handleGameComplete}
                compact
              />
            ) : (
              <HighscoreButton onClick={() => setShowScoreboard(true)} />
            )}

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

            {/* BUTTONS */}

            <div className="bottom-controls">
              {phase !== "playing" && !isStarting && (
                <Button
                  onClick={async () => {
                    {handleReset()}

                    if (showTutorial) {
                      setShowTutorial(true);
                      return;
                    }

                    if (isStarting) return;

                    if (!identityToken) {
                      setApiError("Missing identity token.");
                      return;
                    }

                    try {
                      setIsStarting(true);

                      const transaction = await api.createTransaction({
                        identity_token: identityToken,
                        amount: config.price,
                        amusement_uuid: import.meta.env.VITE_AMUSEMENT_UUID,
                      });

                      setTransactionId(transaction.id);
                      setRewardToken(transaction.stamp);

                      const newTarget = randomFace();

                      setTarget(newTarget);
                      targetRef.current = newTarget;

                      setScore(null);
                      setTargetSpinTrigger((v) => v + 1);

                      startGame();
                    } catch (err) {
                      console.error("Transaction/create error", err);
                      setApiError("Could not create transaction.");
                      setIsStarting(false);
                    }
                  }}
                >
                  Play
                </Button>
              )}

              <Button onClick={() => setShowTutorial(true)} variant="secondary">
                Tutorial
              </Button>

              <Button onClick={handleReset}>Reset</Button>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
