import { SYMBOL_TO_ID, DEFAULT_MAPPINGS } from '@/data/crypto-mappings';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

export class CryptoAPIError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CryptoAPIError'
  }
}

// Export for use in API
export { SYMBOL_TO_ID, DEFAULT_MAPPINGS };

/**
 * Fetches the current price of a cryptocurrency 
 * @param symbol The cryptocurrency symbol (e.g., BTC, ETH)
 * @param currency The currency to fetch the price in (default: USD)
 * @returns The current price in the specified currency
 * @throws CryptoAPIError if the API request fails or the symbol is invalid
 */
export async function getCryptoPrice(symbol: string, currency: string = 'USD'): Promise<number> {
  try {
    const upperSymbol = symbol.toUpperCase()

    // Call our local API which includes currency conversion
    const response = await fetch(`/api/prices/crypto?symbol=${encodeURIComponent(upperSymbol)}&currency=${currency}`)

    if (!response.ok) {
      const errorData = await response.json()
      throw new CryptoAPIError(errorData.error || 'Failed to fetch crypto price')
    }

    const data = await response.json()
    return data.price
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