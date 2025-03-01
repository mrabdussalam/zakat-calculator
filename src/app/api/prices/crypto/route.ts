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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  // Accept currency parameter similar to stocks API
  const requestedCurrency = (searchParams.get('currency') || 'USD').toUpperCase()

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol is required' },
      { status: 400 }
    )
  }

  try {
    const upperSymbol = symbol.toUpperCase()
    const coinId = SYMBOL_TO_ID[upperSymbol]

    if (!coinId) {
      return NextResponse.json(
        { error: `Unsupported cryptocurrency symbol: ${symbol}` },
        { status: 400 }
      )
    }

    const response = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=${coinId}&vs_currencies=usd`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch price from CoinGecko')
    }

    const data = await response.json()
    if (!data[coinId]?.usd) {
      throw new Error(`No price data found for ${symbol}`)
    }

    // Base price is always in USD from CoinGecko
    let price = data[coinId].usd
    const sourceCurrency = 'USD'
    let conversionApplied = false

    // Convert currency if needed and different from USD
    if (requestedCurrency !== 'USD') {
      const rate = await getExchangeRate(sourceCurrency, requestedCurrency)

      if (rate) {
        price = Number((price * rate).toFixed(2))
        conversionApplied = true
        console.log(`Converted ${symbol} price from ${sourceCurrency} to ${requestedCurrency} using rate ${rate}`)
      } else {
        console.log(`Could not convert ${symbol} price from ${sourceCurrency} to ${requestedCurrency}, returning original currency`)
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
    }, {
      headers: {
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=20'
      }
    })

  } catch (error) {
    console.error('Crypto API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error fetching crypto price' },
      { status: 500 }
    )
  }
} 