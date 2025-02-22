import { StockValues, StockPrices, StockHolding } from '@/lib/assets/stocks'
import { initialStockValues, initialStockPrices, DEFAULT_HAWL_STATUS } from '../constants'
import { getAssetType } from '@/lib/assets/registry'
import { getStockPrice, getBatchStockPrices, validateTicker, StockAPIError } from '@/lib/api/stocks'
import { Investment, PassiveCalculations } from '@/lib/assets/types'
import { StateCreator } from 'zustand'
import { ZakatState, ActiveStock } from '../types'
import { NISAB, ZAKAT_RATE } from '@/lib/constants'
import { roundCurrency, formatCurrency } from '@/lib/utils/currency'

export interface PassiveInvestmentStateV1 {
  version: '1.0'
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
    displayProperties?: {
      currency: string
      sharePercentage: number
    }
  }
}

export interface PassiveInvestmentStateV2 extends Omit<PassiveInvestmentStateV1, 'version'> {
  version: '2.0'
  hawlStatus: {
    isComplete: boolean
    startDate?: string
    endDate?: string
  }
  displayProperties: {
    currency: string
    method: string
    totalLabel: string
  }
}

export type PassiveInvestmentState = PassiveInvestmentStateV2

// Add type for current state to handle migration cases
type CurrentPassiveInvestmentState = Partial<PassiveInvestmentState> & {
  version?: '1.0' | '2.0'
  method: 'quick' | 'detailed'
  investments?: Investment[]
  marketValue?: number
  zakatableValue?: number
  companyData?: {
    cash: number
    receivables: number
    inventory: number
    totalShares: number
    yourShares: number
    displayProperties?: {
      currency: string
      sharePercentage: number
    }
  }
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

const migratePassiveInvestments = (state: any): PassiveInvestmentState | undefined => {
  if (!state) return undefined

  try {
    // Handle unversioned state (pre-versioning)
    if (!state.version) {
      return {
        version: '2.0',
        investments: Array.isArray(state.investments) ? state.investments : [],
        method: typeof state.method === 'string' && ['quick', 'detailed'].includes(state.method) 
          ? state.method 
          : 'quick',
        marketValue: typeof state.marketValue === 'number' ? state.marketValue : 0,
        zakatableValue: typeof state.zakatableValue === 'number' ? state.zakatableValue : 0,
        companyData: state.companyData || undefined,
        hawlStatus: {
          isComplete: false,
          startDate: new Date().toISOString(),
        },
        displayProperties: {
          currency: 'USD',
          method: state.method === 'quick' ? '30% Rule' : 'CRI Method',
          totalLabel: state.method === 'quick' ? 'Total Investments' : 'Total Company Assets'
        }
      }
    }

    // Migrate from V1 to V2
    if (state.version === '1.0') {
      return {
        ...state,
        version: '2.0',
        hawlStatus: {
          isComplete: false,
          startDate: new Date().toISOString(),
        },
        displayProperties: {
          currency: 'USD',
          method: state.method === 'quick' ? '30% Rule' : 'CRI Method',
          totalLabel: state.method === 'quick' ? 'Total Investments' : 'Total Company Assets'
        }
      }
    }

    // For V2, validate and sanitize the data
    if (state.version === '2.0') {
      return {
        version: '2.0',
        investments: Array.isArray(state.investments) ? state.investments : [],
        method: typeof state.method === 'string' && ['quick', 'detailed'].includes(state.method) 
          ? state.method 
          : 'quick',
        marketValue: typeof state.marketValue === 'number' ? state.marketValue : 0,
        zakatableValue: typeof state.zakatableValue === 'number' ? state.zakatableValue : 0,
        companyData: state.companyData || undefined,
        hawlStatus: {
          isComplete: typeof state.hawlStatus?.isComplete === 'boolean' 
            ? state.hawlStatus.isComplete 
            : false,
          startDate: state.hawlStatus?.startDate || new Date().toISOString(),
          endDate: state.hawlStatus?.endDate
        },
        displayProperties: {
          currency: typeof state.displayProperties?.currency === 'string' 
            ? state.displayProperties.currency 
            : 'USD',
          method: state.method === 'quick' ? '30% Rule' : 'CRI Method',
          totalLabel: state.method === 'quick' ? 'Total Investments' : 'Total Company Assets'
        }
      }
    }

    // If version is not recognized, return undefined to trigger default state
    return undefined
  } catch (error) {
    console.error('Error migrating passive investments state:', error)
    return undefined
  }
}

export interface StocksSlice {
  // State
  stockValues: StockValues
  stockPrices: StockPrices
  stockHawlMet: boolean
  passiveInvestments?: CurrentPassiveInvestmentState

  // Active Trading Actions
  addActiveStock: (symbol: string, shares: number, manualPrice?: number) => Promise<void>
  updateActiveStock: (symbol: string, shares: number) => Promise<void>
  removeActiveStock: (symbol: string) => void
  updateStockPrices: () => Promise<void>

  // Legacy Actions
  setStockValue: (key: keyof StockValues, value: number | boolean) => void
  resetStockValues: () => void
  setStockPrices: (prices: StockPrices) => void
  setStockHawl: (value: boolean) => void

  // Getters
  getTotalStocks: () => number
  getTotalZakatableStocks: () => number
  getActiveStocksBreakdown: () => {
    stocks: StockHolding[]
    total: {
      marketValue: number
      zakatDue: number
    }
  }
  getStocksBreakdown: () => {
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
      percentage: number
    }>
  }

  // Add Passive Investment Actions
  updatePassiveInvestments: (
    method: 'quick' | 'detailed',
    data?: {
      investments?: Investment[]
      companyData?: {
        cash: number
        receivables: number
        inventory: number
        totalShares: number
        yourShares: number
      }
    },
    calculations?: PassiveCalculations
  ) => void

  // Add loading state
  isLoading: boolean
  lastError: string | null

  // Add nisab check
  meetsNisabThreshold: () => boolean
}

