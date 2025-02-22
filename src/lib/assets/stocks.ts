import { AssetType, AssetBreakdown, AssetBreakdownItem, ZAKAT_RATE, safeCalculate } from './types'

const PASSIVE_FUND_RATE = 0.3 // 30% rule for passive funds

// Stock-specific interfaces
export interface StockHolding {
  symbol: string
  shares: number
  currentPrice: number
  marketValue: number
  zakatDue: number
  lastUpdated?: string
}

export interface StockValues {
  // Active Trading
  activeStocks: StockHolding[]
  
  // Passive Investments
  passiveInvestments?: {
    version: string
    method: 'quick' | 'detailed'
    investments: Array<{
      id: string
      name: string
      shares: number
      pricePerShare: number
      marketValue: number
    }>
    marketValue: number
    zakatableValue: number
    hawlStatus: {
      isComplete: boolean
      startDate: string
    }
    displayProperties: {
      currency: string
      method: string
      totalLabel: string
    }
  }

  // Legacy fields (maintained for backward compatibility)
  total_dividend_earnings?: number
  fund_value?: number
  is_passive_fund?: boolean
  market_value: number
  zakatable_value: number
}

export interface StockPrices {
  prices: Record<string, number>
  lastUpdated?: Date
}

export const stocks: AssetType = {
  id: 'stocks',
  name: 'Stocks & Investments',
  color: '#10B981', // Emerald color

  calculateTotal: (values: StockValues): number => {
    if (!values) return 0

    // Active Trading Stocks - Use marketValue which is already calculated
    const activeValue = Array.isArray(values.activeStocks) 
      ? values.activeStocks.reduce((sum, stock) => 
          sum + (Number.isFinite(stock.marketValue) ? stock.marketValue : 0), 0)
      : 0

    // Passive Investments - Use stored marketValue
    const passiveValue = values.passiveInvestments && Number.isFinite(values.passiveInvestments.marketValue)
      ? values.passiveInvestments.marketValue
      : 0

    // Dividends - Use safe calculation
    const dividendValue = safeCalculate(values.total_dividend_earnings)

    // Investment Funds - Use safe calculation
    const fundValue = safeCalculate(values.fund_value)

    // Return total, ensuring it's a valid number
    const total = activeValue + passiveValue + dividendValue + fundValue
    return Number.isFinite(total) ? total : 0
  },

  calculateZakatable: (values: StockValues, _prices: StockPrices | undefined, hawlMet: boolean): number => {
    if (!values || !hawlMet) return 0

    // Active Trading Stocks - Full amount is zakatable
    const activeValue = Array.isArray(values.activeStocks)
      ? values.activeStocks.reduce((sum, stock) => 
          sum + (Number.isFinite(stock.marketValue) ? stock.marketValue : 0), 0)
      : 0
    const activeZakatable = hawlMet ? activeValue : 0

    // Passive Investments - Use stored zakatable value
    const passiveZakatable = hawlMet && values.passiveInvestments?.zakatableValue
      ? values.passiveInvestments.zakatableValue
      : 0

    // Dividends - Full amount is zakatable
    const dividendValue = safeCalculate(values.total_dividend_earnings)
    const dividendZakatable = hawlMet ? dividendValue : 0

    // Investment Funds - Apply 30% rule for passive funds
    const fundValue = safeCalculate(values.fund_value)
    const fundZakatable = hawlMet 
      ? (values.is_passive_fund ? fundValue * PASSIVE_FUND_RATE : fundValue)
      : 0

    // Return total zakatable amount, ensuring it's a valid number
    const total = activeZakatable + passiveZakatable + dividendZakatable + fundZakatable
    return Number.isFinite(total) ? total : 0
  },

  getBreakdown: (values: StockValues, _prices: StockPrices | undefined, hawlMet: boolean): AssetBreakdown => {
    if (!values) {
      return {
        total: 0,
        zakatable: 0,
        zakatDue: 0,
        items: {}
      }
    }

    // Active Trading Stocks - Calculate from activeStocks array
    const activeValue = (values.activeStocks || []).reduce((sum, stock) => 
      sum + stock.marketValue, 0)
    const activeZakatable = hawlMet ? activeValue : 0
    const activeZakatDue = activeZakatable * ZAKAT_RATE

    // Passive Investments - Use values directly from passiveInvestments state
    const passiveValue = values.passiveInvestments?.marketValue || 0
    const passiveZakatable = hawlMet ? (values.passiveInvestments?.zakatableValue || 0) : 0
    const passiveZakatDue = passiveZakatable * ZAKAT_RATE
    const passiveMethod = values.passiveInvestments?.method || 'detailed'

    // Dividends - Zakat is 2.5% of total earnings
    const dividendValue = safeCalculate(values.total_dividend_earnings)
    const dividendZakatable = hawlMet ? dividendValue : 0
    const dividendZakatDue = dividendZakatable * ZAKAT_RATE

    // Investment Funds
    const fundValue = safeCalculate(values.fund_value)
    const fundZakatable = hawlMet 
      ? (values.is_passive_fund ? fundValue * PASSIVE_FUND_RATE : fundValue)
      : 0
    const fundZakatDue = fundZakatable * ZAKAT_RATE

    // Calculate totals
    const total = activeValue + passiveValue + dividendValue + fundValue
    const zakatable = activeZakatable + passiveZakatable + dividendZakatable + fundZakatable
    const zakatDue = zakatable * ZAKAT_RATE

    // Create breakdown with detailed information
    const items: Record<string, AssetBreakdownItem> = {
      active_trading: {
        value: activeValue,
        isZakatable: hawlMet,
        zakatable: activeZakatable,
        zakatDue: activeZakatDue,
        label: 'Actively Traded Stocks',
        tooltip: 'Full market value is zakatable'
      },
      passive_investments: {
        value: passiveValue,
        isZakatable: hawlMet,
        zakatable: passiveZakatable,
        zakatDue: passiveZakatDue,
        label: `Passive Investments (${passiveMethod === 'quick' ? '30% Rule' : 'CRI Method'})`,
        tooltip: passiveMethod === 'quick' 
          ? '30% of market value is zakatable'
          : 'Based on company financials'
      },
      dividends: {
        value: dividendValue,
        isZakatable: hawlMet,
        zakatable: dividendZakatable,
        zakatDue: dividendZakatDue,
        label: 'Total Dividend Earnings',
        tooltip: 'Full dividend amount is zakatable'
      },
      investment_funds: {
        value: fundValue,
        isZakatable: hawlMet,
        zakatable: fundZakatable,
        zakatDue: fundZakatDue,
        label: values.is_passive_fund ? 'Passive Investment Funds (30% Rule)' : 'Active Investment Funds',
        tooltip: values.is_passive_fund 
          ? '30% of fund value is zakatable'
          : 'Full fund value is zakatable'
      }
    }

    return {
      total,
      zakatable,
      zakatDue,
      items
    }
  }
}