import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { motion } from 'framer-motion'
import { Bus, Crosshair, Footprints, LoaderCircle, Search, Bike, Train } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { getBestLocation, reverseGeocode, searchPlace } from '../services/locationService'
import { getAllSustainableRoutes } from '../services/routingService'
import { calculateFare } from '../services/fareService'
import { calculateCarbon } from '../services/carbonService'
import { getNearbyBusStops, getNearbyCycleRentals } from '../services/nearbyService'
import { bookingLinks } from '../data/bookingLinks.js'
import { fares } from '../data/fareData.js'
import { carbonData } from '../data/carbonData.js'
import { saveTrip } from '../services/tripService.js'
import { getSession } from '../services/sessionService'
import { getUserById } from '../services/userService'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../services/supabaseClient'

const CO2_FACTORS = {
  walking: 0,
  cycling: 0,
  metro: 0.04,
  bus: 0.08,
  ev: 0.12,
}

const TRANSPORT_OPTIONS = [
  { value: 'walking', label: 'Walking' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'bus', label: 'Bus' },
  { value: 'metro', label: 'Metro / Train' },
  { value: 'ev', label: 'EV' },
]

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

const defaultCenter = [20.5937, 78.9629]

const destinationIcon = L.divIcon({
  className: '',
  html: `<div style="width:24px;height:24px;background:#34c96c;border-radius:50%;border:2px solid #ffffff;box-sizing:border-box;"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

const busStopIcon = L.divIcon({
  className: '',
  html: `<div style="width:12px;height:12px;background:#3b82f6;border:1px solid #ffffff;border-radius:2px;"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

const cycleRentalIcon = L.divIcon({
  className: '',
  html: `<div style="width:12px;height:12px;background:#f59e0b;border:1px solid #ffffff;border-radius:50%;"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

function getMarkerLabel(name, fallback) {
  return name && name.trim().length > 0 ? name : fallback
}

function getGoogleMapsUrl(lat, lng, label) {
  const query = encodeURIComponent(label || `${lat},${lng}`)
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}

function FitBounds({ origin, destination }) {
  const map = useMap()

  useEffect(() => {
    if (origin && destination) {
      const bounds = L.latLngBounds([
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ])
      map.fitBounds(bounds, { padding: [60, 60] })
      return
    }

    if (origin && !destination) {
      map.setView([origin.lat, origin.lng], 13, { animate: true })
      return
    }
  }, [map, origin, destination])

  return null
}

function ResizeMapOnLayoutChange({ layoutKey }) {
  const map = useMap()

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      map.invalidateSize()
    }, 150)

    return () => window.clearTimeout(timeoutId)
  }, [layoutKey, map])

  return null
}

function isBlank(value) {
  return typeof value !== 'string' || value.trim().length === 0
}

function normalizeTransportMode(mode) {
  if (!mode) return 'walking'
  if (mode === 'transit') return 'bus'
  if (mode === 'train') return 'metro'
  if (mode === 'driving' || mode === 'car') return 'ev'
  return CO2_FACTORS[mode] !== undefined ? mode : 'walking'
}

function calculateSelectedCo2(distanceKm, mode) {
  const factor = CO2_FACTORS[normalizeTransportMode(mode)] || 0
  return Number((Number(distanceKm || 0) * factor).toFixed(2))
}

function getLocationStatusMessage(source) {
  if (source === 'gps') return 'Using precise location 📍'
  if (source === 'ip') return 'Using approximate location 🌐'
  return 'Using default location ⚠️'
}

function MapView() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [locationState, setLocationState] = useState({
    loading: false,
    success: '',
    error: '',
    coords: null,
  })

  const [fromValue, setFromValue] = useState('')
  const [toValue, setToValue] = useState('')
  const [fromResults, setFromResults] = useState([])
  const [toResults, setToResults] = useState([])
  const [fromOpen, setFromOpen] = useState(false)
  const [toOpen, setToOpen] = useState(false)
  const [origin, setOrigin] = useState(null)
  const [destination, setDestination] = useState(null)
  const [routes, setRoutes] = useState([])
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [transportMode, setTransportMode] = useState('walking')
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState('')
  const [busStops, setBusStops] = useState([])
  const [cycleRentals, setCycleRentals] = useState([])
  const [homeAddressOrigin, setHomeAddressOrigin] = useState(null)
  const [tripSaveState, setTripSaveState] = useState({ status: 'idle', message: '' })
  const [routeSaveToast, setRouteSaveToast] = useState({ show: false, message: '', type: 'success', isClickable: false })

  const fromWrapperRef = useRef(null)
  const toWrapperRef = useRef(null)
  const fromQueryRef = useRef('')
  const toQueryRef = useRef('')

  useEffect(() => {
    const onMouseDown = (event) => {
      const target = event.target
      if (fromWrapperRef.current?.contains(target)) return
      if (toWrapperRef.current?.contains(target)) return
      setFromOpen(false)
      setToOpen(false)
    }

    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  useEffect(() => {
    const query = fromValue.trim()
    fromQueryRef.current = query

    if (!fromOpen) {
      setFromResults([])
      return
    }

    if (query.length < 3) {
      setFromResults([])
      return
    }

    const timeoutId = window.setTimeout(async () => {
      const results = await searchPlace(query)
      if (fromQueryRef.current !== query) return
      setFromResults(results.slice(0, 5))
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [fromValue, fromOpen])

  useEffect(() => {
    const query = toValue.trim()
    toQueryRef.current = query

    if (!toOpen) {
      setToResults([])
      return
    }

    if (query.length < 3) {
      setToResults([])
      return
    }

    const timeoutId = window.setTimeout(async () => {
      const results = await searchPlace(query)
      if (toQueryRef.current !== query) return
      setToResults(results.slice(0, 5))
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [toValue, toOpen])

  useEffect(() => {
    let cancelled = false

    async function loadHomeAddressOrigin() {
      try {
        const session = getSession()
        const user = getUserById(session?.userId)
        const homeAddress = user?.homeAddress?.trim()

        if (!homeAddress) {
          setHomeAddressOrigin(null)
          return
        }

        const [firstMatch] = await searchPlace(homeAddress)
        if (!cancelled && firstMatch) {
          setHomeAddressOrigin({
            name: homeAddress,
            lat: firstMatch.lat,
            lng: firstMatch.lng,
          })
        } else if (!cancelled) {
          setHomeAddressOrigin(null)
        }
      } catch {
        if (!cancelled) {
          setHomeAddressOrigin(null)
        }
      }
    }

    loadHomeAddressOrigin()

    return () => {
      cancelled = true
    }
  }, [])

  // Restore origin/destination from router state (trip reuse)
  useEffect(() => {
    if (location.state?.origin && location.state?.destination) {
      const { origin: restoredOrigin, destination: restoredDestination } = location.state
      
      // Set origin and destination states
      setOrigin(restoredOrigin)
      setDestination(restoredDestination)
      
      // Update input values to show the restored locations
      setFromValue(restoredOrigin.name || '')
      setToValue(restoredDestination.name || '')
      
      // Trigger route fetch after state is set
      // We'll use a small delay to ensure state is updated before fetching routes
      const timeoutId = window.setTimeout(async () => {
        try {
          const foundRoutes = await getAllSustainableRoutes(restoredOrigin, restoredDestination)
          if (foundRoutes && foundRoutes.length > 0) {
            setRoutes(foundRoutes)
            setSelectedRouteIndex(0)
            
            // Fetch nearby stops
            const [busStopsResult, cycleRentalsResult] = await Promise.allSettled([
              getNearbyBusStops(restoredOrigin.lat, restoredOrigin.lng),
              getNearbyCycleRentals(restoredOrigin.lat, restoredOrigin.lng),
            ])
            
            if (busStopsResult.status === 'fulfilled') {
              setBusStops(busStopsResult.value)
            }
            if (cycleRentalsResult.status === 'fulfilled') {
              setCycleRentals(cycleRentalsResult.value)
            }
          } else {
            setRouteError('No sustainable routes found for these locations.')
          }
        } catch (error) {
          setRouteError(typeof error === 'string' ? error : 'Unable to find routes.')
        }
      }, 100)
      
      // Clear state from history to prevent re-restoration on back navigation
      window.history.replaceState({}, document.title, location.pathname)
      
      return () => window.clearTimeout(timeoutId)
    }
  }, [location.pathname, location.state])

  const handleUseMyLocation = async () => {
    if (!Capacitor.isNativePlatform() && !navigator.geolocation) {
      setLocationState({
        loading: false,
        success: '',
        error: 'Geolocation is not supported in this browser.',
        coords: null,
      })
      return
    }

    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.warn('Geolocation requires HTTPS or localhost. Current protocol:', window.location.protocol)
    }

    setLocationState({
      loading: true,
      success: '',
      error: '',
      coords: null,
    })

    try {
      const resolvedOrigin = await resolveCurrentLocationOrigin()
      setOrigin(resolvedOrigin)
      setFromValue(resolvedOrigin.name)
    } catch (error) {
      setLocationState({
        loading: false,
        success: '',
        error: typeof error === 'string' ? error : error?.message || 'Unable to get your location right now.',
        coords: null,
      })
    }
  }

  const resolveCurrentLocationOrigin = async () => {
    const location = await getBestLocation()
    let locationName = location.name || 'Current Location'

    if (location.source === 'gps') {
      try {
        const geoResult = await reverseGeocode(location.lat, location.lng)
        locationName = geoResult.displayName || geoResult.city || 'Current Location'
      } catch (geoError) {
        console.warn('Reverse geocoding failed, using fallback name:', geoError)
        locationName = 'Current Location'
      }
    }

    const resolvedOrigin = {
      name: locationName,
      lat: location.lat,
      lng: location.lng,
      source: location.source,
    }

    setLocationState({
      loading: false,
      success: getLocationStatusMessage(location.source),
      error: '',
      coords: null,
    })

    return resolvedOrigin
  }

  const resolveManualOrigin = async () => {
    const manualFrom = fromValue.trim()

    if (isBlank(manualFrom)) {
      return null
    }

    if (origin && !isBlank(origin.name)) {
      return origin
    }

    const [firstMatch] = await searchPlace(manualFrom)
    if (!firstMatch) {
      throw new Error('Please choose a valid starting point.')
    }

    const resolvedOrigin = {
      name: firstMatch.displayName,
      lat: firstMatch.lat,
      lng: firstMatch.lng,
    }

    setOrigin(resolvedOrigin)
    setFromValue(firstMatch.displayName)
    return resolvedOrigin
  }

  const resolveRouteOrigin = async () => {
    const manualOrigin = await resolveManualOrigin()
    if (manualOrigin) {
      return manualOrigin
    }

    try {
      const currentLocationOrigin = await resolveCurrentLocationOrigin()
      setOrigin(currentLocationOrigin)
      setFromValue(currentLocationOrigin.name)
      return currentLocationOrigin
    } catch (locationError) {
      if (homeAddressOrigin) {
        setOrigin(homeAddressOrigin)
        setFromValue(homeAddressOrigin.name)
        setLocationState({
          loading: false,
          success: 'Using saved home address 🏠',
          error: '',
          coords: null,
        })
        return homeAddressOrigin
      }

      throw new Error(
        typeof locationError === 'string'
          ? locationError
          : locationError?.message || 'Location permission required',
      )
    }
  }

  const handleFindSustainableRoutes = async () => {
    setRouteLoading(true)
    setRouteError('')
    setRoutes([])
    setBusStops([])
    setCycleRentals([])
    setTripSaveState({ status: 'idle', message: '' })

    try {
      if (!destination) {
        throw new Error('Destination is required for routing.')
      }

      const activeOrigin = await resolveRouteOrigin()

      const foundRoutes = await getAllSustainableRoutes(activeOrigin, destination)
      console.log(foundRoutes)
      if (!foundRoutes || foundRoutes.length === 0) {
        setRouteError('No sustainable routes were found.')
      } else {
        setRoutes(foundRoutes)
        setSelectedRouteIndex(0)

        const primaryRoute = foundRoutes[0]
        const initialMode = normalizeTransportMode(primaryRoute.mode)

        setTransportMode(initialMode)

        const [busStopsResult, cycleRentalsResult] = await Promise.allSettled([
          getNearbyBusStops(activeOrigin.lat, activeOrigin.lng),
          getNearbyCycleRentals(activeOrigin.lat, activeOrigin.lng),
        ])

        if (busStopsResult.status === 'fulfilled') {
          setBusStops(busStopsResult.value)
        }
        if (cycleRentalsResult.status === 'fulfilled') {
          setCycleRentals(cycleRentalsResult.value)
        }
      }
    } catch (error) {
      setRouteError(typeof error === 'string' ? error : error?.message || 'Unable to find sustainable routes.')
    } finally {
      setRouteLoading(false)
    }
  }

  const resetRouteSearch = () => {
    setRouteError('')
    setRoutes([])
    setRouteLoading(false)
    setSelectedRouteIndex(0)
    setTransportMode('walking')
    setBusStops([])
    setCycleRentals([])
    setTripSaveState({ status: 'idle', message: '' })
  }

  const routeSummaries = routes.map((route) => {
    const fare = calculateFare(route.mode, route.distanceKm, 'IN')
    const carbon = calculateCarbon(route.mode, route.distanceKm)
    const fareModeKey = route.mode === 'walking' ? 'walking' : route.mode === 'cycling' ? 'cycling' : route.mode === 'transit' ? 'bus' : route.mode
    const fareSource = fareModeKey === 'walking' || fareModeKey === 'cycling'
      ? 'Free'
      : fares.IN.sources[fareModeKey] || 'Local transport provider'
    const carbonSource = carbonData[route.mode]?.source || 'IPCC AR6'
    const bookingOptions = bookingLinks[route.mode] || []
    const fareNote = route.mode === 'driving'
      ? 'Estimate via Uber/Ola — tap to book exact price'
      : route.mode === 'transit'
      ? 'DMRC slab pricing'
      : ''

    return {
      ...route,
      fare,
      carbon,
      fareSource,
      carbonSource,
      bookingOptions,
      fareNote,
      modeName: route.mode.charAt(0).toUpperCase() + route.mode.slice(1),
      durationLabel: Math.round(route.durationMinutes),
      distanceLabel: route.distanceKm.toFixed(1),
    }
  })

  const planetBestIndex =
    routeSummaries.length > 0
      ? routeSummaries.reduce((bestIndex, current, currentIndex) => {
          return current.carbon.gramsSaved > routeSummaries[bestIndex].carbon.gramsSaved
            ? currentIndex
            : bestIndex
        }, 0)
      : -1

  const selectedRoute = routeSummaries[selectedRouteIndex] || null
  const liveCo2Saved = selectedRoute ? calculateSelectedCo2(selectedRoute.distanceKm, transportMode) : 0
  const co2ByMode = selectedRoute
    ? Object.fromEntries(
        TRANSPORT_OPTIONS.map((option) => [
          option.value,
          calculateSelectedCo2(selectedRoute.distanceKm, option.value),
        ]),
      )
    : {}

  const handleConfirmTrip = async () => {
    if (!origin || !destination || !selectedRoute) {
      return
    }

    const saveResult = saveTrip({
      id: String(Date.now()),
      createdAt: Date.now(),
      from: origin,
      to: destination,
      distance: selectedRoute.distanceKm,
      duration: selectedRoute.durationMinutes,
      mode: transportMode,
      co2Saved: liveCo2Saved,
    })

    if (saveResult?.trip) {
      setTripSaveState({
        status: 'success',
        message: 'Trip confirmed and saved to your history.',
      })
    } else {
      setTripSaveState({
        status: 'error',
        message: 'Unable to save this trip right now.',
      })
    }

    // Save route to Supabase if user is logged in
    if (user?.id) {
      try {
        const { error } = await supabase.from('saved_routes').insert({
          user_id: user.id,
          origin_name: fromValue,
          destination_name: toValue,
          origin_lat: origin.lat,
          origin_lng: origin.lng,
          dest_lat: destination.lat,
          dest_lng: destination.lng,
          selected_mode: transportMode,
          distance_km: selectedRoute.distanceKm,
          duration_minutes: selectedRoute.durationMinutes,
          fare_formatted: selectedRoute.fare.formatted,
          carbon_saved_kg: liveCo2Saved,
        })

        if (error) {
          setRouteSaveToast({
            show: true,
            message: "Couldn't save route",
            type: 'error',
            isClickable: false,
          })
        } else {
          setRouteSaveToast({
            show: true,
            message: 'Route saved! 🌿',
            type: 'success',
            isClickable: false,
          })
        }

        // Auto-hide toast after 3 seconds
        window.setTimeout(() => {
          setRouteSaveToast({ show: false, message: '', type: 'success', isClickable: false })
        }, 3000)
      } catch (error) {
        console.error('Error saving route:', error)
        setRouteSaveToast({
          show: true,
          message: "Couldn't save route",
          type: 'error',
          isClickable: false,
        })

        window.setTimeout(() => {
          setRouteSaveToast({ show: false, message: '', type: 'success', isClickable: false })
        }, 3000)
      }
    } else {
      // User not logged in - show clickable toast
      setRouteSaveToast({
        show: true,
        message: 'Log in to save your routes →',
        type: 'info',
        isClickable: true,
      })
    }
  }

  const hasRouteResults = !routeLoading && routes.length > 0
  const mapLayoutKey = `${hasRouteResults}-${routeLoading}-${routes.length}-${selectedRouteIndex}`

  return (
    <section className="px-4 pb-4 pt-2 sm:px-6 lg:px-8">
      <div
        className="flex h-[calc(100vh-110px)] min-h-0 flex-col overflow-hidden rounded-[2rem] border lg:flex-row"
        style={{
          borderColor: 'color-mix(in srgb, var(--color-border) 60%, transparent)',
          background: 'color-mix(in srgb, var(--color-bg-card) 74%, transparent)',
          boxShadow: 'var(--shadow-card)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <div className={`order-1 relative flex min-h-0 flex-1 ${hasRouteResults ? 'touch-auto' : ''} lg:order-2`}>
          <div className="h-full min-h-0 w-full">
            <MapContainer center={defaultCenter} zoom={5} scrollWheelZoom className="h-full w-full">
              <ResizeMapOnLayoutChange layoutKey={mapLayoutKey} />
              <TileLayer
                attribution="© OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {origin ? (
                <Marker position={[origin.lat, origin.lng]}>
                  <Tooltip>{getMarkerLabel(origin.name, 'Origin')}</Tooltip>
                  <Popup>
                    <div className="space-y-3">
                      <p className="font-semibold">{getMarkerLabel(origin.name, 'Origin')}</p>
                      <button
                        type="button"
                        onClick={() => window.open(getGoogleMapsUrl(origin.lat, origin.lng, origin.name), '_blank', 'noreferrer')}
                        className="rounded-full bg-emerald-500 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Open in Google Maps →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ) : null}
              {destination ? (
                <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
                  <Tooltip>{getMarkerLabel(destination.name, 'Destination')}</Tooltip>
                  <Popup>
                    <div className="space-y-3">
                      <p className="font-semibold">{getMarkerLabel(destination.name, 'Destination')}</p>
                      <button
                        type="button"
                        onClick={() => window.open(getGoogleMapsUrl(destination.lat, destination.lng, destination.name), '_blank', 'noreferrer')}
                        className="rounded-full bg-emerald-500 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Open in Google Maps →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ) : null}
              {busStops.map((stop) => {
                const url = getGoogleMapsUrl(stop.lat, stop.lng, `${stop.name} bus stop`)
                return (
                  <Marker
                    key={`bus-${stop.id}`}
                    position={[stop.lat, stop.lng]}
                    icon={busStopIcon}
                    eventHandlers={{
                      click: () => window.open(url, '_blank', 'noreferrer'),
                    }}
                  >
                    <Tooltip>{stop.name}</Tooltip>
                    <Popup>
                      <div className="space-y-3">
                        <p className="font-semibold">{stop.name}</p>
                        <button
                          type="button"
                          onClick={() => window.open(url, '_blank', 'noreferrer')}
                          className="rounded-full bg-emerald-500 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Open in Google Maps →
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
              {cycleRentals.map((rental) => {
                const url = getGoogleMapsUrl(rental.lat, rental.lng, `${rental.name} cycle rental`)
                return (
                  <Marker
                    key={`cycle-${rental.id}`}
                    position={[rental.lat, rental.lng]}
                    icon={cycleRentalIcon}
                    eventHandlers={{
                      click: () => window.open(url, '_blank', 'noreferrer'),
                    }}
                  >
                    <Tooltip>{rental.name}</Tooltip>
                    <Popup>
                      <div className="space-y-3">
                        <p className="font-semibold">{rental.name}</p>
                        <button
                          type="button"
                          onClick={() => window.open(url, '_blank', 'noreferrer')}
                          className="rounded-full bg-emerald-500 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Open in Google Maps →
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
              {routeSummaries[selectedRouteIndex]?.geometry ? (
                <Polyline
                  positions={routeSummaries[selectedRouteIndex].geometry}
                  pathOptions={{ color: '#34c96c', weight: 5, opacity: 0.8 }}
                />
              ) : null}
              {origin && destination ? <FitBounds origin={origin} destination={destination} /> : null}
            </MapContainer>
          </div>
        </div>

        <aside
          className={`order-2 w-full shrink-0 overflow-y-auto border-t p-5 touch-auto ${
            hasRouteResults ? 'max-h-[50vh]' : 'max-h-[45vh]'
          } lg:order-1 lg:h-full lg:max-h-none lg:w-[400px] lg:border-r lg:border-t-0 lg:p-6`}
          style={{
            borderColor: 'color-mix(in srgb, var(--color-border) 55%, transparent)',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
            <div className="space-y-5">
              {routeLoading ? (
                <div className="min-h-[320px] flex flex-col items-center justify-center gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                  <div className="flex items-center gap-3">
                    {[0, 1, 2].map((index) => (
                      <motion.span
                        key={index}
                        className="h-3 w-3 rounded-full bg-emerald-500"
                        animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.4, 1] }}
                        transition={{ repeat: Infinity, duration: 0.9, delay: index * 0.15 }}
                      />
                    ))}
                  </div>
                  <p className="text-lg font-semibold text-emerald-600">Finding green routes...</p>
                </div>
              ) : routes.length > 0 ? (
                <div className="space-y-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetRouteSearch}
                    className="button-secondary inline-flex items-center gap-2"
                  >
                    ← Search Again
                  </motion.button>

                  <div className="rounded-[1.5rem] border border-emerald-200 bg-white/10 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Transport Mode</p>
                        <p className="text-xs text-slate-600">Choose a mode to update CO₂ instantly and save your preference.</p>
                      </div>
                      <div className="rounded-2xl bg-emerald-50/80 px-3 py-2">
                        <p className="text-[0.72rem] uppercase tracking-[0.16em] text-slate-500">CO₂ saved</p>
                        <p className="text-sm font-bold text-emerald-700">{liveCo2Saved.toFixed(2)} kg</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {TRANSPORT_OPTIONS.map((option) => {
                        const isActive = transportMode === option.value
                        const optionCo2 = co2ByMode[option.value] ?? 0

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setTransportMode(option.value)}
                            className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                              isActive
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-emerald-200 bg-white/70 text-slate-700 hover:border-emerald-400'
                            }`}
                          >
                            {option.label} • {optionCo2 > 0 ? `${optionCo2.toFixed(2)} kg` : '0 kg'}
                          </button>
                        )
                      })}
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        onClick={handleConfirmTrip}
                        className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
                      >
                        Confirm Trip
                      </button>
                      {tripSaveState.message ? (
                        <p
                          className={`text-sm ${
                            tripSaveState.status === 'error' ? 'text-red-500' : 'text-emerald-700'
                          }`}
                        >
                          {tripSaveState.message}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-600">Preview first, then confirm to save this trip.</p>
                      )}
                    </div>
                  </div>

                  <div className="relative z-10 min-h-0">
                    <div
                      className="space-y-4 overflow-y-auto overscroll-contain pr-1"
                      style={{
                        WebkitOverflowScrolling: 'touch',
                        touchAction: 'pan-y',
                        maxHeight: 'min(50vh, 420px)',
                      }}
                    >
                      {routeSummaries.map((route, index) => {
                        const isSelected = index === selectedRouteIndex
                        const routeCo2Saved = calculateSelectedCo2(route.distanceKm, transportMode)
                        const co2Label = routeCo2Saved >= 1
                          ? `${routeCo2Saved.toFixed(2)} kg`
                          : `${Math.round(routeCo2Saved * 1000)} g`
                        const modeIcon = {
                          walking: <Footprints size={20} className="text-emerald-500" />,
                          cycling: <Bike size={20} className="text-emerald-500" />,
                          transit: <Bus size={20} className="text-emerald-500" />,
                          driving: <Train size={20} className="text-emerald-500" />,
                        }[route.mode]

                        return (
                          <button
                            key={`${route.mode}-${index}`}
                            type="button"
                            onClick={() => {
                              setSelectedRouteIndex(index)
                            }}
                            className={`relative w-full rounded-[1.5rem] border bg-white/10 p-5 text-left transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(52,201,108,0.15)] ${
                              isSelected ? 'border-emerald-500 bg-white/15 ring-1 ring-emerald-200' : 'border-emerald-200'
                            }`}
                          >
                            {planetBestIndex === index ? (
                              <span className="absolute right-4 top-4 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Best for Planet 🌿
                              </span>
                            ) : null}

                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                                {modeIcon}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-emerald-700">{route.modeName}</p>
                                <p className="text-xs text-slate-400">{route.distanceLabel} km • {route.durationLabel} min</p>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3">
                                <p className="text-[0.72rem] uppercase tracking-[0.16em] text-slate-500">Fare</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{route.fare.formatted}</p>
                                {route.fareNote ? (
                                  <p className="mt-2 text-xs text-slate-500">{route.fareNote}</p>
                                ) : null}
                              </div>
                              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3">
                                <p className="text-[0.72rem] uppercase tracking-[0.16em] text-slate-500">CO₂ saved</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{co2Label}</p>
                              </div>
                            </div>

                            {route.mode === 'walking' ? (
                              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3 text-sm text-emerald-700">
                                Free & emission-free 🌿
                              </div>
                            ) : (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {route.bookingOptions.map((booking) => {
                                  const Icon = {
                                    bus: Bus,
                                    car: Train,
                                    bike: Bike,
                                    train: Train,
                                  }[booking.icon] || Bus

                                  return (
                                    <a
                                      key={booking.url}
                                      href={booking.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 rounded-full border border-emerald-500 px-3 py-2 text-[0.78rem] font-semibold text-emerald-500 transition hover:bg-emerald-500 hover:text-white"
                                    >
                                      <Icon size={14} />
                                      {booking.name}
                                    </a>
                                  )
                                })}
                              </div>
                            )}

                            <p className="mt-4 text-xs text-slate-400">
                              Fare source: {route.fareSource} • CO₂ source: {route.carbonSource}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-emerald-100 bg-white/10 p-4 text-sm text-slate-500">
                    {busStops.length || cycleRentals.length ? (
                      <div className="space-y-2">
                        <p className="font-semibold text-slate-700">Nearby stops</p>
                        <p>
                          <span className="text-blue-500">🔵</span> Bus Stops&nbsp;&nbsp; <span className="text-yellow-500">🟡</span> Cycle Rentals
                        </p>
                        <p className="text-slate-500">{busStops.length} bus stops • {cycleRentals.length} cycle rentals found nearby</p>
                      </div>
                    ) : (
                      <p>No nearby stops found in this area</p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {routeError ? (
                    <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-center">
                      <p className="text-sm font-semibold text-red-700">{routeError}</p>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={resetRouteSearch}
                        className="button-secondary mt-4 w-full justify-center"
                      >
                        Try Again
                      </motion.button>
                    </div>
                  ) : null}

                  <div ref={toWrapperRef} className="space-y-2">
                    <label className="block text-sm font-semibold">To</label>
                    <div className="relative">
                      <span
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--color-accent-primary)' }}
                      >
                        <Search size={18} />
                      </span>
                      <input
                        type="text"
                        placeholder="Search destination"
                        className="input-shell pl-11"
                        aria-label="To"
                        value={toValue}
                        onFocus={() => setToOpen(true)}
                        onChange={(e) => {
                          setToValue(e.target.value)
                          setToOpen(true)
                          setDestination(null)
                        }}
                      />
                      {toOpen && toValue.trim().length >= 3 && toResults.length > 0 ? (
                        <div
                          className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border p-2 glass-panel"
                          style={{ borderColor: 'color-mix(in srgb, var(--color-border) 70%, transparent)' }}
                        >
                          {toResults.map((place) => (
                            <button
                              key={place.id}
                              type="button"
                              className="w-full rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[rgba(52,201,108,0.10)]"
                              style={{ color: 'var(--color-text-primary)' }}
                              onClick={() => {
                                setToValue(place.displayName)
                                setDestination({ name: place.displayName, lat: place.lat, lng: place.lng })
                                setToResults([])
                                setToOpen(false)
                              }}
                            >
                              {place.displayName.length > 60 ? `${place.displayName.slice(0, 60)}...` : place.displayName}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div ref={fromWrapperRef} className="space-y-2">
                    <label className="block text-sm font-semibold">From</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search origin"
                        className="input-shell"
                        aria-label="From"
                        value={fromValue}
                        onFocus={() => setFromOpen(true)}
                        onChange={(e) => {
                          setFromValue(e.target.value)
                          setFromOpen(true)
                          setOrigin(null)
                        }}
                      />
                      {fromOpen && fromValue.trim().length >= 3 && fromResults.length > 0 ? (
                        <div
                          className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border p-2 glass-panel"
                          style={{ borderColor: 'color-mix(in srgb, var(--color-border) 70%, transparent)' }}
                        >
                          {fromResults.map((place) => (
                            <button
                              key={place.id}
                              type="button"
                              className="w-full rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[rgba(52,201,108,0.10)]"
                              style={{ color: 'var(--color-text-primary)' }}
                              onClick={() => {
                                setFromValue(place.displayName)
                                setOrigin({ name: place.displayName, lat: place.lat, lng: place.lng })
                                setFromResults([])
                                setFromOpen(false)
                              }}
                            >
                              {place.displayName.length > 60 ? `${place.displayName.slice(0, 60)}...` : place.displayName}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: locationState.loading ? 1 : 1.02 }}
                      whileTap={{ scale: locationState.loading ? 1 : 0.98 }}
                      onClick={handleUseMyLocation}
                      disabled={locationState.loading}
                      className="button-secondary w-full justify-center disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {locationState.loading ? <LoaderCircle size={16} className="animate-spin" /> : <Crosshair size={16} />}
                      {locationState.loading ? 'Locating...' : 'Use my location'}
                    </motion.button>

                    {locationState.success ? (
                      <p className="text-sm font-medium text-emerald-600">{locationState.success}</p>
                    ) : null}

                    {locationState.error ? (
                      <p className="text-sm font-medium text-red-500">{locationState.error}</p>
                    ) : null}
                  </div>

                  <motion.button
                    type="button"
                    className="button-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!destination || routeLoading}
                    whileHover={{ scale: destination ? 1.04 : 1 }}
                    whileTap={{ scale: destination ? 0.98 : 1 }}
                    onClick={handleFindSustainableRoutes}
                  >
                    Find Sustainable Routes <span className="ml-1">→</span>
                  </motion.button>
                </>
              )}
            </div>
        </aside>
      </div>

      {/* Route Save Toast */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: routeSaveToast.show ? 1 : 0, y: routeSaveToast.show ? 0 : 20 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="pointer-events-none fixed bottom-6 right-6 z-50"
      >
        {routeSaveToast.show ? (
          <motion.button
            type="button"
            onClick={() => {
              if (routeSaveToast.isClickable) {
                navigate('/login')
              }
            }}
            disabled={!routeSaveToast.isClickable}
            className={`inline-flex items-center px-4 py-3 rounded-full text-sm font-medium transition ${
              routeSaveToast.type === 'error'
                ? 'bg-red-500/90 text-white'
                : routeSaveToast.type === 'info'
                ? 'bg-blue-500/90 text-white cursor-pointer pointer-events-auto'
                : 'bg-emerald-500/90 text-white'
            } ${routeSaveToast.isClickable ? 'pointer-events-auto hover:bg-blue-600/90' : ''}`}
          >
            {routeSaveToast.message}
          </motion.button>
        ) : null}
      </motion.div>
    </section>
  )
}

export default MapView
