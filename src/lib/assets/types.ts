// Base interface for breakdown items
export interface AssetBreakdownItem {
  value: number
  isZakatable: boolean
  zakatable: number
  zakatDue: number
  label: string
  tooltip: string
  percentage?: number
  isExempt?: boolean
  isLiability?: boolean
  displayProperties?: Record<string, any>
}

export interface AssetBreakdown {
  total: number
  zakatable: number
  zakatDue: number
  items: Record<string, AssetBreakdownItem>
  details?: Record<string, Record<string, AssetBreakdownItem>>
}

export interface AssetType {
  id: string
  name: string
  color: string
  calculateTotal: (values: any, prices?: any) => number
  calculateZakatable: (values: any, prices: any | undefined, hawlMet: boolean) => number
  getBreakdown: (values: any, prices: any | undefined, hawlMet: boolean, currency?: string) => AssetBreakdown
}

// Re-export constants from canonical source for backward compatibility
export { ZAKAT_RATE, NISAB } from '@/lib/constants'

// Import for local use
import { ZAKAT_RATE as _ZAKAT_RATE } from '@/lib/constants'

// Helper for safe calculations
export const safeCalculate = (value: number | undefined | null): number => {
  if (typeof value !== 'number' || isNaN(value)) return 0
  return value
}

// Helper for calculating zakat due
export const calculateZakatDue = (zakatableAmount: number): number => {
  return zakatableAmount * _ZAKAT_RATE
}

/**
 * Represents a single passive investment holding
 * Used for tracking individual stock or fund investments
 */
export interface Investment {
  id: string;
  name: string;
  shares: number;
  pricePerShare: number;
  marketValue: number;
}

/**
 * Represents the company financial data needed for CRI calculation method
 */
export interface CompanyFinancials {
  cash: number;
  receivables: number;
  inventory: number;
  totalShares: number;
  yourShares: number;
}

/**
 * Results of passive investment zakat calculations
 * Includes both quick (30% rule) and detailed (CRI) methods
 */
export interface PassiveCalculations {
  marketValue: number;
  zakatableValue: number;
  method: 'quick' | 'detailed';
}

 