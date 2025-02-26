import { NextResponse } from 'next/server'

// Use v8 chart API for more reliable price data
const BASE_URL = 'https://query2.finance.yahoo.com/v8/finance/chart'

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

// Simplify the API to focus on getting stock data - we'll let the client currency service handle conversions
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  // We still accept currency parameter for compatibility, but we'll primarily return the source currency
  const requestedCurrency = (searchParams.get('currency') || 'USD').toUpperCase()

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol is required' },
      { status: 400 }
    )
  }

  try {
    // Use the v8 chart API endpoint with 1d interval
    const apiUrl = `${BASE_URL}/${encodeURIComponent(symbol)}?interval=1d&range=1d&includePrePost=false`
    console.log('Fetching from Yahoo Finance:', apiUrl)
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'application/json',
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com'
      }
    })

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Check for API-specific error messages
    if (data.error) {
      throw new Error(data.error.description || 'Failed to fetch stock price')
    }

    // Extract price from response using the v8 API structure
    const result = data?.chart?.result?.[0]
    if (!result) {
      throw new Error(`No data available for symbol: ${symbol}`)
    }

    const meta = result.meta
    const quote = result.indicators?.quote?.[0]
    
    // Try different price sources in order of preference
    let price = meta?.regularMarketPrice
    if (!price && quote?.close?.[0]) {
      price = quote.close[0]
    }
    if (!price && quote?.open?.[0]) {
      price = quote.open[0]
    }

    // Validate price
    if (typeof price !== 'number' || !isFinite(price)) {
      throw new Error(`Could not determine valid price for symbol: ${symbol}`)
    }

    // Get the timestamp
    const timestamp = result.timestamp?.[0] || meta?.regularMarketTime || (Date.now() / 1000)

    // Get the source currency from the API response
    const sourceCurrency = (meta?.currency || 'USD').toUpperCase()
    
    // Format the price to 2 decimal places
    let formattedPrice = Number(price.toFixed(2))
    let conversionApplied = false
    
    // Convert currency if needed
    if (sourceCurrency !== requestedCurrency) {
      const rate = await getExchangeRate(sourceCurrency, requestedCurrency)
      
      if (rate) {
        formattedPrice = Number((formattedPrice * rate).toFixed(2))
        conversionApplied = true
        console.log(`Converted ${symbol} price from ${sourceCurrency} to ${requestedCurrency} using rate ${rate}`)
      } else {
        console.log(`Could not convert ${symbol} price from ${sourceCurrency} to ${requestedCurrency}, returning original currency`)
      }
    }

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      price: formattedPrice,
      lastUpdated: new Date(timestamp * 1000).toISOString(),
      sourceCurrency: sourceCurrency,
      currency: conversionApplied ? requestedCurrency : sourceCurrency,
      conversionApplied,
      requestedCurrency,
      exchangeName: meta?.exchangeName || meta?.fullExchangeName
    }, {
      headers: {
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=20'
      }
    })

  } catch (error) {
    console.error('Stock API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error fetching stock price' },
      { status: 500 }
    )
  }
} 