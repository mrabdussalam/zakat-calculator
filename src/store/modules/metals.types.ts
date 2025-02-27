import { WeightUnit } from '@/lib/utils/units'

export interface MetalsValues {
  gold_regular: number
  gold_occasional: number
  gold_investment: number
  silver_regular: number
  silver_occasional: number
  silver_investment: number
}

export interface MetalPrices {
  gold: number
  silver: number
  lastUpdated: Date
  isCache: boolean
  source?: string
  currency: string
}

export interface MetalsPreferences {
  weightUnit: WeightUnit
} 