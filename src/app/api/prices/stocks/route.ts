import { NextResponse } from 'next/server'

// Use multiple APIs for better reliability
const YAHOO_FINANCE_API_URL = 'https://query2.finance.yahoo.com/v8/finance/chart'
const ALPHA_VANTAGE_API_URL = 'https://www.alphavantage.co/query'
const IEX_CLOUD_API_URL = 'https://cloud.iexapis.com/stable'

// Add environment detection for Replit
const IS_REPLIT = typeof window !== 'undefined' &&
  (window.location.hostname.includes('replit') ||
    window.location.hostname.endsWith('.repl.co'));

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

    // Fallback to hardcoded rates if API fails
    // Special case for USD to SAR (Saudi Riyal)
    if (from.toUpperCase() === 'USD' && to.toUpperCase() === 'SAR') {
      console.log(`Using fallback rate for USD to SAR: 3.75`);
      return 3.75; // Fixed rate for SAR
    }

    // Special case for USD to PKR (Pakistani Rupee) - approximate rate
    if (from.toUpperCase() === 'USD' && to.toUpperCase() === 'PKR') {
      console.log(`Using fallback rate for USD to PKR: 278.5`);
      return 278.5; // Approximate rate for PKR
    }

    return null;
  } catch (error) {
    console.error(`Error fetching exchange rate from ${from} to ${to}:`, error);
    return null;
  }
}

