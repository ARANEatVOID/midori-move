const ORS_BASE_URL = 'https://api.openrouteservice.org/v2'
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'
const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY || ''

export { ORS_BASE_URL, NOMINATIM_BASE_URL, ORS_API_KEY }
