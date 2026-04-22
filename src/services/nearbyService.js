import { supabase } from './supabaseClient.js'

async function queryOverpass(query) {
  const { data, error } = await supabase.functions.invoke('overpass-proxy', {
    body: query,
  })

  if (error) {
    throw new Error(`Overpass proxy request failed: ${error.message}`)
  }

  return data.elements || []
}

async function getNearbyBusStops(lat, lng, radiusMeters = 800) {
  const query = `[out:json];\nnode["highway"="bus_stop"](around:${radiusMeters},${lat},${lng});\nout body;`
  const elements = await queryOverpass(query)
  return elements.map((node) => ({
    id: node.id,
    lat: node.lat,
    lng: node.lon,
    name: node.tags?.name || 'Bus Stop',
  }))
}

async function getNearbyCycleRentals(lat, lng, radiusMeters = 1000) {
  const query = `[out:json];\nnode["amenity"="bicycle_rental"](around:${radiusMeters},${lat},${lng});\nout body;`
  const elements = await queryOverpass(query)
  return elements.map((node) => ({
    id: node.id,
    lat: node.lat,
    lng: node.lon,
    name: node.tags?.name || 'Cycle Rental',
  }))
}

export { getNearbyBusStops, getNearbyCycleRentals }
