export interface Asset {
  id: string
  type: AssetType
  value: number
  currency: string
  hawlMet: boolean
}

export interface ZakatResult {
  eligible: boolean
  amount: number
  breakdown: AssetBreakdown[]
} 