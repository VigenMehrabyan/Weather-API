/** Response shapes from WeatherAPI.com, narrowed to the fields this app uses. */

export interface Condition {
  text: string
  icon: string
  code: number
}

export interface WeatherLocation {
  name: string
  region: string
  country: string
  lat: number
  lon: number
  tz_id: string
  localtime_epoch: number
  localtime: string
}

export interface CurrentWeather {
  last_updated_epoch: number
  last_updated: string
  temp_c: number
  temp_f: number
  is_day: 0 | 1
  condition: Condition
  wind_kph: number
  wind_mph: number
  wind_degree: number
  wind_dir: string
  gust_kph: number
  gust_mph: number
  pressure_mb: number
  pressure_in: number
  precip_mm: number
  precip_in: number
  humidity: number
  cloud: number
  feelslike_c: number
  feelslike_f: number
  dewpoint_c: number
  dewpoint_f: number
  vis_km: number
  vis_miles: number
  uv: number
}

export interface HourForecast {
  time_epoch: number
  time: string
  temp_c: number
  temp_f: number
  is_day: 0 | 1
  condition: Condition
  wind_kph: number
  wind_mph: number
  wind_degree: number
  humidity: number
  feelslike_c: number
  feelslike_f: number
  chance_of_rain: number
  chance_of_snow: number
  precip_mm: number
  precip_in: number
  uv: number
}

export interface DayForecast {
  maxtemp_c: number
  maxtemp_f: number
  mintemp_c: number
  mintemp_f: number
  avgtemp_c: number
  avgtemp_f: number
  maxwind_kph: number
  maxwind_mph: number
  totalprecip_mm: number
  totalprecip_in: number
  avghumidity: number
  daily_chance_of_rain: number
  daily_chance_of_snow: number
  condition: Condition
  uv: number
}

export interface Astro {
  sunrise: string
  sunset: string
  moonrise: string
  moonset: string
  moon_phase: string
  moon_illumination: number
}

export interface ForecastDay {
  date: string
  date_epoch: number
  day: DayForecast
  astro: Astro
  hour: HourForecast[]
}

export interface ForecastResponse {
  location: WeatherLocation
  current: CurrentWeather
  forecast: { forecastday: ForecastDay[] }
}

export interface HistoryResponse {
  location: WeatherLocation
  forecast: { forecastday: ForecastDay[] }
}

export interface SearchResult {
  id: number
  name: string
  region: string
  country: string
  lat: number
  lon: number
  url: string
}
