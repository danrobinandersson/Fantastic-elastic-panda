import { CONTROL_ZONES } from '../config/controlZones'
import type { BlendshapeValues } from '../types/blendshape'

/**
 * Extract max values for each blendshape from control zones.
 * Defaults to 1.0 if not specified in a zone.
 */
export function getBlendshapeMaxValues(): Partial<BlendshapeValues> {
  const maxValues: Partial<BlendshapeValues> = {}

  for (const zone of CONTROL_ZONES) {
    const { x, y, maxValue = 1.0 } = zone

    // X-axis blendshapes
    if (x?.positive) maxValues[x.positive] = maxValue
    if (x?.negative) maxValues[x.negative] = maxValue

    // Y-axis blendshapes
    if (y?.positive) maxValues[y.positive] = maxValue
    if (y?.negative) maxValues[y.negative] = maxValue
  }

  return maxValues
}

/**
 * Get the maximum allowed value for a specific blendshape.
 */
export function getBlendshapeMaxValue(key: keyof BlendshapeValues): number {
  const maxValues = getBlendshapeMaxValues()
  return maxValues[key] ?? 1.0
}
