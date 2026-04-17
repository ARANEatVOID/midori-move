const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

async function queryOverpass(query) {
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: query,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Overpass request failed: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
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
