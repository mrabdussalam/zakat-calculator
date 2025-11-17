export type AssetType = 'cash' | 'metals' | 'crypto' | 'stocks' | 'retirement' | 'realEstate' | 'other'

export interface AssetBreakdown {
  type: AssetType
  value: number
  zakatable: number
  zakatDue: number
  label: string
}

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

export interface ExtendedWindow extends Window {
  hasDispatchedHydrationEvent?: boolean;
}