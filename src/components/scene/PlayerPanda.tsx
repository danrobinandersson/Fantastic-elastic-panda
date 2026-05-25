import React, { useRef, useEffect } from 'react'
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
  materials.Panda.vertexColors = false
 
  // Eye tracking constants
  const EYE_X_AMOUNT = 1.5
  const EYE_Y_AMOUNT = 1.5
  const EYE_ROTATION_AMOUNT = -0.5


  // Eye tracking refs and state
const eyeLRef = useRef<THREE.Mesh>(null)
const eyeRRef = useRef<THREE.Mesh>(null)
const targetEyeRotation = useRef({ x: 0, y: 0 })
const eyeRotation = useRef({ x: 0, y: 0 })
const pointerTarget = useRef({ x: 0, y: 0 })

useEffect(() => {
  const updatePointer = (event: PointerEvent) => {
    pointerTarget.current.x = (event.clientX / window.innerWidth) * 2 - 1
    pointerTarget.current.y = -((event.clientY / window.innerHeight) * 2 - 1)
  }

  window.addEventListener('pointermove', updatePointer)
  window.addEventListener('pointerdown', updatePointer)

  return () => {
    window.removeEventListener('pointermove', updatePointer)
    window.removeEventListener('pointerdown', updatePointer)
  }
}, [])



  useFrame((_, delta) => {
targetEyeRotation.current.x = pointerTarget.current.x * EYE_X_AMOUNT
targetEyeRotation.current.y = -pointerTarget.current.y * EYE_Y_AMOUNT

eyeRotation.current.x = THREE.MathUtils.damp(
  eyeRotation.current.x,
  targetEyeRotation.current.x,
  10,// The higher the damping, the snappier the eyes will follow the pointer (but also more jittery) - adjust to your liking
  delta
)

eyeRotation.current.y = THREE.MathUtils.damp(
  eyeRotation.current.y,
  targetEyeRotation.current.y,
  10, // The higher the damping, the snappier the eyes will follow the pointer (but also more jittery) - adjust to your liking
  delta
)

if (eyeRRef.current) {
  eyeRRef.current.position.x = 31 + eyeRotation.current.x
  eyeRRef.current.position.z = 5.72 + eyeRotation.current.y

  eyeRRef.current.rotation.z =
    eyeRotation.current.x * EYE_ROTATION_AMOUNT

  eyeRRef.current.rotation.x =
    -eyeRotation.current.y * EYE_ROTATION_AMOUNT
}

if (eyeLRef.current) {
  eyeLRef.current.position.x = -31 + eyeRotation.current.x
  eyeLRef.current.position.z = 5.72 + eyeRotation.current.y

  eyeLRef.current.rotation.z =
    eyeRotation.current.x * EYE_ROTATION_AMOUNT

  eyeLRef.current.rotation.x =
    -eyeRotation.current.y * EYE_ROTATION_AMOUNT
}

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
      <group rotation={[Math.PI / 2.15, 0, 0]} scale={0.01} position={[0, -1.5, 0]}>
        <mesh
          ref={meshRef}
          name="Panda001"
          geometry={nodes.Panda001.geometry}
          material={materials.Panda}
          morphTargetDictionary={nodes.Panda001.morphTargetDictionary}
          position={[0, 62.02, 29.72]}
          receiveShadow={props.receiveShadow}
          castShadow={props.castShadow}
        />


<mesh
  ref={eyeRRef}
  geometry={nodes.EyeR.geometry}
  position={[31, 76.02, 6.72]}
  material={materials.Panda}
  scale={[1, 1, 1]}
/>

<mesh
  ref={eyeLRef}
  geometry={nodes.EyeL.geometry}
  position={[-31, 76.02, 6.72]}
  material={materials.Panda}
  scale={[1, 1, 1]}
/>



{/*
<mesh
  name="Body"
  geometry={nodes.Body.geometry}
  material={materials.Panda}
  position={nodes.Body.position}
  rotation={nodes.Body.rotation}
  scale={nodes.Body.scale}
  receiveShadow={props.receiveShadow}
  castShadow={props.castShadow}
/>         

>*/}

      </group>
    </group>
  );
});

PlayerPanda.displayName = "PlayerPanda";
useGLTF.preload("/panda.glb");
