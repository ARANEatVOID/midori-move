import { carbonData } from '../data/carbonData.js'

function calculateCarbon(mode, distanceKm) {
  const entry = carbonData[mode] || { gPerKm: 0 }
  const perKm = entry.gPerKm
  const gramsEmitted = perKm * distanceKm
  const baseline = carbonData.driving.gPerKm
  const gramsSaved = (baseline - perKm) * distanceKm
  const kgSaved = +(gramsSaved / 1000).toFixed(2)
  const treeEquivalent = Math.round(gramsSaved / 21000)

  return {
    gramsEmitted,
    gramsSaved,
    kgSaved,
    treeEquivalent,
  }
}

export { calculateCarbon }
