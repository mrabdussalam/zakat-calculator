import { useCurrencyStore } from '@/lib/services/currency'

// Cache for exchange rates
const rateCache = new Map<string, { rate: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to check if a cached rate is still valid
function isCacheValid(from: string, to: string): boolean {
    const key = `${from}-${to}`;
    const cached = rateCache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < CACHE_DURATION;
}

// Helper function to get cached rate
function getCachedRate(from: string, to: string): number | null {
    const key = `${from}-${to}`;
    const cached = rateCache.get(key);
    if (cached && isCacheValid(from, to)) {
        return cached.rate;
    }
    return null;
}

// Helper function to set cached rate
function setCachedRate(from: string, to: string, rate: number): void {
    const key = `${from}-${to}`;
    rateCache.set(key, {
        rate,
        timestamp: Date.now()
    });
}

// Helper function to clear cache
export function clearExchangeRateCache(): void {
    rateCache.clear();
}

// Main function to get exchange rate with caching
export async function getExchangeRate(from: string, to: string): Promise<number | null> {
    try {
        // If currencies are the same, no conversion needed
        if (from.toUpperCase() === to.toUpperCase()) {
            return 1;
        }

        // Check cache first
        const cachedRate = getCachedRate(from, to);
        if (cachedRate !== null) {
            console.log(`Using cached exchange rate for ${from} to ${to}: ${cachedRate}`);
            return cachedRate;
        }

        // Try to get exchange rate from Frankfurter API
        const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);

        if (response.ok) {
            const data = await response.json();
            if (data && data.rates && data.rates[to.toUpperCase()]) {
                const rate = data.rates[to.toUpperCase()];
                console.log(`Got real-time exchange rate for ${from} to ${to}: ${rate}`);
                setCachedRate(from, to, rate);
                return rate;
            }
        }

        console.log(`Frankfurter API failed for ${from} to ${to}, using currency store`)
        //fallback using currency store
        const currencyStore = useCurrencyStore.getState()
        await currencyStore.fetchRates()
        const value = currencyStore.convertAmount(1, from, to)
        if (value !== null && value !== undefined) {
            console.log(`Currency store exchange rate for ${from} to ${to}: ${value}`)
            setCachedRate(from, to, value)
            return value
        }

        console.log(`Currency store failed for ${from} to ${to}, using fallback rate`)
        // Fallback to hardcoded rates if API fails
        // Special case for USD to SAR (Saudi Riyal)
        if (from.toUpperCase() === 'USD' && to.toUpperCase() === 'SAR') {
            const rate = 3.75; // Fixed rate for SAR
            console.log(`Using fallback rate for USD to SAR: ${rate}`);
            setCachedRate(from, to, rate);
            return rate;
        }

        // Special case for USD to PKR (Pakistani Rupee) - approximate rate
        if (from.toUpperCase() === 'USD' && to.toUpperCase() === 'PKR') {
            const rate = 278.5; // Approximate rate for PKR
            console.log(`Using fallback rate for USD to PKR: ${rate}`);
            setCachedRate(from, to, rate);
            return rate;
        }

        // Special case for USD to RUB (Russian Ruble) - approximate rate
        if (from.toUpperCase() === 'USD' && to.toUpperCase() === 'RUB') {
            const rate = 91.5; // Approximate rate for RUB
            console.log(`Using fallback rate for USD to RUB: ${rate}`);
            setCachedRate(from, to, rate);
            return rate;
        }

        return null;
    } catch (error) {
        console.error(`Error fetching exchange rate from ${from} to ${to}:`, error);
        return null;
    }
}
