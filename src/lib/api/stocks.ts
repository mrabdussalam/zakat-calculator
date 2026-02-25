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

// Main function to get stock price — single server call, server handles all API fallbacks
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

    // Single call to the server — the server tries Yahoo Finance, Alpha Vantage,
    // IEX Cloud, and scraping fallbacks internally
    console.log(`Fetching stock price for ${symbol} from server`);
    const response = await fetch(
      `${BASE_URL}?symbol=${encodeURIComponent(symbol)}&currency=${encodeURIComponent(currency)}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error || `Server returned ${response.status}`;
      throw new StockAPIError(errorMsg, response.status, symbol);
    }

    const data = await response.json();

    if (!data.price || typeof data.price !== 'number') {
      throw new StockAPIError(`No valid price returned for ${symbol}`, undefined, symbol);
    }

    console.log(`Stock price for ${symbol}: ${data.price} (source: ${data.source || 'unknown'})`);

    // Cache the price (in the original currency — server already handles conversion)
    setCachedPrice(symbol, data.price);

    return {
      symbol: data.symbol || symbol.toUpperCase(),
      price: data.price,
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      sourceCurrency: data.sourceCurrency || 'USD',
      currency: data.currency || currency,
      source: data.source || 'unknown'
    };
  } catch (error) {
    console.error(`Error fetching stock price for ${symbol}:`, error);
    throw error;
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
