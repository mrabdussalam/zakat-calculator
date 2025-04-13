'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ReloadIcon } from '@radix-ui/react-icons';
import { SUPPORTED_CURRENCIES, SupportedCurrency, formatCurrency } from '@/lib/utils/currency';
import { useZakatStore } from '@/store/zakatStore';

// Conversion constants
const CONVERSION_RATES = {
    OZ_TO_GRAM: 31.1034768, // Troy ounce to grams
    GRAM_TO_KG: 1000,       // Grams to kilograms
    TOLA_TO_GRAM: 11.66     // Tolas to grams
};

// Gold purity factors
const PURITY = {
    K24: 1.00,   // 100% pure gold
    K22: 0.9167, // 91.67% pure gold
    K21: 0.8750, // 87.5% pure gold
    K18: 0.7500  // 75% pure gold
};

// Define the structure for metal prices
interface MetalPrices {
    gold: {
        Price_OZ: number;
        Price_G: number;
        Price_KG: number;
        Price_Tola: number;
        Price_24K: number;
        Price_22K: number;
        Price_21K: number;
        Price_18K: number;
    };
    silver: {
        Price_OZ: number;
        Price_G: number;
        Price_KG: number;
        Price_Tola: number;
    };
    timestamp: string;
    currency: string;
    source?: string;
    isCache?: boolean;
}

