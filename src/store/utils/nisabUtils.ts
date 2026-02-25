import { NISAB } from '../constants'
// Import the currency conversion utility
import { convertCurrency } from '../../app/api/utils/currency'
import { NisabData } from '../types';
import { DEFAULT_METAL_PRICES } from '@/lib/constants/metals'
import { FALLBACK_RATES, getFallbackRate as getCanonicalFallbackRate } from '@/lib/constants/currency'
import { IS_REPLIT_CLIENT as IS_REPLIT } from '@/lib/utils/environment'

// Use canonical fallback metal prices
export const OFFLINE_FALLBACK_PRICES = {
  gold: DEFAULT_METAL_PRICES.gold,
  silver: DEFAULT_METAL_PRICES.silver,
  lastUpdated: new Date().toISOString(),
  currency: 'USD', // Explicitly mark these as USD values
};

// Maximum number of consecutive fetch errors before considering the API as unavailable
const MAX_CONSECUTIVE_FAILURES = 5;

// Keep track of consecutive failures to trigger more aggressive fallback
let consecutiveFailures = 0;

// Core calculation function for nisab threshold
export function calculateNisabThreshold(goldPrice: number, silverPrice: number): number {
  // Validate inputs to prevent NaN or negative values
  const validGoldPrice = Number.isFinite(goldPrice) && goldPrice > 0 ? goldPrice : OFFLINE_FALLBACK_PRICES.gold;
  const validSilverPrice = Number.isFinite(silverPrice) && silverPrice > 0 ? silverPrice : OFFLINE_FALLBACK_PRICES.silver;

  // Log validation issues for debugging
  if (validGoldPrice !== goldPrice) {
    console.warn(`Invalid gold price (${goldPrice}) provided to calculateNisabThreshold, using fallback: ${validGoldPrice}`);
  }
  if (validSilverPrice !== silverPrice) {
    console.warn(`Invalid silver price (${silverPrice}) provided to calculateNisabThreshold, using fallback: ${validSilverPrice}`);
  }

  // Calculate thresholds with validated prices
  const goldNisabThreshold = validGoldPrice * NISAB.GOLD.GRAMS;
  const silverNisabThreshold = validSilverPrice * NISAB.SILVER.GRAMS;

  // Ensure the result is a valid number
  const result = Math.min(goldNisabThreshold, silverNisabThreshold);

  // Final safety check to prevent returning NaN or Infinity
  if (!Number.isFinite(result) || result <= 0) {
    console.error('Nisab calculation resulted in invalid value, using fallback calculation');
    // Use fallback calculation as last resort
    return OFFLINE_FALLBACK_PRICES.silver * NISAB.SILVER.GRAMS;
  }

  return result;
}

// Create a local cache of successful nisab fetches to use when API fails
const nisabLocalCache: { data: NisabData | null, lastUpdated: number } = { data: null, lastUpdated: 0 };

// Function to get a fallback exchange rate when API fails
export function getFallbackExchangeRate(from: string, to: string): number | null {
  return getCanonicalFallbackRate(from, to);
}

