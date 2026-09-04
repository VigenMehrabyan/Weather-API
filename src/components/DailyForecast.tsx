import { useMemo, useState } from "react"
import { ChevronDown, Droplet, Wind } from "lucide-react"

import type { ForecastDay } from "@/lib/types"
import { iconForCode } from "@/lib/weather-codes"
import { formatWind, temperatureValue, type UnitSystem } from "@/lib/units"
import { cn } from "cn"

interface Props {
  days: ForecastDay[]
  units: UnitSystem
}

const dayName = (date: string, index: number) => {
  if (index === 0) return "Today"
  if (index === 1) return "Tomorrow"
  return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(
    // Parse as local midnight; the API date has no time component.
    new Date(`${date}T12:00:00`)
  )
}

const shortDate = (date: string) =>
  new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(
    new Date(`${date}T12:00:00`)
  )

export function DailyForecast({ days, units }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  // A shared scale so every day's bar is comparable across the whole range.
  const range = useMemo(() => {
    const lows = days.map((d) => temperatureValue(d.day.mintemp_c, d.day.mintemp_f, units))
    const highs = days.map((d) => temperatureValue(d.day.maxtemp_c, d.day.maxtemp_f, units))
    const min = Math.min(...lows)
    const max = Math.max(...highs)
    return { min, max, span: Math.max(max - min, 1) }
  }, [days, units])

  return (
    <section className="glass rounded-3xl p-4 sm:p-5" aria-label="Daily forecast">
      <h2 className="px-1 pb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {days.length}-day forecast
      </h2>

      <ul className="divide-y divide-foreground/10">
        {days.map((day, index) => {
          const Icon = iconForCode(day.day.condition.code, true)
          const low = temperatureValue(day.day.mintemp_c, day.day.mintemp_f, units)
          const high = temperatureValue(day.day.maxtemp_c, day.day.maxtemp_f, units)
          const offset = ((low - range.min) / range.span) * 100
          const width = ((high - low) / range.span) * 100
          const isOpen = expanded === day.date
          const chance = Math.max(
            day.day.daily_chance_of_rain,
            day.day.daily_chance_of_snow
          )

          return (
            <li key={day.date}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : day.date)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 rounded-xl px-1 py-3 text-left transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <div className="w-24 shrink-0 sm:w-32">
                  <p className="truncate text-sm font-medium">
                    {dayName(day.date, index)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shortDate(day.date)}
                  </p>
                </div>

                <Icon
                  className="size-6 shrink-0 text-foreground/80"
                  strokeWidth={1.5}
                  aria-label={day.day.condition.text}
                />

                <span
                  className={cn(
                    "hidden w-12 shrink-0 items-center gap-0.5 text-xs tabular-nums sm:flex",
                    chance >= 30
                      ? "text-sky-600 dark:text-sky-300"
                      : "text-transparent"
                  )}
                  aria-hidden={chance < 30}
                >
                  <Droplet className="size-3" />
                  {chance}%
                </span>

                <span className="w-8 shrink-0 text-right text-sm text-muted-foreground tabular-nums">
                  {low}&deg;
                </span>

                <span className="relative h-1.5 min-w-8 flex-1 overflow-hidden rounded-full bg-foreground/10">
                  <span
                    className="absolute inset-y-0 rounded-full bg-gradient-to-r from-sky-400 to-orange-400"
                    style={{ left: `${offset}%`, width: `${Math.max(width, 6)}%` }}
                  />
                </span>

                <span className="w-8 shrink-0 text-sm font-semibold tabular-nums">
                  {high}&deg;
                </span>

                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>

              {isOpen && (
                <div className="animate-rise-in pb-4">
                  <p className="px-1 pb-2 text-sm text-muted-foreground">
                    {day.day.condition.text} &middot; wind up to{" "}
                    {formatWind(day.day.maxwind_kph, day.day.maxwind_mph, units)}{" "}
                    &middot; humidity {day.day.avghumidity}%
                  </p>
                  <ul className="scrollbar-slim flex gap-1.5 overflow-x-auto pb-1">
                    {day.hour
                      .filter((_, hourIndex) => hourIndex % 2 === 0)
                      .map((hour) => {
                        const HourIcon = iconForCode(
                          hour.condition.code,
                          hour.is_day === 1
                        )
                        return (
                          <li
                            key={hour.time_epoch}
                            className="flex min-w-16 shrink-0 flex-col items-center gap-1.5 rounded-lg px-2 py-2"
                          >
                            <span className="text-[11px] text-muted-foreground">
                              {hour.time.slice(11)}
                            </span>
                            <HourIcon
                              className="size-5 text-foreground/75"
                              strokeWidth={1.5}
                              aria-label={hour.condition.text}
                            />
                            <span className="text-xs font-semibold tabular-nums">
                              {temperatureValue(hour.temp_c, hour.temp_f, units)}&deg;
                            </span>
                          </li>
                        )
                      })}
                  </ul>
                  <p className="flex items-center gap-1.5 px-1 pt-1 text-xs text-muted-foreground">
                    <Wind className="size-3" aria-hidden="true" />
                    Every second hour shown
                  </p>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
