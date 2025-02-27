import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get query from the request
    const query = request.nextUrl.searchParams.get('q') || ''
    
    // Validate we have a search query
    if (!query) {
      return NextResponse.json(
        { error: 'No search query provided' },
        { status: 400 }
      )
    }
    
    // CoinGecko API URL for search
    const apiUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`
    
    // Fetch data from CoinGecko
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to search cryptocurrencies' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    // Extract only coins from the response
    const coins = data.coins || []
    
    // Limit to top 10 results
    const limitedResults = coins.slice(0, 10)
    
    return NextResponse.json(limitedResults)
  } catch (error) {
    console.error('Error searching cryptocurrencies:', error)
    return NextResponse.json(
      { error: 'Failed to search cryptocurrencies' },
      { status: 500 }
    )
  }
} 