// Fetch nisab data from API with retry logic
export async function fetchNisabData(currency: string, forceRefresh = false) {
  const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';
  const MAX_RETRIES = 3;

  // If we've had too many consecutive failures, go directly to fallback
  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES && !forceRefresh) {
    console.warn(`Too many consecutive API failures (${consecutiveFailures}), using fallback without trying API`);

    // Try to use local cache first if available
    if (nisabLocalCache.data && (Date.now() - nisabLocalCache.lastUpdated < 24 * 60 * 60 * 1000)) {
      console.log('Using nisab local cache due to API unavailability');
      return nisabLocalCache.data;
    }

    return getOfflineFallbackNisabData({ currency });
  }

  const fetchWithRetry = async (retryCount = 0): Promise<NisabData> => {
    try {
      // REPLIT environment special handling for offline
      if (IS_REPLIT && retryCount > 0) {
        console.warn('Running on Replit with previous fetch failures, using offline fallback prices');

        // Calculate nisab thresholds using fallback prices
        const goldNisabThreshold = OFFLINE_FALLBACK_PRICES.gold * NISAB.GOLD.GRAMS;
        const silverNisabThreshold = OFFLINE_FALLBACK_PRICES.silver * NISAB.SILVER.GRAMS;
        const nisabThreshold = Math.min(goldNisabThreshold, silverNisabThreshold);

        return {
          nisabThreshold,
          silverPrice: OFFLINE_FALLBACK_PRICES.silver,
          timestamp: OFFLINE_FALLBACK_PRICES.lastUpdated,
          source: 'offline-fallback',
          currency,
          metalPrices: {
            gold: OFFLINE_FALLBACK_PRICES.gold,
            silver: OFFLINE_FALLBACK_PRICES.silver
          }
        };
      }

      // Construct API URL with refresh parameter if needed
      const refreshParam = forceRefresh ? '&refresh=true' : '';
      const apiUrl = `${BASE_URL}/api/nisab?currency=${encodeURIComponent(currency)}&metal=silver${refreshParam}`;

      // Set timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        apiUrl,
        {
          signal: controller.signal,
          cache: forceRefresh ? 'no-store' : 'default',
          headers: forceRefresh ? {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          } : undefined
        }
      );

      // Clear the timeout
      clearTimeout(timeoutId);

      if (!response.ok) {
        consecutiveFailures++;
        throw new Error(`Failed to fetch nisab data: ${response.status}`);
      }

      // Parse JSON with proper error handling
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        consecutiveFailures++;
        throw new Error(`JSON parse error: ${jsonError}`);
      }

      // Validate and extract needed data
      if (typeof data !== 'object' || data === null || typeof data.nisabThreshold !== 'number') {
        consecutiveFailures++;
        throw new Error('Invalid nisab data received from API');
      }

      // Extract metal prices if available
      let metalPrices = null;
      if (data.metadata?.calculatedThresholds) {
        const { gold, silver } = data.metadata.calculatedThresholds;
        if (gold?.price > 0 && silver?.price > 0) {
          metalPrices = {
            gold: gold.price,
            silver: silver.price
          };
        }
      }

      // Check if this is a fallback response due to API errors
      if (data.source && data.source.includes('fallback')) {
        console.warn(`Received fallback response from API: ${data.source}, reason: ${data.errorReason || 'unknown'}`);
        consecutiveFailures++;
      } else {
        // Reset consecutive failures counter on success
        consecutiveFailures = 0;

        // Update local cache with successful response
        nisabLocalCache.data = {
          nisabThreshold: data.nisabThreshold,
          silverPrice: data.metadata?.calculatedThresholds?.silver?.price || 0,
          timestamp: data.timestamp || new Date().toISOString(),
          source: 'api-cache',
          currency: data.currency,
          metalPrices: metalPrices || undefined
        };
        nisabLocalCache.lastUpdated = Date.now();
      }

      return {
        nisabThreshold: data.nisabThreshold,
        silverPrice: data.metadata?.calculatedThresholds?.silver?.price || 0,
        timestamp: data.timestamp || new Date().toISOString(),
        source: data.source || 'api',
        currency: data.currency,
        metalPrices: metalPrices || undefined
      };

    } catch (error: unknown) {
      // Increment consecutive failures counter
      consecutiveFailures++;

      // Handle retries for network errors
      if (retryCount < MAX_RETRIES) {
        const isNetworkError =
          (error instanceof Error) && (
            (error.name === 'TypeError') ||
            error.name === 'AbortError' ||
            error.message.includes('API endpoint not found') ||
            error.message.includes('Failed to fetch'));

        if (isNetworkError) {
          console.warn(`Network error fetching nisab data, retrying (${retryCount + 1}/${MAX_RETRIES})...`);

          // Wait with exponential backoff
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));

          return fetchWithRetry(retryCount + 1);
        }
      }

      // Try to use local cache first if available
      if (nisabLocalCache.data && (Date.now() - nisabLocalCache.lastUpdated < 24 * 60 * 60 * 1000)) {
        console.log('Error fetching nisab, using local cache');
        return nisabLocalCache.data;
      }

      // For Replit environment, use fallback values
      if (IS_REPLIT) {
        return {
          nisabThreshold: calculateNisabThreshold(OFFLINE_FALLBACK_PRICES.gold, OFFLINE_FALLBACK_PRICES.silver),
          silverPrice: OFFLINE_FALLBACK_PRICES.silver,
          timestamp: OFFLINE_FALLBACK_PRICES.lastUpdated,
          source: 'replit-fallback',
          currency,
          metalPrices: {
            gold: OFFLINE_FALLBACK_PRICES.gold,
            silver: OFFLINE_FALLBACK_PRICES.silver
          }
        };
      }

      // If we've exhausted retries, use offline fallback
      return getOfflineFallbackNisabData({ currency });
    }
  };

  // Start the fetch with retry logic
  return fetchWithRetry();
}

