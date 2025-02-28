import React, { useState, useEffect } from 'react';
import { useNisabStatus } from '@/hooks/useNisabStatus';
import { useCurrencyStore } from '@/lib/services/currency';
import { formatCurrency } from '@/lib/utils';

/**
 * Test component to verify nisab calculation and currency display
 * This component shows nisab values in the user's selected currency
 */
export function NisabStatusTest() {
    const currencyStore = useCurrencyStore();
    const currency = currencyStore.baseCurrency || 'USD';

    const setCurrency = async (newCurrency: string) => {
        await currencyStore.fetchRates(newCurrency);
    };

    const [totalAssetValue, setTotalAssetValue] = useState(1000);

    // Initial nisab status (will be recalculated by the hook)
    const initialNisabStatus = {
        meetsNisab: false,
        totalValue: totalAssetValue,
        nisabValue: 0,
        thresholds: {
            gold: 0,
            silver: 0
        }
    };

    // Use our updated hook
    const {
        convertedValues,
        isFetching,
        errorMessage,
        meetsNisab,
        getNisabStatusMessage,
        getNisabMetalUsed,
        handleManualCurrencyUpdate,
        handleRefresh
    } = useNisabStatus(initialNisabStatus, currency);

    // Handle currency change
    const handleCurrencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCurrency = e.target.value;
        await setCurrency(newCurrency);

        // Force a refresh of nisab data with the new currency
        await handleManualCurrencyUpdate(newCurrency);
    };

    // Handle asset value change
    const handleAssetValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value) || 0;
        setTotalAssetValue(value);
    };

    // Update the total value in the nisab status when it changes
    useEffect(() => {
        initialNisabStatus.totalValue = totalAssetValue;
    }, [totalAssetValue]);

    return (
        <div className="nisab-status-test p-4 border rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">Nisab Status Test</h2>

            <div className="mb-4">
                <label className="block mb-2">Currency:</label>
                <select
                    value={currency}
                    onChange={handleCurrencyChange}
                    className="p-2 border rounded w-full"
                >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="PKR">PKR (₨)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="SAR">SAR (﷼)</option>
                </select>
            </div>

            <div className="mb-4">
                <label className="block mb-2">Total Asset Value:</label>
                <input
                    type="number"
                    value={totalAssetValue}
                    onChange={handleAssetValueChange}
                    className="p-2 border rounded w-full"
                />
            </div>

            <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <h3 className="font-bold mb-2">Nisab Calculation Results:</h3>

                {isFetching ? (
                    <p>Loading nisab data...</p>
                ) : errorMessage ? (
                    <div>
                        <p className="text-red-500">{errorMessage}</p>
                        <button
                            onClick={handleRefresh}
                            className="mt-2 p-2 bg-blue-500 text-white rounded"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className={`mb-2 ${meetsNisab ? 'text-green-600' : 'text-red-600'}`}>
                            {getNisabStatusMessage()}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <p className="font-semibold">Nisab Threshold:</p>
                                <p>{formatCurrency(convertedValues.nisabValue, currency)}</p>
                            </div>

                            <div>
                                <p className="font-semibold">Metal Used:</p>
                                <p>{getNisabMetalUsed()}</p>
                            </div>

                            <div>
                                <p className="font-semibold">Gold Threshold:</p>
                                <p>{formatCurrency(convertedValues.goldThreshold, currency)}</p>
                            </div>

                            <div>
                                <p className="font-semibold">Silver Threshold:</p>
                                <p>{formatCurrency(convertedValues.silverThreshold, currency)}</p>
                            </div>

                            <div>
                                <p className="font-semibold">Your Assets:</p>
                                <p>{formatCurrency(convertedValues.totalValue, currency)}</p>
                            </div>

                            <div>
                                <p className="font-semibold">Status:</p>
                                <p>{meetsNisab ? 'Above Nisab' : 'Below Nisab'}</p>
                            </div>
                        </div>

                        <div className="mt-4">
                            <p className="text-sm text-gray-600">
                                <strong>Debug Info:</strong> Using {convertedValues.isDirectGoldPrice ? 'direct' : 'converted'} gold price
                                and {convertedValues.isDirectSilverPrice ? 'direct' : 'converted'} silver price
                                {convertedValues.usedFallback && (
                                    <span className="ml-2 text-amber-600 font-semibold">
                                        (Using fallback values due to suspicious data)
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={handleRefresh}
                className="p-2 bg-blue-500 text-white rounded"
            >
                Refresh Nisab Data
            </button>
        </div>
    );
} 