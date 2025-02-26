import { StateCreator } from 'zustand'
import { ZakatState } from '../types'
import { ZAKAT_RATE } from '@/lib/constants'
import { DEFAULT_HAWL_STATUS } from '../constants'
import { getCryptoPrice, CryptoAPIError } from '@/lib/api/crypto'
import { roundCurrency } from '@/lib/utils/currency'
import { CryptoSlice, CryptoValues, CryptoHolding } from './crypto.types'

// Initial state
const initialCryptoValues: CryptoValues = {
  coins: [],
  total_value: 0,
  zakatable_value: 0
}

export const createCryptoSlice: StateCreator<
  ZakatState,
  [["zustand/persist", unknown]],
  [],
  CryptoSlice
> = (set, get) => ({
  // Initial state
  cryptoValues: initialCryptoValues,
  cryptoHawlMet: DEFAULT_HAWL_STATUS.crypto,
  isLoading: false,
  lastError: null,

  // Actions
  addCoin: async (symbol: string, quantity: number, currency: string = 'USD') => {
    if (typeof quantity !== 'number' || !isFinite(quantity) || quantity < 0) {
      console.warn(`Invalid crypto quantity: ${quantity} for ${symbol}`)
      return
    }

    try {
      const currentPrice = await getCryptoPrice(symbol, currency)
      const marketValue = roundCurrency(quantity * currentPrice)
      const zakatDue = roundCurrency(marketValue * ZAKAT_RATE)

      set((state: ZakatState) => {
        const newCoins = [...state.cryptoValues.coins, {
          symbol: symbol.toUpperCase(),
          quantity,
          currentPrice: roundCurrency(currentPrice),
          marketValue,
          zakatDue,
          currency
        }]

        const total = roundCurrency(newCoins.reduce((sum: number, coin: CryptoHolding) => sum + coin.marketValue, 0))
        
        return {
          cryptoValues: {
            coins: newCoins,
            total_value: total,
            zakatable_value: state.cryptoHawlMet ? total : 0
          }
        }
      })
    } catch (error) {
      console.error('Error adding coin:', error)
      throw error
    }
  },

  removeCoin: (symbol: string) => {
    set((state: ZakatState) => {
      const newCoins = state.cryptoValues.coins.filter(
        (coin: CryptoHolding) => coin.symbol !== symbol.toUpperCase()
      )
      
      const total = roundCurrency(newCoins.reduce((sum: number, coin: CryptoHolding) => sum + coin.marketValue, 0))

      return {
        cryptoValues: {
          coins: newCoins,
          total_value: total,
          zakatable_value: state.cryptoHawlMet ? total : 0
        }
      }
    })
  },

  resetCryptoValues: () => set({ 
    cryptoValues: initialCryptoValues,
    cryptoHawlMet: DEFAULT_HAWL_STATUS.crypto
  }),

  setCryptoHawl: (value: boolean) => {
    set((state: ZakatState) => ({
      cryptoHawlMet: value,
      cryptoValues: {
        ...state.cryptoValues,
        zakatable_value: value ? state.cryptoValues.total_value : 0
      }
    }))
  },

  updatePrices: async (currency: string = 'USD') => {
    set({ isLoading: true, lastError: null })
    
    const state = get()
    const coins = state.cryptoValues.coins

    if (!Array.isArray(coins) || coins.length === 0) {
      set({ isLoading: false })
      return
    }

    const failedUpdates: string[] = []
    const updatedCoins = [...coins]

    try {
      // Update each coin individually to handle failures gracefully
      for (const coin of coins) {
        try {
          const currentPrice = await getCryptoPrice(coin.symbol, currency)
          const marketValue = roundCurrency(coin.quantity * currentPrice)
          const zakatDue = roundCurrency(marketValue * ZAKAT_RATE)

          const index = updatedCoins.findIndex(c => c.symbol === coin.symbol)
          if (index !== -1) {
            updatedCoins[index] = {
              ...coin,
              currentPrice: roundCurrency(currentPrice),
              marketValue,
              zakatDue,
              currency
            }
          }
        } catch (error) {
          // If price update fails, keep existing price and track failure
          console.error(`Failed to update price for ${coin.symbol}:`, error)
          failedUpdates.push(coin.symbol)
        }
      }

      // Calculate total after all updates
      const total = roundCurrency(updatedCoins.reduce((sum: number, coin: CryptoHolding) => sum + coin.marketValue, 0))
      
      // First update the state with new values
      set((state: ZakatState) => ({
        isLoading: false,
        cryptoValues: {
          coins: updatedCoins,
          total_value: total,
          zakatable_value: state.cryptoHawlMet ? total : 0
        }
      }))

      // Then if there were any failures, throw an error
      if (failedUpdates.length > 0) {
        throw new CryptoAPIError(
          `Could not update prices for: ${failedUpdates.join(', ')}. Previous prices retained.`
        )
      }

    } catch (error) {
      console.error('Failed to update crypto prices:', error)
      set({ isLoading: false })
      // Re-throw the error to be handled by the component
      throw error instanceof Error ? error : new Error('Failed to update crypto prices')
    }
  },

  // Getters
  getTotalCrypto: () => {
    const { cryptoValues } = get()
    return cryptoValues.total_value
  },

  getTotalZakatableCrypto: () => {
    const { cryptoValues, cryptoHawlMet } = get()
    return cryptoHawlMet ? cryptoValues.total_value : 0
  },

  getCryptoBreakdown: () => {
    const state = get()
    const total = roundCurrency(state.getTotalCrypto())
    const zakatable = roundCurrency(state.getTotalZakatableCrypto())

    // Ensure coins array exists
    const coins = state.cryptoValues?.coins || []

    return {
      total,
      zakatable,
      zakatDue: roundCurrency(zakatable * ZAKAT_RATE),
      items: coins.reduce((acc: Record<string, {
        value: number;
        isZakatable: boolean;
        zakatable: number;
        zakatDue: number;
        label: string;
        tooltip: string;
        percentage: number;
        isExempt: boolean;
      }>, coin: CryptoHolding) => ({
        ...acc,
        [coin.symbol.toLowerCase()]: {
          value: roundCurrency(coin.marketValue),
          isZakatable: state.cryptoHawlMet,
          zakatable: state.cryptoHawlMet ? roundCurrency(coin.marketValue) : 0,
          zakatDue: state.cryptoHawlMet ? roundCurrency(coin.marketValue * ZAKAT_RATE) : 0,
          label: `${coin.symbol} (${coin.quantity} coins)`,
          tooltip: `${coin.quantity} ${coin.symbol} at ${roundCurrency(coin.currentPrice).toLocaleString('en-US', {
            style: 'currency',
            currency: coin.currency || 'USD'
          })} each`,
          percentage: total > 0 ? roundCurrency((coin.marketValue / total) * 100) : 0,
          isExempt: false
        }
      }), {})
    }
  }
}) 