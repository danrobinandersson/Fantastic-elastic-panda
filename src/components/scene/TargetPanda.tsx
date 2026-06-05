import React, { useEffect, useImperativeHandle, useRef } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { GLTF } from 'three-stdlib'
import type { BlendshapeValues } from '../../types/blendshape'
import { useBlinkAnimation } from '../../hooks/useBlinkAnimation'
import { MORPH_KEYS } from '../../config/morphKeys'
import { applyConstraints } from '../../utils/constraintUtils'

type GLTFResult = GLTF & {
  nodes: {
    Panda001: THREE.Mesh
    EyeL: THREE.Mesh
    EyeR: THREE.Mesh
  }
  materials: {
    Panda: THREE.MeshStandardMaterial
    Eyes: THREE.MeshStandardMaterial
  }
  animations: any[]
}

interface TargetPandaProps {
  values?: Record<string, number>
  receiveShadow?: boolean
  castShadow?: boolean
  spinTrigger?: number
  spinStartDegrees?: number
  spinDurationMs?: number
  onSpinCovered?: () => void
}

export const TargetPanda = React.forwardRef<THREE.Group, TargetPandaProps>(
  (props, ref) => {
    const {
      values = {},
      spinTrigger = 0,
      spinStartDegrees = -1080,
      spinDurationMs = 2000,
      onSpinCovered,
      ...groupProps
    } = props

    const { nodes, materials } = useGLTF('/panda.glb') as unknown as GLTFResult

    const meshRef = useRef<THREE.Mesh>(null)
    const groupRef = useRef<THREE.Group>(null)

    const { updateBlink } = useBlinkAnimation()

    useImperativeHandle(ref, () => groupRef.current!)

    const spinRef = useRef({
      active: false,
      elapsed: 0,
      coveredCalled: false,
      rotationBlendshape: 0,
      revealProgress: 1,

    })

    function easeInOut(t: number) {
      return t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2
    }

    function easeOut(t: number) {
      return 1 - Math.pow(1 - t, 3)
    }

    function lerp(a: number, b: number, t: number) {
      return a + (b - a) * t
    }

    function getSpinDegrees(t: number) {
      const dipDegrees = spinStartDegrees - 120
      const overshootDegrees = 50

      if (t < 0.14) {
        const p = easeInOut(t / 0.14)
        return lerp(spinStartDegrees, dipDegrees, p)
      }

      if (t < 0.78) {
        const p = easeInOut((t - 0.14) / 0.64)
        return lerp(dipDegrees, overshootDegrees, p)
      }

      const p = easeOut((t - 0.78) / 0.22)
      return lerp(overshootDegrees, 0, p)
    }

    function getRotationBlendshape(t: number) {
      if (t >= 0 && t < 0.78) {
        return easeInOut((t - 0) / 0.64)
      }

      if (t >= 0.78 && t <= 1) {
        const p = easeOut((t - 0.78) / 0.22)
        return 1 - p
      }

      return 0
    }

    useEffect(() => {
      if (!spinTrigger) return

      spinRef.current.active = true
      spinRef.current.elapsed = 0
      spinRef.current.coveredCalled = false
      spinRef.current.rotationBlendshape = 0
      spinRef.current.revealProgress = spinTrigger ? 0 : 1


      if (groupRef.current) {
        groupRef.current.rotation.y = THREE.MathUtils.degToRad(spinStartDegrees)
      }
    }, [spinTrigger, spinStartDegrees])

    useFrame((_, delta) => {
      const spin = spinRef.current

      if (spin.active && groupRef.current) {
        spin.elapsed += delta * 1000

        const t = Math.min(spin.elapsed / spinDurationMs, 1)

        const degrees = getSpinDegrees(t)
        spin.rotationBlendshape = getRotationBlendshape(t)

        groupRef.current.rotation.y = THREE.MathUtils.degToRad(degrees)

        if (!spin.coveredCalled && t > 0.35) {
          spin.coveredCalled = true
          onSpinCovered?.()
        }
        if (spin.coveredCalled) {
  // map t from 0.35–1.0 to 0–1
    spin.revealProgress = Math.min((t - 0.35) / 0.45, 1)
  } else {
    spin.revealProgress = 0
  }

        if (t >= 1) {
          spin.active = false
          spin.rotationBlendshape = 0
          groupRef.current.rotation.y = 0
        }
      }

      const mesh = meshRef.current

      if (!mesh?.morphTargetDictionary) return

      if (!mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences = new Array(
          mesh.geometry.morphAttributes.position?.length ?? 0
        ).fill(0)
      }

      const blinkValue = updateBlink(delta * 1000)

      const constrainedValues = {
        ...values,
      } as BlendshapeValues

      applyConstraints(constrainedValues)

      for (const key of MORPH_KEYS) {
        if (key === 'Rotation') continue

      let value = (constrainedValues[key] ?? 0) * spin.revealProgress

        if (key === 'Blink') {
          value = Math.min(1, value + blinkValue)
        }

        const idx = mesh.morphTargetDictionary[key]

        if (idx !== undefined) {
          mesh.morphTargetInfluences[idx] = value
        }
      }

      const rotationIdx = mesh.morphTargetDictionary.Rotation

      if (rotationIdx !== undefined) {
        mesh.morphTargetInfluences[rotationIdx] = spin.rotationBlendshape
      }
    })

    return (
      <group ref={groupRef} {...groupProps} dispose={null}>
        <group
          rotation={[Math.PI / 2.1, 0, 0]}
          scale={0.01}
          position={[0, -1.5, 0]}
        >
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
  <mesh
  geometry={nodes.EyeR.geometry}
  position={[29, 14, -24]}
  material={materials.Panda}
  scale={[1, 1, 1]}

/>

<mesh
  geometry={nodes.EyeL.geometry}
  position={[-29, 14, -24]}
  material={materials.Panda}
  scale={[1, 1, 1]}
/>



          </mesh>
        </group>
      </group>
    )
  }
)

TargetPanda.displayName = 'TargetPanda'

useGLTF.preload('/panda.glb')