/**
 * CacheValidationService
 * 
 * A centralized service for validating cached data throughout the application.
 * This service focuses on:
 * 1. Detecting and rejecting future-dated cache entries
 * 2. Validating metal prices against expected ranges
 * 3. Ensuring cache entries haven't expired
 * 4. Providing consistent validation logic across the application
 */

// Define expected price ranges for metals in USD
const EXPECTED_METAL_PRICE_RANGES = {
    gold: {
        min: 50,    // Minimum acceptable gold price per gram in USD
        max: 120    // Maximum acceptable gold price per gram in USD
    },
    silver: {
        min: 0.5,   // Minimum acceptable silver price per gram in USD
        max: 3      // Maximum acceptable silver price per gram in USD
    }
};

// Define expected exchange rate ranges for common currencies (relative to USD)
const EXPECTED_EXCHANGE_RATE_RANGES: Record<string, { min: number; max: number }> = {
    'EUR': { min: 0.8, max: 1.0 },
    'GBP': { min: 0.7, max: 0.9 },
    'INR': { min: 70, max: 90 },
    'PKR': { min: 250, max: 300 },
    'AED': { min: 3.5, max: 3.8 },
    'SAR': { min: 3.6, max: 3.9 },
    'JPY': { min: 140, max: 160 }
};

// Default cache TTL (Time To Live) in milliseconds
const DEFAULT_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export interface ValidationOptions {
    maxAge?: number;                // Maximum age of cache entry in milliseconds
    allowFutureDates?: boolean;     // Whether to allow future-dated entries (almost always false)
    validateTimestamp?: boolean;    // Whether to validate the timestamp
    logPrefix?: string;             // Prefix for log messages
    strictValidation?: boolean;     // Whether to apply strict validation rules
}

export interface MetalPriceEntry {
    gold: number;
    silver: number;
    currency: string;
    lastUpdated?: Date | string;
    isCache?: boolean;
    source?: string;
    timestamp?: number;
}

export interface ExchangeRateEntry {
    rates: Record<string, number>;
    base: string;
    date?: string | Date;
    timestamp?: number;
}

export class CacheValidationService {
    /**
     * Validate a generic cache entry
     */
    static validateCacheEntry<T>(
        entry: T | null | undefined,
        options: ValidationOptions = {}
    ): { isValid: boolean; reason?: string } {
        const {
            maxAge = DEFAULT_CACHE_TTL,
            allowFutureDates = false,
            validateTimestamp = true,
            logPrefix = 'CacheValidation',
            strictValidation = false
        } = options;

        // Check if entry exists
        if (!entry) {
            return { isValid: false, reason: 'Cache entry is null or undefined' };
        }

        // Check if entry is an object
        if (typeof entry !== 'object') {
            return { isValid: false, reason: 'Cache entry is not an object' };
        }

        // Validate timestamp if required
        if (validateTimestamp && 'timestamp' in entry) {
            const timestamp = (entry as any).timestamp;
            const now = Date.now();

            // Check if timestamp is a valid number
            if (typeof timestamp !== 'number' || isNaN(timestamp)) {
                console.warn(`${logPrefix}: Invalid timestamp format`, { timestamp });
                return { isValid: false, reason: 'Invalid timestamp format' };
            }

            // Check if timestamp is in the future
            if (!allowFutureDates && timestamp > now) {
                const futureTime = new Date(timestamp);
                const currentTime = new Date(now);
                console.warn(`${logPrefix}: Future-dated cache entry detected`, {
                    timestamp,
                    futureTime: futureTime.toISOString(),
                    currentTime: currentTime.toISOString(),
                    difference: (timestamp - now) / 1000 / 60 / 60 / 24 + ' days'
                });
                return { isValid: false, reason: 'Future-dated cache entry' };
            }

            // Check if cache has expired
            if (now - timestamp > maxAge) {
                console.log(`${logPrefix}: Cache entry has expired`, {
                    age: (now - timestamp) / 1000 + 's',
                    maxAge: maxAge / 1000 + 's'
                });
                return { isValid: false, reason: 'Cache entry has expired' };
            }
        } else if (validateTimestamp && 'lastUpdated' in entry) {
            // Alternative timestamp field
            const lastUpdated = (entry as any).lastUpdated;
            const now = new Date();

            // Parse the date if it's a string
            const lastUpdatedDate = typeof lastUpdated === 'string'
                ? new Date(lastUpdated)
                : lastUpdated instanceof Date
                    ? lastUpdated
                    : null;

            if (!lastUpdatedDate) {
                console.warn(`${logPrefix}: Invalid lastUpdated format`, { lastUpdated });
                return { isValid: false, reason: 'Invalid lastUpdated format' };
            }

            // Check if lastUpdated is in the future
            if (!allowFutureDates && lastUpdatedDate > now) {
                console.warn(`${logPrefix}: Future-dated lastUpdated detected`, {
                    lastUpdated: lastUpdatedDate.toISOString(),
                    currentTime: now.toISOString(),
                    difference: (lastUpdatedDate.getTime() - now.getTime()) / 1000 / 60 / 60 / 24 + ' days'
                });
                return { isValid: false, reason: 'Future-dated lastUpdated' };
            }

            // Check if cache has expired
            if (now.getTime() - lastUpdatedDate.getTime() > maxAge) {
                console.log(`${logPrefix}: Cache entry has expired based on lastUpdated`, {
                    age: (now.getTime() - lastUpdatedDate.getTime()) / 1000 + 's',
                    maxAge: maxAge / 1000 + 's'
                });
                return { isValid: false, reason: 'Cache entry has expired' };
            }
        } else if (validateTimestamp && strictValidation) {
            // If strict validation is enabled and no timestamp field is found
            return { isValid: false, reason: 'No timestamp or lastUpdated field found' };
        }

        return { isValid: true };
    }

