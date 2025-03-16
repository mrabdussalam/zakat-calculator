"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CurrencySelector } from '@/components/ui/CurrencySelector'
import { formatCurrency } from '@/lib/utils/currency'

export default function TestCryptoPage() {
    const [selectedCurrency, setSelectedCurrency] = useState('USD')
    const [cryptoPrices, setCryptoPrices] = useState<Record<string, number | null>>({})
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // List of cryptocurrencies to test
    const cryptoList = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL']

    const fetchCryptoPrices = async () => {
        setIsLoading(true)
        setError(null)

        const results: Record<string, number | null> = {}

        try {
            // Fetch prices for each cryptocurrency
            for (const crypto of cryptoList) {
                try {
                    console.log(`Fetching ${crypto} price in ${selectedCurrency}`)
                    const response = await fetch(`/api/prices/crypto?symbol=${crypto}&currency=${selectedCurrency}`)

                    if (!response.ok) {
                        throw new Error(`API returned ${response.status} for ${crypto}`)
                    }

                    const data = await response.json()
                    console.log(`Response for ${crypto}:`, data)

                    // Check if we got a valid price
                    if (data && typeof data.price === 'number') {
                        results[crypto] = data.price
                    } else {
                        results[crypto] = null
                        console.error(`Invalid price data for ${crypto}:`, data)
                    }
                } catch (err) {
                    console.error(`Error fetching ${crypto} price:`, err)
                    results[crypto] = null
                }
            }

            setCryptoPrices(results)
        } catch (err) {
            console.error('Error in fetchCryptoPrices:', err)
            setError('Failed to fetch cryptocurrency prices')
        } finally {
            setIsLoading(false)
        }
    }

    // Fetch prices when currency changes
    useEffect(() => {
        fetchCryptoPrices()
    }, [selectedCurrency])

    return (
        <div className="container mx-auto p-6 max-w-3xl">
            <h1 className="text-2xl font-bold mb-6">Cryptocurrency Conversion Test</h1>

            <div className="bg-slate-50 p-4 rounded-md border mb-6">
                <h2 className="text-lg font-medium mb-3">Select Currency</h2>
                <div className="w-full max-w-xs">
                    <CurrencySelector
                        onChange={(value) => setSelectedCurrency(value)}
                    />
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-md border mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium">Cryptocurrency Prices</h2>
                    <Button
                        onClick={fetchCryptoPrices}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'Refresh Prices'}
                    </Button>
                </div>

                {error && (
                    <div className="p-3 mb-4 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-200">
                                <th className="p-2 text-left">Cryptocurrency</th>
                                <th className="p-2 text-left">Symbol</th>
                                <th className="p-2 text-left">Price in {selectedCurrency}</th>
                                <th className="p-2 text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cryptoList.map(crypto => {
                                const price = cryptoPrices[crypto]
                                const status = isLoading
                                    ? 'Loading...'
                                    : price === null
                                        ? 'Failed'
                                        : 'Success'

                                return (
                                    <tr key={crypto} className="border-b">
                                        <td className="p-2 font-medium">{getCryptoName(crypto)}</td>
                                        <td className="p-2">{crypto}</td>
                                        <td className="p-2">
                                            {price !== null && price !== undefined
                                                ? formatCurrency(price, selectedCurrency)
                                                : 'N/A'}
                                        </td>
                                        <td className="p-2">
                                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(status)}`}>
                                                {status}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-md border">
                <h2 className="text-lg font-medium mb-3">Debug Information</h2>
                <div className="bg-slate-100 p-3 rounded text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify({ selectedCurrency, cryptoPrices }, null, 2)}
                </div>
            </div>
        </div>
    )
}

// Helper function to get cryptocurrency name
function getCryptoName(symbol: string): string {
    const names: Record<string, string> = {
        BTC: 'Bitcoin',
        ETH: 'Ethereum',
        USDT: 'Tether',
        BNB: 'Binance Coin',
        SOL: 'Solana',
        XRP: 'Ripple',
        ADA: 'Cardano',
        DOGE: 'Dogecoin',
        AVAX: 'Avalanche',
        DOT: 'Polkadot'
    }

    return names[symbol] || symbol
}

// Helper function to get status color
function getStatusColor(status: string): string {
    switch (status) {
        case 'Success':
            return 'bg-green-100 text-green-800'
        case 'Failed':
            return 'bg-red-100 text-red-800'
        case 'Loading...':
            return 'bg-blue-100 text-blue-800'
        default:
            return 'bg-gray-100 text-gray-800'
    }
} 