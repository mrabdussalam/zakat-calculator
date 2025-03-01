import fs from 'fs';
import path from 'path';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

export class CryptoAPIError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CryptoAPIError'
  }
}

// Default fallback mapping in case API fetch fails
const DEFAULT_MAPPINGS = {
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
};

// Initialize symbol-to-id mapping
let SYMBOL_TO_ID: Record<string, string> = {};

// Function to fetch and transform CoinGecko data
async function initializeCoinMapping() {
  try {
    // First try to use local JSON file if available
    try {
      const filePath = path.join(process.cwd(), 'data', 'coin_list.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      SYMBOL_TO_ID = JSON.parse(fileContent);
      console.log(`Loaded ${Object.keys(SYMBOL_TO_ID).length} cryptocurrency symbols from coin_list.json`);
      return;
    } catch (fileError) {
      console.log('Local coin_list.json not found or invalid, fetching from API...');
    }

    // If local file doesn't exist, fetch from API
    const response = await fetch(`${COINGECKO_API_URL}/coins/list`);

    if (!response.ok) {
      throw new Error(`Failed to fetch coin list: ${response.status}`);
    }

    const coins = await response.json();

    // Transform data: uppercase symbols as keys, coin ids as values
    const mapping: Record<string, string> = {};
    coins.forEach((coin: { id: string; symbol: string }) => {
      mapping[coin.symbol.toUpperCase()] = coin.id;
    });

    SYMBOL_TO_ID = mapping;
    console.log(`Loaded ${Object.keys(SYMBOL_TO_ID).length} cryptocurrency symbols from CoinGecko API`);

    // Optionally save to file for future use
    try {
      const filePath = path.join(process.cwd(), 'data', 'coin_list.json');
      fs.writeFileSync(filePath, JSON.stringify(SYMBOL_TO_ID, null, 2), 'utf8');
      console.log('Saved coin mapping to coin_list.json');
    } catch (saveError) {
      console.error('Failed to save coin mapping to file:', saveError);
    }

  } catch (error) {
    console.error('Error initializing coin mapping:', error);
    // Fall back to default mappings if everything fails
    SYMBOL_TO_ID = DEFAULT_MAPPINGS;
    console.log('Using default coin mappings');
  }
}

// Initialize the mapping (execute immediately in server context)
// In Next.js, this will run when the module is first imported
initializeCoinMapping().catch(error => {
  console.error('Failed to initialize coin mapping:', error);
  SYMBOL_TO_ID = DEFAULT_MAPPINGS;
});


// Export for use in API
export { SYMBOL_TO_ID };


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