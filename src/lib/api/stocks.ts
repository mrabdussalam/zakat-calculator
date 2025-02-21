const BASE_URL = '/api/prices/stocks'

export interface StockPrice {
  ticker: string
  price: number
  lastUpdated: Date
}

export class StockAPIError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StockAPIError'
  }
}

export async function getStockPrice(ticker: string): Promise<StockPrice> {
  try {
    const url = `${BASE_URL}?ticker=${encodeURIComponent(ticker)}`
    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      throw new StockAPIError(data.error || 'Failed to fetch stock price')
    }

    // Validate the price data
    if (!data || typeof data.price !== 'number' || !isFinite(data.price)) {
      throw new StockAPIError(`Invalid price data received for ${ticker}`)
    }

    return {
      ticker: data.ticker.toUpperCase(),
      price: Number(data.price),
      lastUpdated: new Date(data.lastUpdated)
    }
  } catch (error) {
    console.error(`Failed to fetch price for ${ticker}:`, error)
    throw new StockAPIError(`Failed to fetch price for ${ticker}`)
  }
}

export async function getBatchStockPrices(tickers: string[]): Promise<StockPrice[]> {
  try {
    // Yahoo Finance allows multiple symbols in one request
    const results = await Promise.all(
      tickers.map(ticker => getStockPrice(ticker))
    )
    return results
  } catch (error) {
    console.error('Failed to fetch batch stock prices:', error)
    throw new StockAPIError('Failed to fetch batch stock prices')
  }
}

export async function validateTicker(ticker: string): Promise<boolean> {
  try {
    const url = `${BASE_URL}?ticker=${encodeURIComponent(ticker)}`
    const response = await fetch(url)
    const data = await response.json()
    
    return response.ok && data.price !== undefined
  } catch (error) {
    console.error(`Failed to validate ticker ${ticker}:`, error)
    return false
  }
} 