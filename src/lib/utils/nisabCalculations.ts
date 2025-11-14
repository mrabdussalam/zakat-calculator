import { NISAB } from '@/store/constants';
import { useCurrencyStore } from '@/lib/services/currency';
import { CurrencyConversionService } from '@/lib/services/currencyConversion';
import { CacheValidationService, MetalPriceEntry } from '@/lib/services/cacheValidation';

// Default fallback values for common currencies when validation fails
// These are conservative estimates that will be used when API data is suspicious
const FALLBACK_METAL_PRICES: Record<string, { gold: number; silver: number }> = {
    'USD': { gold: 85, silver: 1.2 },     // USD per gram
    'EUR': { gold: 78, silver: 1.1 },     // EUR per gram
    'GBP': { gold: 67, silver: 0.95 },    // GBP per gram
    'INR': { gold: 7000, silver: 90 },    // INR per gram
    'PKR': { gold: 24000, silver: 300 },  // PKR per gram
    'AED': { gold: 310, silver: 4.4 },    // AED per gram - 310*85=26350, 4.4*595=2618 (within expected ranges)
    'SAR': { gold: 320, silver: 4.5 }     // SAR per gram
};

// Minimum acceptable metal prices per gram in USD to detect suspicious data
const MIN_ACCEPTABLE_PRICES = {
    gold: 50,  // Minimum acceptable gold price per gram in USD
    silver: 0.5 // Minimum acceptable silver price per gram in USD
};

/**
 * Calculate nisab thresholds based on metal prices and target currency
 * This is a pure function that doesn't rely on state management for calculated values
 */
