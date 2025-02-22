const BASE_URL = '/api/prices/stocks'

export interface StockPrice {
  symbol: string
  price: number
  lastUpdated: Date
  currency?: string
  exchangeName?: string
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

export async function getStockPrice(symbol: string): Promise<StockPrice> {
  if (!symbol || typeof symbol !== 'string') {
    throw new StockAPIError('Invalid symbol', 400)
  }

  try {
    const response = await fetchWithRetry(`${BASE_URL}?symbol=${encodeURIComponent(symbol.trim())}`)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new StockAPIError(
        errorData.error || `Failed to fetch stock price: ${response.status} ${response.statusText}`,
        response.status,
        symbol
      )
    }

    const data = await response.json()

    // Validate the response data
    if (!data || typeof data.price !== 'number' || !isFinite(data.price)) {
      throw new StockAPIError(`Invalid price data received for ${symbol}`, 400, symbol)
    }

    // Ensure we have a valid price
    const price = Number(data.price)
    if (isNaN(price) || !isFinite(price) || price < 0) {
      throw new StockAPIError(`Invalid price format for ${symbol}`, 400, symbol)
    }

    return {
      symbol: data.symbol,
      price: price,
      lastUpdated: new Date(data.lastUpdated),
      currency: data.currency,
      exchangeName: data.exchangeName
    }
  } catch (error) {
    console.error(`Failed to fetch price for ${symbol}:`, error)
    if (error instanceof StockAPIError) {
      throw error
    }
    throw new StockAPIError(
      `Failed to fetch price for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      symbol
    )
  }
}

export async function getBatchStockPrices(symbols: string[]): Promise<StockPrice[]> {
  if (!Array.isArray(symbols) || symbols.length === 0) {
    throw new StockAPIError('Invalid symbols array', 400)
  }

  // Deduplicate and validate symbols
  const uniqueSymbols = [...new Set(symbols.filter(Boolean).map(s => s.trim()))]
  if (uniqueSymbols.length === 0) {
    throw new StockAPIError('No valid symbols provided', 400)
  }

  try {
    // Process each symbol individually with retry logic
    const results = await Promise.all(
      uniqueSymbols.map(async symbol => {
        try {
          return await getStockPrice(symbol)
        } catch (error) {
          console.error(`Failed to fetch price for ${symbol}:`, error)
          return null
        }
      })
    )
    
    // Filter out failed requests
    const validResults = results.filter((result): result is StockPrice => result !== null)
    
    if (validResults.length === 0) {
      throw new StockAPIError('Failed to fetch any stock prices', 500)
    }
    
    return validResults
  } catch (error) {
    console.error('Failed to fetch batch stock prices:', error)
    if (error instanceof StockAPIError) {
      throw error
    }
    throw new StockAPIError('Failed to fetch batch stock prices', 500)
  }
}

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