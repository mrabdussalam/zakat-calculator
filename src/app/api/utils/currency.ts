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
      throw new Error('Failed to fetch exchange rate')
    }

    const data = await response.json()
    const rate = data.rates[to]

    // Cache the new rate
    exchangeRateCache.set(cacheKey, {
      rate,
      timestamp: new Date().toISOString()
    })

    return rate
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
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