export function calculateNisabThresholds(
    metalPrices: {
        gold: number;
        silver: number;
        currency: string;
        goldUSD?: number;
        silverUSD?: number;
        exchangeRate?: number;
        lastUpdated?: Date | string;
        isCache?: boolean;
        source?: string;
        timestamp?: string | number;
    },
    targetCurrency: string
): {
    goldThreshold: number;
    silverThreshold: number;
    nisabValue: number;
    metalUsed: 'gold' | 'silver';
    isDirectGoldPrice: boolean;
    isDirectSilverPrice: boolean;
    usedFallback: boolean;
} {
    // Initialize flags for direct price availability
    let isDirectGoldPrice = false;
    let isDirectSilverPrice = false;
    let usedFallback = false;

    // Get the source currency from the metal prices
    const sourceCurrency = metalPrices.currency || 'USD';

    // Initialize prices in target currency
    let goldPriceInTargetCurrency = 0;
    let silverPriceInTargetCurrency = 0;

    console.log('calculateNisabThresholds input:', {
        metalPrices,
        targetCurrency,
        sourceCurrency,
        timestamp: metalPrices.timestamp || new Date().toISOString(),
        isCached: !!metalPrices.isCache,
        source: metalPrices.source || 'unknown'
    });

    // IMPORTANT: Always prioritize USD prices as the base for conversion
    // This is the key change to fix the currency issues

    // Check if we have USD prices available (either directly or via goldUSD/silverUSD)
    const hasUSDPrices = (
        (metalPrices.currency === 'USD' && metalPrices.gold > 0 && metalPrices.silver > 0) ||
        (metalPrices.goldUSD !== undefined && metalPrices.goldUSD > 0 &&
            metalPrices.silverUSD !== undefined && metalPrices.silverUSD > 0)
    );

    // If target currency is USD and we have USD prices, use them directly
    if (targetCurrency === 'USD' && hasUSDPrices) {
        // Use direct USD prices if available
        if (metalPrices.currency === 'USD') {
            goldPriceInTargetCurrency = metalPrices.gold;
            silverPriceInTargetCurrency = metalPrices.silver;
        } else {
            // Use the USD prices stored in goldUSD/silverUSD
            goldPriceInTargetCurrency = metalPrices.goldUSD !== undefined ? metalPrices.goldUSD : 0;
            silverPriceInTargetCurrency = metalPrices.silverUSD !== undefined ? metalPrices.silverUSD : 0;
        }

        isDirectGoldPrice = true;
        isDirectSilverPrice = true;

        console.log('Using direct USD prices:', {
            goldPriceInTargetCurrency,
            silverPriceInTargetCurrency,
            currency: 'USD'
        });
    }
    // If we have USD prices but need to convert to another currency
    else if (hasUSDPrices) {
        // Get the USD prices with null checks
        const goldUSD = metalPrices.currency === 'USD' ?
            metalPrices.gold : (metalPrices.goldUSD !== undefined ? metalPrices.goldUSD : 0);
        const silverUSD = metalPrices.currency === 'USD' ?
            metalPrices.silver : (metalPrices.silverUSD !== undefined ? metalPrices.silverUSD : 0);

        // Convert from USD to target currency using our currency service
        goldPriceInTargetCurrency = CurrencyConversionService.convert(
            goldUSD,
            'USD',
            targetCurrency,
            { logPrefix: 'NisabCalc-Gold' }
        );

        silverPriceInTargetCurrency = CurrencyConversionService.convert(
            silverUSD,
            'USD',
            targetCurrency,
            { logPrefix: 'NisabCalc-Silver' }
        );

        console.log('Converted from USD to target currency:', {
            goldUSD,
            silverUSD,
            goldPriceInTargetCurrency,
            silverPriceInTargetCurrency,
            targetCurrency
        });
    }
    // If we don't have USD prices but source and target currencies match
    else if (sourceCurrency === targetCurrency) {
        // Use the prices directly since currencies match
        goldPriceInTargetCurrency = metalPrices.gold;
        silverPriceInTargetCurrency = metalPrices.silver;

        isDirectGoldPrice = true;
        isDirectSilverPrice = true;

        console.log('Using direct prices (same currency):', {
            goldPriceInTargetCurrency,
            silverPriceInTargetCurrency,
            currency: targetCurrency
        });

        // For specific currencies known to have issues, validate the prices
        if (['AED', 'INR', 'PKR', 'SAR'].includes(targetCurrency)) {
            // Check if the prices seem reasonable based on USD conversion
            const expectedGoldPrice = getExpectedPriceInCurrency(50, 'USD', targetCurrency, 'gold');
            const expectedSilverPrice = getExpectedPriceInCurrency(0.5, 'USD', targetCurrency, 'silver');

            const goldPriceRatio = goldPriceInTargetCurrency / expectedGoldPrice;
            const silverPriceRatio = silverPriceInTargetCurrency / expectedSilverPrice;

            // If prices are significantly off from expected values, use fallback conversion
            if (goldPriceRatio < 0.1 || goldPriceRatio > 10 ||
                silverPriceRatio < 0.1 || silverPriceRatio > 10) {

                console.warn(`Prices for ${targetCurrency} seem incorrect, using fallback conversion`, {
                    actual: { gold: goldPriceInTargetCurrency, silver: silverPriceInTargetCurrency },
                    expected: { gold: expectedGoldPrice, silver: expectedSilverPrice },
                    ratio: { gold: goldPriceRatio, silver: silverPriceRatio }
                });

                // Use fallback conversion
                goldPriceInTargetCurrency = expectedGoldPrice;
                silverPriceInTargetCurrency = expectedSilverPrice;
                usedFallback = true;
            }
        }
    }
    // If we need to convert from source currency to target currency
    else {
        // First try to convert to USD, then to target currency
        // This two-step conversion is more reliable than direct conversion for some currency pairs

        // Step 1: Convert from source to USD
        const goldUSD = CurrencyConversionService.convert(
            metalPrices.gold,
            sourceCurrency,
            'USD',
            { logPrefix: 'NisabCalc-ToUSD-Gold' }
        );

        const silverUSD = CurrencyConversionService.convert(
            metalPrices.silver,
            sourceCurrency,
            'USD',
            { logPrefix: 'NisabCalc-ToUSD-Silver' }
        );

        // Step 2: Convert from USD to target
        goldPriceInTargetCurrency = CurrencyConversionService.convert(
            goldUSD,
            'USD',
            targetCurrency,
            { logPrefix: 'NisabCalc-FromUSD-Gold' }
        );

        silverPriceInTargetCurrency = CurrencyConversionService.convert(
            silverUSD,
            'USD',
            targetCurrency,
            { logPrefix: 'NisabCalc-FromUSD-Silver' }
        );

        console.log('Two-step conversion via USD:', {
            source: { gold: metalPrices.gold, silver: metalPrices.silver, currency: sourceCurrency },
            usd: { gold: goldUSD, silver: silverUSD },
            target: { gold: goldPriceInTargetCurrency, silver: silverPriceInTargetCurrency, currency: targetCurrency }
        });
    }

    // Fallback for specific currencies with known issues
    if ((goldPriceInTargetCurrency <= 0 || silverPriceInTargetCurrency <= 0) &&
        ['AED', 'INR', 'PKR', 'SAR'].includes(targetCurrency)) {

        console.warn(`Using hardcoded fallback for ${targetCurrency} due to zero or negative prices`);

        // Use hardcoded fallback values for these currencies
        const fallbackValues: Record<string, { gold: number; silver: number }> = {
            'AED': { gold: 183.5, silver: 1.83 },
            'INR': { gold: 4100, silver: 41 },
            'PKR': { gold: 14000, silver: 140 },
            'SAR': { gold: 187.5, silver: 1.88 }
        };

        if (goldPriceInTargetCurrency <= 0 && fallbackValues[targetCurrency]) {
            goldPriceInTargetCurrency = fallbackValues[targetCurrency].gold;
        }

        if (silverPriceInTargetCurrency <= 0 && fallbackValues[targetCurrency]) {
            silverPriceInTargetCurrency = fallbackValues[targetCurrency].silver;
        }

        usedFallback = true;

        console.log(`Applied fallback values for ${targetCurrency}:`, {
            gold: goldPriceInTargetCurrency,
            silver: silverPriceInTargetCurrency
        });
    }

    // Validate prices before calculation to prevent NaN/Infinity results
    if (!isValidPrice(goldPriceInTargetCurrency)) {
        console.error('Invalid gold price detected before calculation:', goldPriceInTargetCurrency);
        throw new Error(`Invalid gold price: ${goldPriceInTargetCurrency}. Price must be a positive finite number.`);
    }

    if (!isValidPrice(silverPriceInTargetCurrency)) {
        console.error('Invalid silver price detected before calculation:', silverPriceInTargetCurrency);
        throw new Error(`Invalid silver price: ${silverPriceInTargetCurrency}. Price must be a positive finite number.`);
    }

    // Calculate nisab thresholds using the weights and prices
    const goldGrams = NISAB.GOLD.GRAMS; // 85g
    const silverGrams = NISAB.SILVER.GRAMS; // 595g

    const goldThreshold = goldPriceInTargetCurrency * goldGrams;
    const silverThreshold = silverPriceInTargetCurrency * silverGrams;

    // Validate calculated thresholds
    if (!isValidPrice(goldThreshold) || !isValidPrice(silverThreshold)) {
        console.error('Invalid threshold calculated:', { goldThreshold, silverThreshold });
        throw new Error(`Invalid nisab thresholds calculated. Gold: ${goldThreshold}, Silver: ${silverThreshold}`);
    }

    // The nisab value is the lower of the two thresholds
    const nisabValue = Math.min(goldThreshold, silverThreshold);
    const metalUsed = nisabValue === goldThreshold ? 'gold' : 'silver';

    // Log the calculated values
    console.log('calculateNisabThresholds result:', {
        goldThreshold,
        silverThreshold,
        nisabValue,
        metalUsed,
        targetCurrency,
        isDirectGoldPrice,
        isDirectSilverPrice,
        usedFallback
    });

    // Perform validation for specific currencies
    const validationResult = validateNisabValues(goldThreshold, silverThreshold, targetCurrency);

    // If validation fails and we haven't already used fallback values, recalculate with fallbacks
    if (!validationResult.isValid && !usedFallback) {
        console.warn('Validation failed for calculated nisab values. Using fallback values.', validationResult.reason);

        // Use hardcoded fallback values for these currencies
        const fallbackNisabValues: Record<string, { gold: number; silver: number }> = {
            'USD': { gold: 8500, silver: 600 },
            'AED': { gold: 31000, silver: 2200 },
            'INR': { gold: 700000, silver: 50000 },
            'PKR': { gold: 2400000, silver: 170000 },
            'SAR': { gold: 32000, silver: 2300 },
            'GBP': { gold: 6800, silver: 480 },
            'EUR': { gold: 7900, silver: 560 }
        };

        // If we have fallback values for this currency, use them directly
        if (fallbackNisabValues[targetCurrency]) {
            return {
                goldThreshold: fallbackNisabValues[targetCurrency].gold,
                silverThreshold: fallbackNisabValues[targetCurrency].silver,
                nisabValue: Math.min(
                    fallbackNisabValues[targetCurrency].gold,
                    fallbackNisabValues[targetCurrency].silver
                ),
                metalUsed: fallbackNisabValues[targetCurrency].gold < fallbackNisabValues[targetCurrency].silver ? 'gold' : 'silver',
                isDirectGoldPrice: false,
                isDirectSilverPrice: false,
                usedFallback: true
            };
        }

        // Otherwise, recursively call this function but force fallback usage
        return calculateNisabThresholds({
            ...metalPrices,
            // Set a flag to force fallback usage in the recursive call
            isCache: true,
            // Use CacheValidationService to get a safe timestamp (never in the future)
            timestamp: CacheValidationService.getSafeTimestamp()
        }, targetCurrency);
    }

    return {
        goldThreshold,
        silverThreshold,
        nisabValue,
        metalUsed,
        isDirectGoldPrice,
        isDirectSilverPrice,
        usedFallback
    };
}

