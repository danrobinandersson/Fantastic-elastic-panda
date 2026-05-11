import type { BlendshapeValues } from '../types/blendshape'
import { CONTROLLABLE_MORPH_KEYS } from '../config/morphKeys'
import { getBlendshapeMaxValue } from './controlConfig'
import { applyConstraints } from './constraintUtils'

/**
 * Generate a random face respecting max values from control zones and all constraints.
 * Ensures the generated face is logically valid (no mutually exclusive morphs both active).
 */
export function randomFace(): BlendshapeValues {
  const face = {} as BlendshapeValues

  const exclusivePairs: [keyof BlendshapeValues, keyof BlendshapeValues][] = [
    ['Mouth_Up', 'Mouth_Down'],
    ['Mouth_Left', 'Mouth_Right'],

    ['L_Brow_Up', 'L_Brow_Down'],
    ['R_Brow_Up', 'R_Brow_Down'],
    ['L_Brow_Left', 'L_Brow_Right'],
    ['R_Brow_Left', 'R_Brow_Right'],

    ['L_Cheek_Up', 'L_Cheek_Down'],
    ['R_Cheek_Up', 'R_Cheek_Down'],

    ['L_Ear_Up', 'L_Ear_Down'],
    ['R_Ear_Up', 'R_Ear_Down'],
    ['L_Ear_Left', 'L_Ear_Right'],
    ['R_Ear_Left', 'R_Ear_Right'],

    ['Nose_Up', 'Nose_Down'],
    ['Nose_Left', 'Nose_Right'],
  ]

  const handled = new Set<keyof BlendshapeValues>()

  for (const [a, b] of exclusivePairs) {
    handled.add(a)
    handled.add(b)

    const chosen = Math.random() < 0.5 ? a : b
    const other = chosen === a ? b : a

    face[chosen] = Math.random() * getBlendshapeMaxValue(chosen)
    face[other] = 0
  }

  for (const key of CONTROLLABLE_MORPH_KEYS) {
    const typedKey = key as keyof BlendshapeValues

    if (handled.has(typedKey)) continue

    const max = getBlendshapeMaxValue(typedKey)
    face[typedKey] = Math.random() * max
  }

  return applyConstraints(face)
}

/**
 * Calculate match score between target and player blendshapes.
 * Only scores controllable blendshapes and normalizes by their max values.
 */
export function scoreMatch(target: BlendshapeValues, player: BlendshapeValues): number {
  let sumError = 0

  for (const key of CONTROLLABLE_MORPH_KEYS) {
    const max = getBlendshapeMaxValue(key as keyof BlendshapeValues)
    const targetVal = (target[key as keyof BlendshapeValues] ?? 0) / max
    const playerVal = (player[key as keyof BlendshapeValues] ?? 0) / max
    sumError += Math.abs(targetVal - playerVal)
  }

  const avgError = sumError / CONTROLLABLE_MORPH_KEYS.length
  return Math.max(0, Math.round((1 - avgError) * 100))
}
