import { NextResponse } from 'next/server'
import { SYMBOL_TO_ID } from '@/lib/api/crypto'

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'
const COINCAP_API_URL = 'https://api.coincap.io/v2'
const CRYPTOCOMPARE_API_URL = 'https://min-api.cryptocompare.com/data'

// Add environment detection for Replit
const IS_REPLIT = typeof window !== 'undefined' &&
  (window.location.hostname.includes('replit') ||
    window.location.hostname.endsWith('.repl.co'));

// Helper function to get exchange rate with fallbacks
async function getExchangeRate(from: string, to: string): Promise<number | null> {
  // If currencies are the same, no conversion needed
  if (from.toUpperCase() === to.toUpperCase()) {
    return 1;
  }

  try {
    // Use the proxy API to get exchange rates (provides fallback mechanisms)
    const response = await fetch(`/api/proxy/currency?base=${from}&symbols=${to}`, {
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.rates && data.rates[to.toUpperCase()]) {
        console.log(`Got exchange rate for ${from} to ${to}: ${data.rates[to.toUpperCase()]}`);
        return data.rates[to.toUpperCase()];
      }
    }

    console.log(`Proxy API failed for ${from} to ${to}, using hardcoded fallbacks`);

    // Fallback to hardcoded rates if API fails
    const FALLBACK_RATES: Record<string, number> = {
      'USD': 1,
      'EUR': 0.92,
      'GBP': 0.78,
      'SAR': 3.75,
      'PKR': 278.5,
      'AED': 3.67,
      'INR': 83.15,
      'RUB': 91.5
    };

    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    if (FALLBACK_RATES[fromUpper] && FALLBACK_RATES[toUpper]) {
      const rate = FALLBACK_RATES[toUpper] / FALLBACK_RATES[fromUpper];
      console.log(`Using fallback rate for ${from} to ${to}: ${rate}`);
      return rate;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching exchange rate from ${from} to ${to}:`, error);

    // Return hardcoded fallback rates on error
    const FALLBACK_RATES: Record<string, number> = {
      'USD': 1,
      'EUR': 0.92,
      'GBP': 0.78,
      'SAR': 3.75,
      'PKR': 278.5,
      'AED': 3.67,
      'INR': 83.15,
      'RUB': 91.5
    };

    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    if (FALLBACK_RATES[fromUpper] && FALLBACK_RATES[toUpper]) {
      return FALLBACK_RATES[toUpper] / FALLBACK_RATES[fromUpper];
    }

    return null;
  }
}

// Map of CoinGecko IDs to CoinCap IDs for major cryptocurrencies
const COINCAP_ID_MAP: Record<string, string> = {
  'bitcoin': 'bitcoin',
  'ethereum': 'ethereum',
  'tether': 'tether',
  'binancecoin': 'binance-coin',
  'ripple': 'xrp',
  'cardano': 'cardano',
  'dogecoin': 'dogecoin',
  'solana': 'solana',
  'polkadot': 'polkadot',
  'matic-network': 'polygon'
};

// Map of CoinGecko IDs to CryptoCompare symbols
const CRYPTOCOMPARE_SYMBOL_MAP: Record<string, string> = {
  'bitcoin': 'BTC',
  'ethereum': 'ETH',
  'tether': 'USDT',
  'binancecoin': 'BNB',
  'ripple': 'XRP',
  'cardano': 'ADA',
  'dogecoin': 'DOGE',
  'solana': 'SOL',
  'polkadot': 'DOT',
  'matic-network': 'MATIC'
};

// Try to fetch from CryptoCompare API
async function fetchFromCryptoCompare(coinId: string): Promise<number | null> {
  try {
    // Convert CoinGecko ID to CryptoCompare symbol
    const cryptoCompareSymbol = CRYPTOCOMPARE_SYMBOL_MAP[coinId];

    if (!cryptoCompareSymbol) {
      console.warn(`No CryptoCompare symbol mapping for ${coinId}`);
      return null;
    }

    console.log(`Trying CryptoCompare API for ${cryptoCompareSymbol}`);

    const response = await fetch(`${CRYPTOCOMPARE_API_URL}/price?fsym=${cryptoCompareSymbol}&tsyms=USD`, {
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.warn(`CryptoCompare API returned ${response.status} for ${cryptoCompareSymbol}`);
      return null;
    }

    const data = await response.json();

    if (data && data.USD) {
      const price = parseFloat(data.USD);
      console.log(`CryptoCompare price for ${cryptoCompareSymbol}: $${price}`);
      return price;
    }

    console.warn(`No price data found in CryptoCompare response for ${cryptoCompareSymbol}`);
    return null;
  } catch (error) {
    console.error(`Error fetching from CryptoCompare for ${coinId}:`, error);
    return null;
  }
}

// Try to fetch from CoinCap API first (especially on Replit)
async function fetchFromCoinCap(coinId: string): Promise<number | null> {
  try {
    // Convert CoinGecko ID to CoinCap ID if available
    const coincapId = COINCAP_ID_MAP[coinId] || coinId;

    console.log(`Trying CoinCap API for ${coincapId}`);

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
      console.log(`CoinCap price for ${coincapId}: $${price}`);
      return price;
    }

    console.warn(`No price data found in CoinCap response for ${coincapId}`);
    return null;
  } catch (error) {
    console.error(`Error fetching from CoinCap for ${coinId}:`, error);
    return null;
  }
}

// Direct CoinGecko API call with retries
async function fetchFromCoinGecko(coinId: string, retries = 3): Promise<number | null> {
  let lastError = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`CoinGecko attempt ${attempt + 1} for ${coinId}`);

      const response = await fetch(
        `${COINGECKO_API_URL}/simple/price?ids=${coinId}&vs_currencies=usd`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API returned ${response.status}`);
      }

      const data = await response.json();
      if (!data[coinId]?.usd) {
        throw new Error(`No price data found for ${coinId}`);
      }

      return data[coinId].usd;
    } catch (error) {
      console.error(`CoinGecko attempt ${attempt + 1} failed:`, error);
      lastError = error;

      // Wait before retrying (exponential backoff)
      if (attempt < retries - 1) {
        const delay = Math.pow(2, attempt) * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`All ${retries} attempts to CoinGecko failed for ${coinId}`);
  throw lastError;
}