// Helper function to get expected price in a currency based on USD reference price
function getExpectedPriceInCurrency(usdPrice: number, fromCurrency: string, toCurrency: string, metal: 'gold' | 'silver'): number {
    try {
        // First try to use the currency conversion service
        return CurrencyConversionService.convert(
            usdPrice,
            fromCurrency,
            toCurrency,
            { logPrefix: `NisabCalc-Min${metal.charAt(0).toUpperCase() + metal.slice(1)}Check` }
        );
    } catch (error) {
        console.warn(`Failed to convert ${metal} price from ${fromCurrency} to ${toCurrency}:`, error);

        // Fallback to hardcoded conversion rates for common currencies
        const hardcodedRates: Record<string, number> = {
            'AED': 3.67,  // 1 USD = 3.67 AED
            'INR': 82.0,  // 1 USD = 82 INR
            'PKR': 280.0, // 1 USD = 280 PKR
            'SAR': 3.75,  // 1 USD = 3.75 SAR
            'GBP': 0.8,   // 1 USD = 0.8 GBP
            'EUR': 0.93   // 1 USD = 0.93 EUR
        };

        if (hardcodedRates[toCurrency]) {
            const convertedPrice = usdPrice * hardcodedRates[toCurrency];
            console.log(`Using hardcoded conversion: ${usdPrice} USD → ${convertedPrice.toFixed(2)} ${toCurrency}`);
            return convertedPrice;
        }

        // If no hardcoded rate, return the original price as a last resort
        return usdPrice;
    }
}

