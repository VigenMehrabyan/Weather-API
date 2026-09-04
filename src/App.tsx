import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, CloudSun, RotateCw } from "lucide-react"

import { CitySearch, type RecentPlace } from "@/components/CitySearch"
import { CurrentPanel } from "@/components/CurrentPanel"
import { DailyForecast } from "@/components/DailyForecast"
import { DetailsGrid } from "@/components/DetailsGrid"
import { HourlyStrip } from "@/components/HourlyStrip"
import { ThemeToggle } from "@/components/ThemeToggle"
import { UnitsToggle } from "@/components/UnitsToggle"
import { WeatherScene } from "@/components/scene/WeatherScene"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStoredState } from "@/hooks/use-stored-state"
import { getForecast, WeatherError } from "@/lib/api"
import type { ForecastResponse } from "@/lib/types"
import { sceneFromCode, type SceneKind } from "@/lib/weather-codes"
import type { UnitSystem } from "@/lib/units"

// Charting pulls in recharts, which is large; keep it out of the first load.
const HistoryView = lazy(() =>
  import("@/components/HistoryView").then((module) => ({
    default: module.HistoryView,
  }))
)

const MAX_RECENT = 6

/**
 * Lets a scene be forced for design review, e.g. ?scene=snow or ?scene=thunder.
 * `?night=1` pairs with it to preview the night variant.
 */
function readSceneOverride(): { scene: SceneKind; isDay: boolean } | null {
  const params = new URLSearchParams(window.location.search)
  const scene = params.get("scene")
  if (!scene) return null
  return { scene: scene as SceneKind, isDay: params.get("night") !== "1" }
}

function LoadingState() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading weather">
      <Skeleton className="h-56 rounded-3xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-3xl" />
    </div>
  )
}

export default function App() {
  const [place, setPlace] = useStoredState<RecentPlace>("weather-place", {
    query: "auto:ip",
    label: "My location",
  })
  const [recent, setRecent] = useStoredState<RecentPlace[]>("weather-recent", [])
  const [units, setUnits] = useStoredState<UnitSystem>("weather-units", "metric")

  const [data, setData] = useState<ForecastResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestRef = useRef<AbortController | null>(null)

  const load = useCallback(async (query: string, mode: "initial" | "refresh") => {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller

    if (mode === "refresh") setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const response = await getForecast(query, 14, controller.signal)
      setData(response)
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return
      setError(
        caught instanceof WeatherError
          ? caught.message
          : "Something went wrong loading the forecast."
      )
      if (mode === "initial") setData(null)
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    void load(place.query, "initial")
    return () => requestRef.current?.abort()
  }, [place.query, load])

  const selectPlace = (query: string, label: string) => {
    setPlace({ query, label })
    setRecent(
      [{ query, label }, ...recent.filter((item) => item.query !== query)].slice(
        0,
        MAX_RECENT
      )
    )
  }

  const current = data?.current
  const forecastDays = data?.forecast.forecastday ?? []

  const override = readSceneOverride()
  const scene = override
    ? override.scene
    : current
      ? sceneFromCode(current.condition.code)
      : "partly-cloudy"
  const isDay = override ? override.isDay : current?.is_day !== 0

  return (
    <>
      <WeatherScene
        scene={scene}
        isDay={isDay}
        windKph={current?.wind_kph ?? 0}
      />

      <div className="min-h-dvh">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
          <header className="flex flex-wrap items-center gap-3">
            {/* Everything that sits directly on the sky rides on the glass
                material, so nothing depends on the sky being a given colour. */}
            <div className="glass flex h-11 items-center gap-2 rounded-xl px-3 font-semibold tracking-tight">
              <CloudSun className="size-5 text-foreground/70" aria-hidden="true" />
              <span className="hidden sm:inline">Weather</span>
            </div>

            <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
              <CitySearch
                onSelect={selectPlace}
                recent={recent}
                busy={loading && !data}
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <UnitsToggle units={units} onChange={setUnits} />
              <ThemeToggle />
            </div>
          </header>

          <main className="mt-6 sm:mt-8">
            {loading && !data && <LoadingState />}

            {error && !data && !loading && (
              <div className="glass animate-rise-in flex flex-col items-start gap-4 rounded-3xl p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className="mt-0.5 size-5 shrink-0 text-destructive"
                    aria-hidden="true"
                  />
                  <div>
                    <h2 className="font-semibold">
                      Couldn&rsquo;t load the weather
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
                <Button onClick={() => void load(place.query, "initial")}>
                  <RotateCw />
                  Try again
                </Button>
              </div>
            )}

            {data && current && (
              <div className="space-y-4">
                {error && (
                  <p
                    role="status"
                    className="glass rounded-2xl px-4 py-3 text-sm text-muted-foreground"
                  >
                    Showing the last successful reading &mdash; {error}
                  </p>
                )}

                <CurrentPanel
                  location={data.location}
                  current={current}
                  today={forecastDays[0]?.day}
                  units={units}
                  onRefresh={() => void load(place.query, "refresh")}
                  refreshing={refreshing}
                />

                <Tabs defaultValue="forecast">
                  <TabsList>
                    <TabsTrigger value="forecast">Forecast</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="forecast" className="mt-4 space-y-4">
                    <HourlyStrip
                      days={forecastDays}
                      location={data.location}
                      units={units}
                      fromEpoch={data.location.localtime_epoch}
                    />
                    <DetailsGrid
                      current={current}
                      astro={forecastDays[0]?.astro}
                      units={units}
                    />
                    {forecastDays.length > 0 && (
                      <DailyForecast days={forecastDays} units={units} />
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="mt-4">
                    <Suspense
                      fallback={<Skeleton className="h-96 rounded-3xl" />}
                    >
                      <HistoryView
                        query={place.query}
                        placeLabel={data.location.name}
                        units={units}
                      />
                    </Suspense>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </main>

          <footer className="mt-10 flex justify-center pb-4">
            <p className="glass rounded-full px-4 py-2 text-xs text-muted-foreground">
              Data by{" "}
              <a
                href="https://www.weatherapi.com/"
                target="_blank"
                rel="noreferrer noopener"
                className="underline underline-offset-2 hover:text-foreground"
              >
                WeatherAPI.com
              </a>
            </p>
          </footer>
        </div>
      </div>
    </>
  )
}
