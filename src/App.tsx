import { useState, Suspense, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { PlayerPanda } from "./components/scene/PlayerPanda";
import { TargetPanda } from "./components/scene/TargetPanda";
import { FaceControls } from "./components/controls/FaceControls";
// import { SceneDebugController } from "./components/debug/SceneDebugController"; // Optional debug panel for tweaking scene settings in real-time
import { ApiTest } from "./dev/ApiTest";
import Timer from "./components/ui/Timer";
// Utility functions for generating random faces and scoring similarity
import { randomFace, scoreMatch } from "./utils/faceUtils";
// Type definitions
import type { BlendshapeValues } from "./types/blendshape";
import type { AmbientLight, PointLight } from "three"; 
// Styles
import "./App.css";
import Button from "./components/ui/Button";
import { useGameStore } from "./store/gameStore";
import GameResultModal from "./components/ui/GameResultModal";
import styles from "./App.module.css";

export default function App() {
  // Global game state from Zustand store
  const phase = useGameStore((state) => state.phase);
  const startGame = useGameStore((state) => state.startGame);
  const finishGame = useGameStore((state) => state.finishGame);
  const exitGame = useGameStore((state) => state.exitGame);

  // Reward token returned after game ends
  const [rewardToken, setRewardToken] = useState<string | null>(null);
  const config = useGameStore((state) => state.config);

  // Current player's facial expression values
  const [blendshapes, setBlendshapes] = useState<BlendshapeValues>(
    {} as BlendshapeValues,
  );

  // Target facial expression the player should match
  const [target, setTarget] = useState<BlendshapeValues>(
    {} as BlendshapeValues,
  );

  // Current score
  const [score, setScore] = useState<number | null>(null);

  // Used to force-reset FaceControls
  const [resetTrigger, setResetTrigger] = useState(0);

  // Physics/spring animation settings for panda face movement
  const [springConfig, setSpringConfig] = useState({
    stiffness: 100,
    damping: 12,
    mass: 1,
  });

  // Dynamically offset target panda position based on expression
  const yOffset = -0.25 + (target.Mouth_Down ?? 0) * 0.25;

  const zOffset =
    0 + ((target.L_Cheek_Down || target.R_Cheek_Right) ?? 0) * -0.1;

  // Refs allow access to latest values inside callbacks without stale closures
  const blendshapesRef = useRef(blendshapes);
  const targetRef = useRef(target);

  // Keep refs updated every render
  blendshapesRef.current = blendshapes;
  targetRef.current = target;

  // Environment lighting settings
  const [envIntensity, _setEnvIntensity] = useState(0.1);
  const [envBlur, _setEnvBlur] = useState(0.7);
  const [envRotation, _setEnvRotation] = useState(-3.1);
  // Camera settings
  const [cameraX, _setCameraX] = useState(0);
  const [cameraY, _setCameraY] = useState(-2.2);
  const [cameraZ, _setCameraZ] = useState(5.4);
  const [cameraFov, _setCameraFov] = useState(56);
  const [rotationX, _setRotationX] = useState(0.2);
  // Point light colors
  const [light1Color, _setLight1Color] = useState("#0450d5");
  const [light2Color, _setLight2Color] = useState("#d63404");
  const [light3Color, _setLight3Color] = useState("#ffbd8f");
  // Refs for controlling lights/debugging
  const ambientLightRef = useRef<AmbientLight>(null!);
  const pointLight1Ref = useRef<PointLight>(null!);
  const pointLight2Ref = useRef<PointLight>(null!);
  const pointLight3Ref = useRef<PointLight>(null!);

  // Used to trigger target spin animation
  const [targetSpinTrigger, setTargetSpinTrigger] = useState(0);
  // Spin animation settings
  const TARGET_SPIN_START_DEGREES = -720;
  const TARGET_SPIN_DURATION_MS = 1200;

  // Generates a new target face and starts spin animation
  function handleNewTarget() {
    setScore(null);
    setTargetSpinTrigger((value) => value + 1);
  }

  // Resets player face and temporarily increases spring animation intensity
  const handleReset = () => {
    setResetTrigger((v) => v + 1);
    // Stronger "bounce" animation after reset
    setSpringConfig({ stiffness: 180, damping: 8, mass: 1.4 });
    // Return to normal spring settings after 1.5 seconds
    setTimeout(() => {
      setSpringConfig({ stiffness: 100, damping: 12, mass: 1 });
    }, 1500);
  };

  // Called when timer finishes or score button pressed
  const handleGameComplete = useCallback(() => {
    // Compare player face against target face
    const finalScore = scoreMatch(targetRef.current, blendshapesRef.current);

    setScore(finalScore);

    // Placeholder reward token until backend API exists
    setRewardToken("Token will appear here from API later");

    // Update global game state
    finishGame(finalScore);
  }, [finishGame]);

  // Generates a fresh target and resets score
  const handlePlayAgain = () => {
    const newTarget = randomFace();

    setTarget(newTarget);
    targetRef.current = newTarget;

    setScore(null);
  };

  // Exit game and clear score
  const handleExitGame = useCallback(() => {
    setScore(null);
    exitGame();
  }, [exitGame]);

  return (
    <main>
      <h1>Fantastic elastic panda</h1>
      <ApiTest />

      {/* Starts game and generates first target face */}
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

      {/* Tutorial button placeholder */}
      <Button
        onClick={() => console.log("clicked tutorial")}
        variant="secondary"
      >
        Tutorial
      </Button>

      {/* Manual score trigger */}
      <button onClick={handleGameComplete}>Score</button>

      {/* Reset player expression */}
      <Button onClick={handleReset}>Reset</Button>

      {/* Countdown timer */}
      <Timer
        duration={10}
        isRunning={phase === "playing"}
        onComplete={handleGameComplete}
      />

      {/* Show results modal when game finishes */}
      {phase === "finished" && (
        <GameResultModal
          score={score}
          token={rewardToken}
          config={config}
          onExit={handleExitGame}
        />
      )}

      <div className="scene-wrapper">
        {/* Main 3D scene */}
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
          {/* Optional debug panel */}
          {/*
        <SceneDebugController
                ambientLightRef={ambientLightRef}
                pointLight1Ref={pointLight1Ref}
                pointLight2Ref={pointLight2Ref}
                pointLight3Ref={pointLight3Ref}
                cameraX={cameraX}
                cameraY={cameraY}
                cameraZ={cameraZ}
                cameraFov={cameraFov}
                setCameraX={_setCameraX}
                setCameraY={_setCameraY}
                setCameraZ={_setCameraZ}
                setCameraFov={_setCameraFov}
                rotationX={rotationX}
                setRotationX={_setRotationX}
                envIntensity={envIntensity}
                envBlur={envBlur}
                setEnvIntensity={_setEnvIntensity}
                setEnvBlur={_setEnvBlur}
                envRotation={envRotation}
                setEnvRotation={_setEnvRotation}
                light1Color={light1Color}
                setLight1Color={_setLight1Color}
                light2Color={light2Color}
                setLight2Color={_setLight2Color}
                light3Color={light3Color}
                setLight3Color={_setLight3Color}
              />  */}
              
          {/* Lazy-load 3D assets */}
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
            
            {/* Player-controlled panda */}
            <PlayerPanda
              values={blendshapes}
              springConfig={springConfig}
            />

            {/* HDR environment lighting/background */}
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

        {/* Target preview window */}
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
              // Set custom background color for target window
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

              {/* Offset target model based on expression */}
              <group position={[0, yOffset, zOffset]}>
                <TargetPanda
                  values={target}
                  spinTrigger={targetSpinTrigger}
                  spinStartDegrees={TARGET_SPIN_START_DEGREES}
                  spinDurationMs={TARGET_SPIN_DURATION_MS}

                  // Generate new target after spin animation completes
                  onSpinCovered={() => setTarget(randomFace())}
                />
              </group>
            </Suspense>
          </Canvas>
        </div>

        {/* Debug controls / score display */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            color: "#fff",
            zIndex: 10,
          }}
        >
          {/* Generate a new target */}
          <button onClick={handleNewTarget}>New Target</button>

          {/* Calculate score instantly */}
          <button onClick={() => setScore(scoreMatch(target, blendshapes))}>
            Score
          </button>

          {/* Current score display */}
          <div style={{ marginTop: 8 }}>Score: {score ?? "-"}</div>
        </div>

        {/* Face control sliders/input */}
        <FaceControls
          onBlendshapesChange={setBlendshapes}
          resetTrigger={resetTrigger}
        />
      </div>
    </main>
  );
}