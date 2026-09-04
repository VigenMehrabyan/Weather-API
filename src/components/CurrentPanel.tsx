import { ArrowDown, ArrowUp, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CurrentWeather, DayForecast, WeatherLocation } from "@/lib/types"
import { iconForCode } from "@/lib/weather-codes"
import { formatTemp, tempUnitLabel, type UnitSystem } from "@/lib/units"
import { cn } from "cn"

interface Props {
  location: WeatherLocation
  current: CurrentWeather
  today: DayForecast | undefined
  units: UnitSystem
  onRefresh: () => void
  refreshing: boolean
}

/** Local wall-clock time at the searched location, not the viewer's timezone. */
function localTime(location: WeatherLocation) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      timeZone: location.tz_id,
    }).format(new Date())
  } catch {
    // tz_id is occasionally one the browser does not know.
    return location.localtime.slice(11)
  }
}

export function CurrentPanel({
  location,
  current,
  today,
  units,
  onRefresh,
  refreshing,
}: Props) {
  const Icon = iconForCode(current.condition.code, current.is_day === 1)
  const place = [location.name, location.region || location.country]
    .filter(Boolean)
    .join(", ")

  return (
    <section
      className="animate-rise-in glass rounded-3xl p-6 sm:p-8"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
            {location.name}
          </h1>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {place} &middot; {localTime(location)} local
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon-lg"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh weather"
          title={`Updated ${current.last_updated}`}
          className="shrink-0"
        >
          <RefreshCw className={cn(refreshing && "animate-spin")} />
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-6">
        <div className="flex items-center gap-4">
          <Icon
            className="size-16 shrink-0 text-foreground/80 sm:size-20"
            strokeWidth={1.25}
            aria-hidden="true"
          />
          <div>
            <div className="flex items-start">
              <span className="text-6xl leading-none font-semibold tabular-nums sm:text-7xl">
                {formatTemp(current.temp_c, current.temp_f, units, false)}
              </span>
              <span className="mt-1 ml-1 text-2xl font-medium text-muted-foreground">
                {tempUnitLabel(units)}
              </span>
            </div>
            <p className="mt-2 text-base font-medium sm:text-lg">
              {current.condition.text}
            </p>
          </div>
        </div>

        <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-1.5">
            <dt className="text-muted-foreground">Feels like</dt>
            <dd className="font-semibold tabular-nums">
              {formatTemp(current.feelslike_c, current.feelslike_f, units)}
            </dd>
          </div>
          {today && (
            <>
              <div className="flex items-center gap-1.5">
                <ArrowUp className="size-4 text-muted-foreground" aria-hidden="true" />
                <dt className="sr-only">High</dt>
                <dd className="font-semibold tabular-nums">
                  {formatTemp(today.maxtemp_c, today.maxtemp_f, units)}
                </dd>
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowDown className="size-4 text-muted-foreground" aria-hidden="true" />
                <dt className="sr-only">Low</dt>
                <dd className="font-semibold tabular-nums">
                  {formatTemp(today.mintemp_c, today.mintemp_f, units)}
                </dd>
              </div>
            </>
          )}
        </dl>
      </div>
    </section>
  )
}