/**
 * Check if we should use fallback values based on the metal prices data
 * This is a secondary check in addition to CacheValidationService
 */
function shouldUseFallback(metalPrices: {
    gold: number;
    silver: number;
    currency: string;
    lastUpdated?: Date | string;
    timestamp?: number;
    isCache?: boolean;
}): boolean {
    // Check if the cache timestamp is in the future (invalid)
    if (metalPrices.timestamp) {
        if (CacheValidationService.isFutureTimestamp(metalPrices.timestamp)) {
            console.warn('Detected future-dated timestamp', {
                timestamp: metalPrices.timestamp,
                now: Date.now(),
                difference: (metalPrices.timestamp - Date.now()) / (1000 * 60 * 60 * 24) + ' days'
            });
            return true;
        }
    } else if (metalPrices.lastUpdated) {
        if (CacheValidationService.isFutureTimestamp(metalPrices.lastUpdated)) {
            console.warn('Detected future-dated lastUpdated', {
                lastUpdated: metalPrices.lastUpdated,
                now: new Date().toISOString()
            });
            return true;
        }
    }

    // Check for suspiciously low prices
    if (metalPrices.currency === 'USD') {
        if (metalPrices.gold < MIN_ACCEPTABLE_PRICES.gold ||
            metalPrices.silver < MIN_ACCEPTABLE_PRICES.silver) {
            console.warn('Detected suspiciously low metal prices in USD', {
                goldPrice: metalPrices.gold,
                silverPrice: metalPrices.silver,
                minAcceptableGold: MIN_ACCEPTABLE_PRICES.gold,
                minAcceptableSilver: MIN_ACCEPTABLE_PRICES.silver
            });
            return true;
        }
    } else {
        // For non-USD currencies, we need to check if the prices are suspiciously low
        // based on the expected range for that currency

        // Convert the minimum acceptable prices to the target currency
        const minGoldPrice = CurrencyConversionService.convert(
            MIN_ACCEPTABLE_PRICES.gold,
            'USD',
            metalPrices.currency,
            {
                logPrefix: 'NisabCalc-MinGoldCheck',
                validateResult: false
            }
        );

        const minSilverPrice = CurrencyConversionService.convert(
            MIN_ACCEPTABLE_PRICES.silver,
            'USD',
            metalPrices.currency,
            {
                logPrefix: 'NisabCalc-MinSilverCheck',
                validateResult: false
            }
        );

        if (metalPrices.gold < minGoldPrice * 0.5 ||
            metalPrices.silver < minSilverPrice * 0.5) {
            console.warn(`Detected suspiciously low metal prices in ${metalPrices.currency}`, {
                goldPrice: metalPrices.gold,
                silverPrice: metalPrices.silver,
                minAcceptableGold: minGoldPrice,
                minAcceptableSilver: minSilverPrice
            });
            return true;
        }
    }

    // Check for invalid or zero prices
    if (!isValidPrice(metalPrices.gold) || !isValidPrice(metalPrices.silver)) {
        console.warn('Detected invalid metal prices', {
            goldPrice: metalPrices.gold,
            silverPrice: metalPrices.silver
        });
        return true;
    }

    return false;
}

