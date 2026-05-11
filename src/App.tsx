import { useState, Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { TargetPanda } from './components/scene/TargetPanda'
import { PlayerPanda } from './components/scene/PlayerPanda'
import { FaceControls } from './components/controls/FaceControls'
import { MorphDebugPanel } from './components/debug/MorphDebugPanel'
import { ApiTest } from "./dev/ApiTest";
import Timer from "./components/ui/Timer";

import type { BlendshapeValues } from './types/blendshape'
import { randomFace, scoreMatch } from './utils/faceUtils'
import type { AmbientLight, PointLight } from "three";

import "./App.css";

export default function App() {
  const [blendshapes, setBlendshapes] = useState<BlendshapeValues>({} as BlendshapeValues)
  const [target, setTarget] = useState<BlendshapeValues>({} as BlendshapeValues)
  const [score, setScore] = useState<number | null>(null)
  // These would normally be passed to SceneDebugController (via leva controls)
  // For now, use fixed values since debug controller is commented out
  const envIntensity = 0.1
  const envBlur = 0.7
  const envRotation = -3.1
  const cameraX = 0
  const cameraY = -2.2
  const cameraZ = 5.4
  const cameraFov = 56
  const rotationX = 0.2
  const ambientLightRef = useRef<AmbientLight>(null!)
  const pointLight1Ref = useRef<PointLight>(null!)
  const pointLight2Ref = useRef<PointLight>(null!)
  const pointLight3Ref = useRef<PointLight>(null!)

  return (
    <main>
      <h1>Fantastic elastic panda</h1>
      <ApiTest />
      <Timer />
      <div className="scene-wrapper">
        <Canvas
          camera={{ position: [cameraX, cameraY, cameraZ], fov: cameraFov, rotation: [rotationX, 0, 0] }}
          style={{ width: '100%', height: '100%' }}
          gl={{ antialias: true }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <ambientLight ref={ambientLightRef} intensity={3} />
            <pointLight ref={pointLight1Ref} position={[0, 4, -4.5]} intensity={308} />
            <pointLight ref={pointLight2Ref} position={[0, -6.5, -8.5]} intensity={378} />
            <pointLight ref={pointLight3Ref} position={[0, 7, 11]} intensity={484} />
            {/* SceneDebugController commented out — leva dependency issue */}
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
            /> 
            */}
            
            {/* Main player panda — controlled by drag zones */}
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

        {/* Separate target panda canvas — own little world, square, 50% size */}
        <div style={{ position: 'absolute', top: 20, right: 20, width: 250, height: 250, border: '3px solid #fff', borderRadius: 8, overflow: 'hidden' }}>
          <Canvas
            camera={{ position: [cameraX, cameraY, cameraZ * 0.6], fov: cameraFov, rotation: [rotationX, 0, 0] }}
            style={{ width: '100%', height: '100%' }}
            gl={{ antialias: true }}
            dpr={[1, 2]}
          >
            <Suspense fallback={null}>
              <ambientLight intensity={3} />
              <pointLight position={[0, 4, -4.5]} intensity={308} />
              <pointLight position={[0, -6.5, -8.5]} intensity={378} />
              <pointLight position={[0, 7, 11]} intensity={484} />
              
              {/* Target panda in its own scene */}
              <TargetPanda values={target} />
              
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
        </div>

        {/* Drag controls overlay — outside Canvas, inside wrapper for proper positioning */}
        <FaceControls onBlendshapesChange={setBlendshapes} />

        {/* Game UI controls — outside Canvas for visibility */}
        <div className="game-controls" style={{ position: 'absolute', bottom: 20, left: 20, color: '#fff', zIndex: 10 }}>
          <button onClick={() => setTarget(randomFace())}>New Target</button>
          <button onClick={() => setScore(scoreMatch(target, blendshapes))}>Score</button>
          <div style={{ marginTop: 8 }}>Score: {score ?? '-'}</div>
        </div>

        {/* Debug panel for morph value comparison */}
        <MorphDebugPanel target={target} player={blendshapes} score={score} />
      </div>
    </main>
  )
}