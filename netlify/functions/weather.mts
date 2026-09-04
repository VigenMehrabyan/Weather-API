/**
 * Server-side proxy for WeatherAPI.com.
 *
 * This is the only place the API key exists at runtime. The browser calls
 * `/api/weather?endpoint=forecast&q=...` and never sees the key: it is read
 * from the WEATHER_API_KEY environment variable (`.env` locally, Netlify
 * environment variables in production) and appended here.
 *
 * The endpoint and query parameters are whitelisted so this cannot be abused
 * as an open proxy to arbitrary WeatherAPI resources.
 */

const UPSTREAM = "https://api.weatherapi.com/v1"

/** Endpoint -> how long the response may be cached at the CDN, in seconds. */
const ENDPOINTS: Record<string, number> = {
  current: 300,
  forecast: 300,
  history: 86400, // the past does not change
  search: 3600,
  astronomy: 86400,
}

/** Query parameters the client is allowed to forward upstream. */
const ALLOWED_PARAMS = [
  "q",
  "days",
  "dt",
  "end_dt",
  "hour",
  "aqi",
  "alerts",
  "lang",
] as const

const json = (body: unknown, status: number, cacheSeconds?: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheSeconds
        ? `public, max-age=60, s-maxage=${cacheSeconds}, stale-while-revalidate=600`
        : "no-store",
    },
  })

const fail = (message: string, status: number, code?: number) =>
  json({ error: { message, code } }, status)

export default async (request: Request): Promise<Response> => {
  const key = process.env.WEATHER_API_KEY
  if (!key) {
    return fail(
      "WEATHER_API_KEY is not configured. Add it to .env locally, or to Site settings -> Environment variables on Netlify.",
      500
    )
  }

  const incoming = new URL(request.url).searchParams
  const endpoint = incoming.get("endpoint") ?? ""

  if (!(endpoint in ENDPOINTS)) {
    return fail(
      `Unsupported endpoint "${endpoint}". Allowed: ${Object.keys(ENDPOINTS).join(", ")}.`,
      400
    )
  }

  const q = incoming.get("q")?.trim()
  if (!q) {
    return fail("Missing required parameter: q.", 400)
  }

  const upstream = new URL(`${UPSTREAM}/${endpoint}.json`)
  upstream.searchParams.set("key", key)

  for (const name of ALLOWED_PARAMS) {
    const value = incoming.get(name)
    if (value === null || value === "") continue
    // WeatherAPI rejects days outside 1..14 with a hard error; clamp instead.
    if (name === "days") {
      const days = Math.min(14, Math.max(1, Number(value) || 1))
      upstream.searchParams.set("days", String(days))
      continue
    }
    upstream.searchParams.set(name, value)
  }

  let response: Response
  try {
    response = await fetch(upstream, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    return fail("Could not reach the weather service. Please try again.", 502)
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok || (payload && "error" in payload)) {
    const upstreamError = payload?.error ?? {}
    return fail(
      upstreamError.message ?? "The weather service returned an error.",
      response.status === 401 || response.status === 403 ? 502 : response.status,
      upstreamError.code
    )
  }

  return json(payload, 200, ENDPOINTS[endpoint])
}
