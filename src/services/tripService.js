import { getCurrentUserId } from './sessionService'

function normalizePoint(point) {
  if (!point) return null

  return {
    name: point.name || '',
    lat: typeof point.lat === 'number' ? point.lat : Number(point.lat),
    lng: typeof point.lng === 'number' ? point.lng : Number(point.lng),
  }
}

function normalizeTrip(trip) {
  const from = normalizePoint(trip?.from || trip?.origin)
  const to = normalizePoint(trip?.to || trip?.destination)
  const createdAt = trip?.createdAt || trip?.date || Date.now()
  const distance = trip?.distance ?? trip?.distanceKm ?? 0
  const duration = trip?.duration ?? trip?.durationMinutes ?? 0
  const co2Saved = trip?.co2Saved ?? trip?.carbonSaved ?? 0

  return {
    id: trip?.id || String(createdAt),
    from,
    to,
    origin: from,
    destination: to,
    mode: trip?.mode || '',
    distance: Number(distance) || 0,
    distanceKm: Number(distance) || 0,
    duration: Number(duration) || 0,
    durationMinutes: Number(duration) || 0,
    co2Saved: Number(co2Saved) || 0,
    carbonSaved: Number(co2Saved) || 0,
    createdAt,
    date: createdAt,
  }
}

function sameLocation(a, b) {
  return (
    Number(a?.lat) === Number(b?.lat) &&
    Number(a?.lng) === Number(b?.lng)
  )
}

function getTripsStorageKey(userId) {
  return `trips_${userId}`
}

function readTripsFromStorage(userId) {
  if (!userId) return []

  const tripsRaw = localStorage.getItem(getTripsStorageKey(userId))
  if (!tripsRaw) return []

  const parsedTrips = JSON.parse(tripsRaw)
  return Array.isArray(parsedTrips) ? parsedTrips : []
}

function saveTrip(trip) {
  try {
    const userId = getCurrentUserId()
    if (!userId) return null

    const newTrip = normalizeTrip({
      ...trip,
      id: trip.id || String(Date.now()),
      createdAt: trip.createdAt || Date.now(),
    })
    const trips = getTripHistory()
    const existingIndex = trips.findIndex((existingTrip) => {
      return sameLocation(existingTrip.from, newTrip.from) && sameLocation(existingTrip.to, newTrip.to)
    })

    if (existingIndex >= 0) {
      trips.splice(existingIndex, 1)
    }

    trips.unshift(newTrip)
    localStorage.setItem(getTripsStorageKey(userId), JSON.stringify(trips))
    window.dispatchEvent(
      new CustomEvent('midoriMove:tripsUpdated', {
        detail: {
          userId,
          trips,
        },
      }),
    )
    return {
      trip: newTrip,
      trips,
    }
  } catch (error) {
    console.error('Error saving trip:', error)
    return null
  }
}

function getTripHistory() {
  try {
    const userId = getCurrentUserId()
    return readTripsFromStorage(userId).map(normalizeTrip).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  } catch (error) {
    console.error('Error retrieving trips:', error)
    return []
  }
}

function computeTripStats() {
  const trips = getTripHistory()

  if (!trips.length) {
    return {
      totalTrips: 0,
      totalDistance: 0,
      totalCarbonSaved: 0,
      mostUsedMode: '',
      averageDuration: 0,
    }
  }

  const totalTrips = trips.length
  const totalDistance = Math.round((trips.reduce((sum, t) => sum + (t.distance || t.distanceKm || 0), 0)) * 10) / 10
  const totalCarbonSaved = Math.round((trips.reduce((sum, t) => sum + (t.co2Saved || t.carbonSaved || 0), 0)) * 100) / 100

  const modeCounts = {}
  trips.forEach((t) => {
    modeCounts[t.mode] = (modeCounts[t.mode] || 0) + 1
  })

  const mostUsedMode = Object.entries(modeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || ''
  const averageDuration = Math.round(trips.reduce((sum, t) => sum + (t.duration || t.durationMinutes || 0), 0) / totalTrips)

  return {
    totalTrips,
    totalDistance,
    totalCarbonSaved,
    mostUsedMode,
    averageDuration,
  }
}

function clearTripHistory() {
  try {
    const userId = getCurrentUserId()
    if (!userId) return
    localStorage.removeItem(getTripsStorageKey(userId))
  } catch (error) {
    console.error('Error clearing trips:', error)
  }
}

export { saveTrip, getTripHistory, computeTripStats, clearTripHistory }
