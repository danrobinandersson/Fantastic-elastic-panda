import { useRef } from 'react'
import type { ControlZone } from '../../types/blendshape'

interface DragZoneProps {
  zone: ControlZone
  onDragStart?: (zone: ControlZone) => void
  onDrag: (zone: ControlZone, dx: number, dy: number) => void
  onRelease?: (zone: ControlZone) => void
  style?: React.CSSProperties
}

export function DragZone({ zone, onDragStart, onDrag, onRelease, style }: DragZoneProps) {
  const originRef = useRef<{ x: number; y: number } | null>(null)

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault()

    originRef.current = { x: e.clientX, y: e.clientY }
    onDragStart?.(zone)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  function onMouseMove(e: MouseEvent) {
    if (!originRef.current) return

    onDrag(
      zone,
      e.clientX - originRef.current.x,
      e.clientY - originRef.current.y
    )
  }

  function onMouseUp() {
    originRef.current = null
    onRelease?.(zone)

    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]

    originRef.current = { x: t.clientX, y: t.clientY }
    onDragStart?.(zone)

    // Attach passive: false listener for touch move to allow preventDefault
    const touchMoveHandler = (event: TouchEvent) => {
      event.preventDefault()
      if (!originRef.current) return

      const touch = event.touches[0]
      onDrag(
        zone,
        touch.clientX - originRef.current.x,
        touch.clientY - originRef.current.y
      )
    }

    const touchEndHandler = () => {
      originRef.current = null
      onRelease?.(zone)
      window.removeEventListener('touchmove', touchMoveHandler as EventListener)
      window.removeEventListener('touchend', touchEndHandler as EventListener)
    }

    window.addEventListener('touchmove', touchMoveHandler as EventListener, { passive: false } as AddEventListenerOptions)
    window.addEventListener('touchend', touchEndHandler as EventListener)
  }

  return (
    <div
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      style={{
        position: 'absolute',
        width: '1%',
        height: '1%',
        borderRadius: '50%',
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        // border: '2px solid rgba(255, 255, 255, 0.8)', // for debugging
        ...style,
      }}
      aria-label={`Control ${zone.label}`}
      role="slider"
    />
  )
}