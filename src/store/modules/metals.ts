import { StateCreator } from 'zustand'
import { MetalsValues, MetalPrices, MetalsPreferences } from './metals.types'
import { DEFAULT_HAWL_STATUS } from '../constants'
import { computeMetalsResults } from '../utils'
import { ZakatState } from '../types'
import { ZAKAT_RATE } from '@/lib/constants'
import { WeightUnit } from '@/lib/utils/units'

// Initial values
const initialMetalsValues: MetalsValues = {
  gold_regular: 0,
  gold_occasional: 0,
  gold_investment: 0,
  silver_regular: 0,
  silver_occasional: 0,
  silver_investment: 0
}

const initialMetalPrices: MetalPrices = {
  gold: 0,
  silver: 0,
  lastUpdated: new Date(),
  isCache: false,
  currency: 'USD' // Default currency
}

const initialMetalsPreferences: MetalsPreferences = {
  weightUnit: 'gram' // Default to grams
}

export interface MetalsSlice {
  // State
  metalsValues: MetalsValues
  metalPrices: MetalPrices
  metalsHawlMet: boolean
  metalsPreferences: MetalsPreferences

  // Actions
  setMetalsValue: (key: keyof MetalsValues, value: number) => void
  resetMetalsValues: () => void
  setMetalPrices: (prices: MetalPrices) => void
  setMetalsHawl: (value: boolean) => void
  setMetalsWeightUnit: (unit: WeightUnit) => void

  // Getters
  getTotalMetals: () => {
    goldGrams: number
    silverGrams: number
    goldValue: number
    silverValue: number
    total: number
  }
  getTotalZakatableMetals: () => {
    goldGrams: number
    silverGrams: number
    goldValue: number
    silverValue: number
    total: number
  }
  getMetalsBreakdown: () => {
    total: number
    zakatable: number
    zakatDue: number
    goldGrams: number
    silverGrams: number
    items: Record<string, { value: number; weight: number; isZakatable: boolean; isExempt: boolean; zakatable: number; zakatDue: number }>
  }
}

