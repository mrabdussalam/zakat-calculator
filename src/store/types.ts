import { CashSlice } from './modules/cash'
import { MetalsSlice } from './modules/metals'
import { StocksSlice } from './modules/stocks'
import { NisabSlice } from './modules/nisab'
import { RetirementSlice } from './modules/retirement'
import { RealEstateSlice } from './modules/realEstate'
import { AssetBreakdown as LibAssetBreakdown, CompanyFinancials } from '@/lib/assets/types'
import { StateCreator } from 'zustand'
import { CryptoSlice, CryptoValues } from './modules/crypto.types'
import { StockHolding } from '@/lib/assets/stocks'
import { WeightUnit } from '@/lib/utils/units'
import { DistributionSlice } from './modules/distribution'

// Re-export types with new names to avoid conflicts
export type AssetBreakdown = LibAssetBreakdown

export interface HawlStatus {
  cash: boolean
  metals: boolean
  stocks: boolean
  retirement: boolean
  real_estate: boolean
  crypto: boolean
}

export interface NisabData {
  nisabThreshold: number;
  silverPrice: number;
  timestamp: string;
  source: string;
  currency: string;
  metalPrices?: {
    gold: number;
    silver: number;
  };
}

// Metal Types
export interface MetalPrices {
  gold: number
  silver: number
  lastUpdated: Date
  isCache: boolean
  source?: string
  currency: string
}

export interface MetalsValues {
  gold_regular: number
  gold_occasional: number
  gold_investment: number
  silver_regular: number
  silver_occasional: number
  silver_investment: number
}

export interface MetalsPreferences {
  weightUnit: WeightUnit
}

// Stock Types
export interface StockPrices {
  currentMarketPrice: number
  lastUpdated: Date
}

export interface PassiveInvestment {
  id: string
  name: string
  shares: number
  pricePerShare: number
  marketValue: number
}

export interface ActiveStock extends StockHolding {
  lastUpdated?: string
  currency?: string
  symbol: string
  marketValue: number
  zakatDue: number
}

export interface StockValues {
  active_shares: number
  active_price_per_share: number
  passive_shares: number
  company_cash: number
  company_receivables: number
  company_inventory: number
  total_shares_issued: number
  total_dividend_earnings: number
  dividend_per_share: number
  dividend_shares: number
  fund_value: number
  is_passive_fund: boolean
  activeStocks: ActiveStock[]
  market_value: number
  zakatable_value: number
  price_per_share: number
}

export type CurrentPassiveInvestmentState = {
  version?: '1.0' | '2.0'
  method: 'quick' | 'detailed'
  investments?: PassiveInvestment[]
  marketValue: number
  zakatableValue: number
  companyData?: CompanyFinancials
  hawlStatus?: {
    isComplete: boolean
    startDate?: string
    endDate?: string
  }
  displayProperties?: {
    currency: string
    method: string
    totalLabel: string
  }
}

// Real Estate Types
export interface RealEstateValues {
  primary_residence_value: number
  rental_income: number
  rental_expenses: number
  property_for_sale_value: number
  property_for_sale_active: boolean
  vacant_land_value: number
  vacant_land_sold: boolean
  sale_price: number
}

// Retirement Types
export interface RetirementValues {
  traditional_401k: number
  traditional_ira: number
  roth_401k: number
  roth_ira: number
  pension: number
  other_retirement: number
  tax_rate?: number
  penalty_rate?: number
}

export interface ForeignCurrencyEntry {
  amount: number
  currency: string
  rawInput?: string
}

export interface CashValues {
  cash_on_hand: number
  checking_account: number
  savings_account: number
  digital_wallets: number
  foreign_currency: number
  foreign_currency_entries: ForeignCurrencyEntry[]
}

export interface ZakatBreakdown {
  total: number
  zakatable: number
  zakatDue: number
  items: Record<string, {
    value: number
    isZakatable: boolean
    zakatable: number
    zakatDue: number
    label: string
    tooltip: string
    percentage?: number
    isExempt?: boolean
  }>
}

export interface ZakatState extends CashSlice, MetalsSlice, StocksSlice, RetirementSlice, RealEstateSlice, CryptoSlice, NisabSlice, DistributionSlice {
  // Core properties
  currency: string

  // Reset functions
  reset: () => void
  resetAllCalculators: () => void
  resetWithCurrencyChange: (newCurrency: string) => boolean

  // Currency functions
  setCurrency: (newCurrency: string) => void
  updateMetalPricesForNewCurrency: (newCurrency: string) => void

  // Persistence functions
  forcePersist: () => void

  // Breakdown
  getBreakdown: () => {
    cash: ReturnType<CashSlice['getCashBreakdown']>
    metals: ReturnType<MetalsSlice['getMetalsBreakdown']>
    stocks: ReturnType<StocksSlice['getStocksBreakdown']>
    retirement: ReturnType<RetirementSlice['getRetirementBreakdown']>
    realEstate: ReturnType<RealEstateSlice['getRealEstateBreakdown']>
    crypto: ReturnType<CryptoSlice['getCryptoBreakdown']>
    combined: {
      totalValue: number
      zakatableValue: number
      zakatDue: number
      meetsNisab: boolean
    }
  }
}

export type ZakatSlice = StateCreator<ZakatState, [["zustand/persist", unknown]], []>

export interface RootState {
  retirement: RetirementValues
  retirementHawlMet: boolean
  getRetirementTotal: () => number
  getRetirementZakatable: () => number
  getRetirementBreakdown: () => AssetBreakdown
}

export interface CryptoHolding {
  symbol: string
  quantity: number
  currentPrice: number
  marketValue: number
  zakatDue: number
  currency?: string
  isFallback?: boolean
} 