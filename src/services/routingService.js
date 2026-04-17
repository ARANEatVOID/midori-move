import { ORS_BASE_URL, ORS_API_KEY } from '../config/api.js'

const PROFILE_MODE_MAP = {
  'foot-walking': 'walking',
  'cycling-regular': 'cycling',
  'driving-car': 'driving',
}

async function fetchRoute(originCoords, destCoords, profile) {
  if (!ORS_API_KEY) {
    throw new Error('ORS_API_KEY is not defined')
  }

  const start = `${originCoords.lng},${originCoords.lat}`
  const end = `${destCoords.lng},${destCoords.lat}`
  const url = `${ORS_BASE_URL}/directions/${profile}?api_key=${encodeURIComponent(ORS_API_KEY)}&start=${start}&end=${end}`

  const response = await fetch(url)
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ORS routing request failed: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  const feature = data?.features?.[0]
  if (!feature || !feature.geometry?.coordinates || !feature.properties?.summary) {
    throw new Error('Invalid ORS route response format')
  }

  const geometry = feature.geometry.coordinates.map(([lng, lat]) => [lat, lng])
  const distanceKm = feature.properties.summary.distance / 1000
  const durationMinutes = feature.properties.summary.duration / 60

  return {
    mode: PROFILE_MODE_MAP[profile] ?? profile,
    distanceKm,
    durationMinutes,
    geometry,
  }
}

async function getRoute(originCoords, destCoords, profile) {
  if (!PROFILE_MODE_MAP[profile]) {
    throw new Error(`Unsupported routing profile: ${profile}`)
  }

  return fetchRoute(originCoords, destCoords, profile)
}

async function getAllSustainableRoutes(origin, destination) {
  const profiles = ['foot-walking', 'cycling-regular', 'driving-car']
  const settled = await Promise.allSettled(
    profiles.map((profile) => getRoute(origin, destination, profile))
  )

  const routes = settled
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value)

  const drivingRoute = routes.find((route) => route.mode === 'driving')
  if (drivingRoute) {
    routes.push({
      mode: 'transit',
      distanceKm: drivingRoute.distanceKm,
      durationMinutes: drivingRoute.durationMinutes * 1.4,
      geometry: drivingRoute.geometry,
    })
  }

  return routes.sort((a, b) => a.durationMinutes - b.durationMinutes)
}

export { getRoute, getAllSustainableRoutes }
