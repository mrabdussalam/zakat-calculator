// Zakat Rates
export const ZAKAT_RATE = 0.025 // 2.5%

// Nisab Thresholds (in grams)
export const NISAB = {
  GOLD: {
    GRAMS: 85,    // 85 grams of gold
    DESCRIPTION: 'Gold Nisab (85g)'
  },
  SILVER: {
    GRAMS: 612.36,  // 612.36 grams of silver (52.5 tolas, Hanafi position)
    DESCRIPTION: 'Silver Nisab (612.36g)'
  }
} as const 