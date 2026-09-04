import {
  Droplets,
  Eye,
  Gauge,
  Navigation,
  Sunrise,
  Sunset,
  Thermometer,
  Sun as SunIcon,
  Wind,
} from "lucide-react"

import type { Astro, CurrentWeather } from "@/lib/types"
import {
  compassPoint,
  formatDistance,
  formatPressure,
  formatTemp,
  formatWind,
  uvBand,
  type UnitSystem,
} from "@/lib/units"

interface Props {
  current: CurrentWeather
  astro: Astro | undefined
  units: UnitSystem
}

interface Tile {
  key: string
  label: string
  value: string
  hint?: string
  icon: typeof Wind
  /** Extra element rendered next to the value, e.g. the wind arrow. */
  adornment?: React.ReactNode
  tone?: string
}

export function DetailsGrid({ current, astro, units }: Props) {
  const uv = uvBand(current.uv)

  const tiles: Tile[] = [
    {
      key: "wind",
      label: "Wind",
      value: formatWind(current.wind_kph, current.wind_mph, units),
      hint: `${compassPoint(current.wind_degree)} · gusts ${formatWind(
        current.gust_kph,
        current.gust_mph,
        units
      )}`,
      icon: Wind,
      adornment: (
        <Navigation
          className="size-4 text-muted-foreground"
          aria-hidden="true"
          // The icon points north by default; rotate to the direction the wind
          // is blowing towards.
          style={{ transform: `rotate(${current.wind_degree + 180}deg)` }}
        />
      ),
    },
    {
      key: "humidity",
      label: "Humidity",
      value: `${current.humidity}%`,
      hint: `Dew point ${formatTemp(current.dewpoint_c, current.dewpoint_f, units)}`,
      icon: Droplets,
    },
    {
      key: "uv",
      label: "UV index",
      value: `${Math.round(current.uv)}`,
      hint: uv.label,
      icon: SunIcon,
      tone: uv.tone,
    },
    {
      key: "pressure",
      label: "Pressure",
      value: formatPressure(current.pressure_mb, current.pressure_in, units),
      icon: Gauge,
    },
    {
      key: "visibility",
      label: "Visibility",
      value: formatDistance(current.vis_km, current.vis_miles, units),
      icon: Eye,
    },
    {
      key: "feels",
      label: "Feels like",
      value: formatTemp(current.feelslike_c, current.feelslike_f, units),
      hint: `Cloud cover ${current.cloud}%`,
      icon: Thermometer,
    },
  ]

  if (astro) {
    tiles.push(
      {
        key: "sunrise",
        label: "Sunrise",
        value: astro.sunrise,
        icon: Sunrise,
      },
      {
        key: "sunset",
        label: "Sunset",
        value: astro.sunset,
        hint: astro.moon_phase,
        icon: Sunset,
      }
    )
  }

  return (
    <section aria-label="Current conditions in detail">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.key} className="glass-flat rounded-2xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <tile.icon className="size-4" aria-hidden="true" />
              <span className="text-xs font-medium tracking-wide uppercase">
                {tile.label}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`text-xl font-semibold tabular-nums ${tile.tone ?? ""}`}
              >
                {tile.value}
              </span>
              {tile.adornment}
            </div>
            {tile.hint && (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {tile.hint}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
