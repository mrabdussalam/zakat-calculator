import { StateCreator } from 'zustand'
import { ZakatState } from '../types'
import { NISAB } from '../constants'
// Since we've created the utils file but TypeScript doesn't recognize it yet,
// let's define the utility function interfaces here for now
interface NisabUtils {
  calculateNisabThreshold: (goldPrice: number, silverPrice: number) => number;
  fetchNisabData: (currency: string, forceRefresh?: boolean) => Promise<{
    nisabThreshold: number;
    silverPrice: number;
    timestamp: string;
    source: string;
    currency: string;
    metalPrices?: {
      gold: number;
      silver: number;
    };
  }>;
  getOfflineFallbackNisabData: (state: any, customCurrency?: string) => {
    threshold: number;
    silverPrice: number;
    lastUpdated: string;
    source: string;
    currency: string;
  };
}

// Import the utils module - we'll create an error handling mechanism if it fails
let nisabUtils: NisabUtils;
try {
  // Try to import the module
  nisabUtils = require('../utils/nisabUtils');
} catch (error) {
  // Fallback implementations if the module is not available
  console.error('Failed to import nisabUtils module, using fallback implementations');
  
  nisabUtils = {
    calculateNisabThreshold: (goldPrice: number, silverPrice: number) => {
      const goldNisabThreshold = goldPrice * NISAB.GOLD.GRAMS;
      const silverNisabThreshold = silverPrice * NISAB.SILVER.GRAMS;
      return Math.min(goldNisabThreshold, silverNisabThreshold);
    },
    fetchNisabData: async (currency: string) => ({
      nisabThreshold: 0,
      silverPrice: 0,
      timestamp: new Date().toISOString(),
      source: 'fallback',
      currency
    }),
    getOfflineFallbackNisabData: (state: any, customCurrency?: string) => ({
      threshold: 0,
      silverPrice: 0,
      lastUpdated: new Date().toISOString(),
      source: 'fallback',
      currency: customCurrency || 'USD'
    })
  };
}

// Destructure the utility functions
const { calculateNisabThreshold, fetchNisabData, getOfflineFallbackNisabData } = nisabUtils;

// Add a debounce mechanism to prevent multiple rapid fetch calls
let lastFetchTimestamp = 0;
const FETCH_DEBOUNCE_MS = 2000; // 2 seconds debounce
const MAX_RETRIES = 3; // Increase maximum number of retry attempts
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

// Add environment detection for Replit
const IS_REPLIT = typeof window !== 'undefined' && 
  (window.location.hostname.includes('replit') || 
   window.location.hostname.endsWith('.repl.co'));

// Add offline fallback prices that will be used when API calls fail in Replit
const OFFLINE_FALLBACK_PRICES = {
  gold: 93.98,  // USD per gram
  silver: 1.02, // USD per gram
  lastUpdated: new Date().toISOString()
};

// ENHANCEMENT: Add a flag to prevent unnecessary API calls when fallback values are sufficient
const SKIP_API_CALLS_IN_DEVELOPMENT = true;

export interface NisabSlice {
  // State
  nisabData?: {
    threshold: number
    silverPrice: number
    lastUpdated: string
    source: string
    currency: string
  }
  isFetchingNisab?: boolean // Track fetch state
  fetchError?: string // Track fetch errors

  // Actions
  fetchNisabData: () => Promise<void>
  updateNisabWithPrices: (prices: {
    gold: number
    silver: number
    currency: string
    lastUpdated: Date
    isCache: boolean
  }) => void
  
  // New action to force refresh nisab on currency change - return boolean for success/failure
  forceRefreshNisabForCurrency: (currency: string) => Promise<boolean>

  // Getters
  getNisabStatus: () => {
    meetsNisab: boolean
    totalValue: number
    nisabValue: number
    thresholds: {
      gold: number
      silver: number
    }
    currency: string
  }
  meetsNisab: () => boolean
}

export const createNisabSlice: StateCreator<
  ZakatState,
  [["zustand/persist", unknown]],
  [],
  NisabSlice
