import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

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
let globalMemoryCache: Record<string, MemoryCacheEntry> = {
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
interface MetalPricesResponse {
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
  currency: 'USD'  // Add explicit currency
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

// In-memory cache
let priceCache = {
  prices: null as typeof FALLBACK_PRICES | null,
  lastUpdated: null as Date | null
}

function validatePrices(prices: any) {
  if (!prices || typeof prices !== 'object') return false;
  if (typeof prices.gold !== 'number' || typeof prices.silver !== 'number') return false;
  if (prices.gold <= 0 || prices.silver <= 0) return false;
  return true;
}

async function fetchMetalPrices() {
  // Check cache first
  const now = new Date()
  if (priceCache.prices && priceCache.lastUpdated && 
      (now.getTime() - priceCache.lastUpdated.getTime() < CACHE_DURATION)) {
    return {
      ...priceCache.prices,
      isCache: true
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
      // Update cache with valid prices
      const result = {
        gold: Number((parsedPrices.gold || 0).toFixed(2)),
        silver: Number((parsedPrices.silver || 0).toFixed(2)),
        lastUpdated: new Date().toISOString(),
        isCache: false,
        source: source.name,
        currency: 'USD' // All prices are in USD by default
      }

      priceCache = {
        prices: result,
        lastUpdated: now
      }
      
      // Also update global memory cache for USD
      globalMemoryCache['USD'] = {
        prices: result,
        timestamp: now.getTime()
      };

      return result
    } catch (error) {
      console.error(`Error fetching from ${source.name}:`, error)
      continue
    }
  }

  // If all sources fail, use cache if available and valid
  if (priceCache.prices && priceCache.lastUpdated) {
    console.warn('All price sources failed, using existing cache')
    return {
      ...priceCache.prices,
      isCache: true
    }
  }

  // If no cache available, use emergency fallback values
  console.error('All price sources failed and no cache available, using fallback values')
  return FALLBACK_PRICES
}

// Add proper type for response data
interface GoldPriceResponse {
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
    
    // First check our global memory cache for this currency (skip if force refresh)
    const now = Date.now();
    const memoryCached = globalMemoryCache[currency];
    if (!forceRefresh && memoryCached && (now - memoryCached.timestamp < MEMORY_CACHE_DURATION)) {
      console.log(`Using global memory cache for ${currency}, age: ${(now - memoryCached.timestamp) / 1000}s`);
      return NextResponse.json({
        ...memoryCached.prices,
        isCache: true,
        cacheSource: 'memory'
      });
    }
    
    // Get base metal prices (in USD)
    const prices = await fetchMetalPrices();
    
    // If USD is requested, return directly
    if (currency === 'USD') {
      // Update memory cache for USD
      globalMemoryCache['USD'] = {
        prices: prices,
        timestamp: now
      };
      
      return NextResponse.json({
        ...prices,
        currency: 'USD'
      });
    }
    
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
                  gold: Number((prices.gold * fallbackRate).toFixed(2)),
                  silver: Number((prices.silver * fallbackRate).toFixed(2)),
                  lastUpdated: prices.lastUpdated,
                  isCache: prices.isCache,
                  source: prices.source,
                  currency: currency,
                  exchangeRate: fallbackRate,
                  exchangeRateSource: 'open.er-api.com'
                };
                
                // Update memory cache for this currency
                globalMemoryCache[currency] = {
                  prices: convertedPrices,
                  timestamp: now
                };
                
                return NextResponse.json(convertedPrices);
              }
            }
          }
        } catch (fallbackError) {
          console.error('Error with fallback exchange rate API:', fallbackError);
        }
        
        // If both primary and fallback fail, check memory cache even if expired
        const expiredMemoryCache = globalMemoryCache[currency];
        if (expiredMemoryCache) {
          console.log(`Using expired memory cache for ${currency} due to conversion failure`);
          return NextResponse.json({
            ...expiredMemoryCache.prices,
            isCache: true,
            cacheSource: 'expired-memory'
          });
        }
        
        // If no memory cache, log a clear message about the failure
        console.warn(`Failed to get exchange rate to ${currency}, returning USD prices`);
        return NextResponse.json({
          ...prices,
          currency: 'USD',
          requestedCurrency: currency,
          conversionFailed: true,
          message: `Unable to convert prices to ${currency}. Showing values in USD.`
        });
      }
      
      const exchangeData = await exchangeRateResponse.json();
      let exchangeRate = exchangeData.rates?.[currency];
      
      // Ensure exchangeRate is a valid number
      if (!exchangeRate || typeof exchangeRate !== 'number' || isNaN(exchangeRate)) {
        console.warn(`Invalid exchange rate for ${currency}, returning USD prices`);
        
        // Check for expired memory cache as fallback
        const expiredMemoryCache = globalMemoryCache[currency];
        if (expiredMemoryCache) {
          console.log(`Using expired memory cache for ${currency} due to invalid exchange rate`);
          return NextResponse.json({
            ...expiredMemoryCache.prices,
            isCache: true,
            cacheSource: 'expired-memory'
          });
        }
        
        return NextResponse.json({
          gold: Number(prices.gold.toFixed(2)),
          silver: Number(prices.silver.toFixed(2)),
          lastUpdated: prices.lastUpdated,
          isCache: prices.isCache,
          source: prices.source,
          currency: 'USD'
        });
      }
      
      // Ensure exchangeRate is a finite number and convert to a reasonable precision
      exchangeRate = Number(parseFloat(exchangeRate.toString()).toFixed(4));
      
      console.log(`Applied exchange rate: 1 USD = ${exchangeRate} ${currency}`);
      
      // Convert prices to requested currency
      const convertedPrices = {
        gold: Number((prices.gold * exchangeRate).toFixed(2)),
        silver: Number((prices.silver * exchangeRate).toFixed(2)),
        lastUpdated: prices.lastUpdated,
        isCache: prices.isCache,
        source: prices.source,
        currency: currency,
        exchangeRate: exchangeRate
      };
      
      // Update memory cache for this currency
      globalMemoryCache[currency] = {
        prices: convertedPrices,
        timestamp: now
      };
      
      return NextResponse.json(convertedPrices);
      
    } catch (conversionError) {
      console.error('Error converting currency:', conversionError);
      
      // Check memory cache even if expired as a fallback
      const expiredMemoryCache = globalMemoryCache[currency];
      if (expiredMemoryCache) {
        console.log(`Using expired memory cache for ${currency} due to conversion error`);
        return NextResponse.json({
          ...expiredMemoryCache.prices,
          isCache: true,
          cacheSource: 'expired-memory-error'
        });
      }
      
      // If conversion fails and no cache, return USD prices with a clear message
      return NextResponse.json({
        gold: Number(prices.gold.toFixed(2)),
        silver: Number(prices.silver.toFixed(2)),
        lastUpdated: prices.lastUpdated,
        isCache: prices.isCache,
        source: prices.source,
        currency: 'USD',
        requestedCurrency: currency,
        conversionFailed: true,
        message: `Unable to convert prices to ${currency}. Showing values in USD.`
      });
    }
  } catch (error) {
    console.error('Error in GET handler:', error);
    
    // Last resort - use memory cache for USD if nothing else works
    if (globalMemoryCache['USD']) {
      return NextResponse.json({
        ...globalMemoryCache['USD'].prices,
        isCache: true,
        cacheSource: 'emergency-fallback'
      });
    }
    
    return NextResponse.json({
      gold: Number(FALLBACK_PRICES.gold.toFixed(2)),
      silver: Number(FALLBACK_PRICES.silver.toFixed(2)),
      lastUpdated: FALLBACK_PRICES.lastUpdated,
      isCache: FALLBACK_PRICES.isCache,
      source: FALLBACK_PRICES.source,
      currency: 'USD',
      error: 'Failed to fetch prices and no cache available'
    });
  }
} 
