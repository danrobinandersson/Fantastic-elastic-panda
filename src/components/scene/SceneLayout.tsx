/**
 * Layout.tsx
 * 
 * A starter template for setting up a 3D scene with React Three Fiber.
 * This component provides the basic structure for rendering 3D models with lighting and controls.
 */

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { PlayerPanda } from './PlayerPanda'

export function SceneLayout() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* 3D Canvas container */}
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          {/* Lighting setup */}
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={1} />

          {/* 3D Model */}
          <PlayerPanda values={{}} />

          {/* Environment and reflections */}
          <Environment preset="studio" blur={0.5} background resolution={64} />

          {/* Camera controls (mouse drag to rotate, scroll to zoom) */}
          <OrbitControls />
        </Suspense>
      </Canvas>
    </div>
  )
}