import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get ids from the request
    const ids = request.nextUrl.searchParams.get('ids') || ''
    
    // Get currency from the request (default to USD)
    const currency = request.nextUrl.searchParams.get('currency')?.toLowerCase() || 'usd'
    
    // Validate we have coin IDs
    if (!ids) {
      return NextResponse.json(
        { error: 'No coin IDs provided' },
        { status: 400 }
      )
    }
    
    // CoinGecko API URL with the specified coins
    const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${currency}&include_24hr_change=true`
    
    // Fetch data from CoinGecko
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch cryptocurrency prices' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    // Add the currency to the response
    const result = {
      prices: data,
      currency: currency
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching crypto prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cryptocurrency prices' },
      { status: 500 }
    )
  }
} 