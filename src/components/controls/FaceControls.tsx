import React, { useState, useRef, useCallback, useEffect } from 'react'
import { DragZone } from './DragZone'
import { useBlendshapeControl } from '../../hooks/useBlendshapeControl'
import { CONTROL_ZONES } from '../../config/controlZones'
import type { ControlZone, BlendshapeValues } from '../../types/blendshape'

interface FaceControlsProps {
  onBlendshapesChange?: (blendshapes: BlendshapeValues) => void
  resetTrigger?: number
}

const ZONE_POSITIONS: Record<string, React.CSSProperties> = {
  r_ear:   { top: '44%', left: '80%' },
  l_ear:   { top: '44%', left: '20%' },
  r_brow:  { top: '48%', left: '65%' },
  l_brow:  { top: '48%', left: '35%' },
  r_cheek: { top: '60%', left: '70%' },
  l_cheek: { top: '60%', left: '30%' },
  nose:    { top: '59%', left: '50%' },
  mouth:   { top: '70%', left: '50%' },
}

const OFFSET_FRACTION = 0.06

export const FaceControls: React.FC<FaceControlsProps> = ({
  onBlendshapesChange,
  resetTrigger,
}) => {
  const [blendshapes, setBlendshapes] = useState<BlendshapeValues>({} as BlendshapeValues)
  const [wrapperSize, setWrapperSize] = useState({ width: 300, height: 500 })

  const wrapperRef = useRef<HTMLDivElement>(null)
  const { startDrag, applyDrag } = useBlendshapeControl(blendshapes, setBlendshapes)

  // Reset all internal blendshape state and notify parent
  useEffect(() => {
    if (!resetTrigger) return
    const empty = {} as BlendshapeValues
    setBlendshapes(empty)
    onBlendshapesChange?.(empty)
  }, [resetTrigger])

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setWrapperSize({ width, height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    onBlendshapesChange?.(blendshapes)
  }, [blendshapes, onBlendshapesChange])

  const getZoneStyle = useCallback((zone: ControlZone): React.CSSProperties => {
    const baseStyle = ZONE_POSITIONS[zone.id] || {}
    const { width: wrapperWidth, height: wrapperHeight } = wrapperSize

    const zoneSize = wrapperWidth * 0.18

    let offsetX = 0
    let offsetY = 0

    if (zone.x?.positive || zone.x?.negative) {
      const pos = zone.x.positive ? blendshapes[zone.x.positive] ?? 0 : 0
      const neg = zone.x.negative ? blendshapes[zone.x.negative] ?? 0 : 0
      const maxPos = wrapperWidth * (zone.displayOffsetXPositive ?? OFFSET_FRACTION)
      const maxNeg = wrapperWidth * (zone.displayOffsetXNegative ?? OFFSET_FRACTION)
      offsetX = pos * maxPos - neg * maxNeg
    }

    if (zone.y?.positive || zone.y?.negative) {
      const pos = zone.y.positive ? blendshapes[zone.y.positive] ?? 0 : 0
      const neg = zone.y.negative ? blendshapes[zone.y.negative] ?? 0 : 0
      const maxPos = wrapperHeight * (zone.displayOffsetYPositive ?? OFFSET_FRACTION)
      const maxNeg = wrapperHeight * (zone.displayOffsetYNegative ?? OFFSET_FRACTION)
      offsetY = -(pos * maxPos) + (neg * maxNeg)
    }

    return {
      ...baseStyle,
      width: `${zoneSize}px`,
      height: `${zoneSize}px`,
      transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
      transition: 'transform 0s ease-out',
    }
  }, [blendshapes, wrapperSize])

  return (
    <div ref={wrapperRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {CONTROL_ZONES.map((zone: ControlZone) => (
        <DragZone
          key={zone.id}
          zone={zone}
          onDragStart={startDrag}
          onDrag={applyDrag}
          onRelease={() => {}}
          style={{
            ...getZoneStyle(zone),
            pointerEvents: 'auto',
          }}
        />
      ))}
    </div>
  )
}