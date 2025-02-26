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

export interface StockPriceResponse {
  symbol: string
  price: number
  lastUpdated: string
  sourceCurrency: string
  currency: string
  conversionApplied: boolean
  requestedCurrency: string
  exchangeName?: string
  error?: string
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

export const getStockPrice = async (symbol: string, currency: string = 'USD'): Promise<StockPriceResponse> => {
  try {
    console.log(`Searching stock price for ${symbol} in ${currency}`);
    
    const apiUrl = `${BASE_URL}?symbol=${encodeURIComponent(symbol)}&currency=${encodeURIComponent(currency)}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new StockAPIError(
        errorData.error || `Failed to fetch stock price for ${symbol}`,
        response.status,
        symbol
      );
    }
    
    const data = await response.json() as StockPriceResponse;
    
    if (!data || typeof data.price !== 'number') {
      throw new StockAPIError(`Invalid or missing price data for ${symbol}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching stock price for ${symbol}:`, error);
    if (error instanceof StockAPIError) {
      throw error;
    }
    throw new StockAPIError(
      error instanceof Error ? error.message : `Failed to fetch stock price for ${symbol}`
    );
  }
};

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