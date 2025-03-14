import { SYMBOL_TO_ID, DEFAULT_MAPPINGS } from '@/data/crypto-mappings';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'
const COINCAP_API_URL = 'https://api.coincap.io/v2'
const CRYPTOCOMPARE_API_URL = 'https://min-api.cryptocompare.com/data'

// Add environment detection for Replit
const IS_REPLIT = typeof window !== 'undefined' &&
  (window.location.hostname.includes('replit') ||
    window.location.hostname.endsWith('.repl.co'));

// Fallback prices for major cryptocurrencies
const FALLBACK_PRICES: Record<string, number> = {
  'BTC': 65000, // Fallback price for BTC
  'ETH': 3500,  // Fallback price for ETH
};

// Map of cryptocurrency symbols to CoinCap IDs
const COINCAP_SYMBOL_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'BNB': 'binance-coin',
  'XRP': 'xrp',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'SOL': 'solana',
  'DOT': 'polkadot',
  'MATIC': 'polygon'
};

// Direct mapping for CryptoCompare (uses standard symbols)
const CRYPTOCOMPARE_SYMBOLS = [
  'BTC', 'ETH', 'USDT', 'BNB', 'XRP',
  'ADA', 'DOGE', 'SOL', 'DOT', 'MATIC'
];

export class CryptoAPIError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CryptoAPIError'
  }
}

// Export for use in API
export { SYMBOL_TO_ID, DEFAULT_MAPPINGS };

/**
 * Try to fetch price directly from CryptoCompare API
 * @param symbol The cryptocurrency symbol (e.g., BTC, ETH)
 * @returns The current price in USD or null if failed
 */
