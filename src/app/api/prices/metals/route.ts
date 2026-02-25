import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { CacheValidationService, MetalPriceEntry } from '@/lib/services/cacheValidation'
import { CurrencyConversionService } from '@/lib/services/currencyConversion'
import { getExchangeRate } from '@/lib/api/exchange-rates'
import { DEFAULT_METAL_PRICES } from '@/lib/constants/metals'
import { FALLBACK_RATES } from '@/lib/constants/currency'
import { getRequestCounter } from '@/lib/services/apiCounter'

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
    name: 'gold-api',
    url: 'https://api.gold-api.com/price/XAU',
    parser: (data: unknown) => {
      // gold-api.com returns { name, price, symbol, updatedAt } with price in USD per troy ounce
      // We need to fetch both gold and silver separately, but the PRICE_SOURCES pattern
      // only supports a single URL. We'll fetch gold here and handle silver in the fetch loop.
      const typedData = data as { price: number; symbol: string };
      if (typedData && typeof typedData.price === 'number' && typedData.price > 0) {
        return {
          gold: typedData.price / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS,
          silver: 0 // Will be fetched separately
        };
      }
      return { gold: 0, silver: 0 };
    }
  },
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

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true })
}

// Default fallback prices - using canonical metal price constants
const FALLBACK_PRICES = {
  gold: DEFAULT_METAL_PRICES.gold,
  silver: DEFAULT_METAL_PRICES.silver,
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

      let parsedPrices: { gold: number; silver: number };

      // Special handling for gold-api.com which requires separate requests for gold and silver
      if (source.name === 'gold-api') {
        try {
          const [goldResponse, silverResponse] = await Promise.all([
            fetch('https://api.gold-api.com/price/XAU', { signal: AbortSignal.timeout(5000) }),
            fetch('https://api.gold-api.com/price/XAG', { signal: AbortSignal.timeout(5000) })
          ]);

          if (!goldResponse.ok || !silverResponse.ok) {
            console.warn(`gold-api returned status gold:${goldResponse.status} silver:${silverResponse.status}`);
            continue;
          }

          const goldData = await goldResponse.json() as { price: number };
          const silverData = await silverResponse.json() as { price: number };

          if (!goldData?.price || !silverData?.price) {
            console.warn('gold-api returned invalid data:', { goldData, silverData });
            continue;
          }

          parsedPrices = {
            gold: goldData.price / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS,
            silver: silverData.price / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS
          };
        } catch (goldApiError) {
          console.error('Error fetching from gold-api:', goldApiError);
          continue;
        }
      } else {
        const response = await fetch(source.url)

        if (!response.ok) {
          console.warn(`${source.name} returned status ${response.status}`)
          continue
        }

        const data = await response.json()
        parsedPrices = source.parser(data)
      }

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

// API URLs for metal price sources
const GOLD_API_URL = 'https://api.gold-api.com/price'
const GOLDPRICE_API_URL = 'https://data-asg.goldprice.org/dbXRates'
const METALS_API_URL = 'https://api.metals.live/v1/spot'

// Try to fetch from Gold API (gold-api.com) - free, no auth required
async function fetchFromGoldApi(currency: string): Promise<{ gold: number | null, silver: number | null }> {
  try {
    console.log(`Trying Gold API for ${currency}`);
    const [goldResponse, silverResponse] = await Promise.all([
      fetch(`${GOLD_API_URL}/XAU`, { cache: 'no-store', signal: AbortSignal.timeout(5000) }),
      fetch(`${GOLD_API_URL}/XAG`, { cache: 'no-store', signal: AbortSignal.timeout(5000) })
    ]);

    if (!goldResponse.ok || !silverResponse.ok) {
      console.warn(`Gold API returned gold:${goldResponse.status} silver:${silverResponse.status}`);
      return { gold: null, silver: null };
    }

    const goldData = await goldResponse.json() as { price: number };
    const silverData = await silverResponse.json() as { price: number };

    if (!goldData?.price || !silverData?.price || goldData.price <= 0 || silverData.price <= 0) {
      console.warn('Gold API returned invalid price data:', { goldData, silverData });
      return { gold: null, silver: null };
    }

    // Prices from gold-api.com are in USD per troy ounce
    const goldPrice = goldData.price / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS;
    const silverPrice = silverData.price / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS;

    console.log(`Gold API prices: Gold=${goldPrice.toFixed(2)}/g, Silver=${silverPrice.toFixed(2)}/g (USD)`);

    // If currency is not USD, we'll need conversion downstream
    return { gold: goldPrice, silver: silverPrice };
  } catch (error) {
    console.error(`Error fetching from Gold API:`, error);
    return { gold: null, silver: null };
  }
}

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
        // Use canonical fallback rates for any supported currency
        const fallbackRate = FALLBACK_RATES[currency];
        if (fallbackRate) {
          return {
            gold: Number((basePrices.gold * fallbackRate).toFixed(2)),
            silver: Number((basePrices.silver * fallbackRate).toFixed(2))
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
    // Track the actual currency of the obtained prices
    // gold-api and metals-api always return USD; goldprice returns the requested currency
    let priceCurrency = 'USD';

    // Sequential fallback chain: gold-api → goldprice → metals-api → fallback
    // gold-api is tried first as the most reliable source
    const goldApiPrices = await fetchFromGoldApi(currency);
    if (goldApiPrices.gold !== null && goldApiPrices.silver !== null) {
      goldPrice = goldApiPrices.gold;
      silverPrice = goldApiPrices.silver;
      source = 'gold-api';
      priceCurrency = 'USD'; // gold-api always returns USD
      console.log(`Successfully fetched prices from Gold API (USD)`);
    }

    // Try Goldprice API as second source
    if (goldPrice === null || silverPrice === null) {
      const goldpricePrices = await fetchFromGoldprice(currency);
      if (goldpricePrices.gold !== null && goldpricePrices.silver !== null) {
        goldPrice = goldpricePrices.gold;
        silverPrice = goldpricePrices.silver;
        source = 'goldprice';
        priceCurrency = currency; // goldprice returns prices in the requested currency
        console.log(`Successfully fetched prices from Goldprice (${currency})`);
      }
    }

    // Try Metals API as third source
    if (goldPrice === null || silverPrice === null) {
      const metalsPrices = await fetchFromMetalsAPI(currency);
      if (metalsPrices.gold !== null && metalsPrices.silver !== null) {
        goldPrice = metalsPrices.gold;
        silverPrice = metalsPrices.silver;
        source = 'metals-api';
        priceCurrency = 'USD'; // metals-api always returns USD
        console.log(`Successfully fetched prices from Metals API (USD)`);
      }
    }

    // If all APIs fail, use fallback values
    if (goldPrice === null || silverPrice === null) {
      console.warn(`All APIs failed, using fallback values for ${currency}`);
      const fallbackPrices = await getBasePrices(currency);
      goldPrice = fallbackPrices.gold;
      silverPrice = fallbackPrices.silver;
      source = 'fallback';
      priceCurrency = currency; // getBasePrices already converts to the requested currency
    }

    // Convert prices to the requested currency if needed
    if (priceCurrency !== currency) {
      console.log(`Converting prices from ${priceCurrency} to ${currency}`);
      try {
        const rate = await getExchangeRate(priceCurrency, currency);
        if (rate) {
          goldPrice = goldPrice * rate;
          silverPrice = silverPrice * rate;
          console.log(`Converted prices using exchange rate ${rate}: Gold=${goldPrice.toFixed(2)}, Silver=${silverPrice.toFixed(2)} ${currency}`);
        } else {
          // Use fallback rates if exchange rate API fails
          const fallbackRate = FALLBACK_RATES[currency];
          if (fallbackRate && priceCurrency === 'USD') {
            goldPrice = goldPrice * fallbackRate;
            silverPrice = silverPrice * fallbackRate;
            console.log(`Converted prices using fallback rate ${fallbackRate}: Gold=${goldPrice.toFixed(2)}, Silver=${silverPrice.toFixed(2)} ${currency}`);
          } else {
            console.warn(`No exchange rate available for ${priceCurrency} → ${currency}, returning USD prices`);
          }
        }
      } catch (error) {
        console.error(`Error converting prices from ${priceCurrency} to ${currency}:`, error);
        // Try fallback rates as last resort
        const fallbackRate = FALLBACK_RATES[currency];
        if (fallbackRate && priceCurrency === 'USD') {
          goldPrice = goldPrice * fallbackRate;
          silverPrice = silverPrice * fallbackRate;
          console.log(`Converted prices using fallback rate after error: Gold=${goldPrice.toFixed(2)}, Silver=${silverPrice.toFixed(2)} ${currency}`);
        }
      }
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
