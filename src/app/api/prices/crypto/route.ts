import { NextResponse } from 'next/server'
import { SYMBOL_TO_ID } from '@/lib/api/crypto'

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

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

    return NextResponse.json({
      symbol: upperSymbol,
      price: data[coinId].usd,
      lastUpdated: new Date().toISOString(),
      currency: 'USD'
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