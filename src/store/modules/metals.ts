import { StateCreator } from 'zustand'
import { MetalsValues, MetalPrices, MetalsPreferences, GoldPurity } from './metals.types'
import { DEFAULT_HAWL_STATUS } from '../constants'
import { computeMetalsResults, clearMetalsCalculationCache } from '../utils'
import { ZakatState } from '../types'
import { ZAKAT_RATE } from '@/lib/constants'
import { WeightUnit } from '@/lib/utils/units'
import debug from '@/lib/utils/debug'

// Initial values
const initialMetalsValues: MetalsValues = {
  gold_regular: 0,
  gold_regular_purity: '24K',
  gold_occasional: 0,
  gold_occasional_purity: '24K',
  gold_investment: 0,
  gold_investment_purity: '24K',
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
  setMetalsValue: (key: keyof MetalsValues, value: number | GoldPurity) => void
  resetMetalsValues: () => void
  setMetalsValues: (values: Partial<MetalsValues>) => void
  setMetalPrices: (prices: Partial<MetalPrices>) => void
  setMetalsHawl: (value: boolean) => void
  setMetalsWeightUnit: (unit: WeightUnit) => void

  // Getters
  getMetalsTotal: () => number
  getMetalsZakatable: () => number
  getMetalsBreakdown: () => {
    total: number
    zakatable: number
    zakatDue: number
    goldGrams: number
    silverGrams: number
    items: Record<string, {
      value: number;
      weight: number;
      purity?: GoldPurity;
      isZakatable: boolean;
      isExempt: boolean;
      zakatable: number;
      zakatDue: number
    }>
  }
}

export const createMetalsSlice: StateCreator<
  ZakatState,
  [],
  [],
  MetalsSlice
