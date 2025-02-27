interface ExchangeRate {
  rate: number
  timestamp: string
}

const exchangeRateCache = new Map<string, ExchangeRate>()
const CACHE_DURATION = 1000 * 60 * 60 // 1 hour

async function fetchExchangeRate(from: string, to: string): Promise<number> {
  try {
    const cacheKey = `${from}-${to}`
    const cached = exchangeRateCache.get(cacheKey)

    // Return cached rate if still valid
    if (cached && (Date.now() - new Date(cached.timestamp).getTime()) < CACHE_DURATION) {
      return cached.rate
    }

    // Using Exchange Rates API (you'll need an API key)
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${from}?apikey=${process.env.EXCHANGE_RATE_API_KEY}`
    )

    if (!response.ok) {
      console.error(`Exchange rate API returned status: ${response.status}, ${response.statusText}`)
      
      // Check if there's a fallback cache even if expired
      if (cached) {
        console.warn(`Using expired cached rate for ${from} to ${to} due to API error`)
        return cached.rate;
      }
      
      throw new Error(`Failed to fetch exchange rate: ${response.status} ${response.statusText}`)
    }

    // Check content type to ensure we're receiving JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`Expected JSON but received ${contentType}`)
      
      // Check if there's a fallback cache even if expired
      if (cached) {
        console.warn(`Using expired cached rate for ${from} to ${to} due to content type mismatch`)
        return cached.rate;
      }
      
      throw new Error(`Invalid content type: ${contentType}`)
    }

    // Parse the JSON response with proper error handling
    let data
    try {
      const responseText = await response.text()
      
      // Check if the response starts with HTML tags or doctype (indicating an error page)
      if (responseText.trim().startsWith('<') || responseText.toLowerCase().includes('<!doctype html>')) {
        console.error('Received HTML instead of JSON:', responseText.substring(0, 200))
        
        // Check if there's a fallback cache even if expired
        if (cached) {
          console.warn(`Using expired cached rate for ${from} to ${to} due to HTML response`)
          return cached.rate;
        }
        
        throw new Error('Server returned HTML instead of JSON')
      }
      
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse exchange rate response:', parseError)
      
      // Check if there's a fallback cache even if expired
      if (cached) {
        console.warn(`Using expired cached rate for ${from} to ${to} due to parse error`)
        return cached.rate;
      }
      
      throw new Error(`JSON parse error: ${parseError}`)
    }

    // Validate that we have the expected structure
    if (!data || typeof data !== 'object' || !data.rates) {
      console.error(`Invalid exchange rate data structure:`, data)
      
      // Check if there's a fallback cache even if expired
      if (cached) {
        console.warn(`Using expired cached rate for ${from} to ${to} due to invalid data structure`)
        return cached.rate;
      }
      
      throw new Error(`Invalid exchange rate data structure`)
    }

    const rate = data.rates[to]
    
    if (typeof rate !== 'number') {
      console.error(`Invalid exchange rate for ${from} to ${to}:`, rate)
      
      // Check if there's a fallback cache even if expired
      if (cached) {
        console.warn(`Using expired cached rate for ${from} to ${to} due to invalid rate`)
        return cached.rate;
      }
      
      throw new Error(`Invalid exchange rate value: ${rate}`)
    }

    // Cache the new rate
    exchangeRateCache.set(cacheKey, {
      rate,
      timestamp: new Date().toISOString()
    })

    return rate
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    
    // If the target currency is the same as the source, return 1 (no conversion needed)
    if (from === to) return 1
    
    // For other errors, throw to the caller
    throw error
  }
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  if (from === to) return amount
  
  const rate = await fetchExchangeRate(from, to)
  return amount * rate
}

export async function convertMultipleCurrencies(
  amounts: { amount: number; from: string }[],
  to: string
): Promise<number[]> {
  return Promise.all(
    amounts.map(({ amount, from }) => convertCurrency(amount, from, to))
  )
}

export function formatCurrency(
  amount: number,
  currency: string,
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
} 