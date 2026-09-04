import { useCallback, useState } from "react"

/**
 * useState backed by localStorage. Reads and writes are guarded because
 * storage access throws outright in some privacy modes.
 */
export function useStoredState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? fallback : (JSON.parse(raw) as T)
    } catch {
      return fallback
    }
  })

  const update = useCallback(
    (next: T) => {
      setValue(next)
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {
        // Non-fatal: the value still lives in React state for this session.
      }
    },
    [key]
  )

  return [value, update] as const
}
