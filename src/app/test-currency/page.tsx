"use client"

import { useState, useEffect } from 'react'
import { CurrencySelector } from '@/components/ui/CurrencySelector'
import { Button } from '@/components/ui/button'
import { getExchangeRate } from '@/lib/api/exchange-rates'
import { formatCurrency } from '@/lib/utils/currency'
import { useCurrencyStore } from '@/lib/services/currency'

export default function TestCurrencyPage() {
    const [selectedCurrency, setSelectedCurrency] = useState('USD')
    const [testAmount, setTestAmount] = useState(100)
    const [conversionResults, setConversionResults] = useState<Record<string, number | null>>({})
    const [isLoading, setIsLoading] = useState(false)

    // Test currencies including the new RUB
    const testCurrencies = ['USD', 'GBP', 'SAR', 'INR', 'PKR', 'RUB']

    // Function to test conversion from selected currency to all test currencies
    const testConversions = async () => {
        setIsLoading(true)
        const results: Record<string, number | null> = {}

        for (const currency of testCurrencies) {
            try {
                // Skip if same currency
                if (currency === selectedCurrency) {
                    results[currency] = 1
                    continue
                }

                // Test direct API conversion
                const rate = await getExchangeRate(selectedCurrency, currency)
                results[currency] = rate
            } catch (error) {
                console.error(`Error converting ${selectedCurrency} to ${currency}:`, error)
                results[currency] = null
            }
        }

        setConversionResults(results)
        setIsLoading(false)
    }

    // Run test on currency change
    useEffect(() => {
        testConversions()
    }, [selectedCurrency])

    return (
        <div className="container mx-auto p-6 max-w-3xl">
            <h1 className="text-2xl font-bold mb-6">Currency Conversion Test</h1>

            <div className="bg-slate-50 p-4 rounded-md border mb-6">
                <h2 className="text-lg font-medium mb-3">Select Base Currency</h2>
                <div className="w-full max-w-xs">
                    <CurrencySelector
                        onChange={(value) => setSelectedCurrency(value)}
                    />
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-md border mb-6">
                <h2 className="text-lg font-medium mb-3">Test Amount</h2>
                <div className="flex items-center gap-4">
                    <input
                        type="number"
                        value={testAmount}
                        onChange={(e) => setTestAmount(Number(e.target.value))}
                        className="border rounded p-2 w-32"
                    />
                    <Button onClick={testConversions} disabled={isLoading}>
                        {isLoading ? 'Testing...' : 'Test Conversions'}
                    </Button>
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-md border">
                <h2 className="text-lg font-medium mb-3">Conversion Results</h2>

                {isLoading ? (
                    <p>Loading conversion rates...</p>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-200">
                                <th className="p-2 text-left">Currency</th>
                                <th className="p-2 text-left">Exchange Rate</th>
                                <th className="p-2 text-left">Converted Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {testCurrencies.map(currency => {
                                const rate = conversionResults[currency]
                                const convertedAmount = rate !== null && rate !== undefined ? testAmount * rate : null

                                return (
                                    <tr key={currency} className="border-b">
                                        <td className="p-2">{currency}</td>
                                        <td className="p-2">
                                            {rate !== null && rate !== undefined ? rate.toFixed(4) : 'Failed'}
                                        </td>
                                        <td className="p-2">
                                            {convertedAmount !== null && convertedAmount !== undefined
                                                ? formatCurrency(convertedAmount, currency)
                                                : 'N/A'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
} 