> = (set, get, store) => ({
  // Initial state
  nisabData: undefined,
  isFetchingNisab: false,
  fetchError: undefined,

  // Actions
  fetchNisabData: async () => {
    const state = get();
    
    // Prevent concurrent fetches
    if (state.isFetchingNisab) {
      console.log('Nisab fetch already in progress, skipping');
      return;
    }
    
    set({ isFetchingNisab: true, fetchError: undefined });
    
    try {
      // Use the current currency from metal prices or default to USD
      const currency = state.metalPrices?.currency || 'USD';
      
      // If we have recent metal prices in the correct currency, use them directly
      if (state.metalPrices && 
          state.metalPrices.currency === currency && 
          state.metalPrices.gold > 0 && 
          state.metalPrices.silver > 0) {
        
        const calculatedData = {
          threshold: calculateNisabThreshold(state.metalPrices.gold, state.metalPrices.silver),
          silverPrice: state.metalPrices.silver,
          lastUpdated: state.metalPrices.lastUpdated instanceof Date 
            ? state.metalPrices.lastUpdated.toISOString()
            : typeof state.metalPrices.lastUpdated === 'string' 
              ? state.metalPrices.lastUpdated
              : new Date().toISOString(),
          source: 'calculated-from-prices',
          currency: currency
        };
        
        set({ nisabData: calculatedData });
        
        // Notify components about the calculated update
        if (typeof window !== 'undefined') {
          console.log('Emitting nisab-updated event (calculated)');
          window.dispatchEvent(new CustomEvent('nisab-updated', {
            detail: { 
              currency: currency,
              source: 'calculated',
              threshold: calculatedData.threshold
            }
          }));
        }
        
        return;
      }
      
      // Fetch from API
      const result = await fetchNisabData(currency);
      
      // Update the store with the fetched data
      set({ 
        nisabData: {
          threshold: result.nisabThreshold,
          silverPrice: result.silverPrice,
          lastUpdated: result.timestamp,
          source: result.source,
          currency: result.currency
        },
        fetchError: undefined
      });
      
      // If the API provided metal prices, update them in the store
      if (result.metalPrices) {
        state.setMetalPrices({
          gold: result.metalPrices.gold,
          silver: result.metalPrices.silver,
          lastUpdated: new Date(result.timestamp),
          isCache: false,
          currency: result.currency
        });
      }
      
    } catch (error: any) {
      console.error('Failed to fetch nisab data:', error);
      
      // Get fallback data
      const fallbackData = getOfflineFallbackNisabData(get());
      
      set({ 
        nisabData: fallbackData,
        fetchError: IS_REPLIT
          ? 'Could not connect to the nisab calculation service. Using local calculations.'
          : (error?.message || 'Unknown error fetching nisab data')
      });
      
    } finally {
      set({ isFetchingNisab: false });
      
      // Notify components that nisab data has been updated
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nisab-updated', {
          detail: { timestamp: Date.now() }
        }));
      }
    }
  },

  // Update nisab with metal prices
  updateNisabWithPrices: (prices) => {
    const nisabThreshold = calculateNisabThreshold(prices.gold, prices.silver);
    
    const lastUpdatedISO = prices.lastUpdated instanceof Date 
      ? prices.lastUpdated.toISOString() 
      : typeof prices.lastUpdated === 'string'
        ? prices.lastUpdated
        : new Date().toISOString();
    
    set({
      nisabData: {
        threshold: nisabThreshold,
        silverPrice: prices.silver,
        lastUpdated: lastUpdatedISO,
        source: prices.isCache ? 'sync-cache' : 'sync-live',
        currency: prices.currency
      }
    });
  },

  // Force refresh nisab data for a specific currency
  forceRefreshNisabForCurrency: async (currency: string): Promise<boolean> => {
    const state = get();
    
    // Don't run multiple fetches simultaneously
    if (state.isFetchingNisab) {
      console.log('Nisab fetch already in progress, skipping');
      return false;
    }
    
    set({ isFetchingNisab: true, fetchError: undefined });
    
    try {
      // Use the passed currency or fallback to the current stored currency
      const actualCurrency = currency || state.metalPrices?.currency || 'USD';
      console.log(`Attempting nisab refresh for currency: ${actualCurrency}`);
      
      // If we have recent metal prices in the correct currency, use them directly
      if (state.metalPrices && 
          state.metalPrices.currency === actualCurrency && 
          state.metalPrices.gold > 0 && 
          state.metalPrices.silver > 0) {
        
        console.log('Using existing metal prices for nisab calculation');
        const calculatedData = {
          threshold: calculateNisabThreshold(state.metalPrices.gold, state.metalPrices.silver),
          silverPrice: state.metalPrices.silver,
          lastUpdated: state.metalPrices.lastUpdated instanceof Date 
            ? state.metalPrices.lastUpdated.toISOString()
            : typeof state.metalPrices.lastUpdated === 'string' 
              ? state.metalPrices.lastUpdated
              : new Date().toISOString(),
          source: 'calculated-from-prices',
          currency: actualCurrency
        };
        
        set({ nisabData: calculatedData, isFetchingNisab: false });
        
        // Notify components about the calculated update
        if (typeof window !== 'undefined') {
          console.log('Emitting nisab-updated event (calculated)');
          window.dispatchEvent(new CustomEvent('nisab-updated', {
            detail: { 
              currency: actualCurrency,
              source: 'calculated',
              threshold: calculatedData.threshold
            }
          }));
        }
        
        return true;
      }
      
      // Set a timeout to ensure we don't get stuck in the fetching state
      const fetchTimeout = setTimeout(() => {
        // Only set if still fetching
        if (get().isFetchingNisab) {
          console.warn('Nisab fetch timed out, resetting state');
          set({ isFetchingNisab: false, fetchError: 'Request timed out' });
        }
      }, 15000); // 15 second timeout
      
      try {
        // Attempt to fetch from API
        console.log(`Fetching nisab data from API for currency ${actualCurrency}`);
        const result = await fetchNisabData(actualCurrency, true); // Force refresh
        
        // Clear the timeout since we got a response
        clearTimeout(fetchTimeout);
        
        // If we've already reset the fetching state due to timeout, don't continue
        if (!get().isFetchingNisab) {
          console.warn('Fetch completed after timeout was triggered, skipping update');
          return false;
        }
        
        console.log('Successfully fetched nisab data:', result);
        
        // Update the store with the fetched data
        set({ 
          nisabData: {
            threshold: result.nisabThreshold,
            silverPrice: result.silverPrice,
            lastUpdated: result.timestamp,
            source: result.source,
            currency: result.currency
          },
          fetchError: undefined,
          isFetchingNisab: false
        });
        
        // If the API provided metal prices, update them in the store
        if (result.metalPrices) {
          console.log('Updating metal prices from API response');
          state.setMetalPrices({
            gold: result.metalPrices.gold,
            silver: result.metalPrices.silver,
            lastUpdated: new Date(result.timestamp),
            isCache: false,
            currency: result.currency
          });
        }
        
        // Notify components about the update
        if (typeof window !== 'undefined') {
          console.log('Emitting nisab-updated event');
          window.dispatchEvent(new CustomEvent('nisab-updated', {
            detail: { 
              currency: result.currency,
              source: 'api',
              threshold: result.nisabThreshold
            }
          }));
        }
        
        return true; // Success!
      } catch (fetchError: any) {
        // Clear the timeout
        clearTimeout(fetchTimeout);
        
        // Handle fetch error with fallback logic
        console.error('Failed to fetch nisab data from API:', fetchError);
        
        // Try to use a fallback calculation based on existing metal prices or constants
        console.log('Using fallback calculation for nisab');
        
        // Determine the best available prices to use
        const goldPrice = state.metalPrices?.gold || 65; // Default fallback gold price
        const silverPrice = state.metalPrices?.silver || 0.85; // Default fallback silver price
        
        // Calculate nisab threshold
        const nisabThreshold = calculateNisabThreshold(goldPrice, silverPrice);
        
        // Create a fallback result
        const fallbackData = {
          threshold: nisabThreshold,
          silverPrice: silverPrice,
          lastUpdated: new Date().toISOString(),
          source: 'fallback-calculation',
          currency: actualCurrency
        };
        
        // Update the store with fallback data
        set({ 
          nisabData: fallbackData,
          fetchError: 'Failed to fetch nisab data from API, using fallback calculation',
          isFetchingNisab: false
        });
        
        console.log('Updated nisab with fallback data:', fallbackData);
        
        // Notify components about the fallback update
        if (typeof window !== 'undefined') {
          console.log('Emitting nisab-updated event (fallback)');
          window.dispatchEvent(new CustomEvent('nisab-updated', {
            detail: { 
              currency: actualCurrency,
              source: 'fallback',
              threshold: nisabThreshold
            }
          }));
        }
        
        // Still return true since we handled the error with a valid fallback
        return true;
      }
    } catch (error: any) {
      console.error('Critical error in nisab refresh:', error);
      
      // Always reset fetching state
      set({ 
        isFetchingNisab: false, 
        fetchError: error.message || 'Failed to refresh nisab data'
      });
      
      return false; // Return failure
    }
  },

  // Get nisab status
  getNisabStatus: () => {
    const state = get();
    const nisabData = state.nisabData;
    const currency = state.currency || 'USD';
    
    // Default values
    const defaultStatus = {
      meetsNisab: false,
      totalValue: 0,
      nisabValue: 0,
      thresholds: {
        gold: 0,
        silver: 0
      },
      currency
    };
    
    if (!nisabData) return defaultStatus;
    
    // Calculate total zakatable value using available getters
    // Ensure we handle potential complex return types by extracting only the numeric values we need
    const totalCash = typeof state.getTotalZakatableCash === 'function' 
      ? state.getTotalZakatableCash() : 0;
      
    // Some getters might return objects instead of numbers, handle both cases
    const metalsZakatable = typeof state.getTotalZakatableMetals === 'function'
      ? state.getTotalZakatableMetals()
      : 0;
    const totalMetals = typeof metalsZakatable === 'number'
      ? metalsZakatable
      : (metalsZakatable && typeof metalsZakatable === 'object' && 'total' in metalsZakatable)
        ? (metalsZakatable as any).total
        : 0;
      
    const totalStocks = typeof state.getTotalZakatableStocks === 'function'
      ? state.getTotalZakatableStocks()
      : 0;
    
    // Use appropriate getters based on what's available in the state
    const totalRetirement = typeof state.getRetirementTotal === 'function'
      ? state.getRetirementTotal()
      : 0;
      
    const totalRealEstate = typeof state.getRealEstateTotal === 'function'
      ? state.getRealEstateTotal()
      : 0;
      
    const totalCrypto = typeof state.getTotalZakatableCrypto === 'function'
      ? state.getTotalZakatableCrypto()
      : 0;
    
    // Sum all the assets for total value, ensuring we only add numbers
    const totalValue = totalCash + totalMetals + totalStocks + totalRetirement + totalRealEstate + totalCrypto;
    
    // Determine if meets nisab
    const meetsNisab = totalValue >= nisabData.threshold;
    
    // Calculate gold and silver thresholds
    const goldPrice = state.metalPrices?.gold || 0;
    const silverPrice = state.metalPrices?.silver || nisabData.silverPrice || 0;
    
    const goldThreshold = NISAB.GOLD.GRAMS * goldPrice;
    const silverThreshold = NISAB.SILVER.GRAMS * silverPrice;
    
    return {
      meetsNisab,
      totalValue,
      nisabValue: nisabData.threshold,
      thresholds: {
        gold: goldThreshold,
        silver: silverThreshold
      },
      currency: nisabData.currency || currency
    };
  },

  // Simplified check if meets nisab
  meetsNisab: () => {
    const status = get().getNisabStatus();
    return status.meetsNisab;
  }
}) 