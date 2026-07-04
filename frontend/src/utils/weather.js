import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from 'lucide-react'

const WEATHER_META = {
  0: { label: 'Clear', Icon: Sun },
  1: { label: 'Mainly clear', Icon: CloudSun },
  2: { label: 'Partly cloudy', Icon: CloudSun },
  3: { label: 'Overcast', Icon: Cloud },
  45: { label: 'Foggy', Icon: CloudFog },
  48: { label: 'Foggy', Icon: CloudFog },
  51: { label: 'Light drizzle', Icon: CloudRain },
  53: { label: 'Drizzle', Icon: CloudRain },
  55: { label: 'Heavy drizzle', Icon: CloudRain },
  61: { label: 'Light rain', Icon: CloudRain },
  63: { label: 'Rain', Icon: CloudRain },
  65: { label: 'Heavy rain', Icon: CloudRain },
  71: { label: 'Light snow', Icon: CloudSnow },
  73: { label: 'Snow', Icon: CloudSnow },
  75: { label: 'Heavy snow', Icon: CloudSnow },
  80: { label: 'Showers', Icon: CloudRain },
  81: { label: 'Showers', Icon: CloudRain },
  82: { label: 'Heavy showers', Icon: CloudRain },
  95: { label: 'Thunderstorm', Icon: CloudLightning },
  96: { label: 'Thunderstorm', Icon: CloudLightning },
  99: { label: 'Thunderstorm', Icon: CloudLightning },
}

export function getWeatherMeta(code) {
  return WEATHER_META[code] || { label: 'Weather', Icon: Cloud }
}

export async function reverseGeocode(latitude, longitude) {
  const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client')
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))
  url.searchParams.set('localityLanguage', 'en')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Reverse geocoding failed')

  const data = await res.json()
  const parts = [data.city || data.locality, data.principalSubdivision, data.countryName].filter(Boolean)
  return parts.join(', ') || null
}

export async function geocodePlace(query) {
  if (!query?.trim()) return null

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', query.trim())
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Geocoding failed')

  const data = await res.json()
  const hit = data.results?.[0]
  if (!hit) return null

  const parts = [hit.name, hit.admin1, hit.country].filter(Boolean)
  return {
    latitude: hit.latitude,
    longitude: hit.longitude,
    label: parts.join(', '),
    timezone: hit.timezone,
  }
}

export async function fetchCurrentWeather(latitude, longitude) {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))
  url.searchParams.set('current', 'temperature_2m,weather_code,apparent_temperature')
  url.searchParams.set('timezone', 'auto')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Weather fetch failed')

  const data = await res.json()
  const current = data.current
  if (!current) return null

  const meta = getWeatherMeta(current.weather_code)
  return {
    temperature: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    code: current.weather_code,
    label: meta.label,
    Icon: meta.Icon,
    timezone: data.timezone,
  }
}
