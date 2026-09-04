# Weather

A weather web app on top of [WeatherAPI.com](https://www.weatherapi.com/): current
conditions, a 14-day forecast with hourly detail, and past weather for any date —
behind an animated sky that matches what it is actually doing outside.

- **Animated conditions.** Sun with rotating rays, moon and twinkling stars,
  drifting cloud decks that darken into storm clouds, wind-angled rain, swaying
  snow, sleet, rolling fog, and lightning. Particle systems run on a single
  canvas; the large, slow elements are CSS and SVG.
- **Light / dark / system theme**, chosen from a shadcn `DropdownMenu` and
  applied before first paint, so a dark reload never flashes white.
- **Metric or imperial**, remembered between visits along with your last city
  and recent searches.
- **Accessible by default**: a keyboard-navigable autocomplete, visible focus
  rings, live regions on data changes, and a still gradient whenever the OS asks
  to reduce motion.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · [shadcn/ui](https://ui.shadcn.com)
(Base UI variant, `base-nova`) · Recharts · Netlify Functions.

## The API key

The key is **never** shipped to the browser. `netlify/functions/weather.mts` is a
server-side proxy: the client calls `/api/weather?endpoint=forecast&q=…` and the
function appends the key from the `WEATHER_API_KEY` environment variable. That
variable deliberately has no `VITE_` prefix, so Vite cannot inline it into the
bundle even by accident.

The function also whitelists the endpoints (`current`, `forecast`, `history`,
`search`, `astronomy`) and the query parameters it will forward, so it cannot be
turned into an open proxy.

## Running locally

```bash
npm install
cp .env.example .env      # then paste your key into WEATHER_API_KEY
npm run dev               # netlify dev — Vite plus the function, on :8888
```

`npm run dev` runs `netlify dev`, which serves the app and the function together
so `/api/weather` behaves exactly as it does in production. `npm run dev:vite`
starts Vite alone, but API calls will 404 without the function.

```bash
npm run build             # type-check and build to dist/
npm run preview           # preview the production build
npm run lint              # oxlint
```

## Deploying to Netlify

1. Push to GitHub.
2. Netlify → **Add new site → Import an existing project** → pick the repo. The
   build command and publish directory come from `netlify.toml`.
3. **Site configuration → Environment variables → `WEATHER_API_KEY`.**
   Without it the function returns 500 and the app shows an error.

## Endpoints used

| Endpoint | Used for |
| --- | --- |
| `/forecast.json` | Current conditions, hourly and 14-day forecast, sunrise/sunset |
| `/search.json` | City autocomplete |
| `/history.json` | The History tab |

`q` accepts a city name, `lat,lon`, or `auto:ip`. The app sends coordinates when
you allow geolocation and falls back to `auto:ip` when you don't.

WeatherAPI's free plan caps the forecast at 3 days and excludes history. The
client detects error code `2009` and quietly retries with a shorter range
instead of failing, so the app keeps working on a downgraded key.

## Previewing the animations

Any scene can be forced with a query parameter, which is handy for design review:

```
/?scene=rain      /?scene=snow       /?scene=fog
/?scene=thunder   /?scene=blizzard   /?scene=clear&night=1
```

Scene names are the `SceneKind` values in `src/lib/weather-codes.ts`; add
`&night=1` to preview the night variant of any of them.
