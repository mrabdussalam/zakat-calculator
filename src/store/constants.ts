import { RetirementValues } from './types'

// Nisab thresholds in grams
export const NISAB = {
  GOLD: {
    GRAMS: 85,    // 85 grams of gold
    DESCRIPTION: '85 grams of gold'
  },
  SILVER: {
    GRAMS: 595,   // 595 grams of silver
    DESCRIPTION: '595 grams of silver'
  }
}

export const initialRetirementValues: RetirementValues = {
  traditional_401k: 0,
  traditional_ira: 0,
  roth_401k: 0,
  roth_ira: 0,
  pension: 0,
  other_retirement: 0
} 