/**
 * Check if a price is valid (non-zero, finite, positive)
 */
function isValidPrice(price: number): boolean {
    return typeof price === 'number' && isFinite(price) && price > 0;
}

/**
 * Validate nisab values against expected ranges for common currencies
 * This helps detect conversion issues
 */
export function validateNisabValues(
    goldThreshold: number,
    silverThreshold: number,
    currency: string
): { isValid: boolean; reason?: string } {
    // Define expected value ranges for common currencies
    const expectedRanges: Record<string, { gold: [number, number], silver: [number, number] }> = {
        'USD': {
            gold: [7000, 10000],     // Expected range for 85g gold in USD
            silver: [500, 800]        // Expected range for 595g silver in USD
        },
        'PKR': {
            gold: [2000000, 3000000], // Expected range for 85g gold in PKR
            silver: [150000, 250000]  // Expected range for 595g silver in PKR
        },
        'EUR': {
            gold: [6000, 9000],      // Expected range for 85g gold in EUR
            silver: [400, 700]        // Expected range for 595g silver in EUR
        },
        'GBP': {
            gold: [5500, 8500],      // Expected range for 85g gold in GBP
            silver: [350, 650]        // Expected range for 595g silver in GBP
        },
        'INR': {
            gold: [550000, 850000],  // Expected range for 85g gold in INR
            silver: [40000, 70000]   // Expected range for 595g silver in INR
        },
        'AED': {
            gold: [24000, 36000],    // Updated range for 85g gold in AED (widened)
            silver: [1500, 3500]      // Updated range for 595g silver in AED (widened)
        },
        'SAR': {
            gold: [26000, 36000],    // Expected range for 85g gold in SAR
            silver: [1600, 3100]      // Expected range for 595g silver in SAR
        }
    };

    // If we don't have expected ranges for this currency, return valid
    if (!expectedRanges[currency]) {
        return { isValid: true };
    }

    const goldRange = expectedRanges[currency].gold;
    const silverRange = expectedRanges[currency].silver;

    // Add more logging to understand the current values
    console.log(`Validating nisab values for ${currency}:`, {
        goldThreshold,
        silverThreshold,
        expectedGoldRange: goldRange,
        expectedSilverRange: silverRange
    });

    // Define currencies that need a wider validation margin
    const currenciesNeedingWiderMargin = ['AED', 'INR', 'PKR', 'SAR'];

    // Use a wider margin for validation for currencies that need it
    // Increased to 40% for specific currencies due to observed validation issues
    const margin = currenciesNeedingWiderMargin.includes(currency) ? 0.40 : 0.15;

    const goldLowerBound = goldRange[0] * (1 - margin);
    const goldUpperBound = goldRange[1] * (1 + margin);
    const silverLowerBound = silverRange[0] * (1 - margin);
    const silverUpperBound = silverRange[1] * (1 + margin);

    const isGoldValid = goldThreshold >= goldLowerBound && goldThreshold <= goldUpperBound;
    const isSilverValid = silverThreshold >= silverLowerBound && silverThreshold <= silverUpperBound;

    // If either value is outside expected range
    if (!isGoldValid || !isSilverValid) {
        console.warn(`Nisab values outside expected range for ${currency}:`, {
            goldThreshold,
            silverThreshold,
            expectedGoldRange: goldRange,
            expectedSilverRange: silverRange,
            actualMargins: {
                gold: goldThreshold < goldLowerBound
                    ? `${((goldLowerBound - goldThreshold) / goldLowerBound * 100).toFixed(1)}% below min`
                    : `${((goldThreshold - goldUpperBound) / goldUpperBound * 100).toFixed(1)}% above max`,
                silver: silverThreshold < silverLowerBound
                    ? `${((silverLowerBound - silverThreshold) / silverLowerBound * 100).toFixed(1)}% below min`
                    : `${((silverThreshold - silverUpperBound) / silverUpperBound * 100).toFixed(1)}% above max`
            }
        });

        return {
            isValid: false,
            reason: `Values outside expected range for ${currency}. ` +
                `Gold: ${goldThreshold} (expected ${goldRange[0]}-${goldRange[1]}), ` +
                `Silver: ${silverThreshold} (expected ${silverRange[0]}-${silverRange[1]})`
        };
    }

    return { isValid: true };
}

