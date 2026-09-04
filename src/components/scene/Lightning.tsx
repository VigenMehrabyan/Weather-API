import { useEffect, useState } from "react"

/**
 * Random lightning flashes. A real strike reads as a quick double-flash, so
 * each event fires two pulses a few tens of milliseconds apart.
 */
export function Lightning({ animate }: { animate: boolean }) {
  const [flash, setFlash] = useState(0)

  useEffect(() => {
    if (!animate) return

    const timers = new Set<number>()
    const later = (fn: () => void, delay: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id)
        fn()
      }, delay)
      timers.add(id)
    }

    const strike = () => {
      setFlash(1)
      later(() => setFlash(0), 90)
      later(() => setFlash(0.7), 170)
      later(() => setFlash(0), 260)
      later(strike, 4000 + Math.random() * 9000)
    }

    later(strike, 1500 + Math.random() * 4000)

    return () => {
      for (const id of timers) clearTimeout(id)
      timers.clear()
    }
  }, [animate])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-white transition-opacity duration-75"
      style={{ opacity: flash * 0.55 }}
    />
  )
}
