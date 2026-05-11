import { useCallback, useRef } from 'react'
import type { ControlZone, BlendshapeKey, BlendshapeValues } from '../types/blendshape'
import { CONSTRAINTS } from '../config/controlConstraints'

const DEFAULT_DRAG_RANGE = 300
const DEFAULT_MIN = 0
const DEFAULT_MAX = 1

export function useBlendshapeControl(
  blendshapes: BlendshapeValues,
  setBlendshapes: React.Dispatch<React.SetStateAction<BlendshapeValues>>
) {
  const dragStartValuesRef = useRef<BlendshapeValues>({} as BlendshapeValues)

  const startDrag = useCallback(() => {
    dragStartValuesRef.current = { ...blendshapes }
  }, [blendshapes])

  const applyDrag = useCallback((zone: ControlZone, dx: number, dy: number) => {
    const baseDragRange = zone.sensitivity
      ? DEFAULT_DRAG_RANGE / zone.sensitivity
      : DEFAULT_DRAG_RANGE

    const dragRangeX = zone.dragDistanceX ?? baseDragRange
    const dragRangeY = zone.dragDistanceY ?? baseDragRange

    const min = zone.minValue ?? DEFAULT_MIN
    const max = zone.maxValue ?? DEFAULT_MAX

    setBlendshapes(prev => {
      const next = { ...prev }
      const startValues = dragStartValuesRef.current

      function applyAxis(
        mapping: ControlZone['x'],
        delta: number,
        dragRange: number,
        invert: boolean = false
      ) {
        if (!mapping) return

        const d = invert ? -delta : delta
        const amount = Math.abs(d) / dragRange

        if (d > 0) {
          if (mapping.positive) {
            const start = startValues[mapping.positive] ?? 0
            next[mapping.positive] = Math.min(max, Math.max(min, start + amount))
          }

          if (mapping.negative) {
            const start = startValues[mapping.negative] ?? 0
            next[mapping.negative] = Math.min(max, Math.max(min, start - amount))
          }
        } else if (d < 0) {
          if (mapping.negative) {
            const start = startValues[mapping.negative] ?? 0
            next[mapping.negative] = Math.min(max, Math.max(min, start + amount))
          }

          if (mapping.positive) {
            const start = startValues[mapping.positive] ?? 0
            next[mapping.positive] = Math.min(max, Math.max(min, start - amount))
          }
        }
      }

      applyAxis(zone.y, dy, dragRangeY, true)
      applyAxis(zone.x, dx, dragRangeX)

      for (const constraint of CONSTRAINTS) {
        const currentValue = next[constraint.target] ?? 0
        let clampedValue = currentValue

        if (constraint.min) {
          const minAllowed = constraint.min(next)
          if (clampedValue < minAllowed) {
            clampedValue = minAllowed
          }
        }

        if (constraint.max) {
          const maxAllowed = constraint.max(next)
          if (clampedValue > maxAllowed) {
            clampedValue = maxAllowed
          }
        }

        next[constraint.target] = clampedValue
      }

      return next
    })
  }, [setBlendshapes])

  const resetZone = useCallback((zone: ControlZone) => {
    setBlendshapes(prev => {
      const next = { ...prev }

      const keys = [
        zone.x?.positive,
        zone.x?.negative,
        zone.y?.positive,
        zone.y?.negative,
      ].filter(Boolean) as BlendshapeKey[]

      keys.forEach(k => {
        next[k] = 0
      })

      return next
    })
  }, [setBlendshapes])

  return { startDrag, applyDrag, resetZone }
}