import { useCurrencyStore } from '@/lib/services/currency'

// Detect if we're on the server or client
const isServer = typeof window === 'undefined';

// Dynamically import the shared service only on server
let exchangeRateService: typeof import('@/lib/services/exchangeRateService') | null = null;
if (isServer) {
    // Use dynamic import to avoid bundling server code in client
    exchangeRateService = require('@/lib/services/exchangeRateService');
}

// Cache for exchange rates
const rateCache = new Map<string, { rate: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const API_TIMEOUT = 10000; // 10 seconds timeout for API calls

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

// Helper function to fetch with timeout (client-side only)
async function fetchWithTimeout(url: string, timeout: number = API_TIMEOUT): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json'
            }
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Fallback rates for common currency pairs
const FALLBACK_RATES: Record<string, number> = {
    'usd': 1,
    'eur': 0.92,
    'gbp': 0.78,
    'jpy': 150.5,
    'cad': 1.35,
    'aud': 1.52,
    'inr': 83.15,
    'pkr': 278.5,
    'aed': 3.67,
    'sar': 3.75,
    'myr': 4.65,
    'sgd': 1.35,
    'bdt': 110.5,
    'egp': 30.9,
    'idr': 15600,
    'kwd': 0.31,
    'ngn': 1550,
    'qar': 3.64,
    'zar': 18.5,
    'rub': 91.5
};

// Helper function to get fallback rate
function getFallbackRate(from: string, to: string): number | null {
    const fromLower = from.toLowerCase();
    const toLower = to.toLowerCase();

    if (FALLBACK_RATES[fromLower] && FALLBACK_RATES[toLower]) {
        // Convert via USD
        const rate = FALLBACK_RATES[toLower] / FALLBACK_RATES[fromLower];
        console.log(`Using fallback rate for ${from} to ${to}: ${rate}`);
        return rate;
    }

    return null;
}

// Main function to get exchange rate with caching
export async function getExchangeRate(from: string, to: string): Promise<number | null> {
    try {
        // Normalize currency codes
        const fromUpper = from.toUpperCase();
        const toUpper = to.toUpperCase();

        // If currencies are the same, no conversion needed
        if (fromUpper === toUpper) {
            return 1;
        }

        // Check cache first
        const cachedRate = getCachedRate(fromUpper, toUpper);
        if (cachedRate !== null) {
            console.log(`Using cached exchange rate for ${fromUpper} to ${toUpper}: ${cachedRate}`);
            return cachedRate;
        }

        // SERVER-SIDE: Use the shared exchange rate service directly
        if (isServer && exchangeRateService) {
            try {
                console.log(`[Server] Using shared exchange rate service for ${fromUpper} to ${toUpper}`);
                const rate = await exchangeRateService.getExchangeRate(fromUpper, toUpper);
                if (rate !== null) {
                    setCachedRate(fromUpper, toUpper, rate);
                    return rate;
                }
            } catch (serviceError) {
                console.warn(`[Server] Exchange rate service error for ${fromUpper} to ${toUpper}:`, serviceError instanceof Error ? serviceError.message : 'Unknown error');
            }
        }

        // CLIENT-SIDE: Try to get exchange rate from proxy API
        if (!isServer) {
            try {
                console.log(`[Client] Fetching exchange rate via proxy API for ${fromUpper} to ${toUpper}`);
                const proxyUrl = `/api/proxy/currency?base=${fromUpper}&symbols=${toUpper}`;
                const response = await fetchWithTimeout(proxyUrl);

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.rates && data.rates[toUpper]) {
                        const rate = data.rates[toUpper];
                        console.log(`[Client] Got exchange rate from proxy API for ${fromUpper} to ${toUpper}: ${rate}`);
                        setCachedRate(fromUpper, toUpper, rate);
                        return rate;
                    }
                } else {
                    console.warn(`[Client] Proxy API returned status ${response.status} for ${fromUpper} to ${toUpper}`);
                }
            } catch (proxyError) {
                console.warn(`[Client] Proxy API error for ${fromUpper} to ${toUpper}:`, proxyError instanceof Error ? proxyError.message : 'Unknown error');
            }

            // Fallback: Use currency store (client-side only)
            console.log(`[Client] Proxy API failed for ${fromUpper} to ${toUpper}, using currency store`);
            try {
                const currencyStore = useCurrencyStore.getState();

                // Check if store has rates, if not try to fetch them
                if (!currencyStore.rates || Object.keys(currencyStore.rates).length === 0) {
                    console.log('[Client] Currency store has no rates, attempting to fetch...');
                    await currencyStore.fetchRates(fromUpper);
                }

                const value = currencyStore.convertAmount(1, fromUpper, toUpper);
                if (value !== null && value !== undefined && value > 0) {
                    console.log(`[Client] Currency store exchange rate for ${fromUpper} to ${toUpper}: ${value}`);
                    setCachedRate(fromUpper, toUpper, value);
                    return value;
                }
            } catch (storeError) {
                console.warn(`[Client] Currency store error for ${fromUpper} to ${toUpper}:`, storeError instanceof Error ? storeError.message : 'Unknown error');
            }
        }

        // Last resort: Use hardcoded fallback rates
        console.log(`All methods failed for ${fromUpper} to ${toUpper}, using fallback rates`);
        const fallbackRate = getFallbackRate(fromUpper, toUpper);
        if (fallbackRate !== null) {
            setCachedRate(fromUpper, toUpper, fallbackRate);
            return fallbackRate;
        }

        console.error(`Could not get exchange rate for ${fromUpper} to ${toUpper} from any source`);
        return null;
    } catch (error) {
        console.error(`Error fetching exchange rate from ${from} to ${to}:`, error instanceof Error ? error.message : 'Unknown error');

        // Try fallback rates even on error
        const fallbackRate = getFallbackRate(from, to);
        if (fallbackRate !== null) {
            return fallbackRate;
        }

        return null;
    }
}
