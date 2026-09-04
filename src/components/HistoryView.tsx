import { useEffect, useMemo, useState } from "react"
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { AlertCircle, CalendarDays, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { getHistory, WeatherError } from "@/lib/api"
import type { ForecastDay } from "@/lib/types"
import {
  formatPrecip,
  formatTemp,
  formatWind,
  tempUnitLabel,
  temperatureValue,
  type UnitSystem,
} from "@/lib/units"

interface Props {
  /** The WeatherAPI `q` value for the currently selected place. */
  query: string
  placeLabel: string
  units: UnitSystem
}

const toIsoDate = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

const yesterday = () => {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return date
}

export function HistoryView({ query, placeLabel, units }: Props) {
  const [date, setDate] = useState<Date>(yesterday)
  const [day, setDay] = useState<ForecastDay | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const isoDate = toIsoDate(date)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    getHistory(query, isoDate, controller.signal)
      .then((response) => {
        setDay(response.forecast.forecastday[0] ?? null)
      })
      .catch((caught) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return
        setDay(null)
        setError(
          caught instanceof WeatherError
            ? caught.message
            : "Could not load historical weather."
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [query, isoDate])

  const chartData = useMemo(
    () =>
      (day?.hour ?? []).map((hour) => ({
        time: hour.time.slice(11, 16),
        temp: temperatureValue(hour.temp_c, hour.temp_f, units),
        precip: units === "metric" ? hour.precip_mm : hour.precip_in,
        humidity: hour.humidity,
        condition: hour.condition.text,
      })),
    [day, units]
  )

  const formattedDate = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)

  return (
    <section className="glass rounded-3xl p-4 sm:p-6" aria-label="Past weather">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Past weather
          </h2>
          <p className="mt-1 text-base font-medium">
            {placeLabel} &middot; {formattedDate}
          </p>
        </div>

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger
            render={
              <Button variant="outline" size="lg" className="glass">
                <CalendarDays />
                Pick a date
              </Button>
            }
          />
          <PopoverContent align="end" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(picked) => {
                if (!picked) return
                setDate(picked)
                setCalendarOpen(false)
              }}
              disabled={{ after: yesterday() }}
              defaultMonth={date}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {loading && (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">
              Historical data unavailable
            </p>
            <p className="mt-1 text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && day && (
        <>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "High",
                value: formatTemp(day.day.maxtemp_c, day.day.maxtemp_f, units),
              },
              {
                label: "Low",
                value: formatTemp(day.day.mintemp_c, day.day.mintemp_f, units),
              },
              {
                label: "Precipitation",
                value: formatPrecip(
                  day.day.totalprecip_mm,
                  day.day.totalprecip_in,
                  units
                ),
              },
              {
                label: "Max wind",
                value: formatWind(
                  day.day.maxwind_kph,
                  day.day.maxwind_mph,
                  units
                ),
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-foreground/5 p-3">
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {stat.label}
                </dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id="temp-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.45}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-foreground/10"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  interval={2}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-muted-foreground"
                />
                <YAxis
                  yAxisId="temp"
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-muted-foreground"
                  unit={tempUnitLabel(units)}
                />
                <YAxis
                  yAxisId="precip"
                  orientation="right"
                  hide
                  domain={[0, (dataMax: number) => Math.max(dataMax, 1) * 2.4]}
                />
                <Tooltip
                  cursor={{ stroke: "var(--chart-2)", strokeWidth: 1 }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--popover)",
                    color: "var(--popover-foreground)",
                    fontSize: 12,
                  }}
                  formatter={(value, name) =>
                    name === "temp"
                      ? [`${value}${tempUnitLabel(units)}`, "Temperature"]
                      : [
                          `${value}${units === "metric" ? " mm" : " in"}`,
                          "Precipitation",
                        ]
                  }
                />
                <Bar
                  yAxisId="precip"
                  dataKey="precip"
                  fill="var(--chart-2)"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={10}
                  opacity={0.75}
                  isAnimationActive={false}
                />
                <Area
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temp"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#temp-fill)"
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {!loading && !error && !day && (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4" aria-hidden="true" />
          No observations were recorded for this date.
        </p>
      )}
    </section>
  )
}
