import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { fetchCurrentWeather, reverseGeocode } from '../utils/weather'

const LocalContext = createContext(null)

async function resolveDeviceLocation() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return null
  }

  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 120000,
    })
  })

  const { latitude, longitude } = position.coords
  let label = null

  try {
    label = await reverseGeocode(latitude, longitude)
  } catch {
    // Keep coordinates; label filled below.
  }

  return {
    latitude,
    longitude,
    label: label || 'Current location',
  }
}

export function LocalContextProvider({ children }) {
  const [now, setNow] = useState(() => new Date())
  const [placeLabel, setPlaceLabel] = useState(null)
  const [weather, setWeather] = useState(null)
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [loading, setLoading] = useState(true)
  const [locationDenied, setLocationDenied] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setLocationDenied(false)

      try {
        const coords = await resolveDeviceLocation()
        if (cancelled) return

        if (!coords) {
          setLocationDenied(true)
          setPlaceLabel(null)
          return
        }

        setPlaceLabel(coords.label)

        const wx = await fetchCurrentWeather(coords.latitude, coords.longitude)
        if (cancelled) return

        if (wx) {
          setWeather(wx)
          if (wx.timezone) setTimezone(wx.timezone)
        }
      } catch {
        if (!cancelled) {
          setLocationDenied(true)
          setPlaceLabel(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        timeZone: timezone,
      }),
    [timezone]
  )

  const timeShortFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: timezone,
      }),
    [timezone]
  )

  const value = useMemo(
    () => ({
      now,
      placeLabel,
      weather,
      timezone,
      loading,
      locationDenied,
      formattedTime: timeFormatter.format(now),
      formattedTimeShort: timeShortFormatter.format(now),
    }),
    [now, placeLabel, weather, timezone, loading, locationDenied, timeFormatter, timeShortFormatter]
  )

  return <LocalContext.Provider value={value}>{children}</LocalContext.Provider>
}

export function useLocalContext() {
  const ctx = useContext(LocalContext)
  if (!ctx) {
    throw new Error('useLocalContext must be used within LocalContextProvider')
  }
  return ctx
}
