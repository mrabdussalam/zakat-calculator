import { NextResponse } from 'next/server'

// Use v8 chart API for more reliable price data
const BASE_URL = 'https://query2.finance.yahoo.com/v8/finance/chart'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')

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
    console.log('Yahoo Finance Response:', JSON.stringify(data, null, 2))

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

    // Format the price to 2 decimal places
    const formattedPrice = Number(price.toFixed(2))

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      price: formattedPrice,
      lastUpdated: new Date(timestamp * 1000).toISOString(),
      currency: meta?.currency || 'USD',
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