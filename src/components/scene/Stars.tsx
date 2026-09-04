import { useMemo } from "react"

/**
 * A fixed field of twinkling stars. Positions are generated once per mount so
 * the sky doesn't reshuffle on every render.
 */
export function Stars({ animate }: { animate: boolean }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 70 }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        // Keep stars out of the bottom third, where the content sits.
        top: Math.random() * 62,
        size: 1 + Math.random() * 1.8,
        delay: Math.random() * 4,
        duration: 2.6 + Math.random() * 3.4,
        opacity: 0.35 + Math.random() * 0.5,
      })),
    []
  )

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {stars.map((star) => (
        <span
          key={star.id}
          className={`absolute rounded-full bg-white ${animate ? "animate-twinkle" : ""}`}
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
