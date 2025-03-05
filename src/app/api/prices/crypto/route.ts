import { NextResponse } from 'next/server'
import { SYMBOL_TO_ID } from '@/lib/api/crypto'

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

// Helper function to get exchange rate with fallbacks
async function getExchangeRate(from: string, to: string): Promise<number | null> {
  // If currencies are the same, no conversion needed
  if (from.toUpperCase() === to.toUpperCase()) {
    return 1;
  }

  try {
    // Always try to get exchange rate from Frankfurter API first
    const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);

    if (response.ok) {
      const data = await response.json();
      if (data && data.rates && data.rates[to.toUpperCase()]) {
        console.log(`Got real-time exchange rate for ${from} to ${to}: ${data.rates[to.toUpperCase()]}`);
        return data.rates[to.toUpperCase()];
      }
    }

    console.log(`Frankfurter API failed for ${from} to ${to}, using fallbacks`);

    // Fallback to hardcoded rates if API fails
    // Special case for USD to SAR (Saudi Riyal)
    if (from.toUpperCase() === 'USD' && to.toUpperCase() === 'SAR') {
      console.log(`Using fallback rate for USD to SAR: 3.75`);
      return 3.75; // Fixed rate for SAR
    }

    // Special case for USD to PKR (Pakistani Rupee) - approximate rate
    if (from.toUpperCase() === 'USD' && to.toUpperCase() === 'PKR') {
      console.log(`Using fallback rate for USD to PKR: 278.5`);
      return 278.5; // Approximate rate for PKR
    }

    return null;
  } catch (error) {
    console.error(`Error fetching exchange rate from ${from} to ${to}:`, error);

    // Fallback to hardcoded rates if error occurs
    if (from.toUpperCase() === 'USD' && to.toUpperCase() === 'SAR') {
      console.log(`Using fallback rate after error for USD to SAR: 3.75`);
      return 3.75;
    }

    if (from.toUpperCase() === 'USD' && to.toUpperCase() === 'PKR') {
      console.log(`Using fallback rate after error for USD to PKR: 278.5`);
      return 278.5;
    }

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

  try {
    const upperSymbol = symbol.toUpperCase()
    const coinId = SYMBOL_TO_ID[upperSymbol]

    if (!coinId) {
      return NextResponse.json(
        { error: `Unsupported cryptocurrency symbol: ${symbol}` },
        { status: 400, headers }
      )
    }

    console.log(`Fetching price for ${upperSymbol} (${coinId}) in ${requestedCurrency}`);

    // Use the direct CoinGecko function with retries
    const usdPrice = await fetchFromCoinGecko(coinId);

    // Base price is always in USD from CoinGecko
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
      requestedCurrency
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
        isFallback: true
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
        isFallback: true
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