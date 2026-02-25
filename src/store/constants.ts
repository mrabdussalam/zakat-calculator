import { RetirementValues } from './types'
import { StockValues, StockPrices } from '@/lib/assets/stocks'

// Re-export from canonical source
export { NISAB, ZAKAT_RATE } from '@/lib/constants'

// Add default Hawl status
export const DEFAULT_HAWL_STATUS = {
  cash: true,
  metals: true,
  stocks: true,
  retirement: true,
  real_estate: true,
  crypto: true,
  debt: true
} as const

export const initialRetirementValues: RetirementValues = {
  traditional_401k: 0,
  traditional_ira: 0,
  roth_401k: 0,
  roth_ira: 0,
  pension: 0,
  other_retirement: 0
}

export const initialStockValues: StockValues = {
  activeStocks: [],
  market_value: 0,
  zakatable_value: 0
}

export const initialStockPrices = {
  prices: {},
  lastUpdated: new Date(),
  currency: 'USD'
}
