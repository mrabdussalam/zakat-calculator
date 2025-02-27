import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    // Use currency param from request or default to USD
    const currency = request.nextUrl.searchParams.get('currency') || 'USD'
    
    // CoinGecko API URL for the specified coin
    const apiUrl = `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
    
    // Fetch data from CoinGecko
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch data for coin ${id}` },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    // Extract relevant data for the response
    const result = {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      image: data.image?.large,
      current_price: data.market_data?.current_price?.[currency.toLowerCase()] || null,
      market_cap: data.market_data?.market_cap?.[currency.toLowerCase()] || null,
      market_cap_rank: data.market_cap_rank,
      total_volume: data.market_data?.total_volume?.[currency.toLowerCase()] || null,
      price_change_percentage_24h: data.market_data?.price_change_percentage_24h,
      price_change_percentage_7d: data.market_data?.price_change_percentage_7d,
      price_change_percentage_30d: data.market_data?.price_change_percentage_30d,
      circulating_supply: data.market_data?.circulating_supply,
      total_supply: data.market_data?.total_supply,
      currency: currency
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching crypto data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cryptocurrency data' },
      { status: 500 }
    )
  }
} 