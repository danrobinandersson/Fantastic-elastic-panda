import { useState, useRef, useCallback } from "react";

import { PlayerPanda } from "./components/scene/PlayerPanda";
import { TargetPanda } from "./components/scene/TargetPanda";
import { FaceControls } from "./components/controls/FaceControls";

import Timer from "./components/ui/Timer";
import Button from "./components/ui/Button";
import GameResultModal from "./components/ui/GameResultModal";

import { randomFace, scoreMatch } from "./utils/faceUtils";

import type { BlendshapeValues } from "./types/blendshape";

import { useGameStore } from "./store/gameStore";

import styles from "./App.module.css";
import "./App.css";

import { SceneLayout } from "./components/scene/SceneLayout";
import { defaultSceneConfig } from "./config/sceneConfig";

export default function App() {
  /*
    GAME STORE
  */
  const phase = useGameStore((state) => state.phase);

  const startGame = useGameStore((state) => state.startGame);

  const finishGame = useGameStore((state) => state.finishGame);

  const exitGame = useGameStore((state) => state.exitGame);

  /*
    SCENE CONFIG
  */
  const [sceneConfig, setSceneConfig] = useState(defaultSceneConfig);

  /*
    PLAYER FACE
  */
  const [blendshapes, setBlendshapes] =
    useState<BlendshapeValues>({} as BlendshapeValues);

  /*
    TARGET FACE
  */
  const [target, setTarget] =
    useState<BlendshapeValues>({} as BlendshapeValues);

  /*
    SCORE
  */
  const [score, setScore] = useState<number | null>(null);

  /*
    REWARD TOKEN
  */
  const [rewardToken, setRewardToken] =
    useState<string | null>(null);

  /*
    RESET
  */
  const [resetTrigger, setResetTrigger] = useState(0);

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
  const yOffset =
    -0.25 + (target.Mouth_Down ?? 0) * 0.35;

  const zOffset =
    0 +
    ((target.L_Cheek_Down ||
      target.R_Cheek_Right) ??
      0) *
      -0.1;

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
  const [targetSpinTrigger, setTargetSpinTrigger] =
    useState(0);

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
  const handleGameComplete = useCallback(() => {
    const finalScore = scoreMatch(
      targetRef.current,
      blendshapesRef.current,
    );

    setScore(finalScore);

    /*
      Placeholder API token
    */
    setRewardToken(
      "Token will appear here from API later",
    );

    finishGame(finalScore);
  }, [finishGame]);

  /*
    EXIT GAME
  */
  const handleExitGame = useCallback(() => {
    setScore(null);

    exitGame();
  }, [exitGame]);

  return (
    <main>
      {phase === "finished" && (
        <GameResultModal
          score={score}
          token={rewardToken}
          onExit={handleExitGame}
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
      <PlayerPanda
        values={blendshapes}
        springConfig={springConfig}
      />
    </SceneLayout>
  </div>

  <FaceControls
    onBlendshapesChange={setBlendshapes}
    resetTrigger={resetTrigger}
  />
</div>

          {/* =========================
              UI OVERLAY
          ========================= */}

          <div className="overlay-ui">

            {/* TIMER */}

            <div className="top-bar">
              <Timer
                duration={10}
                isRunning={phase === "playing"}
                onComplete={handleGameComplete}
              />
            </div>

            {/* TARGET WINDOW */}

            <div className={styles.targetWindow}>
              <h1 className={styles.windowText}>
                TARGET
              </h1>

              <div
                className={
                  styles.targetCanvasWrapper
                }
              >
                {/* RADIAL BACKGROUND */}

                <div
                  className={
                    styles.targetBackground
                  }
                />

                <SceneLayout
                  config={sceneConfig}
                  background={null}
                  cameraOverride={{
                    /*
                      Slightly higher framing
                    */
                    y:
                      sceneConfig.camera.y *
                      1.1,

                    /*
                      Closer zoom
                    */
                    z:
                      sceneConfig.camera.z *
                      0.65,
                  }}
                >
                  <group
                    position={[
                      0,
                      yOffset,
                      zOffset,
                    ]}
                  >
                    <TargetPanda
                      values={target}
                      spinTrigger={
                        targetSpinTrigger
                      }
                      spinStartDegrees={
                        TARGET_SPIN_START_DEGREES
                      }
                      spinDurationMs={
                        TARGET_SPIN_DURATION_MS
                      }
                      onSpinCovered={() =>
                        setTarget(randomFace())
                      }
                    />
                  </group>
                </SceneLayout>
              </div>
            </div>

            {/* BUTTONS */}

            <div className="bottom-controls">

              <Button
                onClick={() => {
                  const newTarget =
                    randomFace();

                  setTarget(newTarget);

                  targetRef.current =
                    newTarget;

                  setScore(null);

                  /*
                    Trigger spin animation
                  */
                  setTargetSpinTrigger(
                    (v) => v + 1,
                  );

                  startGame();
                }}
              >
                Play
              </Button>

              <Button
                onClick={() =>
                  console.log(
                    "clicked tutorial",
                  )
                }
                variant="secondary"
              >
                Tutorial
              </Button>

              <Button
                onClick={handleGameComplete}
              >
                Score
              </Button>

              <Button onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}