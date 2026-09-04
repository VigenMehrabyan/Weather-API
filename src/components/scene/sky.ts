import type { SceneKind } from "@/lib/weather-codes"

/**
 * Sky gradients, one pair per scene: how that weather looks by day, and how it
 * looks at night. The palette follows the location's actual `is_day` rather
 * than the UI theme, so a night-time city gets a night sky in either theme.
 * Card legibility is handled by the .glass material instead, which is opaque
 * enough to sit on either sky.
 */
const SKIES: Record<SceneKind, { day: string[]; night: string[] }> = {
  clear: {
    day: ["#2e8ce6", "#69b4f2", "#bfe2fb"],
    night: ["#050a1a", "#0f1c3d", "#1d2f5c"],
  },
  "partly-cloudy": {
    day: ["#3d92dd", "#7cbaea", "#c8e2f6"],
    night: ["#070d21", "#141f42", "#243357"],
  },
  cloudy: {
    day: ["#7794b0", "#a6bccf", "#d3dfe8"],
    night: ["#0b111e", "#1a2437", "#2b3648"],
  },
  overcast: {
    day: ["#6c7f92", "#93a4b3", "#c0cad3"],
    night: ["#080d15", "#161d29", "#252e3c"],
  },
  fog: {
    day: ["#93a1ab", "#b8c1c7", "#dee3e5"],
    night: ["#10151b", "#1f262e", "#333b44"],
  },
  drizzle: {
    day: ["#63809a", "#8ea5ba", "#bdcdda"],
    night: ["#070d17", "#141d2c", "#222d3f"],
  },
  rain: {
    day: ["#4a6379", "#748ca2", "#a6b8c7"],
    night: ["#050a12", "#101827", "#1c2736"],
  },
  "heavy-rain": {
    day: ["#35485a", "#5b7186", "#8b9fb0"],
    night: ["#03070d", "#0b1220", "#16202e"],
  },
  sleet: {
    day: ["#576b7f", "#8397a9", "#b4c2ce"],
    night: ["#060b14", "#111a28", "#1f2937"],
  },
  snow: {
    day: ["#7a90a6", "#a9bccd", "#dce6ef"],
    night: ["#0a1120", "#182238", "#293650"],
  },
  blizzard: {
    day: ["#6a7f93", "#9aacbd", "#cdd8e2"],
    night: ["#080e1a", "#151f30", "#242f44"],
  },
  thunder: {
    day: ["#2c3846", "#4c5c6d", "#7a8b9c"],
    night: ["#02040a", "#080d17", "#131a26"],
  },
}

export function skyGradient(scene: SceneKind, isDay: boolean): string {
  const stops = SKIES[scene][isDay ? "day" : "night"]
  return `linear-gradient(to bottom, ${stops[0]} 0%, ${stops[1]} 48%, ${stops[2]} 100%)`
}
