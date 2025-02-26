import { StateCreator } from 'zustand'
import { ZakatState } from '../types'
import { NISAB } from '../constants'

// Add a debounce mechanism to prevent multiple rapid fetch calls
let lastFetchTimestamp = 0;
const FETCH_DEBOUNCE_MS = 2000; // 2 seconds debounce
const MAX_RETRIES = 3; // Increase maximum number of retry attempts
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

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
> = (set, get) => ({
  // Initial state
  nisabData: undefined,
  isFetchingNisab: false,
  fetchError: undefined,

  // Actions
  fetchNisabData: async () => {
    // Add debounce and lock mechanism
    const now = Date.now();
    const state = get();
    
    // Already fetching - don't start another request
    if (state.isFetchingNisab) {
      console.log('Nisab data fetch already in progress, skipping duplicate request');
      return;
    }
    
    // Debounce frequent calls
    if (now - lastFetchTimestamp < FETCH_DEBOUNCE_MS) {
      console.log(`Debouncing nisab fetch - last fetch was ${now - lastFetchTimestamp}ms ago`);
      return;
    }
    
    // Set fetching flag and update timestamp
    set({ isFetchingNisab: true, fetchError: undefined });
    lastFetchTimestamp = now;
    
    // Retry mechanism for network issues
    const fetchWithRetry = async (retryCount = 0): Promise<any> => {
      try {
        // Get the current currency from the store
        const currency = state.metalPrices?.currency || 'USD';
        
        console.log(`Fetching nisab data with currency: ${currency} (attempt ${retryCount + 1})`);
        
        // Construct the full URL to ensure we're hitting the right endpoint
        const apiUrl = `${BASE_URL}/api/nisab?currency=${encodeURIComponent(currency)}&metal=silver`;
        console.log(`Full nisab API URL: ${apiUrl}`);
        
        // Add a timeout to the fetch request to avoid hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // Increase timeout to 8 seconds
        
        const response = await fetch(
          apiUrl,
          { signal: controller.signal }
        );
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // Extract status code for more specific error handling
          const status = response.status;
          console.warn(`Nisab API returned non-OK status: ${status}`);
          
          // If we get a 404, it might be temporary since the logs show the API works later
          if (status === 404) {
            throw new Error(`API endpoint not found: ${status}`);
          } else {
            throw new Error(`Failed to fetch nisab data: ${status}`);
          }
        }
        
        // Get the response text first instead of directly parsing as JSON
        const responseText = await response.text();
        
        // Try parsing the response text into JSON with error handling
        try {
          return JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Problematic JSON string:', responseText);
          throw new Error('Invalid JSON received from nisab API');
        }
      } catch (error: any) {
        // Check if we should retry
        if (retryCount < MAX_RETRIES) {
          const isNetworkError = 
            error.name === 'TypeError' && 
            (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) ||
            error.name === 'AbortError' ||
            error.message.includes('API endpoint not found'); // Also retry on 404 errors
            
          if (isNetworkError) {
            console.warn(`Network error fetching nisab data, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
            console.warn(`Error details: ${error.message}`);
            
            // Wait before retrying with exponential backoff
            // Use longer delay for 404 errors since the API might need more time to initialize
            const delayMultiplier = error.message.includes('API endpoint not found') ? 3 : 1;
            const delay = Math.pow(2, retryCount) * 1000 * delayMultiplier; // 1-3s, 2-6s, 4-12s, etc.
            console.log(`Waiting ${delay}ms before retry...`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Retry the fetch
            return fetchWithRetry(retryCount + 1);
          }
        }
        
        // If we've exhausted retries or it's not a network error, rethrow
        throw error;
      }
    };
    
    try {
      // Try to use cached values first if available
      if (state.nisabData && state.nisabData.currency === (state.metalPrices?.currency || 'USD')) {
        console.log('Using cached nisab data while attempting to refresh');
      }
      
      // Use the retry mechanism
      const data = await fetchWithRetry();
      
      console.log('Parsed nisab data:', data);
      
      // Validate the required properties exist
      if (typeof data !== 'object' || data === null) {
        throw new Error('Nisab API returned invalid data (not an object)');
      }
      
      // Get the current currency (might be different from when we started the fetch)
      const currency = state.metalPrices?.currency || 'USD';
      
      // Check if the returned currency matches the requested currency
      if (data.currency !== currency) {
        console.warn(`Nisab API returned data in currency ${data.currency}, but requested ${currency}`);
      }
      
      // Update nisab data with API response, with fallbacks for all fields
      const updatedNisabData = {
        threshold: typeof data.nisabThreshold === 'number' ? data.nisabThreshold : 
                  (NISAB.SILVER.GRAMS * (state.metalPrices?.silver || 0.85)),
        silverPrice: state.metalPrices?.silver || 0.85,
        lastUpdated: data.timestamp || new Date().toISOString(),
        source: data.metadata?.source || 'api',
        currency: data.currency || currency // Store the currency used
      };
      
      set({ 
        nisabData: updatedNisabData,
        fetchError: undefined
      });
      
      // Log the updated data for debugging
      console.log('Successfully updated nisab data:', {
        threshold: updatedNisabData.threshold,
        currency: updatedNisabData.currency,
        requestedCurrency: currency,
        thresholds: data.thresholds || {}
      });
      
      // Also update metalPrices if thresholds are provided in the response
      if (data.thresholds && typeof data.thresholds === 'object' && 
          typeof data.metadata?.calculatedThresholds === 'object') {
        
        const calculatedThresholds = data.metadata.calculatedThresholds;
        
        // Only update metal prices if they contain valid price data
        if (calculatedThresholds.gold?.price > 0 && calculatedThresholds.silver?.price > 0) {
          console.log('Updating metal prices from nisab data:', {
            gold: calculatedThresholds.gold.price,
            silver: calculatedThresholds.silver.price,
            currency: data.currency
          });
          
          state.setMetalPrices({
            gold: calculatedThresholds.gold.price,
            silver: calculatedThresholds.silver.price,
            lastUpdated: new Date(data.timestamp || new Date()),
            isCache: false,
            currency: data.currency || currency
          });
        }
      }
      
    } catch (error: any) {
      // More detailed error handling
      console.error('Failed to fetch nisab data:', error);
      
      // Store the error message
      set({ 
        fetchError: error?.message || 'Unknown error fetching nisab data' 
      });
      
      // Fallback to default values with current currency
      const state = get();
      const currency = state.metalPrices?.currency || 'USD';
      
      // Check if we already have nisab data with the correct currency
      if (state.nisabData && state.nisabData.currency === currency) {
        console.log('Using existing nisab data instead of fallback:', state.nisabData);
        // No need to update nisabData if we already have data in the correct currency
      } else {
        // Fallback to calculated values
        const fallbackData = {
          threshold: NISAB.SILVER.GRAMS * (state.metalPrices?.silver || 0.85),
          silverPrice: state.metalPrices?.silver || 0.85,
          lastUpdated: new Date().toISOString(),
          source: 'fallback',
          currency: currency
        };
        
        set({ nisabData: fallbackData });
        console.log('Using fallback nisab data:', fallbackData);
      }
    } finally {
      // CRITICAL: Clear the fetching flag
      set({ isFetchingNisab: false });
    }
  },

  // Getters
  getNisabStatus: () => {
    const state = get();
    
    // Get the current currency from metal prices
    const currentCurrency = state.metalPrices?.currency || 'USD';
    
    // Get total values from each asset type
    const totalCash = state.getTotalCash();
    const totalMetals = state.getTotalMetals()?.total || 0;
    const totalStocks = state.getTotalStocks();
    const totalRetirement = state.getRetirementTotal();
    const totalRealEstate = state.getRealEstateTotal();
    const totalCrypto = state.getTotalCrypto();

    // Total combined wealth (including all assets)
    const totalValue = totalCash + totalMetals + totalStocks + 
      totalRetirement + totalRealEstate + totalCrypto;
    
    // Get metal prices from the metals slice with fallback values
    const metalPrices = {
      gold: state.metalPrices?.gold || 65.52, // Default gold price
      silver: state.metalPrices?.silver || 0.85, // Default silver price
      currency: currentCurrency
    };
    
    console.log(`Calculating nisab with currency: ${currentCurrency}`, {
      metalPrices,
      totalValue
    });
    
    // Check if we have cached nisab data for this currency
    if (state.nisabData && state.nisabData.currency === currentCurrency) {
      console.log(`Using cached nisab data for ${currentCurrency}:`, state.nisabData);
      
      // Calculate values for both gold and silver
      const silverNisabValue = NISAB.SILVER.GRAMS * metalPrices.silver;
      const goldNisabValue = NISAB.GOLD.GRAMS * metalPrices.gold;
      
      // Use the lower of the two valid nisab values
      let nisabThreshold = Math.min(goldNisabValue, silverNisabValue);
      
      // Add debug logging to see which threshold is being used
      console.log(`Nisab thresholds - Gold: ${goldNisabValue} ${currentCurrency}, Silver: ${silverNisabValue} ${currentCurrency}`);
      console.log(`Using ${goldNisabValue <= silverNisabValue ? 'gold' : 'silver'} based threshold: ${nisabThreshold} ${currentCurrency}`);
      
      // Ensure we have a valid threshold
      if (nisabThreshold <= 0) {
        nisabThreshold = state.nisabData.threshold;
        console.warn(`Invalid calculated threshold, using cached threshold: ${nisabThreshold}`);
      }
      
      return {
        meetsNisab: totalValue >= nisabThreshold,
        totalValue,
        nisabValue: nisabThreshold,
        thresholds: {
          gold: goldNisabValue,
          silver: silverNisabValue
        },
        currency: currentCurrency
      };
    }
    
    // If no cached data or currency mismatch, calculate fresh
    console.log(`Calculating fresh nisab values for ${currentCurrency}`);
    
    // Calculate Nisab thresholds
    const goldNisabValue = NISAB.GOLD.GRAMS * metalPrices.gold;    // 85g * gold price
    const silverNisabValue = NISAB.SILVER.GRAMS * metalPrices.silver;  // 595g * silver price
    
    // Add debug logging to see which threshold is being used
    console.log(`Fresh nisab thresholds - Gold: ${goldNisabValue} ${currentCurrency}, Silver: ${silverNisabValue} ${currentCurrency}`);
    
    // Use the lower of the two valid nisab values
    // If either price is invalid (0 or negative), use the other one
    let nisabThreshold;
    let usedMetal;
    
    if (metalPrices.gold > 0 && metalPrices.silver > 0) {
      if (goldNisabValue <= silverNisabValue) {
        nisabThreshold = goldNisabValue;
        usedMetal = 'gold';
      } else {
        nisabThreshold = silverNisabValue;
        usedMetal = 'silver';
      }
    } else if (metalPrices.gold > 0) {
      nisabThreshold = goldNisabValue;
      usedMetal = 'gold';
    } else {
      nisabThreshold = silverNisabValue;
      usedMetal = 'silver';
    }
    
    console.log(`Using ${usedMetal} based threshold: ${nisabThreshold} ${currentCurrency}`);
    
    // Ensure we have a valid threshold
    if (nisabThreshold <= 0) {
      nisabThreshold = NISAB.SILVER.GRAMS * 0.85; // Fallback to default silver price
      console.warn(`Invalid nisab threshold calculated, using fallback: ${nisabThreshold}`);
    }
    
    // Schedule a fetch only if we have no data and aren't already fetching
    if ((!state.nisabData || state.nisabData.currency !== currentCurrency) && 
        !state.isFetchingNisab && 
        Date.now() - lastFetchTimestamp > FETCH_DEBOUNCE_MS) {
      
      // Call fetchNisabData in the next tick to prevent blocking this calculation
      Promise.resolve().then(() => {
        const fetchNisabData = get().fetchNisabData;
        if (typeof fetchNisabData === 'function') {
          fetchNisabData().catch((error: Error) => 
            console.error('Background nisab data fetch failed:', error)
          );
        }
      });
    }
    
    return {
      meetsNisab: totalValue >= nisabThreshold,
      totalValue,
      nisabValue: nisabThreshold,
      thresholds: {
        gold: goldNisabValue,
        silver: silverNisabValue
      },
      currency: currentCurrency
    };
  },

  meetsNisab: () => {
    const state = get();
    return state.getNisabStatus().meetsNisab;
  }
}) 