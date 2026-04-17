import { fares } from '../data/fareData.js'

function formatFare(amount, symbol) {
  if (!amount) {
    return 'Free'
  }
  return `${symbol}${amount}`
}

function roundToNearestFive(value) {
  return Math.max(0, Math.round(value / 5) * 5)
}

function calculateFare(mode, distanceKm, countryCode) {
  const fareConfig = fares[countryCode] || fares.DEFAULT
  const symbol = fareConfig.symbol || fares.DEFAULT.symbol
  const normalizedMode = mode?.toLowerCase?.()

  if (normalizedMode === 'walking' || normalizedMode === 'cycling') {
    return { amount: 0, symbol, formatted: 'Free' }
  }

  if (normalizedMode === 'bus') {
    const amount = fareConfig.bus ?? fares.DEFAULT.bus
    return { amount, symbol, formatted: formatFare(amount, symbol) }
  }

  if (normalizedMode === 'transit') {
    let amount = 0
    if (distanceKm <= 2) amount = 20
    else if (distanceKm <= 5) amount = 30
    else if (distanceKm <= 12) amount = 40
    else if (distanceKm <= 21) amount = 50
    else if (distanceKm <= 32) amount = 60
    else amount = 70
    return { amount, symbol, formatted: formatFare(amount, symbol) }
  }

  if (normalizedMode === 'driving') {
    const autoBase = fareConfig.auto_base ?? 0
    const autoPerKm = fareConfig.auto_per_km ?? 0
    const cabBase = fareConfig.driving_base ?? 0
    const cabPerKm = fareConfig.driving_per_km ?? 0

    const lowEstimate = roundToNearestFive(autoBase + autoPerKm * distanceKm)
    const highEstimate = roundToNearestFive(cabBase + cabPerKm * distanceKm)
    const formatted = `${symbol}${lowEstimate} – ${symbol}${highEstimate}`

    return {
      amount: highEstimate,
      symbol,
      formatted,
      lowEstimate,
      highEstimate,
    }
  }

  const amount = fareConfig[normalizedMode] ?? fares.DEFAULT[normalizedMode] ?? 0
  return { amount, symbol, formatted: formatFare(amount, symbol) }
}

export { calculateFare }
