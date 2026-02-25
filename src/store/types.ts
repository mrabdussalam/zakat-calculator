import { CashSlice } from './modules/cash'
import { MetalsSlice } from './modules/metals'
import { StocksSlice } from './modules/stocks'
import { NisabSlice } from './modules/nisab'
import { RetirementSlice } from './modules/retirement'
import { RealEstateSlice, RealEstateValues as ModuleRealEstateValues } from './modules/realEstate'
import { AssetBreakdown as LibAssetBreakdown, CompanyFinancials, Investment } from '@/lib/assets/types'
import { StateCreator } from 'zustand'
import { CryptoSlice, CryptoValues as CryptoValuesImport, CryptoHolding as CryptoHoldingImport } from './modules/crypto.types'
import { StockHolding } from '@/lib/assets/stocks'
import { DistributionSlice } from './modules/distribution'
import { DebtSlice } from './modules/debt.types'

// Re-export canonical metal types from metals module
export type { MetalPrices, MetalsPreferences, GoldPurity } from './modules/metals.types'

// Re-export types with new names to avoid conflicts
export type AssetBreakdown = LibAssetBreakdown
// Re-export CryptoValues for use in tests and validation
export type CryptoValues = CryptoValuesImport

export interface HawlStatus {
  cash: boolean
  metals: boolean
  stocks: boolean
  retirement: boolean
  real_estate: boolean
  crypto: boolean
  debt: boolean
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

// Exported for tests and validation
export interface MetalValues extends Record<string, unknown> {
  gold_regular: number
  gold_occasional: number
  gold_investment: number
  silver_regular: number
  silver_occasional: number
  silver_investment: number
}

// Keep old name for backward compatibility
export type MetalsValues = MetalValues

// Re-export canonical stock types
export type { StockValues, StockPrices } from '@/lib/assets/stocks'

// Backward compat alias — identical to Investment from lib/assets/types
export type PassiveInvestment = Investment

export interface ActiveStock extends StockHolding {
  currency?: string
}

export type CurrentPassiveInvestmentState = {
  version?: '1.0' | '2.0'
  method: 'quick' | 'detailed'
  investments?: Investment[]
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

// Real Estate Types - extends module type with index signature for dynamic access
export interface RealEstateValues extends ModuleRealEstateValues {
  [key: string]: number | boolean | undefined
}

// Retirement Types
export interface RetirementValues extends Record<string, unknown> {
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

export interface CashValues extends Record<string, unknown> {
  cash_on_hand: number
  checking_account: number
  savings_account: number
  digital_wallets: number
  foreign_currency: number
  foreign_currency_entries?: ForeignCurrencyEntry[]
}

// Debt Types
export interface DebtValues {
  // Receivables (money owed to you)
  receivables: number;
  receivables_entries?: Array<{
    description: string;
    amount: number;
  }>;

  // Liabilities (money you owe)
  short_term_liabilities: number; // Due within 12 months
  long_term_liabilities_annual: number; // Annual payment for long-term debts
  liabilities_entries?: Array<{
    description: string;
    amount: number;
    is_short_term: boolean;
  }>;
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

export interface ZakatState extends CashSlice, MetalsSlice, StocksSlice, RetirementSlice, RealEstateSlice, CryptoSlice, NisabSlice, DistributionSlice, DebtSlice {
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
    debt: ReturnType<DebtSlice['getDebtBreakdown']>
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

// Re-export CryptoHolding from canonical source
export type CryptoHolding = CryptoHoldingImport 