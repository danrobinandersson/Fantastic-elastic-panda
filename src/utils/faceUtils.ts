import type { BlendshapeValues } from '../types/blendshape'
import { MORPH_KEYS } from '../config/morphKeys'

export function randomFace(): BlendshapeValues {
  const out = {} as BlendshapeValues
  for (const k of MORPH_KEYS) {
    out[k] = Math.random()
  }
  return out
}

export function scoreMatch(target: BlendshapeValues, player: BlendshapeValues) {
  const keys = Object.keys(target) as Array<keyof BlendshapeValues>
  const sumError = keys.reduce((s, k) => s + Math.abs((target[k] ?? 0) - (player[k] ?? 0)), 0)
  const avgError = sumError / keys.length
  return Math.max(0, Math.round((1 - avgError) * 100))
}