    /**
     * Validate metal prices
     */
    static validateMetalPrices(
        entry: MetalPriceEntry,
        options: ValidationOptions = {}
    ): { isValid: boolean; reason?: string } {
        const {
            logPrefix = 'MetalPriceValidation',
            strictValidation = false
        } = options;

        // First validate as a generic cache entry
        const baseValidation = this.validateCacheEntry(entry, options);
        if (!baseValidation.isValid) {
            return baseValidation;
        }

        // Check if gold and silver prices exist and are valid numbers
        if (typeof entry.gold !== 'number' || isNaN(entry.gold) || entry.gold <= 0) {
            console.warn(`${logPrefix}: Invalid gold price`, { goldPrice: entry.gold });
            return { isValid: false, reason: 'Invalid gold price' };
        }

        if (typeof entry.silver !== 'number' || isNaN(entry.silver) || entry.silver <= 0) {
            console.warn(`${logPrefix}: Invalid silver price`, { silverPrice: entry.silver });
            return { isValid: false, reason: 'Invalid silver price' };
        }

        // Check if currency is valid
        if (!entry.currency || typeof entry.currency !== 'string') {
            console.warn(`${logPrefix}: Invalid currency`, { currency: entry.currency });
            return { isValid: false, reason: 'Invalid currency' };
        }

        // For USD prices, validate against expected ranges
        if (entry.currency === 'USD') {
            if (entry.gold < EXPECTED_METAL_PRICE_RANGES.gold.min ||
                entry.gold > EXPECTED_METAL_PRICE_RANGES.gold.max) {
                console.warn(`${logPrefix}: Gold price outside expected range for USD`, {
                    goldPrice: entry.gold,
                    expectedRange: EXPECTED_METAL_PRICE_RANGES.gold
                });
                return {
                    isValid: false,
                    reason: `Gold price (${entry.gold}) outside expected range (${EXPECTED_METAL_PRICE_RANGES.gold.min}-${EXPECTED_METAL_PRICE_RANGES.gold.max}) for USD`
                };
            }

            if (entry.silver < EXPECTED_METAL_PRICE_RANGES.silver.min ||
                entry.silver > EXPECTED_METAL_PRICE_RANGES.silver.max) {
                console.warn(`${logPrefix}: Silver price outside expected range for USD`, {
                    silverPrice: entry.silver,
                    expectedRange: EXPECTED_METAL_PRICE_RANGES.silver
                });
                return {
                    isValid: false,
                    reason: `Silver price (${entry.silver}) outside expected range (${EXPECTED_METAL_PRICE_RANGES.silver.min}-${EXPECTED_METAL_PRICE_RANGES.silver.max}) for USD`
                };
            }
        }
        // For other currencies, we need to check if the prices are reasonable
        // based on expected exchange rates
        else if (strictValidation && EXPECTED_EXCHANGE_RATE_RANGES[entry.currency]) {
            const exchangeRate = EXPECTED_EXCHANGE_RATE_RANGES[entry.currency];

            // Calculate expected price ranges for this currency
            const expectedGoldMin = EXPECTED_METAL_PRICE_RANGES.gold.min * exchangeRate.min;
            const expectedGoldMax = EXPECTED_METAL_PRICE_RANGES.gold.max * exchangeRate.max;
            const expectedSilverMin = EXPECTED_METAL_PRICE_RANGES.silver.min * exchangeRate.min;
            const expectedSilverMax = EXPECTED_METAL_PRICE_RANGES.silver.max * exchangeRate.max;

            // Allow a wider range (50% margin) for non-USD currencies due to exchange rate fluctuations
            const margin = 0.5;

            if (entry.gold < expectedGoldMin * (1 - margin) ||
                entry.gold > expectedGoldMax * (1 + margin)) {
                console.warn(`${logPrefix}: Gold price outside expected range for ${entry.currency}`, {
                    goldPrice: entry.gold,
                    expectedRange: [expectedGoldMin, expectedGoldMax],
                    actualVsExpectedRatio: entry.gold / expectedGoldMin
                });
                return {
                    isValid: false,
                    reason: `Gold price (${entry.gold}) outside expected range for ${entry.currency}`
                };
            }

            if (entry.silver < expectedSilverMin * (1 - margin) ||
                entry.silver > expectedSilverMax * (1 + margin)) {
                console.warn(`${logPrefix}: Silver price outside expected range for ${entry.currency}`, {
                    silverPrice: entry.silver,
                    expectedRange: [expectedSilverMin, expectedSilverMax],
                    actualVsExpectedRatio: entry.silver / expectedSilverMin
                });
                return {
                    isValid: false,
                    reason: `Silver price (${entry.silver}) outside expected range for ${entry.currency}`
                };
            }
        }

        return { isValid: true };
    }

