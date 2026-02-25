// Canonical fallback metal prices per gram
// These are conservative estimates used when API data is unavailable
// All prices are per gram, updated Feb 2026

import { FALLBACK_RATES } from '@/lib/constants/currency'

export const FALLBACK_METAL_PRICES: Record<string, { gold: number; silver: number }> = {
  USD: { gold: 160.57, silver: 2.47 },
  EUR: { gold: 147.72, silver: 2.27 },
  GBP: { gold: 127.49, silver: 1.96 },
  CAD: { gold: 218.86, silver: 3.37 },
  AUD: { gold: 226.56, silver: 3.49 },
  INR: { gold: 13327, silver: 205 },
  PKR: { gold: 44719, silver: 688 },
  AED: { gold: 589, silver: 9.06 },
  SAR: { gold: 602, silver: 9.26 },
  QAR: { gold: 584, silver: 8.99 },
}

export const DEFAULT_METAL_PRICES = FALLBACK_METAL_PRICES.USD

/**
 * Get fallback metal prices for a given currency.
 * If the currency has a static fallback, use it.
 * Otherwise, convert from USD using fallback exchange rates.
 * Falls back to raw USD prices only if no exchange rate is available.
 */
export function getFallbackMetalPrices(currency: string): { gold: number; silver: number } {
  if (FALLBACK_METAL_PRICES[currency]) {
    return FALLBACK_METAL_PRICES[currency]
  }

  // Convert from USD using fallback exchange rates
  const rate = FALLBACK_RATES[currency]
  if (rate) {
    return {
      gold: Number((DEFAULT_METAL_PRICES.gold * rate).toFixed(2)),
      silver: Number((DEFAULT_METAL_PRICES.silver * rate).toFixed(2))
    }
  }

  return DEFAULT_METAL_PRICES
}
