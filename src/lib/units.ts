/**
 * WeatherAPI returns every measurement in both metric and imperial, so unit
 * switching is a matter of picking the right field rather than converting.
 */
export type UnitSystem = "metric" | "imperial"

interface DualValue {
  metric: number
  imperial: number
}

const pick = (value: DualValue, units: UnitSystem) =>
  units === "metric" ? value.metric : value.imperial

export const formatTemp = (
  c: number,
  f: number,
  units: UnitSystem,
  withDegree = true
) => `${Math.round(pick({ metric: c, imperial: f }, units))}${withDegree ? "°" : ""}`

export const temperatureValue = (c: number, f: number, units: UnitSystem) =>
  Math.round(pick({ metric: c, imperial: f }, units))

export const tempUnitLabel = (units: UnitSystem) =>
  units === "metric" ? "°C" : "°F"

export const formatWind = (kph: number, mph: number, units: UnitSystem) =>
  `${Math.round(pick({ metric: kph, imperial: mph }, units))} ${
    units === "metric" ? "km/h" : "mph"
  }`

export const formatPrecip = (mm: number, inches: number, units: UnitSystem) =>
  units === "metric"
    ? `${mm.toFixed(1)} mm`
    : `${inches.toFixed(2)} in`

export const formatPressure = (mb: number, inHg: number, units: UnitSystem) =>
  units === "metric" ? `${Math.round(mb)} hPa` : `${inHg.toFixed(2)} inHg`

export const formatDistance = (km: number, miles: number, units: UnitSystem) =>
  `${Math.round(pick({ metric: km, imperial: miles }, units))} ${
    units === "metric" ? "km" : "mi"
  }`

/** UV index bands as published by the WHO. */
export function uvBand(uv: number): { label: string; tone: string } {
  if (uv < 3) return { label: "Low", tone: "text-emerald-500" }
  if (uv < 6) return { label: "Moderate", tone: "text-amber-500" }
  if (uv < 8) return { label: "High", tone: "text-orange-500" }
  if (uv < 11) return { label: "Very high", tone: "text-red-500" }
  return { label: "Extreme", tone: "text-fuchsia-500" }
}

const COMPASS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
]

export const compassPoint = (degrees: number) =>
  COMPASS[Math.round(degrees / 22.5) % 16]
