import { useRef } from 'react'
import type { ControlZone } from '../../types/blendshape'

interface DragZoneProps {
  zone: ControlZone
  onDragStart?: (zone: ControlZone) => void
  onDrag: (zone: ControlZone, dx: number, dy: number) => void
  onRelease?: (zone: ControlZone) => void
  style?: React.CSSProperties
}

const SLOPPY_SOUND_SRC = "/sounds/sloppy.mp3";
const VELOCITY_THRESHOLD = 0.8; // Adjust this value to make it more or less sensitive to movement speed

const SUSTAIN_REQUIRED_MS = 120;
const FADE_IN_MS = 10;
const STOP_DELAY_MS = 10;
const FADE_OUT_MS = 200;
const MAX_VOLUME = 0.15;

export function DragZone({ zone, onDragStart, onDrag, onRelease, style }: DragZoneProps) {
  const originRef = useRef<{ x: number; y: number } | null>(null)

const fastSinceRef = useRef<number | null>(null);
const fadeInIntervalRef = useRef<number | null>(null);
const stopTimeoutRef = useRef<number | null>(null);
const fadeOutIntervalRef = useRef<number | null>(null);


function shouldUseSloppySound(zoneId: string) {
  return zoneId === 'l_cheek' || zoneId === 'r_cheek' || zoneId === 'mouth'
}

  const lastMoveRef = useRef<{
    x: number
    y: number
    time: number
  } | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  function getAudio() {
    if (!audioRef.current) {
      audioRef.current = new Audio(SLOPPY_SOUND_SRC)
      audioRef.current.loop = true
      audioRef.current.volume = 0.35
    }

    return audioRef.current
  }
function clearSoundTimers() {
  if (stopTimeoutRef.current) {
    window.clearTimeout(stopTimeoutRef.current);
    stopTimeoutRef.current = null;
  }

  if (fadeInIntervalRef.current) {
    window.clearInterval(fadeInIntervalRef.current);
    fadeInIntervalRef.current = null;
  }

  if (fadeOutIntervalRef.current) {
    window.clearInterval(fadeOutIntervalRef.current);
    fadeOutIntervalRef.current = null;
  }
}

function startSloppySound() {
  if (!shouldUseSloppySound(zone.id)) return;

  const audio = getAudio();

  clearSoundTimers();

  if (audio.paused) {
    audio.volume = 0;
    audio.play().catch(() => {});
  }

  const startVolume = audio.volume;
  const steps = 12;
  const stepTime = FADE_IN_MS / steps;
  let step = 0;

  fadeInIntervalRef.current = window.setInterval(() => {
    step += 1;

    const nextVolume =
      startVolume + (MAX_VOLUME - startVolume) * (step / steps);

    audio.volume = Math.min(MAX_VOLUME, nextVolume);

    if (step >= steps) {
      if (fadeInIntervalRef.current) {
        window.clearInterval(fadeInIntervalRef.current);
        fadeInIntervalRef.current = null;
      }

      audio.volume = MAX_VOLUME;
    }
  }, stepTime);
}

function stopSloppySound() {
  if (!shouldUseSloppySound(zone.id)) return;

  const audio = audioRef.current;
  if (!audio) return;

  clearSoundTimers();

  stopTimeoutRef.current = window.setTimeout(() => {
    const startVolume = audio.volume;
    const steps = 12;
    const stepTime = FADE_OUT_MS / steps;
    let step = 0;

    fadeOutIntervalRef.current = window.setInterval(() => {
      step += 1;

      const nextVolume = startVolume * (1 - step / steps);
      audio.volume = Math.max(0, nextVolume);

      if (step >= steps) {
        if (fadeOutIntervalRef.current) {
          window.clearInterval(fadeOutIntervalRef.current);
          fadeOutIntervalRef.current = null;
        }

        audio.pause();
        audio.volume = MAX_VOLUME;
      }
    }, stepTime);
  }, STOP_DELAY_MS);
}

  function updateVelocitySound(x: number, y: number) {
    const now = performance.now()

    if (lastMoveRef.current) {
      const dx = x - lastMoveRef.current.x
      const dy = y - lastMoveRef.current.y
      const dt = now - lastMoveRef.current.time

      const distance = Math.sqrt(dx * dx + dy * dy)
      const velocity = distance / Math.max(dt, 1)

if (velocity > VELOCITY_THRESHOLD) {
  if (fastSinceRef.current === null) {
    fastSinceRef.current = now;
  }

  const fastDuration = now - fastSinceRef.current;

  if (fastDuration >= SUSTAIN_REQUIRED_MS) {
    startSloppySound();
  }
} else {
  fastSinceRef.current = null;
  stopSloppySound();
}
    }

    lastMoveRef.current = {
      x,
      y,
      time: now,
    }
  }

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault()

    originRef.current = { x: e.clientX, y: e.clientY }
    lastMoveRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
    }

    onDragStart?.(zone)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  function onMouseMove(e: MouseEvent) {
    if (!originRef.current) return

    updateVelocitySound(e.clientX, e.clientY)

    onDrag(
      zone,
      e.clientX - originRef.current.x,
      e.clientY - originRef.current.y
    )
  }

  function onMouseUp() {
    originRef.current = null
    lastMoveRef.current = null

    stopSloppySound()
    onRelease?.(zone)

    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]

    originRef.current = { x: t.clientX, y: t.clientY }
    lastMoveRef.current = {
      x: t.clientX,
      y: t.clientY,
      time: performance.now(),
    }

    onDragStart?.(zone)

    const touchMoveHandler = (event: TouchEvent) => {
      event.preventDefault()
      if (!originRef.current) return

      const touch = event.touches[0]

      updateVelocitySound(touch.clientX, touch.clientY)

      onDrag(
        zone,
        touch.clientX - originRef.current.x,
        touch.clientY - originRef.current.y
      )
    }

    const touchEndHandler = () => {
      originRef.current = null
      lastMoveRef.current = null

      stopSloppySound()
      onRelease?.(zone)

      window.removeEventListener('touchmove', touchMoveHandler as EventListener)
      window.removeEventListener('touchend', touchEndHandler as EventListener)
    }

    window.addEventListener(
      'touchmove',
      touchMoveHandler as EventListener,
      { passive: false } as AddEventListenerOptions
    )

    window.addEventListener(
      'touchend',
      touchEndHandler as EventListener
    )
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
        minWidth: '44px',
        minHeight: '44px',
        borderRadius: '50%',
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        ...style,
      }}
      aria-label={`Control ${zone.label}`}
      role="slider"
    />
  )
}
