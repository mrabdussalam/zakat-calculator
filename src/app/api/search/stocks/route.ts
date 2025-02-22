import { NextResponse } from 'next/server'

const BASE_URL = 'https://query2.finance.yahoo.com/v1/finance/search'

// Rate limiting map
const RATE_LIMIT = new Map<string, number>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_REQUESTS = 10 // Maximum requests per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const lastRequest = RATE_LIMIT.get(ip) || 0
  
  // Clear old entries
  if (now - lastRequest > RATE_LIMIT_WINDOW) {
    RATE_LIMIT.delete(ip)
    return false
  }
  
  const requestCount = RATE_LIMIT.get(ip) || 0
  return requestCount > MAX_REQUESTS
}

function updateRateLimit(ip: string) {
  const requestCount = RATE_LIMIT.get(ip) || 0
  RATE_LIMIT.set(ip, requestCount + 1)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const ip = request.headers.get('x-forwarded-for') || 'unknown'

    // Check rate limiting
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // Update rate limit counter
    updateRateLimit(ip)

    const apiUrl = `${BASE_URL}?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`
    console.log('Searching stocks:', query)
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'application/json',
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com'
      },
      next: { revalidate: 60 } // Cache for 1 minute
    })

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Log the response for debugging
    console.log('Yahoo Finance Search Response:', data)

    // Check for API-specific error messages
    if (data.error) {
      throw new Error(data.error.description || 'Failed to search stocks')
    }

    // Extract and format the results
    const results = (data.quotes || [])
      .filter((quote: any) => {
        // Only include equity and ETF quotes with valid symbols
        return (quote.quoteType === 'EQUITY' || quote.quoteType === 'ETF') && 
               quote.symbol && 
               !quote.symbol.includes('^') // Exclude indices
      })
      .map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        exchange: quote.exchange || quote.fullExchangeName || '',
        type: quote.quoteType,
        score: quote.score
      }))
      .sort((a: any, b: any) => (b.score || 0) - (a.score || 0)) // Sort by relevance score

    // Return the response with CORS and cache headers
    return new NextResponse(JSON.stringify(results), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    })

  } catch (error) {
    console.error('Stock Search API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error searching stocks' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
} 