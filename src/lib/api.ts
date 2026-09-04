import type {
  ForecastResponse,
  HistoryResponse,
  SearchResult,
} from "@/lib/types"

/**
 * Every request goes through the Netlify function at /api/weather, which
 * injects the API key. The key is never present in this bundle.
 */
const PROXY = "/api/weather"

/** WeatherAPI error codes mapped to something a person can act on. */
const ERROR_MESSAGES: Record<number, string> = {
  1002: "The weather service is missing its API key.",
  1003: "No location was provided.",
  1005: "The weather service rejected the request URL.",
  1006: "We couldn't find that location. Try a nearby city.",
  2006: "The API key is invalid.",
  2007: "This API key has used up its monthly request quota.",
  2008: "This API key has been disabled.",
  2009: "This data isn't included in the current API plan.",
  9000: "The request was malformed.",
  9999: "The weather service is having an internal problem. Try again shortly.",
}

export class WeatherError extends Error {
  readonly code?: number

  constructor(message: string, code?: number) {
    super(code && ERROR_MESSAGES[code] ? ERROR_MESSAGES[code] : message)
    this.name = "WeatherError"
    this.code = code
  }
}

/** True when the failure means "your plan doesn't cover this". */
export const isPlanLimited = (error: unknown) =>
  error instanceof WeatherError && error.code === 2009

async function request<T>(
  params: Record<string, string | number | undefined>,
  signal?: AbortSignal
): Promise<T> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value))
  }

  let response: Response
  try {
    response = await fetch(`${PROXY}?${query}`, { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error
    throw new WeatherError("You appear to be offline. Check your connection.")
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const detail = payload?.error
    throw new WeatherError(
      detail?.message ?? `Request failed with status ${response.status}.`,
      detail?.code
    )
  }

  return payload as T
}

/**
 * Current conditions plus the daily and hourly forecast.
 *
 * Free WeatherAPI plans cap the forecast at 3 days and reject anything longer
 * with code 2009, so fall back rather than showing the user an error.
 */
export async function getForecast(
  q: string,
  days = 14,
  signal?: AbortSignal
): Promise<ForecastResponse> {
  try {
    return await request<ForecastResponse>(
      { endpoint: "forecast", q, days, alerts: "no", aqi: "no" },
      signal
    )
  } catch (error) {
    if (isPlanLimited(error) && days > 3) {
      return request<ForecastResponse>(
        { endpoint: "forecast", q, days: 3, alerts: "no", aqi: "no" },
        signal
      )
    }
    throw error
  }
}

/** Observed weather for a past date. `date` is an ISO yyyy-MM-dd string. */
export function getHistory(
  q: string,
  date: string,
  signal?: AbortSignal
): Promise<HistoryResponse> {
  return request<HistoryResponse>({ endpoint: "history", q, dt: date }, signal)
}

/** Autocomplete for the city search box. */
export async function searchCities(
  q: string,
  signal?: AbortSignal
): Promise<SearchResult[]> {
  if (q.trim().length < 2) return []
  const results = await request<SearchResult[]>(
    { endpoint: "search", q },
    signal
  )
  return Array.isArray(results) ? results : []
}
