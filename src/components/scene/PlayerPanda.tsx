import React, { useRef } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { GLTF } from 'three-stdlib'
import { stepSpring, useSpringStates } from '../../hooks/useSpring'
import type { SpringConfig } from '../../hooks/useSpring'
import { useBlinkAnimation } from '../../hooks/useBlinkAnimation'
import { MORPH_KEYS } from '../../config/morphKeys'

type GLTFResult = GLTF & {
  nodes: { Panda001: THREE.Mesh; EyeL: THREE.Mesh; EyeR: THREE.Mesh; Body: THREE.Mesh }
  materials: { Panda: THREE.MeshStandardMaterial; Eyes: THREE.MeshStandardMaterial }
  animations: any[]
}

interface PlayerPandaProps {
  values?: Record<string, number>
  springConfig?: SpringConfig
  receiveShadow?: boolean
  castShadow?: boolean
}

export const PlayerPanda = React.forwardRef<THREE.Group, PlayerPandaProps>((props, ref) => {
  const { values = {}, springConfig, ...groupProps } = props
  const { nodes, materials } = useGLTF('/panda.glb') as unknown as GLTFResult
  const meshRef = useRef<THREE.Mesh>(null)
  const springs = useSpringStates(MORPH_KEYS)
  const { updateBlink } = useBlinkAnimation()

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh?.morphTargetDictionary) return

    // Initialize morphTargetInfluences if needed
    if (!mesh.morphTargetInfluences) {
      mesh.morphTargetInfluences = new Array(mesh.geometry.morphAttributes.position?.length ?? 0).fill(0)
    }

    // Update blink animation
    const blinkValue = updateBlink(delta * 1000)

    for (const key of MORPH_KEYS) {
      const idx = mesh.morphTargetDictionary[key]
      if (idx === undefined) continue

      // Blink bypasses spring smoothing to avoid double-smoothing
      // (useBlinkAnimation already spring-animates the blink value)
      if (key === 'Blink') {
        const baseBlink = values[key] ?? 0
        mesh.morphTargetInfluences[idx] = Math.min(1, baseBlink + blinkValue)
        continue
      }

      // All other morphs go through spring smoothing
      const target = values[key] ?? 0
      const current = springs.current[key]
      springs.current[key] = stepSpring(current, target, delta, springConfig)
      mesh.morphTargetInfluences[idx] = springs.current[key].value
    }
  })

  return (
    <group ref={ref} {...groupProps} dispose={null}>
      <group rotation={[Math.PI / 2, 0, 0]} scale={0.01} position={[0, -1.5, 0]}>
        <mesh
          ref={meshRef}
          name="Panda001"
          geometry={nodes.Panda001.geometry}
          material={materials.Panda}
          morphTargetDictionary={nodes.Panda001.morphTargetDictionary}
          position={[0, 62.02, 29.72]}
          receiveShadow={props.receiveShadow}
          castShadow={props.castShadow}
        >
          <mesh geometry={nodes.EyeL.geometry} material={materials.Panda} position={[-32, 13.7448, -24.33]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1]} />
          <mesh geometry={nodes.EyeR.geometry} material={materials.Panda} position={[32, 13.7448, -24.33]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1]} />
<mesh
  name="Body"
  geometry={nodes.Body.geometry}
  material={materials.Panda}
  position={nodes.Body.position}
  rotation={nodes.Body.rotation}
  scale={nodes.Body.scale}
  receiveShadow={props.receiveShadow}
  castShadow={props.castShadow}
/>          </mesh>
      </group>
    </group>
  );
});

PlayerPanda.displayName = "PlayerPanda";
useGLTF.preload("/panda.glb");
