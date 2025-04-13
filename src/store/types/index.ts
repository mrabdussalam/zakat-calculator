import { StockPrices } from '@/lib/assets/stocks'

export interface CashValues {
  cash_on_hand: number
  checking_account: number
  savings_account: number
  digital_wallets: number
  foreign_currency: number
  foreign_currency_entries?: Array<{
    amount: number
    currency: string
    rawInput?: string
  }>
}

export interface MetalPrices {
  gold: number
  silver: number
  lastUpdated: Date
  isCache: boolean
  currency?: string
}

export interface MetalsValues {
  gold_regular: number
  gold_occasional: number
  gold_investment: number
  silver_regular: number
  silver_occasional: number
  silver_investment: number
}

export interface ZakatBreakdown {
  type: string
  total: number
  zakatDue: number
}

export interface SummaryCalculation {
  assets: {
    cash: {
      total: number
      zakatable: number
      breakdown: Record<string, number>
    }
    metals: {
      gold: {
        grams: number
        value: number
        zakatable_grams: number
        zakatable_value: number
      }
      silver: {
        grams: number
        value: number
        zakatable_grams: number
        zakatable_value: number
      }
    }
  }
  nisab: {
    gold: {
      threshold_grams: number
      meets_threshold: boolean
    }
    silver: {
      threshold_grams: number
      meets_threshold: boolean
    }
    meets_nisab: boolean
  }
  totals: {
    gross_value: number
    zakatable_value: number
    zakat_due: number
  }
  hawl: {
    cash: boolean
    metals: boolean
  }
}

export interface NisabCalculation {
  gold: {
    grams: number
    value: number
    meets_threshold: boolean
  }
  silver: {
    grams: number
    value: number
    meets_threshold: boolean
  }
  recommended: 'gold' | 'silver'
  meets_nisab: boolean
}

export interface MetalDetails {
  weight: number
  value: number
  isExempt: boolean
}

export interface MetalTypeDetails {
  regular: MetalDetails
  occasional: MetalDetails
  investment: MetalDetails
}

export interface AssetBreakdownDetails {
  gold: MetalTypeDetails
  silver: MetalTypeDetails
}

export interface AssetBreakdown {
  type: string
  name: string
  amount: number
  percentage: number
  isZakatable: boolean
  hawlMet: boolean
  zakatableAmount: number
  zakatDue: number
  details?: AssetBreakdownDetails
}

export interface ComputedMetals {
  total: number
  zakatable: number
  zakatDue: number
  breakdown: {
    gold: {
      regular: { weight: number, value: number, isExempt: boolean }
      occasional: { weight: number, value: number, isZakatable: boolean }
      investment: { weight: number, value: number, isZakatable: boolean }
      total: { weight: number, value: number }
      zakatable: { weight: number, value: number }
    }
    silver: {
      regular: { weight: number, value: number, isExempt: boolean }
      occasional: { weight: number, value: number, isZakatable: boolean }
      investment: { weight: number, value: number, isZakatable: boolean }
      total: { weight: number, value: number }
      zakatable: { weight: number, value: number }
    }
  }
}

export interface ComputedResults {
  metals: ComputedMetals
  cash: {
    total: number
    zakatable: number
    zakatDue: number
    breakdown: Record<keyof CashValues, { value: number, isZakatable: boolean }>
  }
  summary: {
    totalAssets: number
    totalZakatable: number
    totalZakatDue: number
    meetsNisab: boolean
    nisabThreshold: number
    thresholds: {
      gold: number
      silver: number
    }
  }
}

export interface PersistedState {
  cashValues: CashValues
  metalsValues: MetalsValues
  stockValues: StockValues
  cashHawlMet: boolean
  metalsHawlMet: boolean
  stockHawlMet: boolean
  metalPrices: MetalPrices
  stockPrices: StockPrices
  nisabData?: {
    threshold: number
    silverPrice: number
    lastUpdated: string
    source: string
  }
}

export interface ActiveStock {
  ticker: string
  shares: number
  currentPrice: number
  lastUpdated: Date
}

export interface StockValues {
  // Active Trading Section
  activeStocks: ActiveStock[]

  // Passive Investments Section
  passiveInvestments?: {
    investments: Array<{
      id: string
      name: string
      shares: number
      pricePerShare: number
      marketValue: number
    }>
    method: 'quick' | 'detailed'
    marketValue: number
    zakatableValue: number
    companyData?: {
      cash: number
      receivables: number
      inventory: number
      totalShares: number
      yourShares: number
    }
  }

  // Legacy/Other Stock Values
  active_shares: number
  active_price_per_share: number
  passive_shares: number
  company_cash: number
  company_receivables: number
  company_inventory: number
  total_shares_issued: number
  total_dividend_earnings: number
  fund_value: number
  is_passive_fund: boolean
  market_value?: number
  zakatable_value?: number
}

// Re-export only StockPrices since we define StockValues here
export type { StockPrices } 