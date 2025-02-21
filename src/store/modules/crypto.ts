import { StateCreator } from 'zustand'
import { ZakatState, CryptoValues, AssetBreakdown } from '../types'
import { ZAKAT_RATE } from '@/lib/constants'
import { DEFAULT_HAWL_STATUS } from '../constants'
import { getCryptoPrice, validateCryptoSymbol } from '@/lib/api/crypto'
import { getAssetType } from '@/lib/assets/registry'
import { AssetBreakdownItem } from '@/lib/assets/types'
import { roundCurrency, formatCurrency } from '@/lib/utils/currency'

export interface CryptoSlice {
  // State
  cryptoValues: CryptoValues
  cryptoHawlMet: boolean

  // Actions
  addCoin: (symbol: string, quantity: number) => void
  removeCoin: (symbol: string) => void
  resetCryptoValues: () => void
  setCryptoHawl: (value: boolean) => void

  // Getters
  getTotalCrypto: () => number
  getTotalZakatableCrypto: () => number
  getCryptoBreakdown: () => AssetBreakdown
}

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
> = (set, get, store) => ({
  // Initial state
  cryptoValues: initialCryptoValues,
  cryptoHawlMet: DEFAULT_HAWL_STATUS.crypto,

  // Actions
  addCoin: async (symbol: string, quantity: number) => {
    if (typeof quantity !== 'number' || !isFinite(quantity) || quantity < 0) {
      console.warn(`Invalid crypto quantity: ${quantity} for ${symbol}`)
      return
    }

    try {
      const currentPrice = await getCryptoPrice(symbol)
      const marketValue = roundCurrency(quantity * currentPrice)
      const zakatDue = roundCurrency(marketValue * ZAKAT_RATE)

      set((state) => {
        const newCoins = [...state.cryptoValues.coins, {
          symbol: symbol.toUpperCase(),
          quantity,
          currentPrice: roundCurrency(currentPrice),
          marketValue,
          zakatDue
        }]

        const total = roundCurrency(newCoins.reduce((sum, coin) => sum + coin.marketValue, 0))
        
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
    set((state) => {
      const newCoins = state.cryptoValues.coins.filter(
        coin => coin.symbol !== symbol.toUpperCase()
      )
      
      const total = newCoins.reduce((sum, coin) => sum + coin.marketValue, 0)

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
    set((state) => ({
      cryptoHawlMet: value,
      cryptoValues: {
        ...state.cryptoValues,
        zakatable_value: value ? state.cryptoValues.total_value : 0
      }
    }))
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

    const breakdown: AssetBreakdown = {
      total,
      zakatable,
      zakatDue: roundCurrency(zakatable * ZAKAT_RATE),
      items: coins.reduce((acc, coin) => ({
        ...acc,
        [coin.symbol.toLowerCase()]: {
          value: roundCurrency(coin.marketValue),
          isZakatable: state.cryptoHawlMet,
          zakatable: state.cryptoHawlMet ? roundCurrency(coin.marketValue) : 0,
          zakatDue: state.cryptoHawlMet ? roundCurrency(coin.marketValue * ZAKAT_RATE) : 0,
          label: `${coin.symbol} (${coin.quantity} coins)`,
          tooltip: `${coin.quantity} ${coin.symbol} at ${formatCurrency(coin.currentPrice)} each`,
          percentage: total > 0 ? roundCurrency((coin.marketValue / total) * 100) : 0,
          isExempt: false
        }
      }), {})
    }

    // If no coins, add a default item
    if (Object.keys(breakdown.items).length === 0) {
      breakdown.items.cryptocurrency = {
        value: 0,
        isZakatable: false,
        zakatable: 0,
        zakatDue: 0,
        label: 'Cryptocurrency',
        tooltip: 'No cryptocurrencies added yet',
        percentage: 0,
        isExempt: false
      }
    }

    return breakdown
  }
}) 