// Get fallback nisab data when API is unavailable
export async function getOfflineFallbackNisabData(state: any, customCurrency?: string): Promise<NisabData> {
  const currency = customCurrency || state.currency || state.metalPrices?.currency || 'USD';
  const fallbackCurrency = OFFLINE_FALLBACK_PRICES.currency; // 'USD'

  try {
    // Detect if this might be happening during a page refresh
    const isPageRefresh = typeof window !== 'undefined' && !document.hasFocus();

    // Start with fallback prices
    let goldPrice = OFFLINE_FALLBACK_PRICES.gold; // Always start with base fallback price
    let silverPrice = OFFLINE_FALLBACK_PRICES.silver; // Always start with base fallback price

    // Log what's happening for debugging
    console.log(`getOfflineFallbackNisabData called with currency ${currency}, possible page refresh: ${isPageRefresh}`, {
      stateCurrency: state.currency,
      metalPricesCurrency: state.metalPrices?.currency,
      fallbackCurrency
    });

    // Only convert if the currencies are different
    if (currency !== fallbackCurrency) {
      try {
        // Always attempt conversion for non-USD currencies, regardless of refresh state
        console.log(`Converting fallback prices from ${fallbackCurrency} to ${currency}`);

        // Create a safe conversion function that won't throw
        const safeConvert = async (amount: number, from: string, to: string): Promise<number> => {
          try {
            // Attempt the conversion
            return await convertCurrency(amount, from, to);
          } catch (conversionError) {
            // Log error but don't break the flow
            console.error(`Error converting ${amount} from ${from} to ${to}:`, conversionError);

            // Use our hardcoded fallback rates if available
            const fallbackRate = getFallbackExchangeRate(from, to);
            if (fallbackRate !== null) {
              console.log(`Using hardcoded fallback rate for ${from} to ${to}: ${fallbackRate}`);
              return amount * fallbackRate;
            }

            // Use canonical fallback rates via FALLBACK_RATES
            const canonicalRate = getCanonicalFallbackRate(from, to);
            if (canonicalRate !== null) {
              console.log(`Using canonical fallback rate for ${to}: ${canonicalRate}`);
              return amount * canonicalRate;
            }

            // If all else fails, use unconverted amount but log a warning
            console.warn(`Cannot convert ${from} to ${to}, using original amount`);
            return amount;
          }
        };

        // Convert the fallback prices from USD to the selected currency
        goldPrice = await safeConvert(goldPrice, fallbackCurrency, currency);
        silverPrice = await safeConvert(silverPrice, fallbackCurrency, currency);
        console.log(`Converted metal prices from ${fallbackCurrency} to ${currency}:`, { goldPrice, silverPrice });
      } catch (conversionError) {
        console.error('Error in currency conversion block:', conversionError);
        // If conversion fails, log the error but continue with original prices
      }
    }

    // Calculate thresholds with the potentially converted prices
    const threshold = calculateNisabThreshold(goldPrice, silverPrice);

    const result = {
      nisabThreshold: threshold,
      silverPrice,
      timestamp: new Date().toISOString(),
      source: IS_REPLIT ? 'replit-offline' : 'offline-fallback',
      currency,
      metalPrices: {
        gold: goldPrice,
        silver: silverPrice
      }
    };

    console.log(`Fallback nisab data calculated for ${currency}:`, result);
    return result;
  } catch (error) {
    console.error('Error in getOfflineFallbackNisabData:', error);
    // If all else fails, return unconverted values but log the error
    const goldPrice = OFFLINE_FALLBACK_PRICES.gold;
    const silverPrice = OFFLINE_FALLBACK_PRICES.silver;
    const threshold = calculateNisabThreshold(goldPrice, silverPrice);

    return {
      nisabThreshold: threshold,
      silverPrice,
      timestamp: new Date().toISOString(),
      source: 'offline-fallback-error',
      currency, // Still return the requested currency
      metalPrices: {
        gold: goldPrice,
        silver: silverPrice
      }
    };
  }
} 