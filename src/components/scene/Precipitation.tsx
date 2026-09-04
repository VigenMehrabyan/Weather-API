import { useEffect, useRef } from "react"

export type PrecipitationKind = "rain" | "snow" | "sleet"

interface Particle {
  x: number
  y: number
  /** Fall speed in px per second. */
  speed: number
  /** Rain: streak length. Snow/sleet: radius. */
  size: number
  opacity: number
  /** Horizontal phase, used by snow to sway. */
  phase: number
  sway: number
}

interface Props {
  kind: PrecipitationKind
  /** 0..1, scales how many particles fall. */
  intensity: number
  /** Wind speed in km/h; tilts rain and pushes snow sideways. */
  windKph: number
  /** Night skies take bright drops; daylight skies need darker ones. */
  isNight: boolean
}

/** Particles per million device-independent pixels, at full intensity. */
const DENSITY: Record<PrecipitationKind, number> = {
  rain: 420,
  snow: 190,
  sleet: 300,
}

const MAX_PARTICLES = 900

/**
 * A single canvas driving every falling particle. Canvas rather than DOM nodes
 * because a heavy shower is several hundred particles at 60fps, which would
 * thrash layout as elements.
 */
export function Precipitation({ kind, intensity, windKph, isNight }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Held in a ref so wind and intensity changes don't restart the animation.
  const settings = useRef({ kind, intensity, windKph, isNight })
  settings.current = { kind, intensity, windKph, isNight }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return

    let width = 0
    let height = 0
    let particles: Particle[] = []
    let frame = 0
    let lastTime = performance.now()
    let running = true

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const spawn = (particle: Particle | null, atTop: boolean): Particle => {
      const { kind: k, windKph: wind } = settings.current
      const p = particle ?? ({} as Particle)
      p.x = Math.random() * (width + 200) - 100
      p.y = atTop ? -Math.random() * 120 - 20 : Math.random() * height
      p.phase = Math.random() * Math.PI * 2
      if (k === "snow") {
        p.size = 1.2 + Math.random() * 2.8
        p.speed = 25 + p.size * 14
        p.opacity = 0.45 + Math.random() * 0.5
        p.sway = 10 + Math.random() * 26
      } else if (k === "sleet") {
        p.size = 1 + Math.random() * 1.6
        p.speed = 320 + Math.random() * 260
        p.opacity = 0.4 + Math.random() * 0.4
        p.sway = 0
      } else {
        p.size = 9 + Math.random() * 16
        p.speed = 480 + Math.random() * 420 + Math.abs(wind) * 4
        p.opacity = 0.18 + Math.random() * 0.35
        p.sway = 0
      }
      return p
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      const target = Math.min(
        MAX_PARTICLES,
        Math.round(
          ((width * height) / 1_000_000) *
            DENSITY[settings.current.kind] *
            (0.35 + settings.current.intensity * 0.65)
        )
      )
      particles = Array.from({ length: target }, () => spawn(null, false))
    }

    const draw = (now: number) => {
      if (!running) return
      // Clamp dt so a backgrounded tab doesn't teleport every particle.
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      const { kind: k, windKph: wind, isNight: night } = settings.current
      const drift = wind * 1.6 // km/h -> px/s of horizontal push
      context.clearRect(0, 0, width, height)

      if (k === "snow") {
        context.fillStyle = "rgba(255, 255, 255, 1)"
        for (const p of particles) {
          p.y += p.speed * dt
          p.phase += dt * 1.4
          p.x += (Math.sin(p.phase) * p.sway + drift * 0.35) * dt
          if (p.y > height + 12) spawn(p, true)
          if (p.x < -120) p.x += width + 200
          if (p.x > width + 120) p.x -= width + 200

          context.globalAlpha = p.opacity
          context.beginPath()
          context.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          context.fill()
        }
      } else {
        // Rain and sleet are drawn as streaks angled by the wind.
        const angle = Math.atan2(drift, 900)
        const dx = Math.sin(angle)
        const dy = Math.cos(angle)
        context.lineCap = "round"
        // Bright streaks read on a night sky; a daylight sky needs darker ones.
        context.strokeStyle = night
          ? "rgba(198, 220, 250, 1)"
          : "rgba(226, 240, 255, 1)"

        for (const p of particles) {
          p.y += p.speed * dy * dt
          p.x += p.speed * dx * dt
          if (p.y > height + 20) spawn(p, true)
          if (p.x < -120) p.x += width + 200
          if (p.x > width + 120) p.x -= width + 200

          const length = k === "sleet" ? p.size * 3 : p.size
          context.globalAlpha = p.opacity
          context.lineWidth = k === "sleet" ? 1.4 : 1.1
          context.beginPath()
          context.moveTo(p.x, p.y)
          context.lineTo(p.x - dx * length, p.y - dy * length)
          context.stroke()
        }
      }

      context.globalAlpha = 1
      frame = requestAnimationFrame(draw)
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(frame)
      } else if (!running) {
        running = true
        lastTime = performance.now()
        frame = requestAnimationFrame(draw)
      }
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()
    frame = requestAnimationFrame(draw)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      running = false
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
    // Wind and sky tone are read from the ref, so they never restart the loop.
  }, [kind, intensity])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
}
