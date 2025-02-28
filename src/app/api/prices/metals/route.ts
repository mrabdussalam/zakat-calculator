import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { CacheValidationService, MetalPriceEntry } from '@/lib/services/cacheValidation'
import { CurrencyConversionService } from '@/lib/services/currencyConversion'

const CONVERSION_RATES = {
  TROY_OUNCE_TO_GRAMS: 31.1034768 // 1 troy ounce = 31.1034768 grams
}

// Global memory cache for prices in different currencies
// This ensures we always have some value, even during transitions
interface MemoryCacheEntry {
  prices: typeof FALLBACK_PRICES | null;
  timestamp: number;
}

// Initialize global memory cache with fallback values for USD
const globalMemoryCache: Record<string, MemoryCacheEntry> = {
  'USD': {
    prices: null, // Reset to null to force refresh on first request
    timestamp: 0  // Set timestamp to 0 to force refresh
  }
};

// Memory cache lifetime (30 minutes)
const MEMORY_CACHE_DURATION = 30 * 60 * 1000;

// Redefine MetalPrice with a proper structure
interface MetalPrice {
  price: number;
  currency: string;
  timestamp: string;
}

// Define proper response type
// Used for internal typing
interface MetalPrices {
  gold: MetalPrice;
  silver: MetalPrice;
  isCache: boolean;
  source: string;
}

// Add proper typed version of the price sources
interface PriceSource {
  name: string;
  url: string;
  parser: (data: unknown) => { gold: number; silver: number };
}

// Price sources configuration with proper types
const PRICE_SOURCES: PriceSource[] = [
  {
    name: 'goldprice',
    url: 'https://data-asg.goldprice.org/dbXRates/USD',
    parser: (data: unknown) => {
      const typedData = data as { items: Array<{ xauPrice: number; xagPrice: number }> };
      // Check if items exist and has at least one element
      if (typedData.items && typedData.items.length > 0) {
        return {
          gold: typedData.items[0].xauPrice / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS,
          silver: typedData.items[0].xagPrice / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS
        };
      }
      // Return default values if data is invalid
      return { gold: 0, silver: 0 };
    }
  },
  {
    name: 'frankfurter',
    url: 'https://api.frankfurter.app/latest?from=XAU&to=USD,XAG',
    parser: (data: unknown) => {
      const typedData = data as { rates: { USD: number; XAG: number } };
      // Check if rates exist to prevent undefined errors
      if (typedData.rates && typeof typedData.rates.USD === 'number' && typeof typedData.rates.XAG === 'number') {
        return {
          gold: typedData.rates.USD / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS,
          silver: (typedData.rates.USD / typedData.rates.XAG) / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS
        };
      }
      // Return default values if data is invalid
      return { gold: 0, silver: 0 };
    }
  },
  {
    name: 'metals-api',
    url: 'https://api.metals.live/v1/spot/gold,silver',
    parser: (data: unknown) => {
      const typedData = data as Array<{ metal: string; price: number }>;

      // Safe handling for finding gold/silver data
      const goldData = typedData.find(m => m.metal === 'gold');
      const silverData = typedData.find(m => m.metal === 'silver');

      const goldPrice = goldData && typeof goldData.price === 'number'
        ? goldData.price / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS
        : 0;

      const silverPrice = silverData && typeof silverData.price === 'number'
        ? silverData.price / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS
        : 0;

      return {
        gold: goldPrice,
        silver: silverPrice
      };
    }
  }
];

// Make these available to other files
export const COUNTER_FILE = path.join(process.cwd(), 'data', 'metal-api-counter.json')

export interface RequestCounter {
  count: number
  month: number
  year: number
}

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true })
}

// Initialize or read counter
export function getRequestCounter(): RequestCounter {
  try {
    if (fs.existsSync(COUNTER_FILE)) {
      const data = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8'))
      const now = new Date()

      // Reset counter if it's a new month
      if (data.month !== now.getMonth() || data.year !== now.getFullYear()) {
        const newCounter = {
          count: 0,
          month: now.getMonth(),
          year: now.getFullYear()
        }
        fs.writeFileSync(COUNTER_FILE, JSON.stringify(newCounter))
        return newCounter
      }

      return data
    }
  } catch (error) {
    console.error('Error reading counter file:', error)
  }

  // Default counter if file doesn't exist or error occurs
  const now = new Date()
  return {
    count: 0,
    month: now.getMonth(),
    year: now.getFullYear()
  }
}

