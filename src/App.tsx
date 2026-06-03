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
import ControlsHint from "./components/ui/ControlsHint";
import ResetButton from "./components/ui/ResetButton";

import styles from "./App.module.css";
import "./App.css";

import { defaultSceneConfig } from "./config/sceneConfig";

export default function App() {
  const phase = useGameStore((state) => state.phase);
  const config = useGameStore((state) => state.config);
  const startGame = useGameStore((state) => state.startGame);
  const finishGame = useGameStore((state) => state.finishGame);

  const [sceneConfig, setSceneConfig] = useState(defaultSceneConfig);

  const [blendshapes, setBlendshapes] = useState<BlendshapeValues>(
    {} as BlendshapeValues,
  );

  const [target, setTarget] = useState<BlendshapeValues>(
    {} as BlendshapeValues,
  );

  const [score, setScore] = useState<number | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);

  const [springConfig, setSpringConfig] = useState({
    stiffness: 400,
    damping: 32,
    mass: 1,
  });

  const yOffset = -0.25 + (target.Mouth_Down ?? 0) * 0.35;
  const zOffset =
    0 + ((target.L_Cheek_Down || target.R_Cheek_Right) ?? 0) * -0.1;

  const blendshapesRef = useRef(blendshapes);
  const targetRef = useRef(target);
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  blendshapesRef.current = blendshapes;
  targetRef.current = target;

  const [targetSpinTrigger, setTargetSpinTrigger] = useState(0);
  const TARGET_SPIN_START_DEGREES = -720;
  const TARGET_SPIN_DURATION_MS = 1200;

  const [isStarting, setIsStarting] = useState(false);
  const [freezeControls, setFreezeControls] = useState(false);
  const finalizeTimeoutRef = useRef<number | null>(null);

  const isAnyModalOpen =
    showTutorial ||
    showScoreboard ||
    phase === "finished";

  const handleReset = () => {
    setResetTrigger((v) => v + 1);

    setSpringConfig({ stiffness: 180, damping: 8, mass: 1.4 });

    setTimeout(() => {
      setSpringConfig({ stiffness: 100, damping: 12, mass: 1 });
    }, 1500);
  };

  const getOrCreateIdentityToken = () => {
    const existing = window.localStorage.getItem("identityToken");

    if (existing) return existing;

    const created = crypto.randomUUID();
    window.localStorage.setItem("identityToken", created);

    return created;
  };

  const startNewRound = useCallback(() => {
    sessionIdRef.current = crypto.randomUUID();

    const newTarget = randomFace();
    setTarget(newTarget);
    targetRef.current = newTarget;

    setScore(null);
    setTargetSpinTrigger((v) => v + 1);

    startGame();
  }, [startGame]);

  const handleSaveScore = useCallback(
    async (playerName: string): Promise<void> => {
      if (score === null) return;

      try {
        const identityToken = getOrCreateIdentityToken();

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-and-payout`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              playerName,
              sessionId: sessionIdRef.current,
              identityToken,
              playerBlendshapes: blendshapesRef.current,
              targetBlendshapes: targetRef.current,
            }),
          },
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          console.error("Failed to save score:", response.status, data);
          throw new Error(data.error || "Failed to save score");
        }

        console.log("Score submission result:", data);
      } catch (err) {
        console.error("Error saving score:", err);
        throw err;
      }
    },
    [score],
  );

  const handleGameComplete = useCallback(() => {
    setFreezeControls(true);

    if (finalizeTimeoutRef.current) {
      window.clearTimeout(finalizeTimeoutRef.current);
      finalizeTimeoutRef.current = null;
    }

    finalizeTimeoutRef.current = window.setTimeout(() => {
      const finalScore = scoreMatch(targetRef.current, blendshapesRef.current);

      setScore(finalScore);
      console.log("Final score:", finalScore);

      finishGame(finalScore);
      setFreezeControls(false);
      finalizeTimeoutRef.current = null;
    }, 100);
  }, [finishGame]);

  const handlePlayAgain = useCallback(async () => {
    setTarget({} as BlendshapeValues);

    try {
      setIsStarting(true);

      handleReset();
      startNewRound();

      setIsStarting(false);
    } catch (err) {
      console.error("Play again error:", err);
      setIsStarting(false);
    }
  }, [startNewRound]);

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
          playerBlendshapes={blendshapes}
          targetBlendshapes={target}
          onPlayAgain={handlePlayAgain}
          onShowHighScores={() => setShowScoreboard(true)}
          onSaveScore={handleSaveScore}
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
              disabled={freezeControls || isAnyModalOpen}
            />
          </div>

          <div className="overlay-ui">
            <div className="UI-top-row">
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

              <ResetButton onClick={handleReset} />
            </div>

            <div className={styles.targetWindow}>
              <h2 className={styles.windowText}>TARGET</h2>

              <div className={styles.targetCanvasWrapper}>
                <div className={styles.targetBackground} />

                <SceneLayout
                  config={sceneConfig}
                  background={null}
                  cameraOverride={{
                    y: sceneConfig.camera.y * 1.1,
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

      <div className="bottom-controls">
        {phase !== "playing" && !isStarting && (
          <PlayButton
            disabled={isStarting}
            onClick={async () => {
              handleReset();

              if (isStarting) return;

              try {
                setIsStarting(true);
                startNewRound();
                setIsStarting(false);
              } catch (err) {
                console.error("Start game error:", err);
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