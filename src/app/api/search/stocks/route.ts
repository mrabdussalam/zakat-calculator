import { NextResponse } from 'next/server'
import { getYahooSession, clearYahooSession, YAHOO_USER_AGENT } from '@/lib/api/yahooSession'

// ─── Rate limiting ──────────────────────────────────────────────────────────

const RATE_LIMIT = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT_WINDOW = 60000
const MAX_REQUESTS = 10

interface Quote {
  quoteType: string
  symbol: string
  shortname?: string
  longname?: string
  exchange?: string
  fullExchangeName?: string
  score?: number
}

function isRateLimited(ip: string): boolean {
  const entry = RATE_LIMIT.get(ip)
  if (!entry || Date.now() - entry.windowStart > RATE_LIMIT_WINDOW) return false
  return entry.count >= MAX_REQUESTS
}

function updateRateLimit(ip: string) {
  const now = Date.now()
  const entry = RATE_LIMIT.get(ip)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    RATE_LIMIT.set(ip, { count: 1, windowStart: now })
  } else {
    entry.count++
  }
}

// ─── Yahoo Finance search ───────────────────────────────────────────────────

const YAHOO_SEARCH_URL = 'https://query1.finance.yahoo.com/v1/finance/search'

function buildSearchParams(query: string, crumb?: string): URLSearchParams {
  const params = new URLSearchParams({
    q: query,
    quotesCount: '10',
    newsCount: '0',
    enableFuzzyQuery: 'false',
    quotesQueryId: 'tss_match_phrase_query',
  })
  if (crumb) {
    params.set('crumb', crumb)
  }
  return params
}

async function searchYahooFinance(query: string): Promise<Quote[]> {
  // 1. Try simple request first (no crumb auth) — works most of the time
  const simpleParams = buildSearchParams(query)
  const simpleRes = await fetch(`${YAHOO_SEARCH_URL}?${simpleParams}`, {
    headers: {
      'User-Agent': YAHOO_USER_AGENT,
      'Accept': 'application/json',
      'Origin': 'https://finance.yahoo.com',
      'Referer': 'https://finance.yahoo.com',
    },
    signal: AbortSignal.timeout(5000),
  })

  if (simpleRes.ok) {
    const data = await simpleRes.json()
    if (!data.error) {
      return data.quotes || []
    }
  }

  // 2. If simple request fails with auth error, try crumb-based auth
  if (simpleRes.status === 401 || simpleRes.status === 403) {
    console.log('Yahoo search requires crumb auth, trying session-based approach')
    let session = await getYahooSession()
    const crumbParams = buildSearchParams(query, session.crumb)
    let crumbRes = await fetch(`${YAHOO_SEARCH_URL}?${crumbParams}`, {
      headers: {
        'User-Agent': YAHOO_USER_AGENT,
        Cookie: session.cookie,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })

    // If still unauthorized, refresh session and retry once
    if (crumbRes.status === 401 || crumbRes.status === 403) {
      clearYahooSession()
      session = await getYahooSession()
      const retryParams = buildSearchParams(query, session.crumb)
      crumbRes = await fetch(`${YAHOO_SEARCH_URL}?${retryParams}`, {
        headers: {
          'User-Agent': YAHOO_USER_AGENT,
          Cookie: session.cookie,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      })
    }

    if (crumbRes.ok) {
      const data = await crumbRes.json()
      if (!data.error) {
        return data.quotes || []
      }
    }
  }

  throw new Error(`Yahoo search failed: ${simpleRes.status}`)
}

// ─── Offline fallback for well-known stocks ─────────────────────────────────

const WELL_KNOWN_STOCKS: { symbol: string; name: string; exchange: string; type: string }[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', type: 'EQUITY' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', type: 'EQUITY' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', type: 'EQUITY' },
  { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE', type: 'EQUITY' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE', type: 'EQUITY' },
  { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE', type: 'EQUITY' },
  { symbol: 'PG', name: 'Procter & Gamble Co.', exchange: 'NYSE', type: 'EQUITY' },
  { symbol: 'MA', name: 'Mastercard Inc.', exchange: 'NYSE', type: 'EQUITY' },
  { symbol: 'HD', name: 'Home Depot Inc.', exchange: 'NYSE', type: 'EQUITY' },
  { symbol: 'DIS', name: 'Walt Disney Co.', exchange: 'NYSE', type: 'EQUITY' },
  { symbol: 'BRK-B', name: 'Berkshire Hathaway Inc.', exchange: 'NYSE', type: 'EQUITY' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', exchange: 'NYSE', type: 'ETF' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', exchange: 'NYSE', type: 'ETF' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', exchange: 'NYSE', type: 'ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', exchange: 'NASDAQ', type: 'ETF' },
]

function searchOfflineFallback(query: string) {
  const q = query.toUpperCase()
  return WELL_KNOWN_STOCKS.filter(
    (s) => s.symbol.includes(q) || s.name.toUpperCase().includes(q)
  )
}

// ─── Route handler ──────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const ip = request.headers.get('x-forwarded-for') || 'unknown'

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

    updateRateLimit(ip)
    console.log('Searching stocks:', query)

    const quotes = await searchYahooFinance(query)

    const results = quotes
      .filter((quote: Quote) => {
        return (quote.quoteType === 'EQUITY' || quote.quoteType === 'ETF') &&
          quote.symbol &&
          !quote.symbol.includes('^')
      })
      .map((quote: Quote) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        exchange: quote.exchange || quote.fullExchangeName || '',
        type: quote.quoteType,
        score: quote.score,
      }))
      .sort((a: { score?: number }, b: { score?: number }) => (b.score || 0) - (a.score || 0))

    return new NextResponse(JSON.stringify(results), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Stock Search API Error:', error)
    // When Yahoo Finance is unreachable, fall back to well-known stock list
    const query = new URL(request.url).searchParams.get('q')
    const fallbackResults = query ? searchOfflineFallback(query) : []
    return new NextResponse(JSON.stringify(fallbackResults), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