// Initial state
const initialStockValues: StockValues = {
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
  activeStocks: [],
  market_value: 0,
  zakatable_value: 0,
  price_per_share: 0
}

export const createStocksSlice: StateCreator<
  ZakatState,
  [["zustand/persist", unknown]],
  [],
  StocksSlice
> = (set, get, store) => ({
  // Add initial state for loading
  isLoading: false,
  lastError: null,

  // Initial state
  stockValues: initialStockValues,
  stockPrices: initialStockPrices,
  stockHawlMet: DEFAULT_HAWL_STATUS.stocks,
  passiveInvestments: {
    version: '2.0',
    method: 'quick',
    investments: [{
      id: Date.now().toString(),
      name: '',
      shares: 0,
      pricePerShare: 0,
      marketValue: 0
    }],
    marketValue: 0,
    zakatableValue: 0,
    hawlStatus: {
      isComplete: false,
      startDate: new Date().toISOString(),
    },
    displayProperties: {
      currency: 'USD',
      method: '30% Rule',
      totalLabel: 'Total Investments'
    }
  },

  // Active Trading Actions
  addActiveStock: async (symbol: string, shares: number, manualPrice?: number) => {
    try {
      // Validate inputs
      if (!symbol || typeof symbol !== 'string') {
        throw new Error('Invalid symbol')
      }
      if (typeof shares !== 'number' || shares <= 0) {
        throw new Error('Invalid number of shares')
      }

      let price: number
      let lastUpdated: string

      if (manualPrice && manualPrice > 0) {
        price = manualPrice
        lastUpdated = new Date().toISOString()
      } else {
        // Fetch current price
        const priceData = await getStockPrice(symbol)
        price = priceData.price
        lastUpdated = new Date(priceData.lastUpdated).toISOString()
      }

      // Ensure we have a valid price
      if (typeof price !== 'number' || !isFinite(price) || price <= 0) {
        throw new Error(`Invalid price for ${symbol}: ${price}`)
      }

      // Calculate values
      const marketValue = roundCurrency(shares * price)
      const zakatDue = roundCurrency(marketValue * ZAKAT_RATE)

      // Create validated stock object
      const validatedStock = {
        symbol,
        shares,
        currentPrice: price,
        marketValue,
        zakatDue,
        lastUpdated
      }

      console.log('Adding stock with values:', validatedStock)

      set((state) => {
        const newStocks = [...(state.stockValues?.activeStocks || []), validatedStock]
        const totalValue = newStocks.reduce((sum, s) => sum + (s.marketValue || 0), 0)
        
        return {
          stockValues: {
            ...state.stockValues,
            activeStocks: newStocks,
            market_value: totalValue,
            zakatable_value: state.stockHawlMet ? totalValue : 0
          }
        }
      })
    } catch (error) {
      console.error('Error adding stock:', error)
      throw error
    }
  },

  updateActiveStock: async (symbol: string, shares: number) => {
    try {
      // Fetch current price
      const { price, lastUpdated } = await getStockPrice(symbol)
      
      // Ensure we have a valid numeric price
      if (typeof price !== 'number' || !isFinite(price)) {
        throw new Error(`Invalid price received for ${symbol}: ${price}`)
      }

      console.log('Updating stock with price:', { symbol, shares, price })

      // Calculate market value and zakat due
      const marketValue = roundCurrency(shares * price)
      const zakatDue = roundCurrency(marketValue * ZAKAT_RATE)

      set((state) => {
        const updatedStocks = state.stockValues.activeStocks.map((stock) =>
          stock.symbol === symbol
            ? { 
                ...stock, 
                shares, 
                currentPrice: price,
                marketValue,
                zakatDue,
                lastUpdated: new Date(lastUpdated).toISOString()
              }
            : stock
        )

        const totalValue = updatedStocks.reduce((sum, s) => sum + (s.marketValue || 0), 0)

        return {
          stockValues: {
            ...state.stockValues,
            activeStocks: updatedStocks,
            market_value: totalValue,
            zakatable_value: state.stockHawlMet ? totalValue : 0
          }
        }
      })
    } catch (error) {
      console.error('Failed to update active stock:', error)
      throw error
    }
  },

  removeActiveStock: (symbol: string) => {
    set((state) => ({
      stockValues: {
        ...state.stockValues,
        activeStocks: (state.stockValues?.activeStocks || []).filter(s => s.symbol !== symbol)
      }
    }))
  },

  updateStockPrices: async () => {
    set({ isLoading: true, lastError: null })
    try {
      const { stockValues } = get()
      
      // Validate state
      if (!Array.isArray(stockValues.activeStocks)) {
        throw new Error('Invalid stock state')
      }

      // Get all symbols
      const symbols = stockValues.activeStocks.map((stock: ActiveStock) => stock.symbol)
      
      // Track failed updates
      const failedUpdates: string[] = []

      // Update each stock individually to handle failures gracefully
      const updatedStocks = await Promise.all(
        stockValues.activeStocks.map(async (stock: ActiveStock) => {
          try {
            const priceUpdate = await getStockPrice(stock.symbol)
            return {
              ...stock,
              currentPrice: priceUpdate.price,
              marketValue: stock.shares * priceUpdate.price,
              zakatDue: stock.shares * priceUpdate.price * ZAKAT_RATE
            }
          } catch (error) {
            // If price update fails, keep existing price and track failure
            failedUpdates.push(stock.symbol)
            return stock
          }
        })
      )

      set((state: any) => ({
        stockValues: {
          ...state.stockValues,
          activeStocks: updatedStocks
        }
      }))

      // If any updates failed, throw error with details
      if (failedUpdates.length > 0) {
        throw new StockAPIError(
          `Could not update prices for: ${failedUpdates.join(', ')}. Previous prices retained.`
        )
      }

      // Update totals through store actions
      const state = get()
      const stockAsset = getAssetType('stocks')
      if (stockAsset) {
        const newTotal = stockAsset.calculateTotal(state.stockValues, state.stockPrices)
        const newZakatable = stockAsset.calculateZakatable(state.stockValues, state.stockPrices, state.stockHawlMet)
        state.setStockValue('market_value', newTotal)
        state.setStockValue('zakatable_value', newZakatable)
      }
    } catch (error) {
      set({ lastError: error instanceof Error ? error.message : 'Failed to update prices' })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  // Legacy Actions
  setStockValue: (key: keyof StockValues, value: number | boolean) => {
    set((state) => ({
      stockValues: {
        ...state.stockValues,
        [key]: value
      }
    }))
  },

  resetStockValues: () => {
    set({ 
      stockValues: initialStockValues,
      stockHawlMet: DEFAULT_HAWL_STATUS.stocks
    })
  },

  setStockPrices: (prices) => set({ stockPrices: prices }),

  setStockHawl: (value) => set({ stockHawlMet: value }),

  // Getters
  getTotalStocks: () => {
    const state = get()
    
    // Get active stocks total
    const activeTotal = Array.isArray(state.stockValues?.activeStocks)
      ? state.stockValues.activeStocks.reduce(
          (sum: number, stock: ActiveStock) => sum + (Number.isFinite(stock.marketValue) ? stock.marketValue : 0),
          0
        )
      : 0

    // Get passive investments total from new state structure
    const passiveTotal = state.stockValues?.passiveInvestments?.marketValue || 0

    // Get dividend total
    const dividendTotal = state.stockValues?.total_dividend_earnings || 0

    // Return total, ensuring it's a valid number
    const total = activeTotal + passiveTotal + dividendTotal
    return Number.isFinite(total) ? roundCurrency(total) : 0
  },

  getTotalZakatableStocks: () => {
    const state = get()
    if (!state.stockHawlMet) return 0

    // Get active stocks total (fully zakatable)
    const activeTotal = Array.isArray(state.stockValues?.activeStocks)
      ? state.stockValues.activeStocks.reduce(
          (sum: number, stock: ActiveStock) => sum + (Number.isFinite(stock.marketValue) ? stock.marketValue : 0),
          0
        )
      : 0

    // Get passive investments zakatable amount
    const passiveZakatable = state.stockValues?.passiveInvestments?.zakatableValue || 0

    // Get dividend total (fully zakatable)
    const dividendTotal = state.stockValues?.total_dividend_earnings || 0

    // Return total zakatable amount
    const total = activeTotal + passiveZakatable + dividendTotal
    return Number.isFinite(total) ? roundCurrency(total) : 0
  },

  getActiveStocksBreakdown: () => {
    const state = get()
    const stocks = state.stockValues.activeStocks.map(stock => ({
      symbol: stock.symbol,
      shares: typeof stock.shares === 'number' ? stock.shares : 0,
      currentPrice: typeof stock.currentPrice === 'number' ? stock.currentPrice : 0,
      marketValue: typeof stock.marketValue === 'number' ? stock.marketValue : 0,
      zakatDue: typeof stock.zakatDue === 'number' ? stock.zakatDue : 0
    }))

    const total = {
      marketValue: stocks.reduce((sum, stock) => sum + (isFinite(stock.marketValue) ? stock.marketValue : 0), 0),
      zakatDue: stocks.reduce((sum, stock) => sum + (isFinite(stock.zakatDue) ? stock.zakatDue : 0), 0)
    }

    return { stocks, total }
  },

  getStocksBreakdown: () => {
    const state = get()
    const total = state.getTotalStocks()
    const zakatable = state.getTotalZakatableStocks()
    const zakatDue = roundCurrency(zakatable * ZAKAT_RATE)

    const items: Record<string, {
      value: number
      isZakatable: boolean
      zakatable: number
      zakatDue: number
      label: string
      tooltip: string
      percentage: number
    }> = {}

    // Add active trading stocks
    if (Array.isArray(state.stockValues?.activeStocks) && state.stockValues.activeStocks.length > 0) {
      items.active_trading = {
        value: state.stockValues.activeStocks.reduce((sum, stock) => 
          sum + (Number.isFinite(stock.marketValue) ? stock.marketValue : 0), 0),
        isZakatable: state.stockHawlMet,
        zakatable: state.stockHawlMet ? state.stockValues.activeStocks.reduce((sum, stock) => 
          sum + (Number.isFinite(stock.marketValue) ? stock.marketValue : 0), 0) : 0,
        zakatDue: state.stockHawlMet ? roundCurrency(state.stockValues.activeStocks.reduce((sum, stock) => 
          sum + (Number.isFinite(stock.marketValue) ? stock.marketValue : 0), 0) * ZAKAT_RATE) : 0,
        label: 'Active Trading',
        tooltip: 'Full market value is zakatable',
        percentage: total > 0 ? roundCurrency((state.stockValues.activeStocks.reduce((sum, stock) => 
          sum + (Number.isFinite(stock.marketValue) ? stock.marketValue : 0), 0) / total) * 100) : 0
      }
    }

    // Add passive investments
    if (state.stockValues?.passiveInvestments) {
      const passiveValue = state.stockValues.passiveInvestments.marketValue
      const passiveZakatable = state.stockValues.passiveInvestments.zakatableValue
      const method = state.stockValues.passiveInvestments.method

      items.passive_investments = {
        value: passiveValue,
        isZakatable: state.stockHawlMet,
        zakatable: state.stockHawlMet ? passiveZakatable : 0,
        zakatDue: state.stockHawlMet ? roundCurrency(passiveZakatable * ZAKAT_RATE) : 0,
        label: `Passive Investments (${method === 'quick' ? '30% Rule' : 'CRI Method'})`,
        tooltip: method === 'quick' 
          ? '30% of market value is zakatable'
          : 'Based on company financials',
        percentage: total > 0 ? roundCurrency((passiveValue / total) * 100) : 0
      }
    }

    // Add dividend earnings
    const dividendValue = state.stockValues?.total_dividend_earnings || 0
    if (dividendValue > 0) {
      items.dividends = {
        value: dividendValue,
        isZakatable: state.stockHawlMet,
        zakatable: state.stockHawlMet ? dividendValue : 0,
        zakatDue: state.stockHawlMet ? roundCurrency(dividendValue * ZAKAT_RATE) : 0,
        label: 'Dividend Earnings',
        tooltip: 'Full dividend amount is zakatable',
        percentage: total > 0 ? roundCurrency((dividendValue / total) * 100) : 0
      }
    }

    // Add default item if no stocks at all
    if (Object.keys(items).length === 0) {
      items.stocks = {
        value: 0,
        isZakatable: false,
        zakatable: 0,
        zakatDue: 0,
        label: 'Stocks',
        tooltip: 'No stocks added yet',
        percentage: 0
      }
    }

    return {
      total,
      zakatable,
      zakatDue,
      items
    }
  },

  updatePassiveInvestments: (
    method: 'quick' | 'detailed',
    data?: {
      investments?: Investment[]
      companyData?: {
        cash: number
        receivables: number
        inventory: number
        totalShares: number
        yourShares: number
      }
    },
    calculations?: PassiveCalculations
  ) => {
    try {
      const currentState = get().stockValues.passiveInvestments
      const newState: PassiveInvestmentState = {
        version: '2.0',
        method,
        investments: Array.isArray(data?.investments) ? data.investments : (currentState?.investments || []),
        marketValue: typeof calculations?.totalMarketValue === 'number' 
          ? calculations.totalMarketValue 
          : (currentState?.marketValue || 0),
        zakatableValue: typeof calculations?.zakatableValue === 'number' 
          ? calculations.zakatableValue 
          : (currentState?.zakatableValue || 0),
        companyData: data?.companyData || currentState?.companyData,
        hawlStatus: currentState?.hawlStatus || {
          isComplete: false,
          startDate: new Date().toISOString(),
        },
        displayProperties: {
          currency: currentState?.displayProperties?.currency || 'USD',
          method: method === 'quick' ? '30% Rule' : 'CRI Method',
          totalLabel: method === 'quick' ? 'Total Investments' : 'Total Company Assets'
        }
      }

      const migratedState = migratePassiveInvestments(newState)
      if (!migratedState) {
        console.error('Failed to create valid passive investments state')
        return
      }

      // Update state and trigger recalculations
      set((state: any) => {
        const updatedState = {
          stockValues: {
            ...state.stockValues,
            passiveInvestments: migratedState,
            // Update legacy fields for compatibility
            market_value: migratedState.marketValue,
            zakatable_value: migratedState.zakatableValue
          },
          passiveInvestments: migratedState
        }

        // Get updated totals
        const stockAsset = getAssetType('stocks')
        if (stockAsset) {
          const newTotal = stockAsset.calculateTotal(updatedState.stockValues, state.stockPrices)
          const newZakatable = stockAsset.calculateZakatable(
            updatedState.stockValues, 
            state.stockPrices, 
            state.stockHawlMet
          )
          updatedState.stockValues.market_value = newTotal
          updatedState.stockValues.zakatable_value = newZakatable
        }

        return updatedState
      })
    } catch (error) {
      console.error('Error updating passive investments:', error)
    }
  },

  meetsNisabThreshold: () => {
    const state = get()
    
    // Get metal prices from the metals slice
    const metalPrices = state.metalPrices || { gold: 0, silver: 0 }
    
    // Calculate nisab thresholds
    const goldNisab = NISAB.GOLD * metalPrices.gold
    const silverNisab = NISAB.SILVER * metalPrices.silver
    
    // Use the lower of the two nisab values
    const nisabThreshold = Math.min(goldNisab, silverNisab)
    
    // Get total stock value
    const totalStockValue = state.getTotalStocks()
    
    return totalStockValue >= nisabThreshold
  }
}) 