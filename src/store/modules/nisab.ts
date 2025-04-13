import { StateCreator } from 'zustand'
import { NisabData, ZakatState } from '../types'
import { NISAB } from '../constants'
import { MetalPrices } from './metals.types'
import { getOfflineFallbackNisabData, calculateNisabThreshold, fetchNisabData } from '../utils/nisabUtils'

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
  gold: 93.98,  // USD per gram (updated to match other fallback values)
  silver: 1.02, // USD per gram (updated to match other fallback values)
  lastUpdated: new Date().toISOString()
};

// ENHANCEMENT: Add a flag to prevent unnecessary API calls when fallback values are sufficient
const SKIP_API_CALLS_IN_DEVELOPMENT = true;

export interface NisabSlice {
  // State
  nisabData?: NisabData
  isFetchingNisab: boolean
  fetchError?: string

  // Actions
  fetchNisabData: () => Promise<void>
  updateNisabWithPrices: (prices: MetalPrices) => boolean
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
  [],
  [],
  NisabSlice
> = (set, get, store) => ({
  // Initial state
  nisabData: undefined,
  isFetchingNisab: false,
  fetchError: undefined,

  // New function to directly update nisab with metal prices
  updateNisabWithPrices: (prices: MetalPrices) => {
    // Validate the prices
    if (!prices || !prices.gold || !prices.silver || !prices.currency) {
      console.error('Invalid metal prices provided to updateNisabWithPrices', prices);
      return false;
    }

    console.log('Directly updating nisab with metal prices:', {
      gold: prices.gold,
      silver: prices.silver,
      currency: prices.currency
    });

    // Calculate the nisab threshold
    const threshold = calculateNisabThreshold(prices.gold, prices.silver);

    // Create the nisab data object
    const calculatedData = {
      nisabThreshold: threshold,
      silverPrice: prices.silver,
      timestamp: prices.lastUpdated instanceof Date
        ? prices.lastUpdated.toISOString()
        : typeof prices.lastUpdated === 'string'
          ? prices.lastUpdated
          : new Date().toISOString(),
      source: 'direct-update-from-prices',
      currency: prices.currency
    };

    // Update the store
    set({
      nisabData: calculatedData,
      isFetchingNisab: false,
      fetchError: undefined
    });

    // Notify components about the update
    if (typeof window !== 'undefined') {
      console.log('Emitting nisab-updated event (direct update)', {
        threshold: threshold,
        currency: prices.currency
      });
      window.dispatchEvent(new CustomEvent('nisab-updated', {
        detail: {
          currency: prices.currency,
          source: 'direct-update',
          threshold: calculatedData.nisabThreshold,
          immediate: true
        }
      }));
    }

    return true;
  },

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
          nisabThreshold: calculateNisabThreshold(state.metalPrices.gold, state.metalPrices.silver),
          silverPrice: state.metalPrices.silver,
          timestamp: state.metalPrices.lastUpdated instanceof Date
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
              threshold: calculatedData.nisabThreshold
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
          nisabThreshold: result.nisabThreshold,
          silverPrice: result.silverPrice,
          timestamp: result.timestamp,
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
      console.error('Failed to fetch nisab data:', error instanceof Error ? error.message : String(error));

      // Get fallback data
      const fallbackData = await getOfflineFallbackNisabData(get());

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

      // Define currencies that need special handling
      const currenciesNeedingSpecialHandling = ['AED', 'INR', 'PKR', 'SAR'];

      // Special handling for currencies that have shown issues with direct conversion
      const needsSpecialHandling = currenciesNeedingSpecialHandling.includes(actualCurrency.toUpperCase());
      if (needsSpecialHandling) {
        console.log(`Special handling for ${actualCurrency} currency detected in forceRefreshNisabForCurrency`);

        // For these currencies, we'll try to use the refreshNisabCalculations utility if available
        try {
          // Use a direct import instead of window.require
          const nisabCalculations = require('../../lib/utils/nisabCalculations');
          if (nisabCalculations && typeof nisabCalculations.refreshNisabCalculations === 'function') {
            console.log(`Using refreshNisabCalculations utility for ${actualCurrency}`);

            // Get current metal prices
            const currentPrices = state.metalPrices || {
              gold: 0,
              silver: 0,
              currency: actualCurrency,
              lastUpdated: new Date()
            };

            // Call the utility function
            const result = await nisabCalculations.refreshNisabCalculations(
              currentPrices,
              actualCurrency
            );

            if (result) {
              console.log(`Successfully refreshed nisab for ${actualCurrency} using utility:`, result);

              // Update the store with the calculated data
              set({
                nisabData: {
                  nisabThreshold: result.nisabValue,
                  silverPrice: currentPrices.silver,
                  timestamp: new Date().toISOString(),
                  source: `${actualCurrency.toLowerCase()}-special-refresh`,
                  currency: actualCurrency
                },
                fetchError: undefined,
                isFetchingNisab: false
              });

              // Notify components about the update
              if (typeof window !== 'undefined') {
                console.log(`Emitting nisab-updated event (${actualCurrency} special)`);
                window.dispatchEvent(new CustomEvent('nisab-updated', {
                  detail: {
                    currency: actualCurrency,
                    source: `${actualCurrency.toLowerCase()}-special`,
                    threshold: result.nisabValue,
                    immediate: true
                  }
                }));
              }

              return true;
            }
          }
        } catch (utilityError) {
          console.warn(`Failed to use refreshNisabCalculations utility for ${actualCurrency}:`, utilityError);
          // Continue with standard refresh approach
        }
      }

      // IMPORTANT: Check if we have metal prices in the correct currency
      // This is the key part that needs to be fixed for instant updates
      if (state.metalPrices &&
        state.metalPrices.currency === actualCurrency &&
        state.metalPrices.gold > 0 &&
        state.metalPrices.silver > 0) {

        console.log('Using existing metal prices for nisab calculation', {
          gold: state.metalPrices.gold,
          silver: state.metalPrices.silver,
          currency: state.metalPrices.currency
        });

        // Calculate the nisab threshold immediately
        const threshold = calculateNisabThreshold(state.metalPrices.gold, state.metalPrices.silver);

        const calculatedData = {
          nisabThreshold: threshold,
          silverPrice: state.metalPrices.silver,
          timestamp: state.metalPrices.lastUpdated instanceof Date
            ? state.metalPrices.lastUpdated.toISOString()
            : typeof state.metalPrices.lastUpdated === 'string'
              ? state.metalPrices.lastUpdated
              : new Date().toISOString(),
          source: 'calculated-from-prices',
          currency: actualCurrency
        };

        // Update the state immediately
        set({
          nisabData: calculatedData,
          isFetchingNisab: false
        });

        // Notify components about the calculated update
        if (typeof window !== 'undefined') {
          console.log('Emitting nisab-updated event (calculated)', {
            threshold: threshold,
            currency: actualCurrency
          });
          window.dispatchEvent(new CustomEvent('nisab-updated', {
            detail: {
              currency: actualCurrency,
              source: 'calculated',
              threshold: calculatedData.nisabThreshold,
              immediate: true // Flag to indicate this is an immediate update
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
            nisabThreshold: result.nisabThreshold,
            silverPrice: result.silverPrice,
            timestamp: result.timestamp,
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
        console.error('Failed to fetch nisab data from API:', fetchError instanceof Error ? fetchError.message : String(fetchError));

        // Try to use a fallback calculation based on existing metal prices or constants
        console.log('Using fallback calculation for nisab');

        // Determine the best available prices to use
        const goldPrice = state.metalPrices?.gold || 65; // Default fallback gold price
        const silverPrice = state.metalPrices?.silver || 0.85; // Default fallback silver price

        // Calculate nisab threshold
        const nisabThreshold = calculateNisabThreshold(goldPrice, silverPrice);

        // Create a fallback result
        const fallbackData = {
          nisabThreshold: nisabThreshold,
          silverPrice: silverPrice,
          timestamp: new Date().toISOString(),
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
      console.error('Critical error in nisab refresh:', error instanceof Error ? error.message : String(error));

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
    const metalsZakatable = typeof state.getMetalsZakatable === 'function'
      ? state.getMetalsZakatable()
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
    const meetsNisab = totalValue >= nisabData.nisabThreshold;

    // Calculate gold and silver thresholds
    const goldPrice = state.metalPrices?.gold || 0;
    const silverPrice = state.metalPrices?.silver || nisabData.silverPrice || 0;

    const goldThreshold = NISAB.GOLD.GRAMS * goldPrice;
    const silverThreshold = NISAB.SILVER.GRAMS * silverPrice;

    return {
      meetsNisab,
      totalValue,
      nisabValue: nisabData.nisabThreshold,
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