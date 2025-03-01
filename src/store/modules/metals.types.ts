import { WeightUnit } from '@/lib/utils/units'

export type GoldPurity = '24K' | '22K' | '21K' | '18K'

export interface MetalsValues {
  gold_regular: number
  gold_regular_purity: GoldPurity
  gold_occasional: number
  gold_occasional_purity: GoldPurity
  gold_investment: number
  gold_investment_purity: GoldPurity
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