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
  getBreakdown: (values: any, prices: any | undefined, hawlMet: boolean) => AssetBreakdown
}

// Constants for Zakat calculations
export const ZAKAT_RATE = 0.025 // 2.5%

// Export NISAB constant
export const NISAB = {
  GOLD: {
    GRAMS: 85,
    DESCRIPTION: 'Gold Nisab (85g)'
  },
  SILVER: {
    GRAMS: 595,
    DESCRIPTION: 'Silver Nisab (595g)'
  }
} as const

// Helper for safe calculations
export const safeCalculate = (value: number | undefined | null): number => {
  if (typeof value !== 'number' || isNaN(value)) return 0
  return value
}

// Helper for calculating zakat due
export const calculateZakatDue = (zakatableAmount: number): number => {
  return zakatableAmount * ZAKAT_RATE
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

export interface RealEstateValues {
  // Primary Residence (exempt)
  primary_residence_value?: number
  
  // Rental Property
  rental_income?: number
  rental_expenses?: number
  
  // Property for Sale
  property_for_sale_value?: number
  property_for_sale_active?: number // 1 for active, 0 for inactive
  
  // Vacant Land
  vacant_land_value?: number
  vacant_land_sold?: number // 1 for sold, 0 for not sold
  sale_price?: number
}

export interface RealEstateCalculations extends AssetBreakdown {
  totalAssets: number;
  zakatableAmount: number;
  zakatDue: number;
  items: Record<string, AssetBreakdownItem & {
    label: string;
    isExempt?: boolean;
    zakatable: number;
  }>;
} 