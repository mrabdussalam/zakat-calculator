// Zakat Rates
export const ZAKAT_RATE = 0.025 // 2.5%

// Nisab Thresholds (in grams)
export const NISAB = {
  GOLD: 85,    // 85 grams of gold
  SILVER: 595  // 595 grams of silver
} as const

// Asset Types
export const ASSET_TYPES = {
  CASH: 'cash',
  PRECIOUS_METALS: 'precious-metals',
  STOCKS: 'stocks',
  RETIREMENT: 'retirement',
  REAL_ESTATE: 'real-estate',
  CRYPTO: 'crypto',
  DEBT_RECEIVABLE: 'debt-receivable'
} as const

// Currency
export const DEFAULT_CURRENCY = 'USD'

// Value Limits
export const VALUE_LIMITS = {
  MAX_SAFE_VALUE: 1000000000, // 1 billion
  MIN_VALUE: 0
} as const

// Time Constants
export const TIME = {
  LUNAR_YEAR_DAYS: 354.367, // Islamic lunar year
  GREGORIAN_YEAR_DAYS: 365.242 // Gregorian solar year
} as const 