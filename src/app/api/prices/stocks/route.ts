import { NextResponse } from 'next/server'
import { getYahooSession, clearYahooSession, YAHOO_USER_AGENT } from '@/lib/api/yahooSession'
import { getFallbackRate } from '@/lib/constants/currency'

// Use multiple APIs for better reliability
const YAHOO_FINANCE_API_URL = 'https://query1.finance.yahoo.com/v8/finance/chart'
const YAHOO_QUOTE_API_URL = 'https://query1.finance.yahoo.com/v6/finance/quote'
const ALPHA_VANTAGE_API_URL = 'https://www.alphavantage.co/query'
const IEX_CLOUD_API_URL = 'https://cloud.iexapis.com/stable'

// Check which API keys are available at startup
const HAS_ALPHA_VANTAGE_KEY = !!process.env.ALPHA_VANTAGE_API_KEY
const HAS_IEX_CLOUD_KEY = !!process.env.IEX_CLOUD_API_KEY

// Helper function to get exchange rate with fallbacks
async function getExchangeRate(from: string, to: string): Promise<number | null> {
  // If currencies are the same, no conversion needed
  if (from.toUpperCase() === to.toUpperCase()) {
    return 1;
  }

  try {
    // Always try to get exchange rate from Frankfurter API first
    const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);

    if (response.ok) {
      const data = await response.json();
      if (data && data.rates && data.rates[to.toUpperCase()]) {
        console.log(`Got real-time exchange rate for ${from} to ${to}: ${data.rates[to.toUpperCase()]}`);
        return data.rates[to.toUpperCase()];
      }
    }

    console.log(`Frankfurter API failed for ${from} to ${to}, using fallbacks`);

    // Use canonical fallback rates
    return getFallbackRate(from, to);
  } catch (error) {
    console.error(`Error fetching exchange rate from ${from} to ${to}:`, error);

    // Even when an exception occurs, try to use fallback rates
    return getFallbackRate(from, to);
  }
}

// Extract price from Yahoo Finance v8 chart response
function extractYahooPrice(data: Record<string, unknown>): number | null {
  if (data.error) {
    console.warn(`Yahoo Finance API error:`, (data.error as Record<string, string>)?.description);
    return null;
  }

  const result = (data as { chart?: { result?: Array<{ meta?: { regularMarketPrice?: number }; indicators?: { quote?: Array<{ close?: number[]; open?: number[] }> } }> } })?.chart?.result?.[0];
  if (!result) return null;

  const price = result.meta?.regularMarketPrice
    || result.indicators?.quote?.[0]?.close?.[0]
    || result.indicators?.quote?.[0]?.open?.[0];

  return price || null;
}

