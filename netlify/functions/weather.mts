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

/**
 * Names the city an IP sits in.
 *
 * Passing a bare IP to current/forecast makes WeatherAPI answer with the
 * nearest named place, which is usually a neighbourhood rather than a city:
 * 8.8.8.8 comes back as "Santiago Villa Mobile Home Park", and a Yerevan
 * address as the "Aj'ap'nyak" district. /ip.json answers at city level, so ask
 * it first and use the city name as the query.
 */
async function cityForIp(ip: string, key: string): Promise<string | null> {
  try {
    const url = new URL(`${UPSTREAM}/ip.json`)
    url.searchParams.set("key", key)
    url.searchParams.set("q", ip)

    const response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(5_000),
    })
    if (!response.ok) return null

    const data = await response.json()
    if (typeof data?.city !== "string" || data.city === "") return null
    // The region disambiguates cities that share a name.
    return data.region ? `${data.city}, ${data.region}` : data.city
  } catch {
    // Falling back to the raw IP still produces a usable, if less tidy, answer.
    return null
  }
}

/** Loopback and RFC1918 addresses cannot be geolocated; treat them as unusable. */
function isPublicAddress(ip: string): boolean {
  if (ip === "::1" || ip.startsWith("127.") || ip.startsWith("fe80:")) return false
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) return false
  const [, second] = ip.split(".")
  if (ip.startsWith("172.") && Number(second) >= 16 && Number(second) <= 31) {
    return false
  }
  return true
}

interface CachePolicy {
  seconds: number
  /** True when the answer depends on who asked, so the CDN must not share it. */
  perVisitor: boolean
}

const json = (body: unknown, status: number, cache?: CachePolicy) => {
  let cacheControl = "no-store"
  if (cache?.perVisitor) {
    // Same URL, different answer per caller — keep it out of the shared cache
    // or one visitor gets another visitor's city.
    cacheControl = `private, max-age=${Math.min(cache.seconds, 300)}`
  } else if (cache) {
    cacheControl = `public, max-age=60, s-maxage=${cache.seconds}, stale-while-revalidate=600`
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheControl,
    },
  })
}

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

  // "auto:ip" asks WeatherAPI to geolocate the caller — but the caller here is
  // this function, so it would resolve to whichever data centre is running it.
  // Substitute the visitor's real address, which Netlify passes through.
  if (q === "auto:ip") {
    const clientIp =
      request.headers.get("x-nf-client-connection-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    // Under `netlify dev` the visitor is localhost, which WeatherAPI cannot
    // place; leaving "auto:ip" is the better answer there.
    if (clientIp && isPublicAddress(clientIp)) {
      const city = await cityForIp(clientIp, key)
      upstream.searchParams.set("q", city ?? clientIp)
    }
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

  return json(payload, 200, {
    seconds: ENDPOINTS[endpoint],
    perVisitor: q === "auto:ip",
  })
}
