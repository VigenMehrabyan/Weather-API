interface Props {
  isNight: boolean
  animate: boolean
}

const BANDS = [
  { top: "24%", height: "26%", duration: 54, opacity: 0.55, direction: "normal" },
  { top: "44%", height: "34%", duration: 78, opacity: 0.45, direction: "reverse" },
  { top: "66%", height: "34%", duration: 42, opacity: 0.6, direction: "normal" },
]

/** Slow, overlapping bands of haze drifting in opposite directions. */
export function Fog({ isNight, animate }: Props) {
  const tint = isNight
    ? "rgba(150, 165, 180, 0.55)"
    : "rgba(255, 255, 255, 0.8)"

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {BANDS.map((band, index) => (
        <div
          key={band.top}
          className={animate ? "absolute animate-fog-drift" : "absolute"}
          style={{
            top: band.top,
            left: 0,
            width: "220%",
            height: band.height,
            opacity: band.opacity,
            filter: "blur(26px)",
            background: `radial-gradient(ellipse 40% 100% at 18% 50%, ${tint}, transparent 70%),
                         radial-gradient(ellipse 34% 100% at 52% 50%, ${tint}, transparent 70%),
                         radial-gradient(ellipse 44% 100% at 84% 50%, ${tint}, transparent 70%)`,
            animationDuration: `${band.duration}s`,
            animationDirection: band.direction,
            animationDelay: `${index * -14}s`,
          }}
        />
      ))}
    </div>
  )
}
