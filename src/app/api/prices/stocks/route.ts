import { NextResponse } from 'next/server'

const BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get('ticker')

  if (!ticker) {
    return NextResponse.json(
      { error: 'Ticker symbol is required' },
      { status: 400 }
    )
  }

  try {
    const apiUrl = `${BASE_URL}/${ticker}`
    console.log('Fetching from Yahoo Finance:', ticker)
    
    const response = await fetch(apiUrl)
    const data = await response.json()

    // Log the response for debugging
    console.log('Yahoo Finance Response:', data)

    if (!response.ok) {
      return NextResponse.json(
        { error: `Yahoo Finance API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    // Check for API-specific error messages
    if (data.error) {
      return NextResponse.json(
        { error: data.error.description || 'Failed to fetch stock price' },
        { status: 400 }
      )
    }
    
    // Check if we have valid data
    const result = data.chart?.result?.[0]
    if (!result || !result.meta || typeof result.meta.regularMarketPrice !== 'number' || !isFinite(result.meta.regularMarketPrice)) {
      return NextResponse.json(
        { error: `No valid price data available for ticker: ${ticker}. Please verify the symbol is correct.` },
        { status: 404 }
      )
    }

    // Return the current price with proper validation
    const price = Number(result.meta.regularMarketPrice)
    if (!isFinite(price)) {
      return NextResponse.json(
        { error: `Invalid price data received for ticker: ${ticker}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ticker: ticker.toUpperCase(),
      price: price,
      lastUpdated: new Date(result.meta.regularMarketTime * 1000).toISOString()
    })

  } catch (error) {
    console.error('Stock API Error:', error)
    return NextResponse.json(
      { error: `Failed to fetch stock price: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
} 