export default function TestMetalsPurityPage() {
    // Get the current currency from the Zakat store using individual selectors
    const currency = useZakatStore(state => state.currency);
    const setCurrency = useZakatStore(state => state.setCurrency);
    const metalPrices = useZakatStore(state => state.metalPrices);

    const [prices, setPrices] = useState<Record<string, MetalPrices>>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [useFallback, setUseFallback] = useState<boolean>(false);

    // Function to fetch prices for all supported currencies
    const fetchAllPrices = async (forceFallback = false) => {
        setLoading(true);
        setError(null);

        const currencyList = Object.keys(SUPPORTED_CURRENCIES);
        const newPrices: Record<string, MetalPrices> = {};
        let hasAnySuccess = false;

        try {
            // Fetch prices for each currency
            for (const curr of currencyList) {
                try {
                    console.log(`Fetching prices for ${curr}...`);
                    const fallbackParam = forceFallback || useFallback ? '&fallback=true' : '';
                    const response = await fetch(`/api/test-metals-multi-currency?currencies=${curr}${fallbackParam}`, {
                        cache: 'no-store',
                        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
                    });

                    if (!response.ok) {
                        console.warn(`API returned status ${response.status} for ${curr}`);
                        continue;
                    }

                    const data = await response.json();

                    if (data.currencies && data.currencies[curr] && !data.currencies[curr].error) {
                        newPrices[curr] = {
                            gold: data.currencies[curr].gold_rates,
                            silver: data.currencies[curr].silver_rates,
                            timestamp: data.timestamp,
                            currency: curr,
                            source: data.currencies[curr].isFallback ? 'Fallback Values' : 'GoldPrice.org',
                            isCache: data.currencies[curr].isFallback
                        };
                        hasAnySuccess = true;
                    } else if (data.currencies && data.currencies[curr] && data.currencies[curr].error) {
                        console.warn(`Error for ${curr}: ${data.currencies[curr].error}`);
                    }
                } catch (currError) {
                    console.error(`Error fetching ${curr} prices:`, currError);
                    // Continue with other currencies even if one fails
                }
            }

            if (hasAnySuccess) {
                setPrices(newPrices);
                setLastUpdated(new Date().toISOString());
            } else {
                // If all currencies failed, try to use the store values
                const storePrices = calculatePricesFromStore();
                if (storePrices) {
                    setPrices({ store: storePrices });
                    setError("Failed to fetch fresh prices. Using cached values from store.");
                } else {
                    setError("Failed to fetch prices for all currencies and no cached values available.");
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            console.error('Error fetching metal prices:', err);

            // Try to use store values as fallback
            const storePrices = calculatePricesFromStore();
            if (storePrices) {
                setPrices({ store: storePrices });
            }
        } finally {
            setLoading(false);
        }
    };

    // Function to calculate prices from the Zakat store's metal prices
    const calculatePricesFromStore = useCallback(() => {
        if (!metalPrices || !metalPrices.gold || !metalPrices.silver) {
            return null;
        }

        const goldPriceG = metalPrices.gold;
        const silverPriceG = metalPrices.silver;

        // Calculate other units
        const goldPriceOZ = goldPriceG * CONVERSION_RATES.OZ_TO_GRAM;
        const goldPriceKG = goldPriceG * CONVERSION_RATES.GRAM_TO_KG;
        const goldPriceTola = goldPriceG * CONVERSION_RATES.TOLA_TO_GRAM;

        // Calculate purities
        const goldPrice24K = goldPriceG;
        const goldPrice22K = goldPriceG * PURITY.K22;
        const goldPrice21K = goldPriceG * PURITY.K21;
        const goldPrice18K = goldPriceG * PURITY.K18;

        // Calculate silver units
        const silverPriceOZ = silverPriceG * CONVERSION_RATES.OZ_TO_GRAM;
        const silverPriceKG = silverPriceG * CONVERSION_RATES.GRAM_TO_KG;
        const silverPriceTola = silverPriceG * CONVERSION_RATES.TOLA_TO_GRAM;

        return {
            gold: {
                Price_OZ: roundToTwo(goldPriceOZ),
                Price_G: roundToTwo(goldPriceG),
                Price_KG: roundToTwo(goldPriceKG),
                Price_Tola: roundToTwo(goldPriceTola),
                Price_24K: roundToTwo(goldPrice24K),
                Price_22K: roundToTwo(goldPrice22K),
                Price_21K: roundToTwo(goldPrice21K),
                Price_18K: roundToTwo(goldPrice18K)
            },
            silver: {
                Price_OZ: roundToTwo(silverPriceOZ),
                Price_G: roundToTwo(silverPriceG),
                Price_KG: roundToTwo(silverPriceKG),
                Price_Tola: roundToTwo(silverPriceTola)
            },
            timestamp: new Date().toISOString(),
            currency: currency,
            source: metalPrices.source || 'Zakat Store',
            isCache: metalPrices.isCache || false
        };
    }, [currency, metalPrices]);

    // Effect to fetch prices on initial load
    useEffect(() => {
        fetchAllPrices();
    }, [fetchAllPrices]);

    // Effect to update store prices when currency changes
    useEffect(() => {
        const storePrices = calculatePricesFromStore();
        if (storePrices) {
            setPrices(prev => ({
                ...prev,
                store: storePrices
            }));
        }
    }, [calculatePricesFromStore]);

    // Helper function to round to 2 decimal places
    function roundToTwo(num: number): number {
        return Math.round((num + Number.EPSILON) * 100) / 100;
    }

    // Function to handle currency change
    const handleCurrencyChange = (newCurrency: SupportedCurrency) => {
        setCurrency(newCurrency);
    };

    // Toggle fallback mode
    const toggleFallback = () => {
        const newFallbackState = !useFallback;
        setUseFallback(newFallbackState);
        fetchAllPrices(newFallbackState);
    };

    return (
        <div className="container mx-auto py-8 max-w-6xl">
            <h1 className="text-3xl font-bold mb-6">Metal Prices with Purity Levels</h1>

            <div className="flex flex-col md:flex-row gap-6 mb-8">
                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle>Current Currency</CardTitle>
                        <CardDescription>
                            Select a currency to update the Zakat Store
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(SUPPORTED_CURRENCIES).map(([code, details]) => (
                                <Button
                                    key={code}
                                    variant={currency === code ? "default" : "outline"}
                                    onClick={() => handleCurrencyChange(code as SupportedCurrency)}
                                    className="min-w-[80px]"
                                >
                                    {details.symbol} {code}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                        <CardDescription>
                            Refresh prices or use fallback values
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                onClick={() => fetchAllPrices(false)}
                                disabled={loading}
                                className="min-w-[120px]"
                            >
                                {loading ? (
                                    <>
                                        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    'Refresh Prices'
                                )}
                            </Button>
                            <Button
                                variant={useFallback ? "default" : "outline"}
                                onClick={toggleFallback}
                                className="min-w-[120px]"
                            >
                                {useFallback ? 'Using Fallback' : 'Use Fallback Values'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {error && (
                <Alert className="mb-6">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="current">
                <TabsList className="mb-4">
                    <TabsTrigger value="current">Current Currency ({currency})</TabsTrigger>
                    <TabsTrigger value="store">Store Data</TabsTrigger>
                    <TabsTrigger value="all">All Currencies</TabsTrigger>
                </TabsList>

                <TabsContent value="current">
                    {prices[currency] ? (
                        <PriceDetailCard data={prices[currency]} />
                    ) : (
                        <Alert>
                            <AlertTitle>No Data</AlertTitle>
                            <AlertDescription>No price data available for {currency}. Try refreshing the prices.</AlertDescription>
                        </Alert>
                    )}
                </TabsContent>

                <TabsContent value="store">
                    {prices.store ? (
                        <PriceDetailCard data={prices.store} />
                    ) : (
                        <Alert>
                            <AlertTitle>No Store Data</AlertTitle>
                            <AlertDescription>No price data available in the Zakat Store.</AlertDescription>
                        </Alert>
                    )}
                </TabsContent>

                <TabsContent value="all">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(prices)
                            .filter(([key]) => key !== 'store')
                            .map(([curr, data]) => (
                                <PriceSummaryCard key={curr} data={data} />
                            ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Component to display detailed price information
function PriceDetailCard({ data }: { data: MetalPrices }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {data.currency} Metal Prices
                    {data.isCache && <span className="text-amber-500 text-sm ml-2">(Cached)</span>}
                </CardTitle>
                <CardDescription>
                    Source: {data.source || 'GoldPrice.org'} |
                    Updated: {new Date(data.timestamp).toLocaleString()}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="gold">
                    <TabsList>
                        <TabsTrigger value="gold">Gold</TabsTrigger>
                        <TabsTrigger value="silver">Silver</TabsTrigger>
                    </TabsList>

                    <TabsContent value="gold" className="pt-4">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium mb-2">Units</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="font-medium">Per Ounce (OZ):</div>
                                    <div>{formatCurrency(data.gold.Price_OZ, data.currency)}</div>
                                    <div className="font-medium">Per Gram (G):</div>
                                    <div>{formatCurrency(data.gold.Price_G, data.currency)}</div>
                                    <div className="font-medium">Per Kilogram (KG):</div>
                                    <div>{formatCurrency(data.gold.Price_KG, data.currency)}</div>
                                    <div className="font-medium">Per Tola:</div>
                                    <div>{formatCurrency(data.gold.Price_Tola, data.currency)}</div>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h3 className="text-lg font-medium mb-2">Purity Levels</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="font-medium">24K (100% pure):</div>
                                    <div>{formatCurrency(data.gold.Price_24K, data.currency)}</div>
                                    <div className="font-medium">22K (91.67% pure):</div>
                                    <div>{formatCurrency(data.gold.Price_22K, data.currency)}</div>
                                    <div className="font-medium">21K (87.5% pure):</div>
                                    <div>{formatCurrency(data.gold.Price_21K, data.currency)}</div>
                                    <div className="font-medium">18K (75% pure):</div>
                                    <div>{formatCurrency(data.gold.Price_18K, data.currency)}</div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="silver" className="pt-4">
                        <div>
                            <h3 className="text-lg font-medium mb-2">Units</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="font-medium">Per Ounce (OZ):</div>
                                <div>{formatCurrency(data.silver.Price_OZ, data.currency)}</div>
                                <div className="font-medium">Per Gram (G):</div>
                                <div>{formatCurrency(data.silver.Price_G, data.currency)}</div>
                                <div className="font-medium">Per Kilogram (KG):</div>
                                <div>{formatCurrency(data.silver.Price_KG, data.currency)}</div>
                                <div className="font-medium">Per Tola:</div>
                                <div>{formatCurrency(data.silver.Price_Tola, data.currency)}</div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

// Component to display summary price information
function PriceSummaryCard({ data }: { data: MetalPrices }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{data.currency}</CardTitle>
                <CardDescription>
                    Gold: {formatCurrency(data.gold.Price_G, data.currency)}/g |
                    Silver: {formatCurrency(data.silver.Price_G, data.currency)}/g
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <h3 className="font-medium mb-2">Gold Purities (per gram)</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>24K (100%):</div>
                            <div>{formatCurrency(data.gold.Price_24K, data.currency)}</div>
                            <div>22K (91.67%):</div>
                            <div>{formatCurrency(data.gold.Price_22K, data.currency)}</div>
                            <div>21K (87.5%):</div>
                            <div>{formatCurrency(data.gold.Price_21K, data.currency)}</div>
                            <div>18K (75%):</div>
                            <div>{formatCurrency(data.gold.Price_18K, data.currency)}</div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 