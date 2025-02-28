import { CurrencyConversionService } from '../services/currencyConversion';
import { useCurrencyStore } from '../services/currency';

/**
 * Test utility for currency conversion
 * This helps verify that our currency conversion improvements are working correctly
 */
export function testCurrencyConversion() {
    console.group('🧪 Currency Conversion Tests');

    try {
        // Get the currency store
        const currencyStore = useCurrencyStore.getState();

        // Log the current state of the currency store
        console.log('Currency store state:', {
            baseCurrency: currencyStore.baseCurrency,
            ratesCount: Object.keys(currencyStore.rates).length,
            lastUpdated: currencyStore.lastUpdated,
            isLoading: currencyStore.isLoading,
            error: currencyStore.error
        });

        // Test basic conversions
        const testCases = [
            { amount: 100, from: 'USD', to: 'EUR' },
            { amount: 100, from: 'USD', to: 'GBP' },
            { amount: 100, from: 'USD', to: 'INR' },
            { amount: 100, from: 'USD', to: 'PKR' },
            { amount: 100, from: 'USD', to: 'AED' },
            { amount: 100, from: 'EUR', to: 'USD' },
            { amount: 100, from: 'GBP', to: 'USD' },
            { amount: 100, from: 'INR', to: 'USD' },
            { amount: 100, from: 'PKR', to: 'USD' },
            { amount: 100, from: 'AED', to: 'USD' }
        ];

        console.log('Running basic conversion tests...');

        const results = testCases.map(({ amount, from, to }) => {
            // Test both the store's convertAmount and our new service
            const storeResult = currencyStore.convertAmount(amount, from, to);
            const serviceResult = CurrencyConversionService.convert(amount, from, to, {
                logPrefix: 'Test',
                validateResult: true
            });

            return {
                test: `${amount} ${from} → ${to}`,
                storeResult,
                serviceResult,
                match: Math.abs(storeResult - serviceResult) < 0.01
            };
        });

        console.table(results);

        // Test edge cases
        console.log('Testing edge cases...');

        // Invalid amount
        const invalidAmount = CurrencyConversionService.convert(NaN, 'USD', 'EUR');
        console.log('Invalid amount (NaN):', invalidAmount);

        // Invalid currencies
        const invalidFrom = CurrencyConversionService.convert(100, '', 'EUR');
        console.log('Invalid from currency:', invalidFrom);

        const invalidTo = CurrencyConversionService.convert(100, 'USD', '');
        console.log('Invalid to currency:', invalidTo);

        // Same currency
        const sameCurrency = CurrencyConversionService.convert(100, 'USD', 'USD');
        console.log('Same currency:', sameCurrency);

        // Unsupported currency
        const unsupportedCurrency = CurrencyConversionService.convert(100, 'USD', 'XYZ');
        console.log('Unsupported currency:', unsupportedCurrency);

        // Test suspicious data
        console.log('Testing suspicious data handling...');

        // Suspiciously low metal prices
        const suspiciousGoldPrice = 10; // USD per gram (too low)
        const suspiciousSilverPrice = 0.1; // USD per gram (too low)

        const suspiciousData = {
            gold: suspiciousGoldPrice,
            silver: suspiciousSilverPrice,
            currency: 'USD',
            lastUpdated: new Date()
        };

        // Import the shouldUseFallback function dynamically
        import('./nisabCalculations').then(({ calculateNisabThresholds }) => {
            const result = calculateNisabThresholds(suspiciousData, 'USD');
            console.log('Nisab calculation with suspicious data:', {
                suspiciousData,
                result,
                usedFallback: result.usedFallback
            });
        }).catch(error => {
            console.error('Error importing nisabCalculations:', error);
        });

        // Test future-dated cache
        const futureDateData = {
            gold: 85,
            silver: 1.2,
            currency: 'USD',
            lastUpdated: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days in the future
        };

        import('./nisabCalculations').then(({ calculateNisabThresholds }) => {
            const result = calculateNisabThresholds(futureDateData, 'USD');
            console.log('Nisab calculation with future-dated cache:', {
                futureDateData,
                result,
                usedFallback: result.usedFallback
            });
        }).catch(error => {
            console.error('Error importing nisabCalculations:', error);
        });

        // Test AED specific case (the one from the logs)
        const aedSuspiciousData = {
            gold: 93.98,
            silver: 1.02,
            currency: 'AED',
            lastUpdated: new Date('2025-02-27T22:49:30.475Z')
        };

        import('./nisabCalculations').then(({ calculateNisabThresholds }) => {
            const result = calculateNisabThresholds(aedSuspiciousData, 'AED');
            console.log('Nisab calculation with suspicious AED data:', {
                aedSuspiciousData,
                result,
                usedFallback: result.usedFallback
            });
        }).catch(error => {
            console.error('Error importing nisabCalculations:', error);
        });

        return {
            success: true,
            message: 'Currency conversion tests completed',
            results
        };
    } catch (error) {
        console.error('Error running currency conversion tests:', error);
        return {
            success: false,
            message: 'Currency conversion tests failed',
            error
        };
    } finally {
        console.groupEnd();
    }
}

/**
 * Run the currency conversion tests and return the results
 */
export function runCurrencyTests() {
    console.log('🧪 Running currency conversion tests...');
    const results = testCurrencyConversion();
    console.log('🧪 Currency conversion test results:', results);
    return results;
} 