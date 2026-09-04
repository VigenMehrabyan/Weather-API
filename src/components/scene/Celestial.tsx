interface Props {
  isDay: boolean
  /** 0..1 — how much cloud sits in front; dims the sun or moon. */
  cover: number
  animate: boolean
}

/** The sun (day) or moon (night), parked in the upper-right of the sky. */
export function Celestial({ isDay, cover, animate }: Props) {
  const brightness = Math.max(0.18, 1 - cover * 0.85)

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-[8%] right-[10%] size-40 sm:size-56"
      style={{ opacity: brightness }}
    >
      {isDay ? (
        <>
          {/* Warm halo */}
          <div
            className="absolute inset-[-70%] rounded-full blur-2xl"
            style={{
              background:
                "radial-gradient(circle, rgba(255,214,124,0.55) 0%, rgba(255,183,77,0.22) 42%, transparent 70%)",
            }}
          />
          {/* Rays */}
          <svg
            viewBox="0 0 200 200"
            className={animate ? "absolute inset-0 animate-sun-rays" : "absolute inset-0"}
          >
            {Array.from({ length: 12 }, (_, index) => (
              <rect
                key={index}
                x="98"
                y="6"
                width="4"
                height="26"
                rx="2"
                fill="rgba(255, 236, 179, 0.75)"
                transform={`rotate(${index * 30} 100 100)`}
              />
            ))}
          </svg>
          {/* Core */}
          <div
            className={`absolute inset-[22%] rounded-full ${animate ? "animate-sun-pulse" : ""}`}
            style={{
              background:
                "radial-gradient(circle at 35% 32%, #fffbe8 0%, #ffe082 38%, #ffb74d 78%, #ff9800 100%)",
              boxShadow: "0 0 60px rgba(255, 183, 77, 0.65)",
            }}
          />
        </>
      ) : (
        <>
          <div
            className="absolute inset-[-55%] rounded-full blur-2xl"
            style={{
              background:
                "radial-gradient(circle, rgba(203,222,255,0.35) 0%, rgba(160,190,240,0.14) 45%, transparent 72%)",
            }}
          />
          <div
            className={`absolute inset-[24%] rounded-full ${animate ? "animate-moon-glow" : ""}`}
            style={{
              background:
                "radial-gradient(circle at 34% 30%, #ffffff 0%, #e8eefb 45%, #c3cfe6 100%)",
              boxShadow: "0 0 44px rgba(200, 220, 255, 0.45)",
            }}
          >
            <span className="absolute top-[26%] left-[24%] size-[18%] rounded-full bg-slate-400/25" />
            <span className="absolute top-[52%] left-[52%] size-[24%] rounded-full bg-slate-400/20" />
            <span className="absolute top-[18%] left-[58%] size-[12%] rounded-full bg-slate-400/20" />
          </div>
        </>
      )}
    </div>
  )
}
