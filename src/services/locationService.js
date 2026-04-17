import { NOMINATIM_BASE_URL } from '../config/api'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

const JSON_HEADERS = {
  'Accept-Language': 'en',
}

function buildLocationErrorMessage(error) {
  if (!error) {
    return 'Unable to get your location. Please allow location access and try again.'
  }

  console.error('Geolocation error:', {
    code: error.code,
    message: error.message,
    type: error.code === 1 ? 'PERMISSION_DENIED' :
          error.code === 2 ? 'POSITION_UNAVAILABLE' :
          error.code === 3 ? 'TIMEOUT' : 'UNKNOWN'
  })

  switch (error.code) {
    case 1:
      return 'Location access denied. Please allow location permissions in your device settings.'
    case 2:
      return 'Unable to detect your location. Check your GPS/network connection and try again.'
    case 3:
      return 'Location request timed out. Please try again.'
    default:
      return 'Unable to get your location. Please allow location access and try again.'
  }
}

async function parseJsonResponse(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function requestCurrentPosition(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

async function getGpsLocation() {
  if (Capacitor.isNativePlatform()) {
    try {
      const permission = await Geolocation.requestPermissions()
      const granted =
        permission.location === 'granted' ||
        permission.coarseLocation === 'granted'

      if (!granted) {
        const err = new Error('Location permission denied by user')
        err.code = 1
        throw err
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      })

      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        name: 'Your Location',
        accuracy: position.coords.accuracy,
        source: 'gps',
      }
    } catch (error) {
      if (error?.code === 1) {
        throw error
      }
      console.warn('Native geolocation failed, falling through to web fallback:', error?.message || error)
    }
  }

  // Web fallback
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported in this browser.')
  }

  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    console.warn('Geolocation requires HTTPS or localhost. Current protocol:', window.location.protocol)
  }

  const attemptGeolocation = async ({ enableHighAccuracy, timeout }) => {
    const position = await requestCurrentPosition({ enableHighAccuracy, timeout })
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      source: 'gps',
    }
  }

  try {
    console.log('Attempting web geolocation with high accuracy...')
    return await attemptGeolocation({ enableHighAccuracy: true, timeout: 15000 })
  } catch (error) {
    if (error?.code === 1) {
      throw error
    }

    console.warn('High accuracy geolocation failed:', { code: error?.code, message: error?.message })

    if (error?.code === 2 || error?.code === 3) {
      console.log('Retrying with lower accuracy...')
      try {
        return await attemptGeolocation({ enableHighAccuracy: false, timeout: 20000 })
      } catch (fallbackError) {
        console.warn('Lower accuracy geolocation also failed:', { code: fallbackError?.code, message: fallbackError?.message })
        throw fallbackError
      }
    }

    throw error
  }
}

async function getIpLocation() {
  try {
    console.log('Attempting IP-based location fallback...')
    const response = await fetch('https://ipapi.co/json/')

    if (!response.ok) {
      throw new Error(`IP location service failed with status ${response.status}`)
    }

    const data = await parseJsonResponse(response)
    const latitude = Number(data?.latitude)
    const longitude = Number(data?.longitude)
    const city = data?.city || ''
    const country = data?.country_name || ''

    if (!latitude || !longitude) {
      throw new Error('IP location returned invalid coordinates.')
    }

    return {
      lat: latitude,
      lng: longitude,
      name: `${city || 'Unknown city'}, ${country || 'Unknown country'}`,
      source: 'ip',
    }
  } catch (error) {
    console.warn('IP geolocation fallback failed:', error?.message || error)
    return null
  }
}

async function getBestLocation() {
  try {
    const gpsLocation = await getGpsLocation()
    console.log('Location source: gps')
    return gpsLocation
  } catch (error) {
    if (error?.code === 1) {
      console.error('Geolocation permission denied:', error.message)
      throw new Error(buildLocationErrorMessage(error))
    }
    console.warn('GPS failed, attempting IP fallback:', error?.message || error)
  }

  const ipLocation = await getIpLocation()
  if (ipLocation) {
    console.log('Location source: ip')
    return ipLocation
  }

  console.warn('All location methods failed. Using default.')
  return {
    lat: 28.6139,
    lng: 77.2090,
    name: 'New Delhi (Default)',
    source: 'fallback',
  }
}

async function getUserLocation() {
  return getGpsLocation()
}

async function reverseGeocode(lat, lng) {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'json',
    })

    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params.toString()}`, {
      headers: JSON_HEADERS,
    })

    if (!response.ok) {
      throw new Error('Reverse geocoding request failed.')
    }

    const data = await parseJsonResponse(response)
    const address = data?.address ?? {}

    return {
      displayName: data?.display_name ?? '',
      city: address.city ?? address.town ?? address.village ?? address.hamlet ?? '',
      country: address.country ?? '',
      countryCode: address.country_code ? address.country_code.toUpperCase() : 'DEFAULT',
    }
  } catch (error) {
    return Promise.reject(error?.message || 'Unable to reverse geocode this location.')
  }
}

async function searchPlace(query) {
  try {
    const trimmedQuery = query?.trim()
    if (!trimmedQuery) return []

    const params = new URLSearchParams({
      q: trimmedQuery,
      format: 'json',
      limit: '5',
      addressdetails: '1',
    })

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params.toString()}`, {
      headers: JSON_HEADERS,
    })

    if (!response.ok) {
      throw new Error('Place search request failed.')
    }

    const results = await parseJsonResponse(response)
    if (!Array.isArray(results)) return []

    return results.map((place) => ({
      id: place.place_id,
      displayName: place.display_name ?? '',
      lat: Number(place.lat),
      lng: Number(place.lon),
      type: place.type ?? place.addresstype ?? 'place',
    }))
  } catch {
    return []
  }
}

async function getCountryCode() {
  try {
    const location = await getUserLocation()
    const result = await reverseGeocode(location.lat, location.lng)
    return result.countryCode || 'DEFAULT'
  } catch {
    return 'DEFAULT'
  }
}

export { getUserLocation, getBestLocation, reverseGeocode, searchPlace, getCountryCode }
