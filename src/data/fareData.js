const fares = {
  IN: {
    currency: 'INR',
    symbol: '₹',
    bus: 15,
    metro: 60,
    cycling: 0,
    walking: 0,
    driving_base: 50,
    driving_per_km: 12,
    auto_base: 30,
    auto_per_km: 8,
    sources: {
      bus: 'Delhi Transport Corporation (dtc.gov.in)',
      metro: 'Delhi Metro Rail Corporation (delhimetrorail.com)',
      driving: 'Uber/Ola estimates',
      auto: 'Auto-rickshaw estimates',
    },
  },
  US: { currency: 'USD', symbol: '$', bus: 2.75, metro: 3.0, bike: 0, walk: 0 },
  GB: { currency: 'GBP', symbol: '£', bus: 1.75, metro: 3.5, bike: 0, walk: 0 },
  EU: { currency: 'EUR', symbol: '€', bus: 1.5, metro: 2.2, bike: 0, walk: 0 },
  DEFAULT: { currency: 'USD', symbol: '$', bus: 2.0, metro: 2.5, bike: 0, walk: 0 },
}

export { fares }
