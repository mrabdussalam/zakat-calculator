import { StateCreator } from 'zustand'
import { ZakatState } from '../types'
import { NISAB } from '../constants'

export interface NisabSlice {
  // State
  nisabData?: {
    threshold: number
    silverPrice: number
    lastUpdated: string
    source: string
  }

  // Actions
  fetchNisabData: () => Promise<void>

  // Getters
  getNisabStatus: () => {
    meetsNisab: boolean
    totalValue: number
    nisabValue: number
    thresholds: {
      gold: number
      silver: number
    }
  }
  meetsNisab: () => boolean
}

export const createNisabSlice: StateCreator<
  ZakatState,
  [],
  [],
  NisabSlice
> = (set, get) => ({
  // Initial state
  nisabData: undefined,

  // Actions
  fetchNisabData: async () => {
    try {
      // TODO: Implement actual API call
      // For now, just use default values
      set({
        nisabData: {
          threshold: NISAB.SILVER.GRAMS * 0.75, // Using default silver price
          silverPrice: 0.75,
          lastUpdated: new Date().toISOString(),
          source: 'default'
        }
      })
    } catch (error) {
      console.error('Failed to fetch nisab data:', error)
    }
  },

  // Getters
  getNisabStatus: () => {
    const state = get()
    
    // Get total values from each asset type
    const totalCash = state.getTotalCash()
    const totalMetals = state.getTotalMetals().total
    const totalStocks = state.getTotalStocks()
    const totalRetirement = state.getRetirementTotal()
    const totalRealEstate = state.getRealEstateTotal()
    const totalCrypto = state.getTotalCrypto()

    // Total combined wealth (including all assets)
    const totalValue = totalCash + totalMetals + totalStocks + 
      totalRetirement + totalRealEstate + totalCrypto
    
    // Get metal prices from the metals slice
    const metalPrices = state.metalPrices || { gold: 0, silver: 0 }
    
    // Calculate Nisab thresholds
    const goldNisabValue = NISAB.GOLD.GRAMS * metalPrices.gold    // 85g * gold price
    const silverNisabValue = NISAB.SILVER.GRAMS * metalPrices.silver  // 595g * silver price
    const nisabThreshold = Math.min(goldNisabValue, silverNisabValue)
    
    return {
      meetsNisab: totalValue >= nisabThreshold,
      totalValue,
      nisabValue: nisabThreshold,
      thresholds: {
        gold: goldNisabValue,
        silver: silverNisabValue
      }
    }
  },

  meetsNisab: () => {
    const state = get()
    return state.getNisabStatus().meetsNisab
  }
}) 