// Try to fetch from Yahoo Finance API
async function fetchFromYahooFinance(symbol: string): Promise<number | null> {
  try {
    console.log(`Trying Yahoo Finance API for ${symbol}`);

    // Create an AbortController to handle timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(
      `${YAHOO_FINANCE_API_URL}/${encodeURIComponent(symbol)}?interval=1d&range=1d&includePrePost=false`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
          'Accept': 'application/json',
          'Origin': 'https://finance.yahoo.com',
          'Referer': 'https://finance.yahoo.com'
        }
      }
    );

    // Clear the timeout
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Yahoo Finance API returned ${response.status} for ${symbol}`);
      return null;
    }

    const data = await response.json();

    // Check for API-specific error messages
    if (data.error) {
      console.warn(`Yahoo Finance API error: ${data.error.description}`);
      return null;
    }

    // Extract price from response using the v8 API structure
    const result = data?.chart?.result?.[0];
    if (!result) {
      console.warn(`No data available for symbol: ${symbol}`);
      return null;
    }

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];

    // Try different price sources in order of preference
    let price = meta?.regularMarketPrice;
    if (!price && quote?.close?.[0]) {
      price = quote.close[0];
    }
    if (!price && quote?.open?.[0]) {
      price = quote.open[0];
    }

    if (price) {
      console.log(`Yahoo Finance price for ${symbol}: $${price}`);
      return price;
    }

    console.warn(`No valid price found in Yahoo Finance response for ${symbol}`);
    return null;
  } catch (error) {
    // More specific error handling
    if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
      console.error(`Timeout when fetching from Yahoo Finance for ${symbol}`);
    } else {
      console.error(`Error fetching from Yahoo Finance for ${symbol}:`, error);
    }
    return null;
  }
}

// Try to fetch from Alpha Vantage API
async function fetchFromAlphaVantage(symbol: string): Promise<number | null> {
  try {
    console.log(`Trying Alpha Vantage API for ${symbol}`);

    // Create an AbortController to handle timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(
      `${ALPHA_VANTAGE_API_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`,
      {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    // Clear the timeout
    clearTimeout(timeoutId);

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
    // More specific error handling
    if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
      console.error(`Timeout when fetching from Alpha Vantage for ${symbol}`);
    } else {
      console.error(`Error fetching from Alpha Vantage for ${symbol}:`, error);
    }
    return null;
  }
}

// Try to fetch from IEX Cloud API
async function fetchFromIEXCloud(symbol: string): Promise<number | null> {
  try {
    console.log(`Trying IEX Cloud API for ${symbol}`);

    // Create an AbortController to handle timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(
      `${IEX_CLOUD_API_URL}/stock/${symbol}/quote?token=${process.env.IEX_CLOUD_API_KEY}`,
      {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    // Clear the timeout
    clearTimeout(timeoutId);

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
    // More specific error handling
    if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
      console.error(`Timeout when fetching from IEX Cloud for ${symbol}`);
    } else if (
      error &&
      typeof error === 'object' &&
      error instanceof TypeError &&
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.includes('fetch failed')
    ) {
      console.error(`Network error when fetching from IEX Cloud for ${symbol}`);
    } else {
      console.error(`Error fetching from IEX Cloud for ${symbol}:`, error);
    }
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

    // Determine which API to try first based on environment and randomization
    const random = Math.random();

    // On Replit, we want to avoid APIs that might have rate limits
    // Try APIs in different order based on random value
    if (IS_REPLIT) {
      // On Replit, try IEX Cloud first 50% of the time, Alpha Vantage first 50% of the time
      if (random < 0.5) {
        // Try IEX Cloud first
        price = await fetchFromIEXCloud(symbol);
        if (price !== null) {
          source = 'iex-cloud';
          console.log(`Successfully fetched price from IEX Cloud: ${price}`);
        } else {
          // Then try Alpha Vantage
          price = await fetchFromAlphaVantage(symbol);
          if (price !== null) {
            source = 'alpha-vantage';
            console.log(`Successfully fetched price from Alpha Vantage: ${price}`);
          }
        }
      } else {
        // Try Alpha Vantage first
        price = await fetchFromAlphaVantage(symbol);
        if (price !== null) {
          source = 'alpha-vantage';
          console.log(`Successfully fetched price from Alpha Vantage: ${price}`);
        } else {
          // Then try IEX Cloud
          price = await fetchFromIEXCloud(symbol);
          if (price !== null) {
            source = 'iex-cloud';
            console.log(`Successfully fetched price from IEX Cloud: ${price}`);
          }
        }
      }

      // Only try Yahoo Finance as a last resort on Replit
      if (price === null) {
        price = await fetchFromYahooFinance(symbol);
        if (price !== null) {
          source = 'yahoo-finance';
          console.log(`Successfully fetched price from Yahoo Finance: ${price}`);
        }
      }
    } else {
      // Not on Replit, distribute requests across all APIs
      if (random < 0.33) {
        // Try Yahoo Finance first
        price = await fetchFromYahooFinance(symbol);
        if (price !== null) {
          source = 'yahoo-finance';
          console.log(`Successfully fetched price from Yahoo Finance: ${price}`);
        } else {
          // Then try Alpha Vantage
          price = await fetchFromAlphaVantage(symbol);
          if (price !== null) {
            source = 'alpha-vantage';
            console.log(`Successfully fetched price from Alpha Vantage: ${price}`);
          }
        }

        // Finally try IEX Cloud
        if (price === null) {
          price = await fetchFromIEXCloud(symbol);
          if (price !== null) {
            source = 'iex-cloud';
            console.log(`Successfully fetched price from IEX Cloud: ${price}`);
          }
        }
      } else if (random < 0.66) {
        // Try Alpha Vantage first
        price = await fetchFromAlphaVantage(symbol);
        if (price !== null) {
          source = 'alpha-vantage';
          console.log(`Successfully fetched price from Alpha Vantage: ${price}`);
        } else {
          // Then try IEX Cloud
          price = await fetchFromIEXCloud(symbol);
          if (price !== null) {
            source = 'iex-cloud';
            console.log(`Successfully fetched price from IEX Cloud: ${price}`);
          }
        }

        // Finally try Yahoo Finance
        if (price === null) {
          price = await fetchFromYahooFinance(symbol);
          if (price !== null) {
            source = 'yahoo-finance';
            console.log(`Successfully fetched price from Yahoo Finance: ${price}`);
          }
        }
      } else {
        // Try IEX Cloud first
        price = await fetchFromIEXCloud(symbol);
        if (price !== null) {
          source = 'iex-cloud';
          console.log(`Successfully fetched price from IEX Cloud: ${price}`);
        } else {
          // Then try Yahoo Finance
          price = await fetchFromYahooFinance(symbol);
          if (price !== null) {
            source = 'yahoo-finance';
            console.log(`Successfully fetched price from Yahoo Finance: ${price}`);
          }
        }

        // Finally try Alpha Vantage
        if (price === null) {
          price = await fetchFromAlphaVantage(symbol);
          if (price !== null) {
            source = 'alpha-vantage';
            console.log(`Successfully fetched price from Alpha Vantage: ${price}`);
          }
        }
      }
    }

    // If all APIs fail, throw an error
    if (price === null) {
      throw new Error(`Failed to fetch stock price for ${symbol} from any API source`);
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
        error: error instanceof Error ? error.message : 'Unknown error fetching stock price',
        symbol
      },
      { status: 500 }
    );
  }
} 