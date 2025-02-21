import { StockValues, StockPrices } from '@/lib/assets/stocks'
import { initialStockValues, initialStockPrices, DEFAULT_HAWL_STATUS } from '../constants'
import { getAssetType } from '@/lib/assets/registry'
import { getStockPrice, getBatchStockPrices, validateTicker, StockAPIError } from '@/lib/api/stocks'
import { Investment, PassiveCalculations } from '@/lib/assets/types'
import { StateCreator } from 'zustand'
import { ZakatState } from '../types'
import { NISAB, ZAKAT_RATE } from '@/lib/constants'
import { roundCurrency, formatCurrency } from '@/lib/utils/currency'

interface ActiveStock {
  ticker: string
  shares: number
  currentPrice: number
  marketValue: number
  zakatDue: number
}

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
  addActiveStock: (ticker: string, shares: number, manualPrice?: number) => Promise<void>
  updateActiveStock: (ticker: string, shares: number) => Promise<void>
  removeActiveStock: (ticker: string) => void
  updateStockPrices: () => Promise<void>

  // Legacy Actions
  setStockValue: <K extends keyof StockValues>(key: K, value: StockValues[K]) => void
  resetStockValues: () => void
  setStockPrices: (prices: StockPrices) => void
  setStockHawl: (value: boolean) => void

  // Getters
  getTotalStocks: () => number
  getTotalZakatableStocks: () => number
  getActiveStocksBreakdown: () => {
    stocks: {
      ticker: string
      shares: number
      currentPrice: number
      marketValue: number
      zakatDue: number
    }[]
    total: {
      marketValue: number
      zakatDue: number
    }
  }
  getStocksBreakdown: () => {
    total: number
    zakatable: number
    zakatDue: number
    meetsNisab: boolean
    items: Record<string, { 
      value: number
      isZakatable: boolean
      zakatable: number
      label: string
      tooltip: string
      percentage?: number 
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
  addActiveStock: async (ticker: string, shares: number, manualPrice?: number) => {
    if (typeof shares !== 'number' || !isFinite(shares) || shares < 0) {
      console.warn(`Invalid shares quantity: ${shares} for ${ticker}`)
      return
    }

    try {
      // Get price data
      const priceData = manualPrice ? { price: manualPrice } : await getStockPrice(ticker)
      if (!priceData || typeof priceData.price !== 'number' || !isFinite(priceData.price)) {
        throw new Error(`Invalid price data received for ${ticker}`)
      }

      const currentPrice = priceData.price
      const marketValue = roundCurrency(shares * currentPrice)
      const zakatDue = roundCurrency(marketValue * ZAKAT_RATE)

      set((state) => {
        // Update prices
        const newPrices = {
          ...state.stockPrices,
          prices: {
            ...state.stockPrices.prices,
            [ticker.toUpperCase()]: currentPrice
          },
          lastUpdated: new Date()
        }

        // Update active stocks
        const newStocks = [...(state.stockValues.activeStocks || []), {
          ticker: ticker.toUpperCase(),
          shares,
          currentPrice: roundCurrency(currentPrice),
          marketValue,
          zakatDue
        }]

        return {
          stockValues: {
            ...state.stockValues,
            activeStocks: newStocks,
            total_value: roundCurrency(newStocks.reduce((sum: number, stock) => sum + stock.marketValue, 0))
          },
          stockPrices: newPrices
        }
      })
    } catch (error) {
      console.error('Error adding stock:', error)
      throw error instanceof StockAPIError ? error : new StockAPIError(`Failed to add stock ${ticker}`)
    }
  },

  updateActiveStock: async (ticker: string, shares: number) => {
    try {
      // Fetch current price
      const { price, lastUpdated } = await getStockPrice(ticker)

      set((state: any) => ({
        stockValues: {
          ...state.stockValues,
          activeStocks: state.stockValues.activeStocks.map((stock: ActiveStock) =>
            stock.ticker === ticker
              ? { ...stock, shares, currentPrice: price, lastUpdated }
              : stock
          )
        }
      }))
    } catch (error) {
      console.error('Failed to update active stock:', error)
      throw error
    }
  },

  removeActiveStock: (ticker: string) => {
    set((state: any) => ({
      stockValues: {
        ...state.stockValues,
        activeStocks: state.stockValues.activeStocks.filter(
          (stock: ActiveStock) => stock.ticker !== ticker
        )
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

      // Get all tickers
      const tickers = stockValues.activeStocks.map((stock: ActiveStock) => stock.ticker)
      
      // Track failed updates
      const failedUpdates: string[] = []

      // Update each stock individually to handle failures gracefully
      const updatedStocks = await Promise.all(
        stockValues.activeStocks.map(async (stock: ActiveStock) => {
          try {
            const priceUpdate = await getStockPrice(stock.ticker)
            return {
              ...stock,
              currentPrice: priceUpdate.price,
              marketValue: stock.shares * priceUpdate.price,
              zakatDue: stock.shares * priceUpdate.price * ZAKAT_RATE
            }
          } catch (error) {
            // If price update fails, keep existing price and track failure
            failedUpdates.push(stock.ticker)
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
  setStockValue: (key, value) => 
    set((state: any) => ({
      stockValues: {
        ...state.stockValues,
        [key]: value
      }
    })),

  resetStockValues: () => {
    set({ 
      stockValues: {
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
        market_value: 0,
        zakatable_value: 0,
        price_per_share: 0
      },
      stockPrices: initialStockPrices,
      isLoading: false,
      lastError: null
    })
  },

  setStockPrices: (prices) => set({ stockPrices: prices }),

  setStockHawl: (value) => set({ stockHawlMet: value }),

  // Getters
  getTotalStocks: () => {
    const state = get()
    
    // Get active stocks total
    const activeTotal = Array.isArray(state.stockValues.activeStocks)
      ? state.stockValues.activeStocks.reduce(
          (sum, stock) => sum + (Number.isFinite(stock.marketValue) ? stock.marketValue : 0),
          0
        )
      : 0
    
    // Get passive investments total - use stockValues consistently
    const passiveTotal = state.stockValues.passiveInvestments?.marketValue || 0
    
    // Get dividend total
    const dividendTotal = Number.isFinite(state.stockValues.total_dividend_earnings)
      ? state.stockValues.total_dividend_earnings
      : 0
    
    // Get fund total
    const fundTotal = Number.isFinite(state.stockValues.fund_value)
      ? state.stockValues.fund_value
      : 0
    
    // Return combined total
    return activeTotal + passiveTotal + dividendTotal + fundTotal
  },

  getTotalZakatableStocks: () => {
    const state = get()
    if (!state.stockHawlMet) return 0
    
    // Only calculate if nisab is met
    if (!state.meetsNisabThreshold()) return 0
    
    // Get active stocks total (fully zakatable)
    const activeZakatable = Array.isArray(state.stockValues.activeStocks)
      ? state.stockValues.activeStocks.reduce(
          (sum, stock) => sum + (Number.isFinite(stock.marketValue) ? stock.marketValue : 0),
          0
        )
      : 0
    
    // Get passive investments zakatable amount (30% or CRI method)
    const passiveZakatable = state.passiveInvestments?.zakatableValue || 0
    
    // Get dividend total (fully zakatable)
    const dividendZakatable = Number.isFinite(state.stockValues.total_dividend_earnings)
      ? state.stockValues.total_dividend_earnings
      : 0
    
    // Get fund zakatable amount (30% for passive, full for active)
    const fundTotal = Number.isFinite(state.stockValues.fund_value)
      ? state.stockValues.fund_value
      : 0
    const fundZakatable = state.stockValues.is_passive_fund
      ? fundTotal * 0.3
      : fundTotal
    
    // Return combined zakatable amount
    return activeZakatable + passiveZakatable + dividendZakatable + fundZakatable
  },

  getActiveStocksBreakdown: () => {
    const state = get()
    const stocks = state.stockValues.activeStocks || []
    const total = {
      marketValue: roundCurrency(stocks.reduce((sum: number, stock) => sum + stock.marketValue, 0)),
      zakatDue: roundCurrency(stocks.reduce((sum: number, stock) => sum + stock.zakatDue, 0))
    }

    return {
      stocks: stocks.map(stock => ({
        ticker: stock.ticker,
        shares: stock.shares,
        currentPrice: roundCurrency(stock.currentPrice),
        marketValue: roundCurrency(stock.marketValue),
        zakatDue: roundCurrency(stock.zakatDue)
      })),
      total
    }
  },

  getStocksBreakdown: () => {
    const state = get()
    const total = roundCurrency(state.getTotalStocks())
    const zakatable = roundCurrency(state.getTotalZakatableStocks())
    const zakatDue = roundCurrency(zakatable * ZAKAT_RATE)
    
    // Calculate nisab threshold
    const goldNisab = NISAB.GOLD * (state.metalPrices?.gold || 0)
    const silverNisab = NISAB.SILVER * (state.metalPrices?.silver || 0)
    const nisabThreshold = Math.min(goldNisab, silverNisab)
    const meetsNisab = total >= nisabThreshold

    const activeStocks = state.stockValues.activeStocks || []
    const items: Record<string, {
      value: number
      isZakatable: boolean
      zakatable: number
      label: string
      tooltip: string
      percentage?: number
    }> = {}

    // Add active stocks
    activeStocks.forEach(stock => {
      items[stock.ticker.toLowerCase()] = {
        value: roundCurrency(stock.marketValue),
        isZakatable: state.stockHawlMet,
        zakatable: state.stockHawlMet ? roundCurrency(stock.marketValue) : 0,
        label: `${stock.ticker} (${stock.shares} shares)`,
        tooltip: `${stock.shares} shares at ${formatCurrency(stock.currentPrice)} each`,
        percentage: total > 0 ? roundCurrency((stock.marketValue / total) * 100) : 0
      }
    })

    // Add passive investments if present
    if (state.passiveInvestments) {
      const passiveTotal = roundCurrency(state.passiveInvestments.marketValue || 0)
      const passiveZakatable = roundCurrency(state.passiveInvestments.zakatableValue || 0)
      
      items['passive_investments'] = {
        value: passiveTotal,
        isZakatable: state.stockHawlMet,
        zakatable: state.stockHawlMet ? passiveZakatable : 0,
        label: 'Passive Investments',
        tooltip: `Using ${state.passiveInvestments.method} calculation method`,
        percentage: total > 0 ? roundCurrency((passiveTotal / total) * 100) : 0
      }
    }

    return {
      total,
      zakatable,
      zakatDue,
      meetsNisab,
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