export async function GET(request: Request) {
  // Set CORS headers for cross-origin requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'public, max-age=10, stale-while-revalidate=20'
  };

  // Handle OPTIONS request for CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers });
  }

  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  // Accept currency parameter similar to stocks API
  const requestedCurrency = (searchParams.get('currency') || 'USD').toUpperCase()

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol is required' },
      { status: 400, headers }
    )
  }

  const upperSymbol = symbol.toUpperCase();
  const coinId = SYMBOL_TO_ID[upperSymbol];

  if (!coinId) {
    return NextResponse.json(
      { error: `Unsupported cryptocurrency symbol: ${symbol}` },
      { status: 400, headers }
    )
  }

  try {
    console.log(`Fetching price for ${upperSymbol} (${coinId}) in ${requestedCurrency}`);

    // Variables to track price and source
    let usdPrice = null;
    let source = '';

    // Determine which API to try first based on environment and randomization
    // This helps distribute requests across different APIs
    const random = Math.random();

    // On Replit, we want to avoid CoinGecko due to rate limits
    // Try APIs in different order based on random value
    if (IS_REPLIT) {
      // On Replit, try CryptoCompare first 50% of the time, CoinCap first 50% of the time
      if (random < 0.5) {
        // Try CryptoCompare first
        usdPrice = await fetchFromCryptoCompare(coinId);
        if (usdPrice !== null) {
          source = 'cryptocompare';
          console.log(`Successfully fetched price from CryptoCompare: ${usdPrice}`);
        } else {
          // Then try CoinCap
          usdPrice = await fetchFromCoinCap(coinId);
          if (usdPrice !== null) {
            source = 'coincap';
            console.log(`Successfully fetched price from CoinCap: ${usdPrice}`);
          }
        }
      } else {
        // Try CoinCap first
        usdPrice = await fetchFromCoinCap(coinId);
        if (usdPrice !== null) {
          source = 'coincap';
          console.log(`Successfully fetched price from CoinCap: ${usdPrice}`);
        } else {
          // Then try CryptoCompare
          usdPrice = await fetchFromCryptoCompare(coinId);
          if (usdPrice !== null) {
            source = 'cryptocompare';
            console.log(`Successfully fetched price from CryptoCompare: ${usdPrice}`);
          }
        }
      }

      // Only try CoinGecko as a last resort on Replit
      if (usdPrice === null) {
        try {
          usdPrice = await fetchFromCoinGecko(coinId);
          source = 'coingecko';
          console.log(`Successfully fetched price from CoinGecko: ${usdPrice}`);
        } catch (error) {
          console.error(`CoinGecko fallback failed on Replit:`, error);
        }
      }
    } else {
      // Not on Replit, distribute requests across all three APIs
      if (random < 0.33) {
        // Try CoinGecko first
        try {
          usdPrice = await fetchFromCoinGecko(coinId);
          source = 'coingecko';
          console.log(`Successfully fetched price from CoinGecko: ${usdPrice}`);
        } catch (error) {
          console.error(`CoinGecko attempt failed:`, error);
        }

        // Then try CoinCap
        if (usdPrice === null) {
          usdPrice = await fetchFromCoinCap(coinId);
          if (usdPrice !== null) {
            source = 'coincap';
            console.log(`Successfully fetched price from CoinCap: ${usdPrice}`);
          }
        }

        // Finally try CryptoCompare
        if (usdPrice === null) {
          usdPrice = await fetchFromCryptoCompare(coinId);
          if (usdPrice !== null) {
            source = 'cryptocompare';
            console.log(`Successfully fetched price from CryptoCompare: ${usdPrice}`);
          }
        }
      } else if (random < 0.66) {
        // Try CoinCap first
        usdPrice = await fetchFromCoinCap(coinId);
        if (usdPrice !== null) {
          source = 'coincap';
          console.log(`Successfully fetched price from CoinCap: ${usdPrice}`);
        } else {
          // Then try CryptoCompare
          usdPrice = await fetchFromCryptoCompare(coinId);
          if (usdPrice !== null) {
            source = 'cryptocompare';
            console.log(`Successfully fetched price from CryptoCompare: ${usdPrice}`);
          } else {
            // Finally try CoinGecko
            try {
              usdPrice = await fetchFromCoinGecko(coinId);
              source = 'coingecko';
              console.log(`Successfully fetched price from CoinGecko: ${usdPrice}`);
            } catch (error) {
              console.error(`CoinGecko fallback failed:`, error);
            }
          }
        }
      } else {
        // Try CryptoCompare first
        usdPrice = await fetchFromCryptoCompare(coinId);
        if (usdPrice !== null) {
          source = 'cryptocompare';
          console.log(`Successfully fetched price from CryptoCompare: ${usdPrice}`);
        } else {
          // Then try CoinGecko
          try {
            usdPrice = await fetchFromCoinGecko(coinId);
            source = 'coingecko';
            console.log(`Successfully fetched price from CoinGecko: ${usdPrice}`);
          } catch (error) {
            console.error(`CoinGecko attempt failed:`, error);

            // Finally try CoinCap
            usdPrice = await fetchFromCoinCap(coinId);
            if (usdPrice !== null) {
              source = 'coincap';
              console.log(`Successfully fetched price from CoinCap: ${usdPrice}`);
            }
          }
        }
      }
    }

    // If all APIs fail for major coins, use fallback values
    if (usdPrice === null) {
      if (upperSymbol === 'BTC' || upperSymbol === 'ETH') {
        const fallbackPrices = {
          'BTC': 65000, // Fallback price for BTC
          'ETH': 3500,  // Fallback price for ETH
        };

        usdPrice = fallbackPrices[upperSymbol];
        source = 'fallback';
        console.log(`Using fallback price for ${upperSymbol}: ${usdPrice}`);
      } else {
        throw new Error(`Failed to fetch price for ${upperSymbol} from any API source`);
      }
    }

    // Base price is always in USD from APIs
    let price = usdPrice || 0; // Ensure price is not null
    const sourceCurrency = 'USD';
    let conversionApplied = false;

    // Convert currency if needed and different from USD
    if (requestedCurrency !== 'USD') {
      const rate = await getExchangeRate(sourceCurrency, requestedCurrency);

      if (rate) {
        price = Number((price * rate).toFixed(2));
        conversionApplied = true;
        console.log(`Converted ${symbol} price from ${sourceCurrency} to ${requestedCurrency} using rate ${rate}`);
      } else {
        console.log(`Could not convert ${symbol} price from ${sourceCurrency} to ${requestedCurrency}, returning original currency`);
      }
    }

    return NextResponse.json({
      symbol: upperSymbol,
      price: price,
      lastUpdated: new Date().toISOString(),
      sourceCurrency: sourceCurrency,
      currency: conversionApplied ? requestedCurrency : sourceCurrency,
      conversionApplied,
      source,
      isFallback: source === 'fallback'
    }, { headers })

  } catch (error) {
    console.error('Crypto API Error:', error);

    // Provide fallback prices for major cryptocurrencies
    if (symbol.toUpperCase() === 'BTC') {
      return NextResponse.json({
        symbol: symbol.toUpperCase(),
        price: 65000, // Fallback price for BTC
        lastUpdated: new Date().toISOString(),
        sourceCurrency: 'USD',
        currency: requestedCurrency,
        conversionApplied: false,
        isFallback: true,
        source: 'fallback'
      }, { headers });
    }

    if (symbol.toUpperCase() === 'ETH') {
      return NextResponse.json({
        symbol: symbol.toUpperCase(),
        price: 3500, // Fallback price for ETH
        lastUpdated: new Date().toISOString(),
        sourceCurrency: 'USD',
        currency: requestedCurrency,
        conversionApplied: false,
        isFallback: true,
        source: 'fallback'
      }, { headers });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error fetching crypto price',
        symbol: symbol.toUpperCase()
      },
      { status: 500, headers }
    )
  }
} 