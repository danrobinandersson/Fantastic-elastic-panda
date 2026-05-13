import { useState, Suspense, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { PlayerPanda } from "./components/scene/PlayerPanda";
import { TargetPanda } from "./components/scene/TargetPanda";
import { FaceControls } from "./components/controls/FaceControls";
// import { SceneDebugController } from './components/debug/SceneDebugController'
import { ApiTest } from "./dev/ApiTest";
import Timer from "./components/ui/Timer";
import { randomFace, scoreMatch } from "./utils/faceUtils";

import type { BlendshapeValues } from "./types/blendshape";
import type { AmbientLight, PointLight } from "three";
import "./App.css";
import Button from "./components/ui/Button";
import { useGameStore } from "./store/gameStore";
import GameResultModal from "./components/ui/GameResultModal";
import styles from "./App.module.css";

export default function App() {
  const phase = useGameStore((state) => state.phase);
  const startGame = useGameStore((state) => state.startGame);
  const finishGame = useGameStore((state) => state.finishGame);
  const exitGame = useGameStore((state) => state.exitGame);
  const [rewardToken, setRewardToken] = useState<string | null>(null);
  const config = useGameStore((state) => state.config);

  const [blendshapes, setBlendshapes] = useState<BlendshapeValues>(
    {} as BlendshapeValues,
  );
  const [target, setTarget] = useState<BlendshapeValues>(
    {} as BlendshapeValues,
  );
  const [score, setScore] = useState<number | null>(null);

  // Calculate the y-offset for the target panda based on the Mouth_Down blendshape. Used to center model in the target window as mouth opens/closes.
  const yOffset = -0.25 + (target.Mouth_Down ?? 0) * 0.25;

  //Calculate the z-offset for the target panda based on the cheek blendshapes. Used to prevent clipping to right and left when cheeks are stretched.
  const zOffset =
    0 + ((target.L_Cheek_Down || target.R_Cheek_Right) ?? 0) * -0.1;

  // These refs always store the latest values,
  // but changing them does NOT cause the timer to restart.
  const blendshapesRef = useRef(blendshapes);
  const targetRef = useRef(target);

  // Keep refs updated with the newest state values.
  blendshapesRef.current = blendshapes;
  targetRef.current = target;

  const [envIntensity, _setEnvIntensity] = useState(0.1);
  const [envBlur, _setEnvBlur] = useState(0.7);
  const [envRotation, _setEnvRotation] = useState(-3.1);
  const [cameraX, _setCameraX] = useState(0);
  const [cameraY, _setCameraY] = useState(-2.2);
  const [cameraZ, _setCameraZ] = useState(5.4);
  const [cameraFov, _setCameraFov] = useState(56);
  const [rotationX, _setRotationX] = useState(0.2);
  const [light1Color, _setLight1Color] = useState("#0450d5");
  const [light2Color, _setLight2Color] = useState("#d63404");
  const [light3Color, _setLight3Color] = useState("#ffbd8f");
  const ambientLightRef = useRef<AmbientLight>(null!);
  const pointLight1Ref = useRef<PointLight>(null!);
  const pointLight2Ref = useRef<PointLight>(null!);
  const pointLight3Ref = useRef<PointLight>(null!);

  // Animation state
  const [targetSpinTrigger, setTargetSpinTrigger] = useState(0);

  const TARGET_SPIN_START_DEGREES = -720;
  const TARGET_SPIN_DURATION_MS = 1200;

  function handleNewTarget() {
    setScore(null);
    setTargetSpinTrigger((value) => value + 1);
  }

  // This function finishes the game.
  // It uses refs instead of state directly so the timer does not freeze while dragging.
  const handleGameComplete = useCallback(() => {
    const finalScore = scoreMatch(targetRef.current, blendshapesRef.current);

    setScore(finalScore);

    // Temporary until API is ready
    setRewardToken("Token will appear here from API later");

    finishGame(finalScore);
  }, [finishGame]);

  const handleExitGame = useCallback(() => {
    setScore(null);
    exitGame();
  }, [exitGame]);

  return (
    <main>
      <h1>Fantastic elastic panda</h1>
      <ApiTest />

      <Button
        onClick={() => {
          const newTarget = randomFace();

          setTarget(newTarget);
          targetRef.current = newTarget;

          setScore(null);
          startGame();
        }}
      >
        Play
      </Button>
      <Button
        onClick={() => console.log("clicked tutorial")}
        variant="secondary"
      >
        Tutorial
      </Button>
      <button onClick={handleGameComplete}>Score</button>

      <Timer
        duration={10}
        isRunning={phase === "playing"}
        onComplete={handleGameComplete}
      />

      {phase === "finished" && (
        <GameResultModal
          score={score}
          token={rewardToken}
          config={config}
          onExit={handleExitGame}
        />
      )}

      <div className="scene-wrapper">
        <Canvas
          camera={{
            position: [cameraX, cameraY, cameraZ],
            fov: cameraFov,
            rotation: [rotationX, 0, 0],
          }}
          style={{ width: "100%", height: "100%" }}
          gl={{ antialias: true }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <ambientLight ref={ambientLightRef} intensity={3} />
            <pointLight
              ref={pointLight1Ref}
              color={light1Color}
              position={[0, 4, -4.5]}
              intensity={308}
            />
            <pointLight
              ref={pointLight2Ref}
              color={light2Color}
              position={[0, -6.5, -8.5]}
              intensity={378}
            />
            <pointLight
              ref={pointLight3Ref}
              color={light3Color}
              position={[0, 7, 11]}
              intensity={484}
            />
            {/* <SceneDebugController
              ambientLightRef={ambientLightRef}
              pointLight1Ref={pointLight1Ref}
              pointLight2Ref={pointLight2Ref}
              pointLight3Ref={pointLight3Ref}
              cameraX={cameraX}
              cameraY={cameraY}
              cameraZ={cameraZ}
              cameraFov={cameraFov}
              setCameraX={setCameraX}
              setCameraY={setCameraY}
              setCameraZ={setCameraZ}
              setCameraFov={setCameraFov}
              rotationX={rotationX}
              setRotationX={setRotationX}
              envIntensity={envIntensity}
              envBlur={envBlur}
              setEnvIntensity={setEnvIntensity}
              setEnvBlur={setEnvBlur}
              envRotation={envRotation}
              setEnvRotation={setEnvRotation}
              light1Color={light1Color}
              setLight1Color={setLight1Color}
              light2Color={light2Color}
              setLight2Color={setLight2Color}
              light3Color={light3Color}
              setLight3Color={setLight3Color}
            /> */}
            <PlayerPanda
              values={blendshapes}
              springConfig={{ stiffness: 100, damping: 12, mass: 1 }}
            />
            <Environment
              preset="apartment"
              blur={envBlur}
              background
              resolution={64}
              environmentIntensity={envIntensity}
              environmentRotation={[0, envRotation, 0]}
              backgroundRotation={[0, envRotation, 0]}
            />
          </Suspense>
        </Canvas>

        <div className={styles.targetWindow}>
          <h1 className={styles.windowText}>TARGET</h1>
          <Canvas
            camera={{
              position: [cameraX, cameraY, cameraZ * 0.65],
              fov: cameraFov,
              rotation: [rotationX, 0, 0],
            }}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 20,
              overflow: "hidden",
            }}
            gl={{ antialias: true }}
            dpr={[1, 2]}
            onCreated={({ scene }) => {
              scene.background = new THREE.Color("#53518d");
            }}
          >
            <Suspense fallback={null}>
              <ambientLight intensity={3} />

              <pointLight
                color={light1Color}
                position={[0, 4, -4.5]}
                intensity={308}
              />

              <pointLight
                color={light2Color}
                position={[0, -6.5, -8.5]}
                intensity={378}
              />

              <pointLight
                color={light3Color}
                position={[0, 7, 11]}
                intensity={484}
              />
              <group position={[0, yOffset, zOffset]}>
                <TargetPanda
                  values={target}
                  spinTrigger={targetSpinTrigger}
                  spinStartDegrees={TARGET_SPIN_START_DEGREES}
                  spinDurationMs={TARGET_SPIN_DURATION_MS}
                  onSpinCovered={() => setTarget(randomFace())}
                />
              </group>
              {/* 
              <Environment
                preset="apartment"
                blur={envBlur}
                background
                resolution={64}
                environmentIntensity={envIntensity}
                environmentRotation={[0, envRotation, 0]}
                backgroundRotation={[0, envRotation, 0]}
              /> */}
            </Suspense>
          </Canvas>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            color: "#fff",
            zIndex: 10,
          }}
        >
          <button onClick={handleNewTarget}>New Target</button>
          <button onClick={() => setScore(scoreMatch(target, blendshapes))}>
            Score
          </button>
          <div style={{ marginTop: 8 }}>Score: {score ?? "-"}</div>
        </div>

        <FaceControls onBlendshapesChange={setBlendshapes} />
      </div>
      {/* </div> */}
    </main>
  );
}
