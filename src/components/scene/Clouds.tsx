import type { CSSProperties } from "react"

interface Props {
  /** 0..1 — drives how many layers appear and how opaque they are. */
  cover: number
  /** Night skies need cooler, dimmer cloud tint than daylight ones. */
  isNight: boolean
  animate: boolean
}

interface Layer {
  top: string
  height: string
  duration: number
  opacity: number
  blur: number
  /** Puff positions as [x%, y%, width%, height%]. */
  puffs: [number, number, number, number][]
}

/**
 * Clouds are built from overlapping soft radial gradients rather than SVG
 * shapes: a blurred gradient has no silhouette edge, which is what makes a
 * cloud read as vapour instead of a white blob.
 */
const LAYERS: Layer[] = [
  {
    top: "-4%",
    height: "30%",
    duration: 130,
    opacity: 0.9,
    blur: 12,
    puffs: [
      [6, 62, 15, 70],
      [13, 42, 11, 78],
      [20, 60, 14, 62],
      [40, 55, 13, 74],
      [47, 38, 10, 70],
      [55, 58, 15, 66],
      [78, 60, 14, 68],
      [85, 44, 11, 74],
    ],
  },
  {
    top: "14%",
    height: "26%",
    duration: 92,
    opacity: 0.7,
    blur: 16,
    puffs: [
      [2, 55, 12, 72],
      [10, 66, 16, 58],
      [30, 48, 14, 70],
      [37, 64, 12, 60],
      [62, 52, 15, 68],
      [70, 66, 13, 56],
      [92, 56, 14, 64],
    ],
  },
  {
    top: "30%",
    height: "34%",
    duration: 176,
    opacity: 0.5,
    blur: 22,
    puffs: [
      [16, 58, 20, 66],
      [26, 44, 15, 72],
      [50, 60, 22, 60],
      [72, 50, 18, 70],
      [90, 62, 16, 62],
    ],
  },
]

const puffLayer = (layer: Layer, tint: string) =>
  layer.puffs
    .map(
      ([x, y, w, h]) =>
        `radial-gradient(ellipse ${w}% ${h}% at ${x}% ${y}%, ${tint} 0%, ${tint} 32%, transparent 72%)`
    )
    .join(", ")

/**
 * Fair-weather cloud versus storm cloud. Heavier cover means a darker, greyer
 * deck, so a thunderstorm does not read as a bright summer sky.
 */
function cloudTint(cover: number, isNight: boolean) {
  // 0 at light cover, 1 at a solid overcast deck.
  const heaviness = Math.max(0, Math.min(1, (cover - 0.4) / 0.6))
  const fair = isNight ? [186, 200, 222] : [255, 255, 255]
  const storm = isNight ? [78, 88, 104] : [138, 150, 166]
  const [r, g, b] = fair.map((channel, index) =>
    Math.round(channel + (storm[index] - channel) * heaviness)
  )
  const alpha = isNight ? 0.72 : 0.9
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function Clouds({ cover, isNight, animate }: Props) {
  if (cover <= 0) return null

  const visible = LAYERS.slice(0, cover > 0.6 ? 3 : cover > 0.3 ? 2 : 1)
  const tint = cloudTint(cover, isNight)

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {visible.map((layer, index) => (
        <div
          key={layer.top}
          className={animate ? "absolute animate-cloud-drift" : "absolute"}
          style={
            {
              top: layer.top,
              left: 0,
              width: "200%",
              height: layer.height,
              opacity: layer.opacity * (0.4 + cover * 0.6),
              filter: `blur(${layer.blur}px)`,
              backgroundImage: puffLayer(layer, tint),
              animationDuration: `${layer.duration}s`,
              animationDelay: `${index * -31}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
