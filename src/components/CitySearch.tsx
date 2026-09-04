import { useEffect, useId, useRef, useState } from "react"
import { Loader2, LocateFixed, MapPin, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/use-debounce"
import { searchCities } from "@/lib/api"
import type { SearchResult } from "@/lib/types"
import { cn } from "cn"

export interface RecentPlace {
  query: string
  label: string
}

interface Props {
  /** Called with a WeatherAPI `q` value: a city name or "lat,lon". */
  onSelect: (query: string, label: string) => void
  recent: RecentPlace[]
  busy?: boolean
}

const describe = (place: SearchResult) =>
  [place.region, place.country].filter(Boolean).join(", ")

export function CitySearch({ onSelect, recent, busy }: Props) {
  const [term, setTerm] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)
  const [locating, setLocating] = useState(false)

  const debounced = useDebounce(term, 300)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()

  useEffect(() => {
    const query = debounced.trim()
    if (query.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    searchCities(query, controller.signal)
      .then((found) => {
        setResults(found)
        setActive(found.length ? 0 : -1)
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResults([])
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [debounced])

  // Close the list when a click lands outside the combobox.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  const showRecent = term.trim().length < 2 && recent.length > 0
  const options = term.trim().length >= 2 ? results : []
  const rowCount = showRecent ? recent.length : options.length

  const choose = (index: number) => {
    if (showRecent) {
      const item = recent[index]
      if (!item) return
      onSelect(item.query, item.label)
    } else {
      const place = options[index]
      if (!place) return
      onSelect(`${place.lat},${place.lon}`, `${place.name}, ${place.country}`)
    }
    setTerm("")
    setOpen(false)
    inputRef.current?.blur()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false)
      return
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!rowCount) return
      event.preventDefault()
      setOpen(true)
      const step = event.key === "ArrowDown" ? 1 : -1
      setActive((current) => (current + step + rowCount) % rowCount)
      return
    }
    if (event.key === "Enter") {
      event.preventDefault()
      if (open && active >= 0 && rowCount > 0) {
        choose(active)
      } else if (term.trim().length >= 2) {
        // Let WeatherAPI resolve the free-text city name itself.
        const raw = term.trim()
        onSelect(raw, raw)
        setTerm("")
        setOpen(false)
      }
    }
  }

  const useMyLocation = () => {
    setLocating(true)
    if (!navigator.geolocation) {
      onSelect("auto:ip", "My location")
      setLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        onSelect(`${latitude.toFixed(4)},${longitude.toFixed(4)}`, "My location")
        setLocating(false)
      },
      () => {
        // Permission denied or unavailable: fall back to IP geolocation.
        onSelect("auto:ip", "My location")
        setLocating(false)
      },
      { timeout: 8000, maximumAge: 600_000 }
    )
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={term}
            onChange={(event) => {
              setTerm(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search for a city..."
            aria-label="Search for a city"
            role="combobox"
            aria-expanded={open && rowCount > 0}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              open && active >= 0 ? `${listboxId}-${active}` : undefined
            }
            autoComplete="off"
            spellCheck={false}
            className="glass h-11 pr-9 pl-9 text-base"
          />
          {(loading || busy) && (
            <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
          {!loading && !busy && term.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setTerm("")
                inputRef.current?.focus()
              }}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <Button
          variant="outline"
          size="icon-lg"
          onClick={useMyLocation}
          disabled={locating}
          aria-label="Use my location"
          className="glass h-11 w-11 shrink-0"
        >
          {locating ? <Loader2 className="animate-spin" /> : <LocateFixed />}
        </Button>
      </div>

      {open && rowCount > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={showRecent ? "Recent searches" : "Search results"}
          className="glass absolute top-full left-0 z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-xl p-1 shadow-xl sm:w-[calc(100%-3.25rem)]"
        >
          {showRecent && (
            <li
              aria-hidden="true"
              className="px-3 pt-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase"
            >
              Recent
            </li>
          )}

          {showRecent
            ? recent.map((item, index) => (
                <li key={`${item.query}-${index}`}>
                  <button
                    type="button"
                    id={`${listboxId}-${index}`}
                    role="option"
                    aria-selected={index === active}
                    onPointerEnter={() => setActive(index)}
                    onClick={() => choose(index)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      index === active
                        ? "bg-foreground/10 text-foreground"
                        : "text-foreground/85"
                    )}
                  >
                    <MapPin className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{item.label}</span>
                  </button>
                </li>
              ))
            : options.map((place, index) => (
                <li key={place.id}>
                  <button
                    type="button"
                    id={`${listboxId}-${index}`}
                    role="option"
                    aria-selected={index === active}
                    onPointerEnter={() => setActive(index)}
                    onClick={() => choose(index)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      index === active
                        ? "bg-foreground/10 text-foreground"
                        : "text-foreground/85"
                    )}
                  >
                    <MapPin className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{place.name}</span>
                    <span className="ml-auto truncate text-xs text-muted-foreground">
                      {describe(place)}
                    </span>
                  </button>
                </li>
              ))}
        </ul>
      )}
    </div>
  )
}
