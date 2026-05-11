import React, { useRef } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { GLTF } from 'three-stdlib'
import { stepSpring, useSpringStates } from '../../hooks/useSpring'
import type { SpringConfig } from '../../hooks/useSpring'
import { MORPH_KEYS } from '../../config/morphKeys'

type GLTFResult = GLTF & {
  nodes: { Panda001: THREE.Mesh; EyeL: THREE.Mesh; EyeR: THREE.Mesh }
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

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh?.morphTargetDictionary || !mesh.morphTargetInfluences) return

    for (const key of MORPH_KEYS) {
      const target = values[key] ?? 0
      const current = springs.current[key]

      // Step the spring toward the target value
      springs.current[key] = stepSpring(current, target, delta, springConfig)

      // Write the animated value to the mesh
      const idx = mesh.morphTargetDictionary[key]
      if (idx !== undefined) {
        mesh.morphTargetInfluences[idx] = springs.current[key].value
      }
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
          morphTargetInfluences={nodes.Panda001.morphTargetInfluences}
          position={[0, 62.02, 29.72]}
          receiveShadow={props.receiveShadow}
          castShadow={props.castShadow}
        >
          <mesh geometry={nodes.EyeL.geometry} material={materials.Panda} position={[-32, 13.7448, -24.33]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1]} />
          <mesh geometry={nodes.EyeR.geometry} material={materials.Panda} position={[32, 13.7448, -24.33]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1]} />
        </mesh>
      </group>
    </group>
  );
});

PlayerPanda.displayName = "PlayerPanda";
useGLTF.preload("/panda.glb");
