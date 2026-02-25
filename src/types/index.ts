type AssetType = string

interface ZakatResultBreakdownItem {
  type: string
  value: number
  zakatDue: number
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
  breakdown: ZakatResultBreakdownItem[]
}

export interface ExtendedWindow extends Window {
  hasDispatchedHydrationEvent?: boolean;
}

export type { CalculatorProps } from './calculator'