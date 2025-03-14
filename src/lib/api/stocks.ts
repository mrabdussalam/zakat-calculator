import { getExchangeRate } from '@/lib/api/exchange-rates';
import { StockPriceResponse } from '@/types/api';

const BASE_URL = '/api/prices/stocks'

export interface StockPrice {
  symbol: string
  price: number
  lastUpdated: Date
  currency?: string
  sourceCurrency?: string
  exchangeName?: string
  conversionApplied?: boolean
  requestedCurrency?: string
}

export class StockAPIError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly symbol?: string
  ) {
    super(message)
    this.name = 'StockAPIError'
  }
}

const MAX_RETRIES = 2
const RETRY_DELAY = 1000 // 1 second

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url)

    // If rate limited, wait and retry
    if (response.status === 429 && retries > 0) {
      await sleep(RETRY_DELAY)
      return fetchWithRetry(url, retries - 1)
    }

    return response
  } catch (error) {
    if (retries > 0) {
      await sleep(RETRY_DELAY)
      return fetchWithRetry(url, retries - 1)
    }
    throw error
  }
}

// Add environment detection for Replit
const IS_REPLIT = typeof window !== 'undefined' &&
  (window.location.hostname.includes('replit') ||
    window.location.hostname.endsWith('.repl.co'));

// Cache for stock prices
const priceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to check if a cached price is still valid
function isCacheValid(symbol: string): boolean {
  const cached = priceCache.get(symbol);
  if (!cached) return false;
  return Date.now() - cached.timestamp < CACHE_DURATION;
}

// Helper function to get cached price
function getCachedPrice(symbol: string): number | null {
  const cached = priceCache.get(symbol);
  if (cached && isCacheValid(symbol)) {
    return cached.price;
  }
  return null;
}

// Helper function to set cached price
function setCachedPrice(symbol: string, price: number): void {
  priceCache.set(symbol, {
    price,
    timestamp: Date.now()
  });
}

// Helper function to clear cache
export function clearStockPriceCache(): void {
  priceCache.clear();
}

// Main function to get stock price with caching and currency conversion
export async function getStockPrice(
  symbol: string,
  currency: string = 'USD',
  forceRefresh: boolean = false
): Promise<StockPriceResponse> {
  try {
    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedPrice = getCachedPrice(symbol);
      if (cachedPrice !== null) {
        console.log(`Using cached price for ${symbol}: $${cachedPrice}`);
        return {
          symbol: symbol.toUpperCase(),
          price: cachedPrice,
          lastUpdated: new Date().toISOString(),
          sourceCurrency: 'USD',
          currency: currency !== 'USD' ? currency : 'USD',
          source: 'cache'
        };
      }
    }

    // Determine which API to try first based on environment and randomization
    const random = Math.random();
    let price: number | null = null;
    let source = '';

    // On Replit, we want to avoid APIs that might have rate limits
    if (IS_REPLIT) {
      // Try IEX Cloud first 50% of the time, Alpha Vantage first 50% of the time
      if (random < 0.5) {
        // Try IEX Cloud first
        price = await fetchFromIEXCloud(symbol);
        if (price !== null) {
          source = 'iex-cloud';
          console.log(`Successfully fetched price from IEX Cloud: ${price}`);
        } else {
          // Then try Alpha Vantage
          price = await fetchFromAlphaVantage(symbol);
          if (price !== null) {
            source = 'alpha-vantage';
            console.log(`Successfully fetched price from Alpha Vantage: ${price}`);
          }
        }
      } else {
        // Try Alpha Vantage first
        price = await fetchFromAlphaVantage(symbol);
        if (price !== null) {
          source = 'alpha-vantage';
          console.log(`Successfully fetched price from Alpha Vantage: ${price}`);
        } else {
          // Then try IEX Cloud
          price = await fetchFromIEXCloud(symbol);
          if (price !== null) {
            source = 'iex-cloud';
            console.log(`Successfully fetched price from IEX Cloud: ${price}`);
          }
        }
      }

      // Only try Yahoo Finance as a last resort on Replit
      if (price === null) {
        price = await fetchFromYahooFinance(symbol);
        if (price !== null) {
          source = 'yahoo-finance';
          console.log(`Successfully fetched price from Yahoo Finance: ${price}`);
        }
      }
    } else {
      // Not on Replit, distribute requests across all APIs
      if (random < 0.33) {
        // Try Yahoo Finance first
        price = await fetchFromYahooFinance(symbol);
        if (price !== null) {
          source = 'yahoo-finance';
          console.log(`Successfully fetched price from Yahoo Finance: ${price}`);
        } else {
          // Then try Alpha Vantage
          price = await fetchFromAlphaVantage(symbol);
          if (price !== null) {
            source = 'alpha-vantage';
            console.log(`Successfully fetched price from Alpha Vantage: ${price}`);
          }
        }

        // Finally try IEX Cloud
        if (price === null) {
          price = await fetchFromIEXCloud(symbol);
          if (price !== null) {
            source = 'iex-cloud';
            console.log(`Successfully fetched price from IEX Cloud: ${price}`);
          }
        }
      } else if (random < 0.66) {
        // Try Alpha Vantage first
        price = await fetchFromAlphaVantage(symbol);
        if (price !== null) {
          source = 'alpha-vantage';
          console.log(`Successfully fetched price from Alpha Vantage: ${price}`);
        } else {
          // Then try IEX Cloud
          price = await fetchFromIEXCloud(symbol);
          if (price !== null) {
            source = 'iex-cloud';
            console.log(`Successfully fetched price from IEX Cloud: ${price}`);
          }
        }

        // Finally try Yahoo Finance
        if (price === null) {
          price = await fetchFromYahooFinance(symbol);
          if (price !== null) {
            source = 'yahoo-finance';
            console.log(`Successfully fetched price from Yahoo Finance: ${price}`);
          }
        }
      } else {
        // Try IEX Cloud first
        price = await fetchFromIEXCloud(symbol);
        if (price !== null) {
          source = 'iex-cloud';
          console.log(`Successfully fetched price from IEX Cloud: ${price}`);
        } else {
          // Then try Yahoo Finance
          price = await fetchFromYahooFinance(symbol);
          if (price !== null) {
            source = 'yahoo-finance';
            console.log(`Successfully fetched price from Yahoo Finance: ${price}`);
          }
        }

        // Finally try Alpha Vantage
        if (price === null) {
          price = await fetchFromAlphaVantage(symbol);
          if (price !== null) {
            source = 'alpha-vantage';
            console.log(`Successfully fetched price from Alpha Vantage: ${price}`);
          }
        }
      }
    }

    // If all APIs fail, throw an error
    if (price === null) {
      throw new Error(`Failed to fetch stock price for ${symbol} from any API source`);
    }

    // Cache the price
    setCachedPrice(symbol, price);

    // Convert currency if needed
    if (currency !== 'USD') {
      const rate = await getExchangeRate('USD', currency);
      if (rate) {
        price = Number((price * rate).toFixed(2));
        console.log(`Converted ${symbol} price from USD to ${currency} using rate ${rate}`);
      } else {
        console.log(`Could not convert ${symbol} price from USD to ${currency}, returning USD price`);
      }
    }

    return {
      symbol: symbol.toUpperCase(),
      price,
      lastUpdated: new Date().toISOString(),
      sourceCurrency: 'USD',
      currency: currency !== 'USD' ? currency : 'USD',
      source: source || 'unknown'
    };
  } catch (error) {
    console.error(`Error fetching stock price for ${symbol}:`, error);
    throw error;
  }
}