> = (set, get) => ({
  // Initial state
  metalsValues: initialMetalsValues,
  metalPrices: initialMetalPrices,
  metalsHawlMet: DEFAULT_HAWL_STATUS.metals,
  metalsPreferences: initialMetalsPreferences,

  // Actions
  setMetalsValue: (key: keyof MetalsValues, value: number | GoldPurity) =>
    set((state: ZakatState) => ({
      metalsValues: {
        ...state.metalsValues,
        [key]: value
      }
    })),

  resetMetalsValues: () => set({ metalsValues: initialMetalsValues }),

  setMetalsValues: (values: Partial<MetalsValues>) => {
    debug.info('Setting metals values', values, 'metals');
    set((state) => ({
      metalsValues: {
        ...state.metalsValues,
        ...values
      }
    }));

    // Clear calculation cache when values change
    clearMetalsCalculationCache();
  },

  setMetalPrices: (prices: Partial<MetalPrices>) => {
    const currentPrices = get().metalPrices;
    const updatedPrices = {
      ...currentPrices,
      ...prices,
      // Ensure lastUpdated is a Date object
      lastUpdated: prices.lastUpdated || new Date()
    };

    // Log the price update
    console.log('Updating metal prices:', {
      from: {
        gold: currentPrices.gold,
        silver: currentPrices.silver,
        currency: currentPrices.currency
      },
      to: {
        gold: updatedPrices.gold,
        silver: updatedPrices.silver,
        currency: updatedPrices.currency
      }
    });

    // Update the prices in the store
    set({ metalPrices: updatedPrices });

    // Clear the calculation cache when prices change
    clearMetalsCalculationCache();

    // IMPORTANT: Immediately update nisab data with the new metal prices
    // This ensures nisab threshold updates instantly with the metal prices
    const state = get();

    // First try to use the direct update method for immediate updates
    if (typeof state.updateNisabWithPrices === 'function') {
      console.log('Immediately updating nisab with new metal prices (direct method)');
      const success = state.updateNisabWithPrices(updatedPrices);
      console.log('Direct nisab update result:', success ? 'success' : 'failed');

      // If direct update failed, fall back to the refresh method
      if (!success && typeof state.forceRefreshNisabForCurrency === 'function' && updatedPrices.currency) {
        console.log('Falling back to refresh method for nisab update');
        state.forceRefreshNisabForCurrency(updatedPrices.currency)
          .catch(error => console.error('Error in fallback nisab refresh:', error));
      }
    }
    // If direct update not available, use the refresh method
    else if (typeof state.forceRefreshNisabForCurrency === 'function' && updatedPrices.currency) {
      console.log('Refreshing nisab data with new currency (refresh method):', updatedPrices.currency);
      state.forceRefreshNisabForCurrency(updatedPrices.currency)
        .then(success => {
          console.log('Nisab refresh result:', success ? 'success' : 'failed');
        })
        .catch(error => {
          console.error('Error refreshing nisab data:', error);
        });
    }

    // Dispatch an event to notify components about the price update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('metal-prices-updated', {
        detail: {
          prices: updatedPrices,
          timestamp: new Date().toISOString()
        }
      }));
    }
  },

  setMetalsHawl: (value: boolean) => set({ metalsHawlMet: value }),

  setMetalsWeightUnit: (unit: WeightUnit) =>
    set((state: ZakatState) => ({
      metalsPreferences: {
        ...state.metalsPreferences,
        weightUnit: unit
      }
    })),

  // Getters
  getMetalsTotal: () => {
    const state = get();
    const { metalsValues, metalPrices, metalsHawlMet } = state;

    // Use the memoized computation function
    const result = computeMetalsResults(metalsValues, metalPrices, metalsHawlMet);

    // Only log at trace level to minimize console noise
    debug.trace('Computed metals total', {
      total: result.total,
      zakatable: result.zakatable,
      currency: metalPrices.currency
    }, 'calculation');

    return result.total;
  },

  getMetalsZakatable: () => {
    const state = get();
    const { metalsValues, metalPrices, metalsHawlMet } = state;

    // Use the memoized computation function
    const result = computeMetalsResults(metalsValues, metalPrices, metalsHawlMet);

    return result.zakatable;
  },

  getMetalsBreakdown: () => {
    const state = get();
    const { metalsValues, metalPrices, metalsHawlMet } = state;

    // Use the memoized computation function
    const result = computeMetalsResults(metalsValues, metalPrices, metalsHawlMet);

    const items: Record<string, {
      value: number;
      weight: number;
      purity?: GoldPurity;
      isZakatable: boolean;
      isExempt: boolean;
      zakatable: number;
      zakatDue: number
    }> = {
      gold_regular: {
        value: result.breakdown.gold.regular.value,
        weight: result.breakdown.gold.regular.weight,
        purity: result.breakdown.gold.regular.purity,
        isZakatable: result.breakdown.gold.regular.isZakatable,
        isExempt: result.breakdown.gold.regular.isExempt,
        zakatable: metalsHawlMet ? (result.breakdown.gold.regular.isZakatable ? result.breakdown.gold.regular.value : 0) : 0,
        zakatDue: metalsHawlMet ? (result.breakdown.gold.regular.isZakatable ? result.breakdown.gold.regular.value * ZAKAT_RATE : 0) : 0
      },
      gold_occasional: {
        value: result.breakdown.gold.occasional.value,
        weight: result.breakdown.gold.occasional.weight,
        purity: result.breakdown.gold.occasional.purity,
        isZakatable: result.breakdown.gold.occasional.isZakatable,
        isExempt: result.breakdown.gold.occasional.isExempt,
        zakatable: metalsHawlMet ? result.breakdown.gold.occasional.value : 0,
        zakatDue: metalsHawlMet ? result.breakdown.gold.occasional.value * ZAKAT_RATE : 0
      },
      gold_investment: {
        value: result.breakdown.gold.investment.value,
        weight: result.breakdown.gold.investment.weight,
        purity: result.breakdown.gold.investment.purity,
        isZakatable: result.breakdown.gold.investment.isZakatable,
        isExempt: result.breakdown.gold.investment.isExempt,
        zakatable: metalsHawlMet ? result.breakdown.gold.investment.value : 0,
        zakatDue: metalsHawlMet ? result.breakdown.gold.investment.value * ZAKAT_RATE : 0
      },
      silver_regular: {
        value: result.breakdown.silver.regular.value,
        weight: result.breakdown.silver.regular.weight,
        isZakatable: result.breakdown.silver.regular.isZakatable,
        isExempt: result.breakdown.silver.regular.isExempt,
        zakatable: metalsHawlMet ? (result.breakdown.silver.regular.isZakatable ? result.breakdown.silver.regular.value : 0) : 0,
        zakatDue: metalsHawlMet ? (result.breakdown.silver.regular.isZakatable ? result.breakdown.silver.regular.value * ZAKAT_RATE : 0) : 0
      },
      silver_occasional: {
        value: result.breakdown.silver.occasional.value,
        weight: result.breakdown.silver.occasional.weight,
        isZakatable: result.breakdown.silver.occasional.isZakatable,
        isExempt: result.breakdown.silver.occasional.isExempt,
        zakatable: metalsHawlMet ? result.breakdown.silver.occasional.value : 0,
        zakatDue: metalsHawlMet ? result.breakdown.silver.occasional.value * ZAKAT_RATE : 0
      },
      silver_investment: {
        value: result.breakdown.silver.investment.value,
        weight: result.breakdown.silver.investment.weight,
        isZakatable: result.breakdown.silver.investment.isZakatable,
        isExempt: result.breakdown.silver.investment.isExempt,
        zakatable: metalsHawlMet ? result.breakdown.silver.investment.value : 0,
        zakatDue: metalsHawlMet ? result.breakdown.silver.investment.value * ZAKAT_RATE : 0
      }
    }

    return {
      total: result.total,
      zakatable: result.zakatable,
      zakatDue: result.zakatDue,
      goldGrams: result.breakdown.gold.total.weight,
      silverGrams: result.breakdown.silver.total.weight,
      items
    }
  }
}) 