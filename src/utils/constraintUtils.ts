import type { BlendshapeValues } from '../types/blendshape'
import { CONSTRAINTS } from '../config/controlConstraints'

/**
 * Apply all constraints to a blendshape values object.
 * Mutates the input object and returns it.
 */
export function applyConstraints(values: BlendshapeValues): BlendshapeValues {
  for (const constraint of CONSTRAINTS) {
    const currentValue = values[constraint.target] ?? 0
    let clampedValue = currentValue

    if (constraint.min) {
      const minAllowed = constraint.min(values)
      if (clampedValue < minAllowed) {
        clampedValue = minAllowed
      }
    }

    if (constraint.max) {
      const maxAllowed = constraint.max(values)
      if (clampedValue > maxAllowed) {
        clampedValue = maxAllowed
      }
    }

    values[constraint.target] = clampedValue
  }

  return values
}
