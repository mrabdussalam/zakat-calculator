import { calculateNisabThresholds } from './nisabCalculations';

/**
 * Test utility to verify nisab calculations with various inputs
 * This can be used to debug issues with metal prices and currency conversion
 */
export function testNisabCalculations() {
    console.group('🧪 Testing Nisab Calculations');

    // Test with valid prices
    console.log('Test with valid USD prices:');
    const validUsdResult = calculateNisabThresholds({
        gold: 85,
        silver: 1.2,
        currency: 'USD',
        lastUpdated: new Date()
    }, 'USD');
    console.log('Result:', validUsdResult);

    // Test with valid INR prices
    console.log('Test with valid INR prices:');
    const validInrResult = calculateNisabThresholds({
        gold: 7000,
        silver: 90,
        currency: 'INR',
        lastUpdated: new Date()
    }, 'INR');
    console.log('Result:', validInrResult);

    // Test with suspiciously low INR prices (similar to the issue in logs)
    console.log('Test with suspiciously low INR prices:');
    const lowInrResult = calculateNisabThresholds({
        gold: 93.98,
        silver: 1.02,
        currency: 'INR',
        lastUpdated: new Date()
    }, 'INR');
    console.log('Result:', lowInrResult);

    // Test with future-dated cache
    console.log('Test with future-dated cache:');
    const futureDateResult = calculateNisabThresholds({
        gold: 85,
        silver: 1.2,
        currency: 'USD',
        lastUpdated: new Date('2025-02-27T22:29:56.805Z'),
        isCache: true
    }, 'USD');
    console.log('Result:', futureDateResult);

    // Test currency conversion
    console.log('Test currency conversion from USD to INR:');
    const conversionResult = calculateNisabThresholds({
        gold: 85,
        silver: 1.2,
        currency: 'USD',
        lastUpdated: new Date()
    }, 'INR');
    console.log('Result:', conversionResult);

    console.groupEnd();

    return {
        validUsdResult,
        validInrResult,
        lowInrResult,
        futureDateResult,
        conversionResult
    };
}

/**
 * Run this function in the browser console to test the nisab calculations
 */
export function runNisabTests() {
    const results = testNisabCalculations();

    // Check if fallback values are being used correctly
    const fallbackTests = [
        { name: 'Low INR values', result: results.lowInrResult, expectFallback: true },
        { name: 'Future-dated cache', result: results.futureDateResult, expectFallback: true },
        { name: 'Valid USD values', result: results.validUsdResult, expectFallback: false },
        { name: 'Valid INR values', result: results.validInrResult, expectFallback: false }
    ];

    console.group('🧪 Fallback Tests Results');

    let allTestsPassed = true;

    fallbackTests.forEach(test => {
        const passed = test.result.usedFallback === test.expectFallback;
        console.log(
            `${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASSED' : 'FAILED'} - ` +
            `Expected fallback: ${test.expectFallback}, Actual: ${test.result.usedFallback}`
        );

        if (!passed) {
            allTestsPassed = false;
        }
    });

    console.log(`\nOverall test result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.groupEnd();

    return results;
} 