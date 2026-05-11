import React, { useRef } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { GLTF } from 'three-stdlib'
import type { BlendshapeValues } from '../../types/blendshape'
import { MORPH_KEYS } from '../../config/morphKeys'
import { applyConstraints } from '../../utils/constraintUtils'

type GLTFResult = GLTF & {
  nodes: { Panda001: THREE.Mesh; EyeL: THREE.Mesh; EyeR: THREE.Mesh }
  materials: { Panda: THREE.MeshStandardMaterial; Eyes: THREE.MeshStandardMaterial }
  animations: any[]
}

interface TargetPandaProps {
  values?: Record<string, number>
  receiveShadow?: boolean
  castShadow?: boolean
}

export const TargetPanda = React.forwardRef<THREE.Group, TargetPandaProps>((props, ref) => {
  const { values = {}, ...groupProps } = props
  const { nodes, materials } = useGLTF('/panda.glb') as unknown as GLTFResult
  const meshRef = useRef<THREE.Mesh>(null)

  // Update morphTargetInfluences every frame (like PlayerPanda, but without spring)
  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh?.morphTargetDictionary || !mesh.morphTargetInfluences) return
    
    // Apply constraints to the values
    const constrainedValues = { ...values } as BlendshapeValues
    applyConstraints(constrainedValues)
    
    for (const key of MORPH_KEYS) {
      const idx = mesh.morphTargetDictionary[key]
      if (idx !== undefined) {
        mesh.morphTargetInfluences[idx] = constrainedValues[key] ?? 0
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

TargetPanda.displayName = "TargetPanda";
useGLTF.preload('/panda.glb');
