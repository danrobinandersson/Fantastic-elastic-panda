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

  for (const key of CONTROLLABLE_MORPH_KEYS) {
    const max = getBlendshapeMaxValue(key as keyof BlendshapeValues)
    face[key as keyof BlendshapeValues] = Math.random() * max
  }

  // Apply constraints to ensure logically valid face (no contradictions)
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