// Try to fetch from Yahoo Finance v8 chart API
// Strategy: try simple request first, then crumb-based auth as fallback
async function fetchFromYahooFinance(symbol: string): Promise<number | null> {
  try {
    console.log(`Trying Yahoo Finance v8 chart API for ${symbol}`);

    // 1. Try simple request first (no crumb auth) — works most of the time
    const simpleRes = await fetch(
      `${YAHOO_FINANCE_API_URL}/${encodeURIComponent(symbol)}?interval=1d&range=1d&includePrePost=false`,
      {
        headers: {
          'User-Agent': YAHOO_USER_AGENT,
          'Accept': 'application/json',
          'Origin': 'https://finance.yahoo.com',
          'Referer': 'https://finance.yahoo.com',
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (simpleRes.ok) {
      const data = await simpleRes.json();
      const price = extractYahooPrice(data);
      if (price) {
        console.log(`Yahoo Finance price for ${symbol}: $${price} (simple request)`);
        return price;
      }
    }

    // 2. If simple request fails with auth error, try crumb-based auth
    //    Skip crumb auth for 429 (rate limit) — it would generate even more requests
    if (simpleRes.status === 401 || simpleRes.status === 403) {
      console.log(`Yahoo Finance requires auth for ${symbol}, trying crumb-based session`);
      try {
        let session = await getYahooSession();
        let crumbRes = await fetch(
          `${YAHOO_FINANCE_API_URL}/${encodeURIComponent(symbol)}?interval=1d&range=1d&includePrePost=false&crumb=${encodeURIComponent(session.crumb)}`,
          {
            headers: {
              'User-Agent': YAHOO_USER_AGENT,
              'Accept': 'application/json',
              'Cookie': session.cookie,
            },
            signal: AbortSignal.timeout(5000),
          }
        );

        // If still unauthorized, refresh session and retry once
        if (crumbRes.status === 401 || crumbRes.status === 403) {
          clearYahooSession();
          session = await getYahooSession();
          crumbRes = await fetch(
            `${YAHOO_FINANCE_API_URL}/${encodeURIComponent(symbol)}?interval=1d&range=1d&includePrePost=false&crumb=${encodeURIComponent(session.crumb)}`,
            {
              headers: {
                'User-Agent': YAHOO_USER_AGENT,
                'Accept': 'application/json',
                'Cookie': session.cookie,
              },
              signal: AbortSignal.timeout(5000),
            }
          );
        }

        if (crumbRes.ok) {
          const data = await crumbRes.json();
          const price = extractYahooPrice(data);
          if (price) {
            console.log(`Yahoo Finance price for ${symbol}: $${price} (crumb auth)`);
            return price;
          }
        }
      } catch (crumbError) {
        console.warn(`Crumb-based Yahoo auth failed for ${symbol}:`, crumbError);
      }
    }

    console.warn(`Yahoo Finance v8 API returned ${simpleRes.status} for ${symbol}`);
    return null;
  } catch (error) {
    console.error(`Error fetching from Yahoo Finance v8 for ${symbol}:`, error);
    return null;
  }
}

// Try Yahoo Finance v6 quote API as an alternative endpoint
async function fetchFromYahooQuote(symbol: string): Promise<number | null> {
  try {
    console.log(`Trying Yahoo Finance v6 quote API for ${symbol}`);

    // Try with crumb session
    let session;
    try {
      session = await getYahooSession();
    } catch {
      console.warn('Could not establish Yahoo session for quote API');
      return null;
    }

    const res = await fetch(
      `${YAHOO_QUOTE_API_URL}?symbols=${encodeURIComponent(symbol)}&crumb=${encodeURIComponent(session.crumb)}`,
      {
        headers: {
          'User-Agent': YAHOO_USER_AGENT,
          'Accept': 'application/json',
          'Cookie': session.cookie,
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) {
      console.warn(`Yahoo Finance v6 quote API returned ${res.status} for ${symbol}`);
      return null;
    }

    const data = await res.json();
    const quote = (data as { quoteResponse?: { result?: Array<{ regularMarketPrice?: number }> } })
      ?.quoteResponse?.result?.[0];

    if (quote?.regularMarketPrice) {
      console.log(`Yahoo Finance quote price for ${symbol}: $${quote.regularMarketPrice}`);
      return quote.regularMarketPrice;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching from Yahoo Finance v6 quote for ${symbol}:`, error);
    return null;
  }
}

// Try to scrape price from Yahoo Finance website as last resort
async function fetchFromYahooScraping(symbol: string): Promise<number | null> {
  try {
    console.log(`Trying Yahoo Finance page scraping for ${symbol}`);

    const res = await fetch(
      `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/`,
      {
        headers: {
          'User-Agent': YAHOO_USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      console.warn(`Yahoo Finance page returned ${res.status} for ${symbol}`);
      return null;
    }

    const html = await res.text();

    // Try to extract price from the page using several patterns.
    // IMPORTANT: The page contains prices for many trending stocks in embedded JSON.
    // We must use patterns that target the SPECIFIC stock's quote page price,
    // not generic regularMarketPrice which matches the first trending stock.
    const patterns = [
      // Pattern 1 (most reliable): The primary quote-page price element
      // Yahoo renders the stock's price in: <fin-streamer ... data-testid="qsp-price">640.16</fin-streamer>
      /data-testid="qsp-price"[^>]*>([\d,]+\.?\d*)/,
      // Pattern 2: fin-streamer with the specific symbol's data-symbol attribute
      new RegExp(`data-symbol="${symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*data-field="regularMarketPrice"[^>]*data-value="([\\d.]+)"`),
      // Pattern 3: Find the symbol in embedded JSON, then its regularMarketPrice nearby
      new RegExp(`"symbol":"${symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^}]*?"regularMarketPrice":\\{[^}]*"raw":\\s*([\\d.]+)`),
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const price = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(price) && price > 0) {
          console.log(`Yahoo Finance scraped price for ${symbol}: $${price}`);
          return price;
        }
      }
    }

    console.warn(`Could not extract price from Yahoo Finance page for ${symbol}`);
    return null;
  } catch (error) {
    console.error(`Error scraping Yahoo Finance for ${symbol}:`, error);
    return null;
  }
}

// Try to fetch from Alpha Vantage API (only if API key is configured)
async function fetchFromAlphaVantage(symbol: string): Promise<number | null> {
  if (!HAS_ALPHA_VANTAGE_KEY) {
    return null;
  }

  try {
    console.log(`Trying Alpha Vantage API for ${symbol}`);
    const response = await fetch(
      `${ALPHA_VANTAGE_API_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
    );

    if (!response.ok) {
      console.warn(`Alpha Vantage API returned ${response.status} for ${symbol}`);
      return null;
    }

    const data = await response.json();
    const price = parseFloat(data['Global Quote']?.['05. price']);

    if (price && !isNaN(price)) {
      console.log(`Alpha Vantage price for ${symbol}: $${price}`);
      return price;
    }

    console.warn(`No valid price found in Alpha Vantage response for ${symbol}`);
    return null;
  } catch (error) {
    console.error(`Error fetching from Alpha Vantage for ${symbol}:`, error);
    return null;
  }
}

// Try to fetch from IEX Cloud API (only if API key is configured)
async function fetchFromIEXCloud(symbol: string): Promise<number | null> {
  if (!HAS_IEX_CLOUD_KEY) {
    return null;
  }

  try {
    console.log(`Trying IEX Cloud API for ${symbol}`);
    const response = await fetch(
      `${IEX_CLOUD_API_URL}/stock/${symbol}/quote?token=${process.env.IEX_CLOUD_API_KEY}`
    );

    if (!response.ok) {
      console.warn(`IEX Cloud API returned ${response.status} for ${symbol}`);
      return null;
    }

    const data = await response.json();
    const price = data?.latestPrice;

    if (price && typeof price === 'number') {
      console.log(`IEX Cloud price for ${symbol}: $${price}`);
      return price;
    }

    console.warn(`No valid price found in IEX Cloud response for ${symbol}`);
    return null;
  } catch (error) {
    console.error(`Error fetching from IEX Cloud for ${symbol}:`, error);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const requestedCurrency = (searchParams.get('currency') || 'USD').toUpperCase()

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol is required' },
      { status: 400 }
    )
  }

  try {
    // Variables to track price and source
    let price = null;
    let source = '';

    // Try APIs in order of reliability:
    // 1. Yahoo Finance v8 chart API (most reliable, no key needed)
    // 2. Yahoo Finance v6 quote API (alternative endpoint)
    // 3. Alpha Vantage (if key configured)
    // 4. IEX Cloud (if key configured)
    // 5. Yahoo Finance page scraping (last resort)

    // 1. Yahoo Finance v8 chart API
    price = await fetchFromYahooFinance(symbol);
    if (price !== null) {
      source = 'yahoo-finance';
    }

    // 2. Yahoo Finance v6 quote API
    if (price === null) {
      price = await fetchFromYahooQuote(symbol);
      if (price !== null) {
        source = 'yahoo-quote';
      }
    }

    // 3. Alpha Vantage (skipped if no key)
    if (price === null) {
      price = await fetchFromAlphaVantage(symbol);
      if (price !== null) {
        source = 'alpha-vantage';
      }
    }

    // 4. IEX Cloud (skipped if no key)
    if (price === null) {
      price = await fetchFromIEXCloud(symbol);
      if (price !== null) {
        source = 'iex-cloud';
      }
    }

    // 5. Yahoo Finance page scraping (last resort)
    if (price === null) {
      price = await fetchFromYahooScraping(symbol);
      if (price !== null) {
        source = 'yahoo-scraping';
      }
    }

    // If all sources fail, return error
    if (price === null) {
      const triedSources = ['yahoo-finance-v8', 'yahoo-quote-v6'];
      if (HAS_ALPHA_VANTAGE_KEY) triedSources.push('alpha-vantage');
      if (HAS_IEX_CLOUD_KEY) triedSources.push('iex-cloud');
      triedSources.push('yahoo-scraping');

      console.error(`All stock price sources failed for ${symbol}. Tried: ${triedSources.join(', ')}`);

      return NextResponse.json(
        {
          error: `Could not fetch stock price for ${symbol}. Please try again or enter the price manually.`,
          symbol,
          triedSources
        },
        { status: 502 }
      );
    }

    // Convert currency if needed and different from USD
    if (requestedCurrency !== 'USD') {
      const rate = await getExchangeRate('USD', requestedCurrency);
      if (rate) {
        price = Number((price * rate).toFixed(2));
        console.log(`Converted ${symbol} price from USD to ${requestedCurrency} using rate ${rate}`);
      } else {
        console.log(`Could not convert ${symbol} price from USD to ${requestedCurrency}, returning USD price`);
      }
    }

    return NextResponse.json({
      symbol,
      price,
      lastUpdated: new Date().toISOString(),
      sourceCurrency: 'USD',
      currency: requestedCurrency !== 'USD' ? requestedCurrency : 'USD',
      source
    });

  } catch (error) {
    console.error('Stock API Error:', error);
    return NextResponse.json(
      {
        error: `Failed to fetch stock price for ${symbol}. Please try again or enter the price manually.`,
        symbol
      },
      { status: 500 }
    );
  }
}