export const createMetalsSlice: StateCreator<ZakatState> = (set, get) => ({
  // Initial state
  metalsValues: initialMetalsValues,
  metalPrices: initialMetalPrices,
  metalsHawlMet: DEFAULT_HAWL_STATUS.metals,
  metalsPreferences: initialMetalsPreferences,

  // Actions
  setMetalsValue: (key: keyof MetalsValues, value: number) => 
    set((state: ZakatState) => ({
      metalsValues: {
        ...state.metalsValues,
        [key]: value
      }
    })),

  resetMetalsValues: () => set({ metalsValues: initialMetalsValues }),

  setMetalPrices: (prices: MetalPrices) => set((state: ZakatState) => {
    // Ensure currency is always set, default to USD if not provided
    const updatedPrices = {
      ...prices,
      currency: prices.currency || 'USD'
    };
    
    return { metalPrices: updatedPrices };
  }),

  setMetalsHawl: (value: boolean) => set({ metalsHawlMet: value }),

  setMetalsWeightUnit: (unit: WeightUnit) => 
    set((state: ZakatState) => ({
      metalsPreferences: {
        ...state.metalsPreferences,
        weightUnit: unit
      }
    })),

  // Getters
  getTotalMetals: () => {
    const { metalsValues, metalPrices } = get()
    const results = computeMetalsResults(metalsValues, metalPrices, true)

    return {
      goldGrams: results.breakdown.gold.total.weight,
      silverGrams: results.breakdown.silver.total.weight,
      goldValue: results.breakdown.gold.total.value,
      silverValue: results.breakdown.silver.total.value,
      total: results.total
    }
  },

  getTotalZakatableMetals: () => {
    const { metalsValues, metalPrices, metalsHawlMet } = get()
    const results = computeMetalsResults(metalsValues, metalPrices, metalsHawlMet)

    return {
      goldGrams: results.breakdown.gold.zakatable.weight,
      silverGrams: results.breakdown.silver.zakatable.weight,
      goldValue: results.breakdown.gold.zakatable.value,
      silverValue: results.breakdown.silver.zakatable.value,
      total: results.zakatable
    }
  },

  getMetalsBreakdown: () => {
    const { metalsValues, metalPrices, metalsHawlMet } = get()
    const results = computeMetalsResults(metalsValues, metalPrices, metalsHawlMet)
    
    const items: Record<string, { value: number; weight: number; isZakatable: boolean; isExempt: boolean; zakatable: number; zakatDue: number }> = {
      gold_regular: {
        value: results.breakdown.gold.regular.value,
        weight: results.breakdown.gold.regular.weight,
        isZakatable: results.breakdown.gold.regular.isZakatable,
        isExempt: results.breakdown.gold.regular.isExempt,
        zakatable: metalsHawlMet ? (results.breakdown.gold.regular.isZakatable ? results.breakdown.gold.regular.value : 0) : 0,
        zakatDue: metalsHawlMet ? (results.breakdown.gold.regular.isZakatable ? results.breakdown.gold.regular.value * ZAKAT_RATE : 0) : 0
      },
      gold_occasional: {
        value: results.breakdown.gold.occasional.value,
        weight: results.breakdown.gold.occasional.weight,
        isZakatable: results.breakdown.gold.occasional.isZakatable,
        isExempt: results.breakdown.gold.occasional.isExempt,
        zakatable: metalsHawlMet ? results.breakdown.gold.occasional.value : 0,
        zakatDue: metalsHawlMet ? results.breakdown.gold.occasional.value * ZAKAT_RATE : 0
      },
      gold_investment: {
        value: results.breakdown.gold.investment.value,
        weight: results.breakdown.gold.investment.weight,
        isZakatable: results.breakdown.gold.investment.isZakatable,
        isExempt: results.breakdown.gold.investment.isExempt,
        zakatable: metalsHawlMet ? results.breakdown.gold.investment.value : 0,
        zakatDue: metalsHawlMet ? results.breakdown.gold.investment.value * ZAKAT_RATE : 0
      },
      silver_regular: {
        value: results.breakdown.silver.regular.value,
        weight: results.breakdown.silver.regular.weight,
        isZakatable: results.breakdown.silver.regular.isZakatable,
        isExempt: results.breakdown.silver.regular.isExempt,
        zakatable: metalsHawlMet ? (results.breakdown.silver.regular.isZakatable ? results.breakdown.silver.regular.value : 0) : 0,
        zakatDue: metalsHawlMet ? (results.breakdown.silver.regular.isZakatable ? results.breakdown.silver.regular.value * ZAKAT_RATE : 0) : 0
      },
      silver_occasional: {
        value: results.breakdown.silver.occasional.value,
        weight: results.breakdown.silver.occasional.weight,
        isZakatable: results.breakdown.silver.occasional.isZakatable,
        isExempt: results.breakdown.silver.occasional.isExempt,
        zakatable: metalsHawlMet ? results.breakdown.silver.occasional.value : 0,
        zakatDue: metalsHawlMet ? results.breakdown.silver.occasional.value * ZAKAT_RATE : 0
      },
      silver_investment: {
        value: results.breakdown.silver.investment.value,
        weight: results.breakdown.silver.investment.weight,
        isZakatable: results.breakdown.silver.investment.isZakatable,
        isExempt: results.breakdown.silver.investment.isExempt,
        zakatable: metalsHawlMet ? results.breakdown.silver.investment.value : 0,
        zakatDue: metalsHawlMet ? results.breakdown.silver.investment.value * ZAKAT_RATE : 0
      }
    }

    return {
      total: results.total,
      zakatable: results.zakatable,
      zakatDue: results.zakatDue,
      goldGrams: results.breakdown.gold.total.weight,
      silverGrams: results.breakdown.silver.total.weight,
      items
    }
  }
}) 