import { useCurrencyStore } from './currency';

/**
 * CurrencyConversionService provides a centralized way to handle currency conversions
 * throughout the application, ensuring consistent behavior and proper fallback mechanisms.
 */
export class CurrencyConversionService {
    /**
     * Convert an amount from one currency to another
     * 
     * @param amount The amount to convert
     * @param fromCurrency The source currency code
     * @param toCurrency The target currency code
     * @param options Optional configuration
     * @returns The converted amount
     */
    static convert(
        amount: number,
        fromCurrency: string,
        toCurrency: string,
        options: {
            logPrefix?: string;
            fallbackToHardcoded?: boolean;
            validateResult?: boolean;
        } = {}
    ): number {
        const {
            logPrefix = 'CurrencyConversion',
            fallbackToHardcoded = true,
            validateResult = true
        } = options;

        // Validate inputs
        if (!this.validateInputs(amount, fromCurrency, toCurrency)) {
            console.warn(`${logPrefix}: Invalid inputs, returning 0`);
            return 0;
        }

        // If currencies are the same, no conversion needed
        if (fromCurrency.toLowerCase() === toCurrency.toLowerCase()) {
            console.log(`${logPrefix}: Same currency (${fromCurrency}), no conversion needed`);
            return amount;
        }

        try {
            // Get the currency store
            const currencyStore = useCurrencyStore.getState();

            // Check if the store has rates
            if (!currencyStore.rates || Object.keys(currencyStore.rates).length === 0) {
                console.warn(`${logPrefix}: No exchange rates available in store, using fallback`);
                if (fallbackToHardcoded) {
                    return this.hardcodedConversion(amount, fromCurrency, toCurrency);
                }
                return amount;
            }

            // Use the store's convertAmount function
            const result = currencyStore.convertAmount(amount, fromCurrency, toCurrency);

            // Log the conversion
            console.log(`${logPrefix}: ${amount} ${fromCurrency} → ${result.toFixed(2)} ${toCurrency}`);

            // Validate the result if requested
            if (validateResult && !this.isValidConversionResult(result, amount, fromCurrency, toCurrency)) {
                console.warn(`${logPrefix}: Conversion result validation failed, using fallback`, {
                    amount,
                    fromCurrency,
                    toCurrency,
                    result
                });

                // Use fallback if validation fails
                if (fallbackToHardcoded) {
                    return this.hardcodedConversion(amount, fromCurrency, toCurrency);
                }
            }

            return result;
        } catch (error) {
            // Fix: Prevent circular reference by not logging the entire error object
            console.error(`${logPrefix}: Error during conversion`, {
                amount,
                fromCurrency,
                toCurrency,
                errorMessage: error instanceof Error ? error.message : String(error)
            });

            // Use fallback on error
            if (fallbackToHardcoded) {
                return this.hardcodedConversion(amount, fromCurrency, toCurrency);
            }

            return amount;
        }
    }

    /**
     * Validate conversion inputs
     */
    private static validateInputs(amount: number, fromCurrency: string, toCurrency: string): boolean {
        // Validate amount
        if (amount === undefined || amount === null ||
            typeof amount !== 'number' ||
            isNaN(amount) || !isFinite(amount)) {
            console.warn('Invalid amount for currency conversion:', amount);
            return false;
        }

        // Validate currencies
        if (!fromCurrency || typeof fromCurrency !== 'string') {
            console.warn('Invalid source currency:', fromCurrency);
            return false;
        }

        if (!toCurrency || typeof toCurrency !== 'string') {
            console.warn('Invalid target currency:', toCurrency);
            return false;
        }

        return true;
    }

