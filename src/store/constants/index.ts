import { CashValues, StockValues, StockPrices } from '../types'
import { MetalsValues, MetalPrices } from '../modules/metals.types'

export const ZAKAT_RULES = {
  RATE: 0.025, // 2.5%
  NISAB: {
    GOLD_GRAMS: 85,    // 85 grams of gold
    SILVER_GRAMS: 595  // 595 grams of silver
  }
} as const

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

export const initialCashValues: CashValues = {
  cash_on_hand: 0,
  checking_account: 0,
  savings_account: 0,
  digital_wallets: 0,
  foreign_currency: 0,
  foreign_currency_entries: []
}

export const initialMetalsValues: MetalsValues = {
  gold_regular: 0,
  gold_occasional: 0,
  gold_investment: 0,
  silver_regular: 0,
  silver_occasional: 0,
  silver_investment: 0
}

export const initialMetalPrices: MetalPrices = {
  gold: 93.98,
  silver: 1.02,
  lastUpdated: new Date(),
  isCache: true,
  currency: 'USD'
}

export const initialStockValues: StockValues = {
  activeStocks: [],
  active_shares: 0,
  active_price_per_share: 0,
  passive_shares: 0,
  company_cash: 0,
  company_receivables: 0,
  company_inventory: 0,
  total_shares_issued: 0,
  total_dividend_earnings: 0,
  dividend_per_share: 0,
  dividend_shares: 0,
  fund_value: 0,
  is_passive_fund: false,
  market_value: 0,
  zakatable_value: 0,
  price_per_share: 0
}

export const initialStockPrices: StockPrices = {
  currentMarketPrice: 0,
  lastUpdated: new Date()
}

// Add default Hawl status
export const DEFAULT_HAWL_STATUS = {
  cash: true,
  metals: true,
  stocks: true,
  retirement: true,
  real_estate: true,
  crypto: true,
  debt_receivable: true
} as const 