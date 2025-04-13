import { AssetType } from '@/types'

export interface AssetMetadata {
  // Common metadata
  notes?: string
  dateAdded: string

  // Precious Metals
  purity?: number // percentage
  weight?: number // grams
  form?: 'bar' | 'coin' | 'jewelry'

  // Stocks & Investments
  purchaseDate?: string
  dividendYield?: number
  isActivelyTraded?: boolean

  // Real Estate
  rentalIncome?: number
  expenses?: number
  isForSale?: boolean
  propertyType?: 'residential' | 'commercial' | 'land'

  // Crypto
  acquisitionCost?: number
  stakingRewards?: number
  platform?: string

  // Business Assets
  condition?: 'new' | 'used'
  purchasePrice?: number
  marketValue?: number

  // Retirement Accounts
  accountType?: '401k' | 'ira' | 'pension'
  employerMatch?: number
  vestingPeriod?: number

  // Other
  maturityDate?: string
  interestRate?: number
}

export interface Asset {
  id: string
  type: AssetType | 'other'
  name: string
  value: number
  currency: string
  metadata: Partial<AssetMetadata>
}

export interface AssetCategory {
  id: string
  name: string
  description: string
  subcategories?: string[]
  zakatRate: number
  requiresNisab: boolean
  metadata: {
    required: (keyof AssetMetadata)[]
    optional: (keyof AssetMetadata)[]
  }
}

export interface CalculationState {
  assets: Asset[]
  nisabThreshold: {
    gold: number
    silver: number
  }
  zakatDue: number
  lastCalculated: string
  exchangeRates: Record<string, number>
}

export interface AssetBreakdownProps {
  values: Record<string, number>
  currency: string
  isLoading?: boolean
} 