    /**
     * Check if a conversion result is valid
     */
    private static isValidConversionResult(
        result: number,
        amount: number,
        fromCurrency: string,
        toCurrency: string
    ): boolean {
        // Check if result is a valid number
        if (result === undefined || result === null ||
            typeof result !== 'number' ||
            isNaN(result) || !isFinite(result)) {
            return false;
        }

        // Check for suspiciously large or small conversions
        // This helps catch issues with incorrect exchange rates

        // Define expected ranges for common currency pairs
        const expectedRanges: Record<string, Record<string, [number, number]>> = {
            'USD': {
                'EUR': [0.8, 1.0],    // 1 USD should be between 0.8-1.0 EUR
                'GBP': [0.7, 0.9],    // 1 USD should be between 0.7-0.9 GBP
                'INR': [70, 90],      // 1 USD should be between 70-90 INR
                'PKR': [250, 300],    // 1 USD should be between 250-300 PKR
                'AED': [3.5, 3.8],    // 1 USD should be between 3.5-3.8 AED
                'SAR': [3.6, 3.9]     // 1 USD should be between 3.6-3.9 SAR
            },
            'EUR': {
                'USD': [1.0, 1.25]    // 1 EUR should be between 1.0-1.25 USD
            }
        };

        // IMPORTANT: Add special handling for problematic currencies
        // For currencies like AED, we need to be more lenient with validation
        const problematicCurrencies = ['AED', 'INR', 'PKR', 'SAR'];

        // If either currency is in the problematic list, use a wider validation range
        if (problematicCurrencies.includes(fromCurrency.toUpperCase()) ||
            problematicCurrencies.includes(toCurrency.toUpperCase())) {

            // Calculate the rate
            const rate = result / amount;

            // For problematic currencies, we'll use a different approach
            // Instead of fixed ranges, we'll use the hardcoded rates as a reference
            const hardcodedRate = this.getHardcodedRate(fromCurrency, toCurrency);

            if (hardcodedRate > 0) {
                // Allow a wider margin of error (±50%) for problematic currencies
                const minAcceptable = hardcodedRate * 0.5;
                const maxAcceptable = hardcodedRate * 1.5;

                if (rate < minAcceptable || rate > maxAcceptable) {
                    console.warn('Conversion rate for problematic currency outside acceptable range', {
                        fromCurrency,
                        toCurrency,
                        rate,
                        hardcodedRate,
                        acceptableRange: [minAcceptable, maxAcceptable]
                    });
                    return false;
                }

                // If we're within range, the result is valid
                return true;
            }
        }

        // Check if we have expected ranges for this currency pair
        if (expectedRanges[fromCurrency]?.[toCurrency]) {
            const [min, max] = expectedRanges[fromCurrency][toCurrency];
            const rate = result / amount;

            if (rate < min * 0.5 || rate > max * 1.5) {
                console.warn('Conversion rate outside expected range', {
                    fromCurrency,
                    toCurrency,
                    rate,
                    expectedRange: [min, max]
                });
                return false;
            }
        }

        return true;
    }

    // Add a helper method to get hardcoded rates
    private static getHardcodedRate(fromCurrency: string, toCurrency: string): number {
        // Normalize currency codes
        const from = fromCurrency.toLowerCase();
        const to = toCurrency.toLowerCase();

        // Common currency conversion rates (approximate)
        const rates: Record<string, number> = {
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
            'zar': 18.5
        };

        // If both currencies are in our rates list, we can calculate a rate
        if (rates[from] && rates[to]) {
            // Convert via USD
            return rates[to] / rates[from];
        }

        // If one currency is USD, we can use the rate directly
        if (from === 'usd' && rates[to]) {
            return rates[to];
        }

        if (to === 'usd' && rates[from]) {
            return 1 / rates[from];
        }

        // If we can't determine a rate, return 0
        return 0;
    }

    /**
     * Fallback conversion using hardcoded rates
     */
    private static hardcodedConversion(amount: number, fromCurrency: string, toCurrency: string): number {
        // Common currency conversion rates (approximate)
        const rates: Record<string, number> = {
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
            'zar': 18.5
        };

        // Normalize currency codes
        const from = fromCurrency.toLowerCase();
        const to = toCurrency.toLowerCase();

        // If both currencies are in our rates list, we can do a conversion
        if (rates[from] && rates[to]) {
            // Convert to USD first, then to target currency
            const amountInUSD = amount / rates[from];
            const result = amountInUSD * rates[to];

            console.warn(`Using hardcoded conversion: ${amount} ${fromCurrency} → ${result.toFixed(2)} ${toCurrency}`);
            return result;
        }

        // If we can't convert using the above method, try direct conversion if one currency is USD
        if (from === 'usd' && rates[to]) {
            const result = amount * rates[to];
            console.warn(`Using direct USD conversion: ${amount} USD → ${result.toFixed(2)} ${toCurrency}`);
            return result;
        }

        if (to === 'usd' && rates[from]) {
            const result = amount / rates[from];
            console.warn(`Using inverse conversion to USD: ${amount} ${fromCurrency} → ${result.toFixed(2)} USD`);
            return result;
        }

        // If we can't convert, return the original amount
        console.warn(`Cannot convert ${fromCurrency} to ${toCurrency} using hardcoded rates. Returning original amount.`);
        return amount;
    }

    /**
     * Convert multiple amounts from one currency to another
     */
    static convertMultiple(
        amounts: Array<{ amount: number; fromCurrency: string }>,
        toCurrency: string,
        options: {
            logPrefix?: string;
            fallbackToHardcoded?: boolean;
        } = {}
    ): number[] {
        return amounts.map(({ amount, fromCurrency }) =>
            this.convert(amount, fromCurrency, toCurrency, options)
        );
    }

    /**
     * Get the exchange rate between two currencies
     */
    static getExchangeRate(fromCurrency: string, toCurrency: string): number {
        // Use the convert method with amount 1 to get the exchange rate
        return this.convert(1, fromCurrency, toCurrency);
    }
} 