async function fetchFromCryptoCompare(symbol: string): Promise<number | null> {
  try {
    const upperSymbol = symbol.toUpperCase();

    // Check if symbol is supported by CryptoCompare
    if (!CRYPTOCOMPARE_SYMBOLS.includes(upperSymbol)) {
      console.warn(`Symbol ${upperSymbol} not in CryptoCompare supported list`);
      return null;
    }

    console.log(`Trying CryptoCompare API for ${upperSymbol}`);

    const response = await fetch(`${CRYPTOCOMPARE_API_URL}/price?fsym=${upperSymbol}&tsyms=USD`, {
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.warn(`CryptoCompare API returned ${response.status} for ${upperSymbol}`);
      return null;
    }

    const data = await response.json();

    if (data && data.USD) {
      const price = parseFloat(data.USD);
      console.log(`CryptoCompare price for ${upperSymbol}: $${price}`);
      return price;
    }

    console.warn(`No price data found in CryptoCompare response for ${upperSymbol}`);
    return null;
  } catch (error) {
    console.error(`Error fetching from CryptoCompare:`, error);
    return null;
  }
}

/**
 * Try to fetch price directly from CoinCap API
 * @param symbol The cryptocurrency symbol (e.g., BTC, ETH)
 * @returns The current price in USD or null if failed
 */
async function fetchFromCoinCap(symbol: string): Promise<number | null> {
  try {
    const upperSymbol = symbol.toUpperCase();
    // Get the CoinCap ID for this symbol
    const coincapId = COINCAP_SYMBOL_MAP[upperSymbol];

    if (!coincapId) {
      console.warn(`No CoinCap ID mapping for ${upperSymbol}`);
      return null;
    }

    console.log(`Trying CoinCap API for ${upperSymbol} (${coincapId})`);

    const response = await fetch(`${COINCAP_API_URL}/assets/${coincapId}`, {
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.warn(`CoinCap API returned ${response.status} for ${coincapId}`);
      return null;
    }

    const data = await response.json();

    if (data && data.data && data.data.priceUsd) {
      const price = parseFloat(data.data.priceUsd);
      console.log(`CoinCap price for ${upperSymbol}: $${price}`);
      return price;
    }

    console.warn(`No price data found in CoinCap response for ${coincapId}`);
    return null;
  } catch (error) {
    console.error(`Error fetching from CoinCap:`, error);
    return null;
  }
}

/**
 * Fetches the current price of a cryptocurrency 
 * @param symbol The cryptocurrency symbol (e.g., BTC, ETH)
 * @param currency The currency to fetch the price in (default: USD)
 * @returns The current price in the specified currency
 * @throws CryptoAPIError if the API request fails or the symbol is invalid
 */
export async function getCryptoPrice(symbol: string, currency: string = 'USD'): Promise<number> {
  const upperSymbol = symbol.toUpperCase();

  try {
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
      // For major cryptocurrencies, try direct API calls as fallbacks
      if (upperSymbol === 'BTC' || upperSymbol === 'ETH') {
        console.log(`Attempting direct API fallbacks for ${upperSymbol}...`);

        // Try CryptoCompare first (often has higher rate limits)
        const cryptoComparePrice = await fetchFromCryptoCompare(upperSymbol);
        if (cryptoComparePrice !== null) {
          console.log(`Direct CryptoCompare fallback successful for ${upperSymbol}: ${cryptoComparePrice}`);
          return cryptoComparePrice;
        }

        // Then try CoinCap
        const coincapPrice = await fetchFromCoinCap(upperSymbol);
        if (coincapPrice !== null) {
          console.log(`Direct CoinCap fallback successful for ${upperSymbol}: ${coincapPrice}`);
          return coincapPrice;
        }

        // Finally try CoinGecko (skip on Replit)
        if (!IS_REPLIT) {
          try {
            console.log(`Attempting direct CoinGecko fallback for ${upperSymbol}...`);
            const coinId = upperSymbol === 'BTC' ? 'bitcoin' : 'ethereum';

            const fallbackResponse = await fetch(
              `${COINGECKO_API_URL}/simple/price?ids=${coinId}&vs_currencies=usd`
            );

            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              if (fallbackData[coinId]?.usd) {
                console.log(`CoinGecko fallback successful for ${symbol}: ${fallbackData[coinId].usd}`);
                return fallbackData[coinId].usd;
              }
            }
          } catch (fallbackError) {
            console.error(`CoinGecko fallback attempt failed for ${symbol}:`, fallbackError);
          }
        }

        // If all else fails, return hardcoded fallback price
        console.log(`Using hardcoded fallback price for ${upperSymbol}`);
        return FALLBACK_PRICES[upperSymbol];
      }

      throw error;
    }

    // If we can't fetch from our API, try direct fallbacks for major coins
    if (upperSymbol === 'BTC' || upperSymbol === 'ETH') {
      // Try CryptoCompare first
      console.log(`Attempting direct CryptoCompare fallback for ${upperSymbol}...`);
      const cryptoComparePrice = await fetchFromCryptoCompare(upperSymbol);
      if (cryptoComparePrice !== null) {
        console.log(`Direct CryptoCompare fallback successful for ${upperSymbol}: ${cryptoComparePrice}`);
        return cryptoComparePrice;
      }

      // Then try CoinCap
      console.log(`Attempting direct CoinCap fallback for ${upperSymbol}...`);
      const coincapPrice = await fetchFromCoinCap(upperSymbol);
      if (coincapPrice !== null) {
        console.log(`Direct CoinCap fallback successful for ${upperSymbol}: ${coincapPrice}`);
        return coincapPrice;
      }

      // Finally try CoinGecko (skip on Replit)
      if (!IS_REPLIT) {
        try {
          console.log(`Attempting direct CoinGecko fallback for ${upperSymbol}...`);
          const coinId = upperSymbol === 'BTC' ? 'bitcoin' : 'ethereum';

          const fallbackResponse = await fetch(
            `${COINGECKO_API_URL}/simple/price?ids=${coinId}&vs_currencies=usd`
          );

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData[coinId]?.usd) {
              console.log(`CoinGecko fallback successful for ${symbol}: ${fallbackData[coinId].usd}`);
              return fallbackData[coinId].usd;
            }
          }
        } catch (fallbackError) {
          console.error(`CoinGecko fallback attempt failed for ${symbol}:`, fallbackError);
        }
      }

      // If all else fails, return hardcoded fallback price
      console.log(`Using hardcoded fallback price for ${upperSymbol}`);
      return FALLBACK_PRICES[upperSymbol];
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
  return !!SYMBOL_TO_ID[upperSymbol] ||
    !!COINCAP_SYMBOL_MAP[upperSymbol] ||
    CRYPTOCOMPARE_SYMBOLS.includes(upperSymbol);
} 