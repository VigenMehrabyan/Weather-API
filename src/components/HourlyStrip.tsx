import { useMemo } from "react"
import { Droplet, Snowflake } from "lucide-react"

import type { ForecastDay, WeatherLocation } from "@/lib/types"
import { iconForCode } from "@/lib/weather-codes"
import { formatTemp, type UnitSystem } from "@/lib/units"
import { cn } from "cn"

interface Props {
  days: ForecastDay[]
  location: WeatherLocation
  units: UnitSystem
  /** Epoch seconds of "now" at the location; the first hour shown. */
  fromEpoch: number
  hours?: number
}

const hourLabel = (epoch: number, timeZone: string) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      timeZone,
    }).format(epoch * 1000)
  } catch {
    return new Date(epoch * 1000).getHours().toString()
  }
}

export function HourlyStrip({
  days,
  location,
  units,
  fromEpoch,
  hours = 24,
}: Props) {
  const slots = useMemo(() => {
    // The API returns whole days; drop the hours that have already passed.
    const startOfHour = fromEpoch - (fromEpoch % 3600)
    return days
      .flatMap((day) => day.hour)
      .filter((hour) => hour.time_epoch >= startOfHour)
      .slice(0, hours)
  }, [days, fromEpoch, hours])

  if (slots.length === 0) return null

  return (
    <section className="glass rounded-3xl p-4 sm:p-5" aria-label="Hourly forecast">
      <h2 className="px-1 pb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        Next {slots.length} hours
      </h2>
      <ul className="scrollbar-slim flex gap-1.5 overflow-x-auto pb-1">
        {slots.map((slot, index) => {
          const Icon = iconForCode(slot.condition.code, slot.is_day === 1)
          const snowy = slot.chance_of_snow > slot.chance_of_rain
          const chance = snowy ? slot.chance_of_snow : slot.chance_of_rain

          return (
            <li
              key={slot.time_epoch}
              className={cn(
                "flex min-w-[4.5rem] shrink-0 flex-col items-center gap-2 rounded-xl px-2 py-3 transition-colors",
                index === 0 && "bg-foreground/10 ring-1 ring-foreground/10"
              )}
            >
              <span className="text-xs font-medium text-muted-foreground">
                {index === 0 ? "Now" : hourLabel(slot.time_epoch, location.tz_id)}
              </span>
              <Icon
                className="size-6 text-foreground/80"
                strokeWidth={1.5}
                aria-label={slot.condition.text}
              />
              <span className="text-sm font-semibold tabular-nums">
                {formatTemp(slot.temp_c, slot.temp_f, units)}
              </span>
              <span
                className={cn(
                  "flex items-center gap-0.5 text-[11px] tabular-nums",
                  chance >= 30 ? "text-sky-600 dark:text-sky-300" : "text-transparent"
                )}
                aria-hidden={chance < 30}
              >
                {snowy ? (
                  <Snowflake className="size-3" />
                ) : (
                  <Droplet className="size-3" />
                )}
                {chance}%
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