// Helper function to fetch from Yahoo Finance
async function fetchFromYahooFinance(symbol: string): Promise<number | null> {
  try {
    console.log(`Trying Yahoo Finance API for ${symbol}`);
    const response = await fetch(
      `/api/prices/stocks?symbol=${encodeURIComponent(symbol)}&source=yahoo-finance`
    );

    if (!response.ok) {
      console.warn(`Yahoo Finance API returned ${response.status} for ${symbol}`);
      return null;
    }

    const data = await response.json();
    if (data.price && typeof data.price === 'number') {
      return data.price;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching from Yahoo Finance for ${symbol}:`, error);
    return null;
  }
}

// Helper function to fetch from Alpha Vantage
async function fetchFromAlphaVantage(symbol: string): Promise<number | null> {
  try {
    console.log(`Trying Alpha Vantage API for ${symbol}`);
    const response = await fetch(
      `/api/prices/stocks?symbol=${encodeURIComponent(symbol)}&source=alpha-vantage`
    );

    if (!response.ok) {
      console.warn(`Alpha Vantage API returned ${response.status} for ${symbol}`);
      return null;
    }

    const data = await response.json();
    if (data.price && typeof data.price === 'number') {
      return data.price;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching from Alpha Vantage for ${symbol}:`, error);
    return null;
  }
}

// Helper function to fetch from IEX Cloud
async function fetchFromIEXCloud(symbol: string): Promise<number | null> {
  try {
    console.log(`Trying IEX Cloud API for ${symbol}`);
    const response = await fetch(
      `/api/prices/stocks?symbol=${encodeURIComponent(symbol)}&source=iex-cloud`
    );

    if (!response.ok) {
      console.warn(`IEX Cloud API returned ${response.status} for ${symbol}`);
      return null;
    }

    const data = await response.json();
    if (data.price && typeof data.price === 'number') {
      return data.price;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching from IEX Cloud for ${symbol}:`, error);
    return null;
  }
}

export const getBatchStockPrices = async (symbols: string[], currency: string = 'USD'): Promise<StockPriceResponse[]> => {
  try {
    console.log(`Fetching batch stock prices for ${symbols.length} symbols in ${currency}`);
    const results: StockPriceResponse[] = [];

    // Process in batches to avoid overloading
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const promises = batch.map(symbol => getStockPrice(symbol, currency));

      // Wait for this batch to complete before proceeding
      const batchResults = await Promise.allSettled(promises);

      // Process results, adding only successful ones
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Failed to fetch price for ${batch[index]}:`, result.reason);
        }
      });

      // Small delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return results;
  } catch (error) {
    console.error('Error in batch stock prices:', error);
    throw new StockAPIError(
      error instanceof Error ? error.message : 'Failed to fetch batch stock prices'
    );
  }
};

export async function validateSymbol(symbol: string): Promise<boolean> {
  if (!symbol || typeof symbol !== 'string') {
    return false
  }

  try {
    await getStockPrice(symbol.trim())
    return true
  } catch (error) {
    return false
  }
} 