// Default fallback prices - updated to recent market values
const FALLBACK_PRICES = {
  gold: 93.98,  // USD per gram (updated from goldprice.org)
  silver: 1.02, // USD per gram (updated from goldprice.org)
  lastUpdated: new Date().toISOString(),
  isCache: true,
  source: 'fallback',
  currency: 'USD',  // Add explicit currency
  timestamp: CacheValidationService.getSafeTimestamp() // Use safe timestamp
}

// Helper function to ensure timestamps are never future-dated
function getSafeTimestamp(): number {
  // Use the CacheValidationService to get a safe timestamp
  return CacheValidationService.getSafeTimestamp();
}

// Create fallback file if it doesn't exist
function ensureFallbackFile() {
  const fallbackFilePath = path.join(process.cwd(), 'data', 'metal-prices-fallback.json');
  try {
    if (!fs.existsSync(fallbackFilePath)) {
      // Use a safe timestamp when creating the fallback file
      const safeData = {
        ...FALLBACK_PRICES,
        timestamp: getSafeTimestamp()
      };
      fs.writeFileSync(fallbackFilePath, JSON.stringify(safeData), 'utf8');
      console.log('Created fallback metal prices file');
    }
  } catch (error) {
    console.error('Error creating fallback file:', error);
  }
}

// Try to ensure fallback file exists
ensureFallbackFile();

