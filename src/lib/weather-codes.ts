import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  Cloudy,
  Moon,
  Snowflake,
  Sun,
  type LucideIcon,
} from "lucide-react"

/**
 * The visual families the animated background can render. WeatherAPI ships
 * ~50 condition codes; collapsing them into these keeps the scene layer small
 * while still distinguishing every phenomenon a person would notice.
 */
export type SceneKind =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "heavy-rain"
  | "sleet"
  | "snow"
  | "blizzard"
  | "thunder"

/** condition.code -> scene. Codes are from WeatherAPI's conditions list. */
const CODE_TO_SCENE: Record<number, SceneKind> = {
  1000: "clear",
  1003: "partly-cloudy",
  1006: "cloudy",
  1009: "overcast",

  1030: "fog",
  1135: "fog",
  1147: "fog",

  1063: "drizzle",
  1072: "drizzle",
  1150: "drizzle",
  1153: "drizzle",
  1168: "drizzle",
  1171: "drizzle",

  1180: "rain",
  1183: "rain",
  1186: "rain",
  1189: "rain",
  1198: "rain",
  1240: "rain",

  1192: "heavy-rain",
  1195: "heavy-rain",
  1201: "heavy-rain",
  1243: "heavy-rain",
  1246: "heavy-rain",

  1069: "sleet",
  1204: "sleet",
  1207: "sleet",
  1237: "sleet",
  1249: "sleet",
  1252: "sleet",
  1261: "sleet",
  1264: "sleet",

  1066: "snow",
  1210: "snow",
  1213: "snow",
  1216: "snow",
  1219: "snow",
  1255: "snow",
  1258: "snow",

  1114: "blizzard",
  1117: "blizzard",
  1222: "blizzard",
  1225: "blizzard",

  1087: "thunder",
  1273: "thunder",
  1276: "thunder",
  1279: "thunder",
  1282: "thunder",
}

export function sceneFromCode(code: number): SceneKind {
  return CODE_TO_SCENE[code] ?? "partly-cloudy"
}

/** Icons differ between day and night for the two clear-sky scenes. */
const ICONS: Record<SceneKind, { day: LucideIcon; night: LucideIcon }> = {
  clear: { day: Sun, night: Moon },
  "partly-cloudy": { day: CloudSun, night: CloudMoon },
  cloudy: { day: Cloud, night: Cloud },
  overcast: { day: Cloudy, night: Cloudy },
  fog: { day: CloudFog, night: CloudFog },
  drizzle: { day: CloudDrizzle, night: CloudDrizzle },
  rain: { day: CloudRain, night: CloudRain },
  "heavy-rain": { day: CloudRainWind, night: CloudRainWind },
  sleet: { day: CloudHail, night: CloudHail },
  snow: { day: CloudSnow, night: CloudSnow },
  blizzard: { day: Snowflake, night: Snowflake },
  thunder: { day: CloudLightning, night: CloudLightning },
}

export function iconForCode(code: number, isDay: boolean): LucideIcon {
  const icon = ICONS[sceneFromCode(code)]
  return isDay ? icon.day : icon.night
}

/**
 * Relative intensity, 0..1, used to scale particle counts and cloud opacity so
 * that "light drizzle" and "torrential shower" don't look identical.
 */
export const SCENE_INTENSITY: Record<SceneKind, number> = {
  clear: 0,
  "partly-cloudy": 0.15,
  cloudy: 0.35,
  overcast: 0.55,
  fog: 0.5,
  drizzle: 0.3,
  rain: 0.6,
  "heavy-rain": 1,
  sleet: 0.6,
  snow: 0.55,
  blizzard: 1,
  thunder: 0.85,
}

/** Which particle system, if any, the scene needs. */
export function precipitationOf(
  scene: SceneKind
): "rain" | "snow" | "sleet" | null {
  switch (scene) {
    case "drizzle":
    case "rain":
    case "heavy-rain":
    case "thunder":
      return "rain"
    case "snow":
    case "blizzard":
      return "snow"
    case "sleet":
      return "sleet"
    default:
      return null
  }
}

/** How much cloud cover to draw, 0 = none, 1 = solid deck. */
export function cloudinessOf(scene: SceneKind): number {
  switch (scene) {
    case "clear":
      return 0
    case "partly-cloudy":
      return 0.35
    case "fog":
      return 0.4
    case "drizzle":
      return 0.7
    case "cloudy":
      return 0.7
    case "rain":
    case "sleet":
    case "snow":
      return 0.85
    default:
      return 1
  }
}
