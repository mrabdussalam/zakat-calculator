import { NextResponse } from 'next/server'

const BASE_URL = 'https://query2.finance.yahoo.com/v1/finance/search'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 }
    )
  }

  try {
    const apiUrl = `${BASE_URL}?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`
    console.log('Searching stocks:', query)
    
    const response = await fetch(apiUrl)
    const data = await response.json()

    // Log the response for debugging
    console.log('Yahoo Finance Search Response:', data)

    if (!response.ok) {
      return NextResponse.json(
        { error: `Yahoo Finance API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    // Check for API-specific error messages
    if (data.error) {
      return NextResponse.json(
        { error: data.error.description || 'Failed to search stocks' },
        { status: 400 }
      )
    }

    // Extract and format the results
    const results = (data.quotes || [])
      .filter((quote: any) => quote.quoteType === 'EQUITY')
      .map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        exchange: quote.exchange || ''
      }))

    return NextResponse.json(results)

  } catch (error) {
    console.error('Stock Search API Error:', error)
    return NextResponse.json(
      { error: `Failed to search stocks: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
} 