// Function to load fallback prices from file
function loadFallbackPrices() {
  const fallbackFilePath = path.join(process.cwd(), 'data', 'metal-prices-fallback.json');
  try {
    if (fs.existsSync(fallbackFilePath)) {
      const data = JSON.parse(fs.readFileSync(fallbackFilePath, 'utf8'));

      // Validate the fallback data using CacheValidationService
      const fallbackData = {
        ...data,
        isCache: true,
        source: 'file-fallback',
        timestamp: getSafeTimestamp() // Always use a safe timestamp
      };

      // Check if the fallback data is valid
      const validation = CacheValidationService.validateMetalPrices(fallbackData as MetalPriceEntry, {
        allowFutureDates: false,
        logPrefix: 'FallbackMetalPrices',
        strictValidation: false
      });

      if (validation.isValid) {
        return fallbackData;
      } else {
        console.warn(`Fallback file data is invalid: ${validation.reason}`);
        // If fallback file is invalid, use hardcoded fallback with safe timestamp
        return {
          ...FALLBACK_PRICES,
          timestamp: getSafeTimestamp() // Use safe timestamp
        };
      }
    }
  } catch (error) {
    console.error('Error loading fallback file:', error);
  }
  // Use hardcoded fallback with safe timestamp
  return {
    ...FALLBACK_PRICES,
    timestamp: getSafeTimestamp() // Use safe timestamp
  };
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

// In-memory cache
let priceCache = {
  prices: null as typeof FALLBACK_PRICES | null,
  lastUpdated: null as Date | null
}

function validatePrices(prices: { gold: number; silver: number }) {
  if (!prices || typeof prices !== 'object') return false;
  if (typeof prices.gold !== 'number' || typeof prices.silver !== 'number') return false;
  if (prices.gold <= 0 || prices.silver <= 0) return false;
  return true;
}

async function fetchMetalPrices() {
  // Check cache first
  const now = new Date()
  const currentTimestamp = getSafeTimestamp(); // Use safe timestamp

  if (priceCache.prices && priceCache.lastUpdated) {
    // Validate the cache using CacheValidationService
    const cacheEntry = {
      ...priceCache.prices,
      timestamp: priceCache.lastUpdated.getTime()
    };

    const validation = CacheValidationService.validateMetalPrices(cacheEntry as MetalPriceEntry, {
      maxAge: CACHE_DURATION,
      allowFutureDates: false,
      logPrefix: 'MetalPriceCache',
      strictValidation: false
    });

    if (validation.isValid) {
      console.log('Using validated price cache');
      return {
        ...priceCache.prices,
        isCache: true
      };
    } else {
      console.warn(`Cache validation failed: ${validation.reason}`);
    }
  }

  // Try each source in sequence until we get valid prices
  for (const source of PRICE_SOURCES) {
    try {
      console.log(`Attempting to fetch prices from ${source.name}...`)
      const response = await fetch(source.url)

      if (!response.ok) {
        console.warn(`${source.name} returned status ${response.status}`)
        continue
      }

      const data = await response.json()
      const parsedPrices = source.parser(data)

      // Validate the parsed prices
      if (!validatePrices(parsedPrices)) {
        console.warn(`${source.name} returned invalid prices:`, parsedPrices)
        continue
      }

      // At this point, we know prices are valid and have gold and silver properties
      // Create result with safe timestamp (never future-dated)
      const result = {
        gold: Number((parsedPrices.gold || 0).toFixed(2)),
        silver: Number((parsedPrices.silver || 0).toFixed(2)),
        lastUpdated: now.toISOString(),
        isCache: false,
        source: source.name,
        currency: 'USD', // All prices are in USD by default
        timestamp: getSafeTimestamp() // Use safe timestamp
      }

      // Validate the result using CacheValidationService
      const validation = CacheValidationService.validateMetalPrices(result as MetalPriceEntry, {
        allowFutureDates: false,
        logPrefix: 'FetchedMetalPrices',
        strictValidation: true
      });

      if (!validation.isValid) {
        console.warn(`Fetched prices from ${source.name} failed validation: ${validation.reason}`);
        continue;
      }

      // Update cache with valid prices
      priceCache = {
        prices: result,
        lastUpdated: now
      }

      // Also update global memory cache for USD
      globalMemoryCache['USD'] = {
        prices: result,
        timestamp: getSafeTimestamp() // Use safe timestamp
      };

      return result
    } catch (error) {
      console.error(`Error fetching from ${source.name}:`, error)
      continue
    }
  }

  // If all sources fail, use cache if available and valid
  if (priceCache.prices && priceCache.lastUpdated) {
    console.warn('All price sources failed, using existing cache');

    // Validate the cache again, but with relaxed constraints (allow expired cache in emergency)
    const cacheEntry = {
      ...priceCache.prices,
      timestamp: priceCache.lastUpdated.getTime()
    };

    const validation = CacheValidationService.validateMetalPrices(cacheEntry as MetalPriceEntry, {
      maxAge: 24 * 60 * 60 * 1000, // Allow up to 24 hours old in emergency
      allowFutureDates: false, // Still don't allow future dates
      logPrefix: 'EmergencyMetalPriceCache',
      strictValidation: false // Relaxed validation in emergency
    });

    if (validation.isValid) {
      return {
        ...priceCache.prices,
        isCache: true,
        cacheSource: 'emergency'
      };
    } else {
      console.warn(`Emergency cache validation failed: ${validation.reason}`);
    }
  }

  // If no cache available or cache is invalid, use emergency fallback values from file
  console.error('All price sources failed and no valid cache available, using fallback values');
  return loadFallbackPrices();
}

// Base response format used for internal typing
interface MetalPricesData {
  gold: {
    price: number;
    currency: string;
    timestamp: string;
  };
  silver: {
    price: number;
    currency: string;
    timestamp: string;
  };
}

// Replace the any types with specific types where possible
export async function GET(request: Request): Promise<Response> {
  try {
    // Parse the URL to get the currency parameter
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency') || 'USD';
    const forceRefresh = searchParams.get('refresh') === 'true';

    console.log(`Metal prices requested in currency: ${currency}, forceRefresh: ${forceRefresh}`);

    // IMPORTANT: Always fetch prices in USD first
    // This is the key change to fix the currency issues

    // Get base metal prices (always in USD)
    const usdPrices = await fetchMetalPrices();

    // If USD is requested, return directly
    if (currency === 'USD') {
      // Update memory cache for USD with safe timestamp
      globalMemoryCache['USD'] = {
        prices: {
          ...usdPrices,
          timestamp: getSafeTimestamp() // Use safe timestamp
        },
        timestamp: getSafeTimestamp() // Use safe timestamp
      };

      return NextResponse.json({
        ...usdPrices,
        currency: 'USD',
        timestamp: getSafeTimestamp() // Use safe timestamp
      });
    }

    // For non-USD currencies, use our CurrencyConversionService for conversion
    // This ensures consistent conversion logic across the application
    try {
      // Convert gold and silver prices using the service
      const goldPriceInTargetCurrency = CurrencyConversionService.convert(
        usdPrices.gold,
        'USD',
        currency,
        {
          logPrefix: 'API-MetalPrices-Gold',
          fallbackToHardcoded: true,
          validateResult: true
        }
      );

      const silverPriceInTargetCurrency = CurrencyConversionService.convert(
        usdPrices.silver,
        'USD',
        currency,
        {
          logPrefix: 'API-MetalPrices-Silver',
          fallbackToHardcoded: true,
          validateResult: true
        }
      );

      // Get the exchange rate used
      const exchangeRate = goldPriceInTargetCurrency / usdPrices.gold;

      console.log(`Converted metal prices using CurrencyConversionService:`, {
        fromUSD: { gold: usdPrices.gold, silver: usdPrices.silver },
        toTarget: { gold: goldPriceInTargetCurrency, silver: silverPriceInTargetCurrency },
        currency,
        exchangeRate
      });

      // Create the converted prices object
      const convertedPrices = {
        gold: Number(goldPriceInTargetCurrency.toFixed(2)),
        silver: Number(silverPriceInTargetCurrency.toFixed(2)),
        lastUpdated: usdPrices.lastUpdated,
        isCache: usdPrices.isCache,
        source: usdPrices.source,
        currency: currency,
        exchangeRate: Number(exchangeRate.toFixed(4)),
        // IMPORTANT: Always include the original USD prices
        goldUSD: Number(usdPrices.gold.toFixed(2)),
        silverUSD: Number(usdPrices.silver.toFixed(2)),
        timestamp: getSafeTimestamp() // Use safe timestamp
      };

      // Update memory cache for this currency
      globalMemoryCache[currency] = {
        prices: convertedPrices,
        timestamp: getSafeTimestamp() // Use safe timestamp
      };

      return NextResponse.json(convertedPrices);
    } catch (conversionError) {
      console.error('Error using CurrencyConversionService:', conversionError);

      // Fall back to the existing conversion logic
      try {
        // Fetch exchange rate from USD to requested currency
        const exchangeRateResponse = await fetch(`https://api.frankfurter.app/latest?from=USD&to=${currency}`);

        if (!exchangeRateResponse.ok) {
          console.warn(`frankfurter returned status ${exchangeRateResponse.status}`);

          // Try alternative exchange rate API as fallback
          try {
            console.log(`Attempting to fetch exchange rate from alternative source...`);
            const fallbackResponse = await fetch(`https://open.er-api.com/v6/latest/USD`);

            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json() as { rates?: Record<string, number> };
              if (fallbackData && fallbackData.rates && fallbackData.rates[currency]) {
                const fallbackRate = fallbackData.rates[currency];

                if (typeof fallbackRate === 'number' && !isNaN(fallbackRate)) {
                  console.log(`Got exchange rate from fallback: 1 USD = ${fallbackRate} ${currency}`);

                  // Convert prices using fallback rate
                  const convertedPrices = {
                    gold: Number((usdPrices.gold * fallbackRate).toFixed(2)),
                    silver: Number((usdPrices.silver * fallbackRate).toFixed(2)),
                    lastUpdated: usdPrices.lastUpdated,
                    isCache: usdPrices.isCache,
                    source: usdPrices.source,
                    currency: currency,
                    exchangeRate: fallbackRate,
                    exchangeRateSource: 'open.er-api.com',
                    // Include the original USD prices for better conversion in the frontend
                    goldUSD: Number(usdPrices.gold.toFixed(2)),
                    silverUSD: Number(usdPrices.silver.toFixed(2)),
                    timestamp: getSafeTimestamp() // Use safe timestamp
                  };

                  // Update memory cache for this currency
                  globalMemoryCache[currency] = {
                    prices: convertedPrices,
                    timestamp: getSafeTimestamp() // Use safe timestamp
                  };

                  return NextResponse.json(convertedPrices);
                }
              }
            }
          } catch (fallbackError) {
            console.error('Error with fallback exchange rate API:', fallbackError);
          }
        } else {
          const exchangeData = await exchangeRateResponse.json();
          let exchangeRate = exchangeData.rates?.[currency];

          // Ensure exchangeRate is a valid number
          if (exchangeRate && typeof exchangeRate === 'number' && !isNaN(exchangeRate)) {
            // Ensure exchangeRate is a finite number and convert to a reasonable precision
            exchangeRate = Number(parseFloat(exchangeRate.toString()).toFixed(4));

            console.log(`Applied exchange rate: 1 USD = ${exchangeRate} ${currency}`);

            // Convert prices to requested currency - multiply by exchange rate
            const goldPriceInRequestedCurrency = usdPrices.gold * exchangeRate;
            const silverPriceInRequestedCurrency = usdPrices.silver * exchangeRate;

            // Log the conversion details for debugging
            console.log(`Conversion details for ${currency}:`, {
              originalGoldPrice: usdPrices.gold,
              originalSilverPrice: usdPrices.silver,
              exchangeRate,
              convertedGoldPrice: goldPriceInRequestedCurrency,
              convertedSilverPrice: silverPriceInRequestedCurrency
            });

            const convertedPrices = {
              gold: Number(goldPriceInRequestedCurrency.toFixed(2)),
              silver: Number(silverPriceInRequestedCurrency.toFixed(2)),
              lastUpdated: usdPrices.lastUpdated,
              isCache: usdPrices.isCache,
              source: usdPrices.source,
              currency: currency,
              exchangeRate: exchangeRate,
              // Include the original USD prices for better conversion in the frontend
              goldUSD: Number(usdPrices.gold.toFixed(2)),
              silverUSD: Number(usdPrices.silver.toFixed(2)),
              timestamp: getSafeTimestamp() // Use safe timestamp
            };

            // Update memory cache for this currency
            globalMemoryCache[currency] = {
              prices: convertedPrices,
              timestamp: getSafeTimestamp() // Use safe timestamp
            };

            return NextResponse.json(convertedPrices);
          }
        }
      } catch (apiError) {
        console.error('Error with exchange rate APIs:', apiError);
      }

      // If all conversion methods fail, use hardcoded conversion as last resort
      const hardcodedRate = CurrencyConversionService.convert(1, 'USD', currency, {
        logPrefix: 'API-LastResort',
        fallbackToHardcoded: true,
        validateResult: false
      });

      if (hardcodedRate > 0) {
        console.warn(`Using hardcoded conversion as last resort: 1 USD = ${hardcodedRate} ${currency}`);

        const convertedPrices = {
          gold: Number((usdPrices.gold * hardcodedRate).toFixed(2)),
          silver: Number((usdPrices.silver * hardcodedRate).toFixed(2)),
          lastUpdated: usdPrices.lastUpdated,
          isCache: usdPrices.isCache,
          source: usdPrices.source,
          currency: currency,
          exchangeRate: hardcodedRate,
          exchangeRateSource: 'hardcoded-fallback',
          // Include the original USD prices for better conversion in the frontend
          goldUSD: Number(usdPrices.gold.toFixed(2)),
          silverUSD: Number(usdPrices.silver.toFixed(2)),
          timestamp: getSafeTimestamp(), // Use safe timestamp
          conversionMethod: 'hardcoded-fallback'
        };

        // Update memory cache for this currency
        globalMemoryCache[currency] = {
          prices: convertedPrices,
          timestamp: getSafeTimestamp() // Use safe timestamp
        };

        return NextResponse.json(convertedPrices);
      }

      // If all else fails, return USD prices with a clear message
      return NextResponse.json({
        ...usdPrices,
        currency: 'USD',
        requestedCurrency: currency,
        conversionFailed: true,
        message: `Unable to convert prices to ${currency}. Showing values in USD.`,
        // Include the original USD prices explicitly labeled
        goldUSD: Number(usdPrices.gold.toFixed(2)),
        silverUSD: Number(usdPrices.silver.toFixed(2)),
        timestamp: getSafeTimestamp() // Use safe timestamp
      });
    }
  } catch (error) {
    console.error('Error in GET handler:', error);

    // Last resort - use memory cache for USD if nothing else works
    if (globalMemoryCache['USD'] && globalMemoryCache['USD'].prices) {
      // Validate the USD memory cache
      const usdCacheEntry = {
        ...globalMemoryCache['USD'].prices,
        timestamp: globalMemoryCache['USD'].timestamp
      };

      const validation = CacheValidationService.validateMetalPrices(usdCacheEntry as MetalPriceEntry, {
        maxAge: 24 * 60 * 60 * 1000, // Allow up to 24 hours old in emergency
        allowFutureDates: false,
        logPrefix: 'EmergencyUSDCache',
        strictValidation: false
      });

      if (validation.isValid) {
        return NextResponse.json({
          ...globalMemoryCache['USD'].prices,
          isCache: true,
          cacheSource: 'emergency-fallback'
        });
      } else {
        console.warn(`Emergency USD cache failed validation: ${validation.reason}`);
      }
    }

    // Load from fallback file as absolute last resort
    const fallbackPrices = loadFallbackPrices();
    return NextResponse.json({
      ...fallbackPrices,
      error: 'Failed to fetch prices and no cache available'
    });
  }
} 
