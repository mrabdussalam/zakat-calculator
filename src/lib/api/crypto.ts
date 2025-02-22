const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

export class CryptoAPIError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CryptoAPIError'
  }
}

// Map common symbols to CoinGecko IDs
export const SYMBOL_TO_ID: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'SOL': 'solana',
  'DOT': 'polkadot',
  'MATIC': 'matic-network'
}

/**
 * Fetches the current price of a cryptocurrency in USD
 * @param symbol The cryptocurrency symbol (e.g., BTC, ETH)
 * @returns The current price in USD
 * @throws CryptoAPIError if the API request fails or the symbol is invalid
 */
export async function getCryptoPrice(symbol: string): Promise<number> {
  try {
    const upperSymbol = symbol.toUpperCase()
    const coinId = SYMBOL_TO_ID[upperSymbol]
    
    if (!coinId) {
      throw new CryptoAPIError(`Unsupported cryptocurrency symbol: ${symbol}`)
    }

    const response = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=${coinId}&vs_currencies=usd`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch price from CoinGecko')
    }

    const data = await response.json()
    if (!data[coinId]?.usd) {
      throw new CryptoAPIError(`No price data found for ${symbol}`)
    }

    return data[coinId].usd
  } catch (error) {
    if (error instanceof CryptoAPIError) {
      throw error
    }
    throw new CryptoAPIError(
      error instanceof Error ? error.message : 'Failed to fetch crypto price'
    )
  }
}

/**
 * Validates if a cryptocurrency symbol is supported
 * @param symbol The cryptocurrency symbol to validate
 * @returns True if the symbol is valid, false otherwise
 */
export async function validateCryptoSymbol(symbol: string): Promise<boolean> {
  const upperSymbol = symbol.toUpperCase()
  return !!SYMBOL_TO_ID[upperSymbol]
} 