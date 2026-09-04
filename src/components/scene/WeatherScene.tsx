import { useEffect, useRef, useState } from "react"

import { useReducedMotion } from "@/hooks/use-reduced-motion"
import {
  cloudinessOf,
  precipitationOf,
  SCENE_INTENSITY,
  type SceneKind,
} from "@/lib/weather-codes"
import { Celestial } from "@/components/scene/Celestial"
import { Clouds } from "@/components/scene/Clouds"
import { Fog } from "@/components/scene/Fog"
import { Lightning } from "@/components/scene/Lightning"
import { Precipitation } from "@/components/scene/Precipitation"
import { skyGradient } from "@/components/scene/sky"
import { Stars } from "@/components/scene/Stars"

interface Props {
  scene: SceneKind
  isDay: boolean
  windKph: number
}

const CROSSFADE_MS = 900

/**
 * The animated backdrop. It sits behind all content and reacts to the current
 * conditions: sky colour, sun or moon, cloud cover, precipitation, fog, and
 * lightning. Everything degrades to a still gradient under "reduce motion".
 */
export function WeatherScene({ scene, isDay, windKph }: Props) {
  const reducedMotion = useReducedMotion()
  const animate = !reducedMotion

  // The sky follows the location's day/night, not the UI theme.
  const isNight = !isDay
  const gradient = skyGradient(scene, isDay)
  const cover = cloudinessOf(scene)
  const precipitation = precipitationOf(scene)
  const intensity = SCENE_INTENSITY[scene]

  // Two stacked gradients let the sky cross-fade; CSS cannot tween a gradient.
  const nextKey = useRef(0)
  const [layers, setLayers] = useState(() => [{ id: 0, gradient }])

  useEffect(() => {
    setLayers((current) => {
      if (current[current.length - 1].gradient === gradient) return current
      nextKey.current += 1
      return [...current.slice(-1), { id: nextKey.current, gradient }]
    })
  }, [gradient])

  useEffect(() => {
    if (layers.length < 2) return
    const timer = setTimeout(
      () => setLayers((current) => current.slice(-1)),
      CROSSFADE_MS
    )
    return () => clearTimeout(timer)
  }, [layers])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {layers.map((layer, index) => (
        <div
          key={layer.id}
          className="absolute inset-0 transition-opacity ease-out"
          style={{
            background: layer.gradient,
            // The outgoing layer stays on top and fades away, revealing the new
            // one underneath — a freshly mounted node cannot animate its own
            // opacity from 0 without an extra frame.
            opacity: index === layers.length - 1 ? 1 : 0,
            zIndex: index === layers.length - 1 ? 0 : 1,
            transitionDuration: `${CROSSFADE_MS}ms`,
          }}
        />
      ))}

      {!isDay && <Stars animate={animate} />}

      <Celestial isDay={isDay} cover={cover} animate={animate} />

      <Clouds cover={cover} isNight={isNight} animate={animate} />

      {scene === "fog" && <Fog isNight={isNight} animate={animate} />}

      {animate && precipitation && (
        <Precipitation
          kind={precipitation}
          intensity={intensity}
          windKph={windKph}
          isNight={isNight}
        />
      )}

      {scene === "thunder" && <Lightning animate={animate} />}

    </div>
  )
}