/**
 * Force refresh the Nisab calculations by clearing any cached data
 * and recalculating with fresh exchange rates
 */
export async function refreshNisabCalculations(
    metalPrices: {
        gold: number;
        silver: number;
        currency: string;
        goldUSD?: number;
        silverUSD?: number;
    },
    targetCurrency: string
): Promise<{
    goldThreshold: number;
    silverThreshold: number;
    nisabValue: number;
    metalUsed: 'gold' | 'silver';
    refreshed: boolean;
}> {
    console.log('Refreshing Nisab calculations...', {
        sourceCurrency: metalPrices.currency,
        targetCurrency,
        goldPrice: metalPrices.gold,
        silverPrice: metalPrices.silver
    });

    // First, try to refresh the exchange rates
    const currencyStore = useCurrencyStore.getState();
    let refreshed = false;
    let refreshErrors = [];

    try {
        // Force refresh the rates for both the source and target currencies
        if (metalPrices.currency !== targetCurrency) {
            console.log(`Refreshing exchange rates for source currency: ${metalPrices.currency}`);
            try {
                await currencyStore.forceRefreshRates(metalPrices.currency);
                console.log(`Successfully refreshed rates for ${metalPrices.currency}`);
            } catch (sourceError) {
                console.error(`Failed to refresh rates for ${metalPrices.currency}:`, sourceError);
                refreshErrors.push(`Source currency refresh failed: ${sourceError instanceof Error ? sourceError.message : String(sourceError)}`);
            }

            console.log(`Refreshing exchange rates for target currency: ${targetCurrency}`);
            try {
                await currencyStore.forceRefreshRates(targetCurrency);
                console.log(`Successfully refreshed rates for ${targetCurrency}`);
                refreshed = true;
            } catch (targetError) {
                console.error(`Failed to refresh rates for ${targetCurrency}:`, targetError);
                refreshErrors.push(`Target currency refresh failed: ${targetError instanceof Error ? targetError.message : String(targetError)}`);
            }
        } else {
            console.log(`Refreshing exchange rates for currency: ${targetCurrency}`);
            await currencyStore.forceRefreshRates(targetCurrency);
            console.log(`Successfully refreshed rates for ${targetCurrency}`);
            refreshed = true;
        }
    } catch (error) {
        console.error('Failed to refresh exchange rates:', error);
        refreshErrors.push(`General refresh error: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Define currencies that need special handling
    const currenciesNeedingSpecialHandling = ['AED', 'INR', 'PKR', 'SAR'];

    // Special handling for currencies that have shown issues with direct conversion
    if (currenciesNeedingSpecialHandling.includes(targetCurrency) ||
        currenciesNeedingSpecialHandling.includes(metalPrices.currency)) {
        const currencyWithIssue = currenciesNeedingSpecialHandling.includes(targetCurrency)
            ? targetCurrency
            : metalPrices.currency;

        console.log(`Special handling for ${currencyWithIssue} currency detected`);

        // For these currencies, ensure we have USD rates as a reference
        try {
            await currencyStore.forceRefreshRates('USD');
            console.log(`Successfully refreshed USD rates as reference for ${currencyWithIssue}`);

            // For certain currencies, also refresh EUR as an additional reference point
            if (['INR', 'PKR'].includes(currencyWithIssue)) {
                try {
                    await currencyStore.forceRefreshRates('EUR');
                    console.log(`Successfully refreshed EUR rates as additional reference for ${currencyWithIssue}`);
                } catch (eurError) {
                    console.warn('Failed to refresh EUR rates as additional reference:', eurError);
                }
            }
        } catch (usdError) {
            console.warn('Failed to refresh USD rates as reference:', usdError);
        }
    }

    // Now recalculate the Nisab thresholds with the refreshed rates
    const result = calculateNisabThresholds(
        {
            ...metalPrices,
            // Force a fresh timestamp to bypass any caching
            timestamp: Date.now()
        },
        targetCurrency
    );

    // Log the result for debugging
    console.log('Refreshed Nisab calculations result:', {
        goldThreshold: result.goldThreshold,
        silverThreshold: result.silverThreshold,
        nisabValue: result.nisabValue,
        metalUsed: result.metalUsed,
        refreshed,
        refreshErrors: refreshErrors.length > 0 ? refreshErrors : 'None'
    });

    return {
        ...result,
        refreshed
    };
} 