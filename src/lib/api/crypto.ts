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

    // Get the base URL dynamically to support both local and deployed environments
    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_API_BASE_URL || '';

    // Use absolute URL with origin for better compatibility in deployed environments
    const apiUrl = `${baseUrl}/api/prices/crypto?symbol=${encodeURIComponent(upperSymbol)}&currency=${currency}`;

    console.log(`Fetching crypto price for ${upperSymbol} in ${currency} from: ${apiUrl}`);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP error ${response.status}` }));
      console.error(`Error fetching ${upperSymbol} price:`, errorData);
      throw new CryptoAPIError(errorData.error || `Failed to fetch crypto price for ${upperSymbol}`);
    }

    const data = await response.json();
    console.log(`Received price data for ${upperSymbol}:`, data);

    if (!data.price && data.price !== 0) {
      throw new CryptoAPIError(`No price data returned for ${upperSymbol}`);
    }

    return data.price;
  } catch (error) {
    console.error(`Error in getCryptoPrice for ${symbol}:`, error);

    if (error instanceof CryptoAPIError) {
      throw error;
    }

    // If we can't fetch from our API, try a direct fallback for major coins
    if (symbol.toUpperCase() === 'BTC' || symbol.toUpperCase() === 'ETH') {
      try {
        console.log(`Attempting direct CoinGecko fallback for ${symbol}...`);
        const coinId = symbol.toUpperCase() === 'BTC' ? 'bitcoin' : 'ethereum';
        const fallbackResponse = await fetch(
          `${COINGECKO_API_URL}/simple/price?ids=${coinId}&vs_currencies=usd`
        );

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData[coinId]?.usd) {
            console.log(`Fallback successful for ${symbol}: ${fallbackData[coinId].usd}`);
            return fallbackData[coinId].usd;
          }
        }
      } catch (fallbackError) {
        console.error(`Fallback attempt failed for ${symbol}:`, fallbackError);
      }
    }

    throw new CryptoAPIError(
      error instanceof Error ? error.message : `Failed to fetch crypto price for ${symbol}`
    );
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