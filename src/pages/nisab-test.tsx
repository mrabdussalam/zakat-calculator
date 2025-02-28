import React from 'react';
import { NisabStatusTest } from '@/components/NisabStatusTest';
import { runNisabTests } from '@/lib/utils/testNisabCalculations';
import { runCurrencyTests } from '@/lib/utils/testCurrencyConversion';

/**
 * Test page to demonstrate the fixed nisab calculation
 */
export default function NisabTestPage() {
    const handleRunTests = () => {
        console.clear();
        console.log('Running nisab calculation tests...');
        const results = runNisabTests();
        console.log('Test results:', results);
    };

    const handleRunCurrencyTests = () => {
        console.clear();
        console.log('Running currency conversion tests...');
        const results = runCurrencyTests();
        console.log('Currency test results:', results);
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Nisab Calculation Test</h1>
            <p className="mb-4">
                This page demonstrates the fixed nisab calculation system that dynamically calculates
                nisab thresholds in the user's selected currency.
            </p>

            <div className="bg-white rounded-lg shadow-md p-6">
                <NisabStatusTest />
            </div>

            <div className="mt-4 flex space-x-4">
                <div>
                    <button
                        onClick={handleRunTests}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Run Nisab Tests
                    </button>
                    <p className="text-sm text-gray-600 mt-2">
                        Tests nisab calculations with various inputs
                    </p>
                </div>

                <div>
                    <button
                        onClick={handleRunCurrencyTests}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        Run Currency Tests
                    </button>
                    <p className="text-sm text-gray-600 mt-2">
                        Tests currency conversion with various scenarios
                    </p>
                </div>
            </div>

            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                <h2 className="text-xl font-bold mb-2">About This Fix</h2>
                <p className="mb-2">
                    The previous implementation had issues with currency display where USD values were
                    being shown with the user's currency symbol. This happened because:
                </p>
                <ul className="list-disc pl-6 mb-4">
                    <li>Nisab values were stored in state rather than calculated dynamically</li>
                    <li>Currency conversion was applied inconsistently</li>
                    <li>There were race conditions between currency changes and nisab calculations</li>
                    <li>Metal prices data was sometimes invalid or suspiciously low</li>
                    <li>Cache entries sometimes had future timestamps</li>
                </ul>
                <p className="mb-2">
                    The new implementation:
                </p>
                <ul className="list-disc pl-6">
                    <li>Uses a pure utility function to calculate nisab thresholds</li>
                    <li>Dynamically calculates values in the user's current currency</li>
                    <li>Applies consistent currency conversion through a centralized service</li>
                    <li>Eliminates race conditions by waiting for store hydration</li>
                    <li>Implements fallback values when metal prices are suspicious or invalid</li>
                    <li>Validates calculated values against expected ranges for each currency</li>
                    <li>Detects and handles future-dated cache entries</li>
                    <li>Provides robust validation for currency conversion results</li>
                    <li>Includes comprehensive testing utilities for both nisab and currency conversion</li>
                </ul>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h2 className="text-xl font-bold mb-2">Currency Conversion Improvements</h2>
                <p className="mb-2">
                    The currency conversion system has been enhanced with the following improvements:
                </p>
                <ul className="list-disc pl-6">
                    <li>Centralized conversion service to ensure consistent behavior</li>
                    <li>Robust validation of conversion inputs and results</li>
                    <li>Fallback mechanisms for handling missing or invalid exchange rates</li>
                    <li>Detection of suspicious conversion results outside expected ranges</li>
                    <li>Detailed logging for debugging currency conversion issues</li>
                    <li>Hardcoded fallback rates for common currency pairs</li>
                    <li>Validation of exchange rates before they're used in calculations</li>
                </ul>
                <p className="mt-2 text-sm text-gray-600">
                    These improvements ensure that even with API issues or invalid data, the system will
                    display reasonable values in the user's selected currency.
                </p>
            </div>
        </div>
    );
} 