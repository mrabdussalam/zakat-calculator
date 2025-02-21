import { NextResponse } from 'next/server'

interface PriceRequest {
  type: 'crypto' | 'stock' | 'metal'
  symbol: string
  currency: string
}

async function fetchCryptoPrice(symbol: string, currency: string) {
  try {
    // Using CoinGecko API (free tier)
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=${currency.toLowerCase()}`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch crypto price')
    }

    const data = await response.json()
    return data[symbol][currency.toLowerCase()]
  } catch (error) {
    console.error('Error fetching crypto price:', error)
    throw error
  }
}

async function fetchStockPrice(symbol: string) {
  try {
    // Using Alpha Vantage API (you'll need an API key)
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch stock price')
    }

    const data = await response.json()
    return parseFloat(data['Global Quote']['05. price'])
  } catch (error) {
    console.error('Error fetching stock price:', error)
    throw error
  }
}

async function fetchMetalPrice(symbol: string, currency: string) {
  try {
    // Using metals API (you'll need to replace with your preferred provider)
    const response = await fetch(
      `https://api.metals.live/v1/spot/${currency.toLowerCase()}`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch metal price')
    }

    const data = await response.json()
    return data[symbol.toLowerCase()]
  } catch (error) {
    console.error('Error fetching metal price:', error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    const requests: PriceRequest[] = await request.json()
    
    const prices = await Promise.all(
      requests.map(async ({ type, symbol, currency }) => {
        try {
          let price: number

          switch (type) {
            case 'crypto':
              price = await fetchCryptoPrice(symbol, currency)
              break
            case 'stock':
              price = await fetchStockPrice(symbol)
              break
            case 'metal':
              price = await fetchMetalPrice(symbol, currency)
              break
            default:
              throw new Error(`Unsupported asset type: ${type}`)
          }

          return {
            type,
            symbol,
            price,
            currency,
            timestamp: new Date().toISOString()
          }
        } catch (error) {
          console.error(`Error fetching price for ${type} ${symbol}:`, error)
          return {
            type,
            symbol,
            error: 'Failed to fetch price',
            currency,
            timestamp: new Date().toISOString()
          }
        }
      })
    )

    return NextResponse.json({ prices })
  } catch (error) {
    console.error('Error processing price requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset prices' },
      { status: 500 }
    )
  }
} 