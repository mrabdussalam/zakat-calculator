import { AssetBreakdown } from '@/lib/assets/types'

export interface CryptoHolding {
  symbol: string
  quantity: number
  currentPrice: number
  marketValue: number
  zakatDue: number
  currency?: string
}

export interface CryptoValues {
  coins: CryptoHolding[]
  total_value: number
  zakatable_value: number
}

export interface CryptoSlice {
  // State
  cryptoValues: CryptoValues
  cryptoHawlMet: boolean
  isLoading: boolean
  lastError: string | null

  // Actions
  addCoin: (symbol: string, quantity: number, currency?: string) => Promise<void>
  removeCoin: (symbol: string) => void
  resetCryptoValues: () => void
  setCryptoHawl: (value: boolean) => void
  updatePrices: (currency?: string) => Promise<void>

  // Getters
  getTotalCrypto: () => number
  getTotalZakatableCrypto: () => number
  getCryptoBreakdown: () => AssetBreakdown
} 