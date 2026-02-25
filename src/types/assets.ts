type AssetIconType = string

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