    /**
     * Validate exchange rates
     */
    static validateExchangeRates(
        entry: ExchangeRateEntry,
        options: ValidationOptions = {}
    ): { isValid: boolean; reason?: string } {
        const {
            logPrefix = 'ExchangeRateValidation',
            strictValidation = false
        } = options;

        // First validate as a generic cache entry
        const baseValidation = this.validateCacheEntry(entry, options);
        if (!baseValidation.isValid) {
            return baseValidation;
        }

        // Check if rates exist and are an object
        if (!entry.rates || typeof entry.rates !== 'object') {
            console.warn(`${logPrefix}: Invalid rates object`, { rates: entry.rates });
            return { isValid: false, reason: 'Invalid rates object' };
        }

        // Check if base currency is valid
        if (!entry.base || typeof entry.base !== 'string') {
            console.warn(`${logPrefix}: Invalid base currency`, { base: entry.base });
            return { isValid: false, reason: 'Invalid base currency' };
        }

        // Validate individual rates against expected ranges
        if (strictValidation && entry.base === 'USD') {
            for (const [currency, rate] of Object.entries(entry.rates)) {
                if (EXPECTED_EXCHANGE_RATE_RANGES[currency]) {
                    const expectedRange = EXPECTED_EXCHANGE_RATE_RANGES[currency];

                    // Allow a wider range (20% margin) due to exchange rate fluctuations
                    const margin = 0.2;

                    if (rate < expectedRange.min * (1 - margin) ||
                        rate > expectedRange.max * (1 + margin)) {
                        console.warn(`${logPrefix}: Exchange rate outside expected range for ${currency}`, {
                            rate,
                            expectedRange,
                            actualVsExpectedRatio: rate / expectedRange.min
                        });
                        return {
                            isValid: false,
                            reason: `Exchange rate (${rate}) outside expected range for ${currency}`
                        };
                    }
                }
            }
        }

        return { isValid: true };
    }

    /**
     * Check if a timestamp is in the future
     */
    static isFutureTimestamp(timestamp: number | Date | string): boolean {
        const now = new Date();
        const date = typeof timestamp === 'number'
            ? new Date(timestamp)
            : typeof timestamp === 'string'
                ? new Date(timestamp)
                : timestamp;

        return date > now;
    }

    /**
     * Get a safe timestamp (never in the future)
     */
    static getSafeTimestamp(): number {
        return Date.now();
    }
} 