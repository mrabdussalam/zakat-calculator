import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { CacheValidationService, MetalPriceEntry } from '@/lib/services/cacheValidation'
import { CurrencyConversionService } from '@/lib/services/currencyConversion'
import { getExchangeRate } from '@/lib/api/exchange-rates'

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

// Add new API URLs
const GOLDPRICE_API_URL = 'https://data-asg.goldprice.org/dbXRates'
const METALS_API_URL = 'https://api.metals.live/v1/spot'
const KITCO_API_URL = 'https://www.kitco.com/gold-price-today-usa'
const GOLDSILVERPRO_API_URL = 'https://www.goldsilverpro.com/api/v1/spot'

// Add environment detection for Replit
const IS_REPLIT = typeof window !== 'undefined' &&
  (window.location.hostname.includes('replit') ||
    window.location.hostname.endsWith('.repl.co'));

// Try to fetch from Goldprice API
async function fetchFromGoldprice(currency: string): Promise<{ gold: number | null, silver: number | null }> {
  try {
    console.log(`Trying Goldprice API for ${currency}`);
    const response = await fetch(`${GOLDPRICE_API_URL}/${currency}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      console.warn(`Goldprice API returned ${response.status} for ${currency}`);
      return { gold: null, silver: null };
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      console.warn(`No data found in Goldprice response for ${currency}`);
      return { gold: null, silver: null };
    }

    const goldPrice = data.items[0].xauPrice / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS;
    const silverPrice = data.items[0].xagPrice / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS;

    console.log(`Goldprice API prices for ${currency}: Gold=${goldPrice}, Silver=${silverPrice}`);
    return { gold: goldPrice, silver: silverPrice };
  } catch (error) {
    console.error(`Error fetching from Goldprice for ${currency}:`, error);
    return { gold: null, silver: null };
  }
}

interface MetalPrice {
  metal: string;
  price: number;
}

// Try to fetch from Metals API
async function fetchFromMetalsAPI(currency: string): Promise<{ gold: number | null, silver: number | null }> {
  try {
    console.log(`Trying Metals API for ${currency}`);
    const response = await fetch(`${METALS_API_URL}/gold,silver`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      console.warn(`Metals API returned ${response.status} for ${currency}`);
      return { gold: null, silver: null };
    }

    const data = await response.json();
    const goldData = data.find((m: MetalPrice) => m.metal === 'gold');
    const silverData = data.find((m: MetalPrice) => m.metal === 'silver');

    if (!goldData || !silverData) {
      console.warn(`Invalid data structure in Metals API response`);
      return { gold: null, silver: null };
    }

    const goldPrice = goldData.price / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS;
    const silverPrice = silverData.price / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS;

    console.log(`Metals API prices for ${currency}: Gold=${goldPrice}, Silver=${silverPrice}`);
    return { gold: goldPrice, silver: silverPrice };
  } catch (error) {
    console.error(`Error fetching from Metals API for ${currency}:`, error);
    return { gold: null, silver: null };
  }
}

// Try to fetch from Kitco API
async function fetchFromKitco(currency: string): Promise<{ gold: number | null, silver: number | null }> {
  try {
    console.log(`Trying Kitco API for ${currency}`);
    const response = await fetch(`${KITCO_API_URL}/${currency.toLowerCase()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.warn(`Kitco API returned ${response.status} for ${currency}`);
      return { gold: null, silver: null };
    }

    const data = await response.json();
    if (!data.gold || !data.silver) {
      console.warn(`No price data found in Kitco response for ${currency}`);
      return { gold: null, silver: null };
    }

    const goldPrice = data.gold / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS;
    const silverPrice = data.silver / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS;

    console.log(`Kitco API prices for ${currency}: Gold=${goldPrice}, Silver=${silverPrice}`);
    return { gold: goldPrice, silver: silverPrice };
  } catch (error) {
    console.error(`Error fetching from Kitco for ${currency}:`, error);
    return { gold: null, silver: null };
  }
}

// Try to fetch from GoldSilverPro API
async function fetchFromGoldSilverPro(currency: string): Promise<{ gold: number | null, silver: number | null }> {
  try {
    console.log(`Trying GoldSilverPro API for ${currency}`);
    const response = await fetch(`${GOLDSILVERPRO_API_URL}/${currency.toLowerCase()}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      console.warn(`GoldSilverPro API returned ${response.status} for ${currency}`);
      return { gold: null, silver: null };
    }

    const data = await response.json();
    if (!data.gold || !data.silver) {
      console.warn(`No price data found in GoldSilverPro response for ${currency}`);
      return { gold: null, silver: null };
    }

    const goldPrice = data.gold / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS;
    const silverPrice = data.silver / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS;

    console.log(`GoldSilverPro API prices for ${currency}: Gold=${goldPrice}, Silver=${silverPrice}`);
    return { gold: goldPrice, silver: silverPrice };
  } catch (error) {
    console.error(`Error fetching from GoldSilverPro for ${currency}:`, error);
    return { gold: null, silver: null };
  }
}

// Helper function to get base prices
async function getBasePrices(currency: string): Promise<{ gold: number; silver: number }> {
  // Use the existing FALLBACK_PRICES as base
  const basePrices = {
    gold: FALLBACK_PRICES.gold,
    silver: FALLBACK_PRICES.silver
  };

  // If currency is not USD, apply conversion
  if (currency !== 'USD') {
    try {
      // Get the exchange rate from the service
      const rate = await getExchangeRate('USD', currency);

      if (rate) {
        return {
          gold: Number((basePrices.gold * rate).toFixed(2)),
          silver: Number((basePrices.silver * rate).toFixed(2))
        };
      } else {
        console.warn(`Failed to get exchange rate for ${currency}, using fallback rates`);
        // Fallback to hardcoded rates only if exchange rate service fails
        if (currency === 'SAR') {
          return {
            gold: Number((basePrices.gold * 3.75).toFixed(2)),
            silver: Number((basePrices.silver * 3.75).toFixed(2))
          };
        } else if (currency === 'PKR') {
          return {
            gold: Number((basePrices.gold * 278.5).toFixed(2)),
            silver: Number((basePrices.silver * 278.5).toFixed(2))
          };
        }
      }
    } catch (error) {
      console.error(`Error converting to ${currency}:`, error);
      // Return USD prices if conversion fails
      return basePrices;
    }
  }

  return basePrices;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const currency = (searchParams.get('currency') || 'USD').toUpperCase();
    const shouldRefresh = searchParams.get('refresh') === 'true';

    console.log(`Fetching metal prices for ${currency}${shouldRefresh ? ' (refresh requested)' : ''}`);

    // Variables to track prices and source
    let goldPrice = null;
    let silverPrice = null;
    let source = '';

    // Determine which API to try first based on environment and randomization
    const random = Math.random();

    // On Replit, we want to avoid APIs that might have rate limits
    // Try APIs in different order based on random value
    if (IS_REPLIT) {
      // On Replit, try GoldSilverPro first 50% of the time, Kitco first 50% of the time
      if (random < 0.5) {
        // Try GoldSilverPro first
        const goldSilverProPrices = await fetchFromGoldSilverPro(currency);
        if (goldSilverProPrices.gold !== null && goldSilverProPrices.silver !== null) {
          goldPrice = goldSilverProPrices.gold;
          silverPrice = goldSilverProPrices.silver;
          source = 'goldsilverpro';
          console.log(`Successfully fetched prices from GoldSilverPro`);
        } else {
          // Then try Kitco
          const kitcoPrices = await fetchFromKitco(currency);
          if (kitcoPrices.gold !== null && kitcoPrices.silver !== null) {
            goldPrice = kitcoPrices.gold;
            silverPrice = kitcoPrices.silver;
            source = 'kitco';
            console.log(`Successfully fetched prices from Kitco`);
          }
        }
      } else {
        // Try Kitco first
        const kitcoPrices = await fetchFromKitco(currency);
        if (kitcoPrices.gold !== null && kitcoPrices.silver !== null) {
          goldPrice = kitcoPrices.gold;
          silverPrice = kitcoPrices.silver;
          source = 'kitco';
          console.log(`Successfully fetched prices from Kitco`);
        } else {
          // Then try GoldSilverPro
          const goldSilverProPrices = await fetchFromGoldSilverPro(currency);
          if (goldSilverProPrices.gold !== null && goldSilverProPrices.silver !== null) {
            goldPrice = goldSilverProPrices.gold;
            silverPrice = goldSilverProPrices.silver;
            source = 'goldsilverpro';
            console.log(`Successfully fetched prices from GoldSilverPro`);
          }
        }
      }

      // Only try Goldprice and Metals API as last resorts on Replit
      if (goldPrice === null || silverPrice === null) {
        const goldpricePrices = await fetchFromGoldprice(currency);
        if (goldpricePrices.gold !== null && goldpricePrices.silver !== null) {
          goldPrice = goldpricePrices.gold;
          silverPrice = goldpricePrices.silver;
          source = 'goldprice';
          console.log(`Successfully fetched prices from Goldprice`);
        } else {
          const metalsPrices = await fetchFromMetalsAPI(currency);
          if (metalsPrices.gold !== null && metalsPrices.silver !== null) {
            goldPrice = metalsPrices.gold;
            silverPrice = metalsPrices.silver;
            source = 'metals-api';
            console.log(`Successfully fetched prices from Metals API`);
          }
        }
      }
    } else {
      // Not on Replit, distribute requests across all APIs
      if (random < 0.25) {
        // Try Goldprice first
        const goldpricePrices = await fetchFromGoldprice(currency);
        if (goldpricePrices.gold !== null && goldpricePrices.silver !== null) {
          goldPrice = goldpricePrices.gold;
          silverPrice = goldpricePrices.silver;
          source = 'goldprice';
          console.log(`Successfully fetched prices from Goldprice`);
        } else {
          // Then try Metals API
          const metalsPrices = await fetchFromMetalsAPI(currency);
          if (metalsPrices.gold !== null && metalsPrices.silver !== null) {
            goldPrice = metalsPrices.gold;
            silverPrice = metalsPrices.silver;
            source = 'metals-api';
            console.log(`Successfully fetched prices from Metals API`);
          }
        }

        // Then try GoldSilverPro
        if (goldPrice === null || silverPrice === null) {
          const goldSilverProPrices = await fetchFromGoldSilverPro(currency);
          if (goldSilverProPrices.gold !== null && goldSilverProPrices.silver !== null) {
            goldPrice = goldSilverProPrices.gold;
            silverPrice = goldSilverProPrices.silver;
            source = 'goldsilverpro';
            console.log(`Successfully fetched prices from GoldSilverPro`);
          }
        }

        // Finally try Kitco
        if (goldPrice === null || silverPrice === null) {
          const kitcoPrices = await fetchFromKitco(currency);
          if (kitcoPrices.gold !== null && kitcoPrices.silver !== null) {
            goldPrice = kitcoPrices.gold;
            silverPrice = kitcoPrices.silver;
            source = 'kitco';
            console.log(`Successfully fetched prices from Kitco`);
          }
        }
      } else if (random < 0.5) {
        // Try Metals API first
        const metalsPrices = await fetchFromMetalsAPI(currency);
        if (metalsPrices.gold !== null && metalsPrices.silver !== null) {
          goldPrice = metalsPrices.gold;
          silverPrice = metalsPrices.silver;
          source = 'metals-api';
          console.log(`Successfully fetched prices from Metals API`);
        } else {
          // Then try Goldprice
          const goldpricePrices = await fetchFromGoldprice(currency);
          if (goldpricePrices.gold !== null && goldpricePrices.silver !== null) {
            goldPrice = goldpricePrices.gold;
            silverPrice = goldpricePrices.silver;
            source = 'goldprice';
            console.log(`Successfully fetched prices from Goldprice`);
          }
        }

        // Then try Kitco
        if (goldPrice === null || silverPrice === null) {
          const kitcoPrices = await fetchFromKitco(currency);
          if (kitcoPrices.gold !== null && kitcoPrices.silver !== null) {
            goldPrice = kitcoPrices.gold;
            silverPrice = kitcoPrices.silver;
            source = 'kitco';
            console.log(`Successfully fetched prices from Kitco`);
          }
        }

        // Finally try GoldSilverPro
        if (goldPrice === null || silverPrice === null) {
          const goldSilverProPrices = await fetchFromGoldSilverPro(currency);
          if (goldSilverProPrices.gold !== null && goldSilverProPrices.silver !== null) {
            goldPrice = goldSilverProPrices.gold;
            silverPrice = goldSilverProPrices.silver;
            source = 'goldsilverpro';
            console.log(`Successfully fetched prices from GoldSilverPro`);
          }
        }
      } else if (random < 0.75) {
        // Try GoldSilverPro first
        const goldSilverProPrices = await fetchFromGoldSilverPro(currency);
        if (goldSilverProPrices.gold !== null && goldSilverProPrices.silver !== null) {
          goldPrice = goldSilverProPrices.gold;
          silverPrice = goldSilverProPrices.silver;
          source = 'goldsilverpro';
          console.log(`Successfully fetched prices from GoldSilverPro`);
        } else {
          // Then try Kitco
          const kitcoPrices = await fetchFromKitco(currency);
          if (kitcoPrices.gold !== null && kitcoPrices.silver !== null) {
            goldPrice = kitcoPrices.gold;
            silverPrice = kitcoPrices.silver;
            source = 'kitco';
            console.log(`Successfully fetched prices from Kitco`);
          }
        }

        // Then try Goldprice
        if (goldPrice === null || silverPrice === null) {
          const goldpricePrices = await fetchFromGoldprice(currency);
          if (goldpricePrices.gold !== null && goldpricePrices.silver !== null) {
            goldPrice = goldpricePrices.gold;
            silverPrice = goldpricePrices.silver;
            source = 'goldprice';
            console.log(`Successfully fetched prices from Goldprice`);
          }
        }

        // Finally try Metals API
        if (goldPrice === null || silverPrice === null) {
          const metalsPrices = await fetchFromMetalsAPI(currency);
          if (metalsPrices.gold !== null && metalsPrices.silver !== null) {
            goldPrice = metalsPrices.gold;
            silverPrice = metalsPrices.silver;
            source = 'metals-api';
            console.log(`Successfully fetched prices from Metals API`);
          }
        }
      } else {
        // Try Kitco first
        const kitcoPrices = await fetchFromKitco(currency);
        if (kitcoPrices.gold !== null && kitcoPrices.silver !== null) {
          goldPrice = kitcoPrices.gold;
          silverPrice = kitcoPrices.silver;
          source = 'kitco';
          console.log(`Successfully fetched prices from Kitco`);
        } else {
          // Then try GoldSilverPro
          const goldSilverProPrices = await fetchFromGoldSilverPro(currency);
          if (goldSilverProPrices.gold !== null && goldSilverProPrices.silver !== null) {
            goldPrice = goldSilverProPrices.gold;
            silverPrice = goldSilverProPrices.silver;
            source = 'goldsilverpro';
            console.log(`Successfully fetched prices from GoldSilverPro`);
          }
        }

        // Then try Metals API
        if (goldPrice === null || silverPrice === null) {
          const metalsPrices = await fetchFromMetalsAPI(currency);
          if (metalsPrices.gold !== null && metalsPrices.silver !== null) {
            goldPrice = metalsPrices.gold;
            silverPrice = metalsPrices.silver;
            source = 'metals-api';
            console.log(`Successfully fetched prices from Metals API`);
          }
        }

        // Finally try Goldprice
        if (goldPrice === null || silverPrice === null) {
          const goldpricePrices = await fetchFromGoldprice(currency);
          if (goldpricePrices.gold !== null && goldpricePrices.silver !== null) {
            goldPrice = goldpricePrices.gold;
            silverPrice = goldpricePrices.silver;
            source = 'goldprice';
            console.log(`Successfully fetched prices from Goldprice`);
          }
        }
      }
    }

    // If all APIs fail, use fallback values
    if (goldPrice === null || silverPrice === null) {
      console.warn(`All APIs failed, using fallback values for ${currency}`);
      const fallbackPrices = await getBasePrices(currency);
      goldPrice = fallbackPrices.gold;
      silverPrice = fallbackPrices.silver;
      source = 'fallback';
    }

    // Create response with safe timestamp
    const response = {
      gold: Number(goldPrice.toFixed(2)),
      silver: Number(silverPrice.toFixed(2)),
      lastUpdated: new Date().toISOString(),
      isCache: false,
      source,
      currency,
      timestamp: getSafeTimestamp()
    };

    // Validate the response
    const validation = CacheValidationService.validateMetalPrices(response as MetalPriceEntry, {
      allowFutureDates: false,
      logPrefix: 'MetalPriceResponse',
      strictValidation: true
    });

    if (!validation.isValid) {
      console.warn(`Response validation failed: ${validation.reason}`);
      // Use fallback values if validation fails
      const fallbackPrices = await getBasePrices(currency);
      return NextResponse.json({
        ...fallbackPrices,
        lastUpdated: new Date().toISOString(),
        isCache: false,
        source: 'fallback',
        currency,
        timestamp: getSafeTimestamp()
      });
    }

    return NextResponse.json(response);

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
