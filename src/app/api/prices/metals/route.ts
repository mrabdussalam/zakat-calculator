import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const METALS_API = {
  baseURL: 'https://www.goldapi.io/api',
  headers: {
    'x-access-token': 'goldapi-8ip6sv19m6j04na6-io',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
}

const CONVERSION_RATES = {
  TROY_OUNCE_TO_GRAMS: 31.1034768 // 1 troy ounce = 31.1034768 grams
}

interface MetalPrices {
  gold: number      // Price per gram
  silver: number    // Price per gram
  lastUpdated: Date
  currency: string
  isCache: boolean
  source: string
}

// Price sources configuration
const PRICE_SOURCES = [
  {
    name: 'frankfurter',
    url: 'https://api.frankfurter.app/latest?from=XAU&to=USD,XAG',
    parser: (data: any) => ({
      gold: data.rates.USD / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS,
      silver: (data.rates.USD / data.rates.XAG) / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS
    })
  },
  {
    name: 'goldprice',
    url: 'https://data-asg.goldprice.org/dbXRates/USD',
    parser: (data: any) => ({
      gold: data.items[0].xauPrice / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS,
      silver: data.items[0].xagPrice / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS
    })
  },
  {
    name: 'metals-api',
    url: 'https://api.metals.live/v1/spot/gold,silver',
    parser: (data: any) => ({
      gold: data.find((m: any) => m.metal === 'gold')?.price / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS,
      silver: data.find((m: any) => m.metal === 'silver')?.price / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS
    })
  }
]

// Make these available to other files
export const COUNTER_FILE = path.join(process.cwd(), 'data', 'metal-api-counter.json')

export interface RequestCounter {
  count: number
  month: number
  year: number
}

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true })
}

// Initialize or read counter
export function getRequestCounter(): RequestCounter {
  try {
    if (fs.existsSync(COUNTER_FILE)) {
      const data = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8'))
      const now = new Date()
      
      // Reset counter if it's a new month
      if (data.month !== now.getMonth() || data.year !== now.getFullYear()) {
        const newCounter = {
          count: 0,
          month: now.getMonth(),
          year: now.getFullYear()
        }
        fs.writeFileSync(COUNTER_FILE, JSON.stringify(newCounter))
        return newCounter
      }
      
      return data
    }
  } catch (error) {
    console.error('Error reading counter file:', error)
  }

  // Default counter if file doesn't exist or error occurs
  const now = new Date()
  return {
    count: 0,
    month: now.getMonth(),
    year: now.getFullYear()
  }
}

// Update request counter
function incrementRequestCounter() {
  const counter = getRequestCounter()
  counter.count++
  fs.writeFileSync(COUNTER_FILE, JSON.stringify(counter))
  return counter.count
}

// Check if we've hit the limit
function hasReachedLimit(): boolean {
  const counter = getRequestCounter()
  return counter.count >= 80 // Monthly limit
}

// Default fallback prices
const FALLBACK_PRICES = {
  gold: 65.52,  // USD per gram
  silver: 0.85, // USD per gram
  lastUpdated: new Date().toISOString(),
  isCache: true
}

// Cache duration in milliseconds (1 hour)
const CACHE_DURATION = 60 * 60 * 1000

// In-memory cache
let priceCache = {
  prices: null as typeof FALLBACK_PRICES | null,
  lastUpdated: null as Date | null
}

async function fetchMetalPrices() {
  try {
    // TODO: Implement real API call to get metal prices
    // For now, return fallback values
    return {
      ...FALLBACK_PRICES,
      lastUpdated: new Date().toISOString(),
      isCache: false
    }
  } catch (error) {
    console.error('Error fetching metal prices:', error)
    return FALLBACK_PRICES
  }
}

export async function GET() {
  try {
    // Return fallback prices for now
    return NextResponse.json(FALLBACK_PRICES)
  } catch (error) {
    console.error('Error fetching metal prices:', error)
    return NextResponse.json(FALLBACK_PRICES)
  }
} 
