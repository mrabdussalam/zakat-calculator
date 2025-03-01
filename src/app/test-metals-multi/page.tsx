'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ReloadIcon } from '@radix-ui/react-icons';

export default function TestMetalsMultiCurrencyPage() {
    const [currencies, setCurrencies] = useState<string>('USD,EUR,GBP');
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMetalPrices = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/test-metals-multi-currency?currencies=${encodeURIComponent(currencies)}`, {
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`API returned status ${response.status}`);
            }

            const data = await response.json();
            setResults(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            console.error('Error fetching metal prices:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetalPrices();
    }, []);

    return (
        <div className="container mx-auto py-8 max-w-6xl">
            <h1 className="text-3xl font-bold mb-6">Multi-Currency Metal Prices Test</h1>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Test Configuration</CardTitle>
                    <CardDescription>
                        Enter comma-separated currency codes to test (e.g., USD,EUR,GBP)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="currencies">Currencies</Label>
                            <Input
                                id="currencies"
                                value={currencies}
                                onChange={(e) => setCurrencies(e.target.value)}
                                placeholder="USD,EUR,GBP"
                            />
                        </div>
                        <Button
                            onClick={fetchMetalPrices}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                'Fetch Prices'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive" className="mb-8">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {results && (
                <>
                    <div className="mb-4">
                        <p className="text-sm text-muted-foreground">
                            Last updated: {new Date(results.timestamp).toLocaleString()}
                        </p>
                    </div>

                    <Tabs defaultValue="summary">
                        <TabsList className="mb-4">
                            <TabsTrigger value="summary">Summary</TabsTrigger>
                            <TabsTrigger value="details">Detailed View</TabsTrigger>
                            <TabsTrigger value="raw">Raw Data</TabsTrigger>
                        </TabsList>

                        <TabsContent value="summary">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(results.currencies).map(([currency, data]: [string, any]) => (
                                    <Card key={currency}>
                                        <CardHeader>
                                            <CardTitle>{currency}</CardTitle>
                                            {data.error ? (
                                                <CardDescription className="text-red-500">
                                                    Error: {data.error}
                                                </CardDescription>
                                            ) : (
                                                <CardDescription>
                                                    Gold: {data.gold_rates.Price_G} {currency}/g | Silver: {data.silver_rates.Price_G} {currency}/g
                                                </CardDescription>
                                            )}
                                        </CardHeader>
                                        {!data.error && (
                                            <CardContent>
                                                <div className="space-y-4">
                                                    <div>
                                                        <h3 className="font-medium mb-2">Gold Prices</h3>
                                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                                            <div>Per Gram:</div>
                                                            <div>{data.gold_rates.Price_G} {currency}</div>
                                                            <div>Per Ounce:</div>
                                                            <div>{data.gold_rates.Price_OZ} {currency}</div>
                                                            <div>Per Tola:</div>
                                                            <div>{data.gold_rates.Price_Tola} {currency}</div>
                                                        </div>
                                                    </div>

                                                    <Separator />

                                                    <div>
                                                        <h3 className="font-medium mb-2">Silver Prices</h3>
                                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                                            <div>Per Gram:</div>
                                                            <div>{data.silver_rates.Price_G} {currency}</div>
                                                            <div>Per Ounce:</div>
                                                            <div>{data.silver_rates.Price_OZ} {currency}</div>
                                                            <div>Per Tola:</div>
                                                            <div>{data.silver_rates.Price_Tola} {currency}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="details">
                            <div className="grid grid-cols-1 gap-6">
                                {Object.entries(results.currencies).map(([currency, data]: [string, any]) => (
                                    <Card key={currency}>
                                        <CardHeader>
                                            <CardTitle>{currency} Detailed View</CardTitle>
                                        </CardHeader>
                                        {data.error ? (
                                            <CardContent>
                                                <Alert variant="destructive">
                                                    <AlertTitle>Error</AlertTitle>
                                                    <AlertDescription>{data.error}</AlertDescription>
                                                </Alert>
                                            </CardContent>
                                        ) : (
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
                                                                    <div>{data.gold_rates.Price_OZ} {currency}</div>
                                                                    <div className="font-medium">Per Gram (G):</div>
                                                                    <div>{data.gold_rates.Price_G} {currency}</div>
                                                                    <div className="font-medium">Per Kilogram (KG):</div>
                                                                    <div>{data.gold_rates.Price_KG} {currency}</div>
                                                                    <div className="font-medium">Per Tola:</div>
                                                                    <div>{data.gold_rates.Price_Tola} {currency}</div>
                                                                </div>
                                                            </div>

                                                            <Separator />

                                                            <div>
                                                                <h3 className="text-lg font-medium mb-2">Purity Levels</h3>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div className="font-medium">24K (100% pure):</div>
                                                                    <div>{data.gold_rates.Price_24K} {currency}</div>
                                                                    <div className="font-medium">22K (91.67% pure):</div>
                                                                    <div>{data.gold_rates.Price_22K} {currency}</div>
                                                                    <div className="font-medium">21K (87.5% pure):</div>
                                                                    <div>{data.gold_rates.Price_21K} {currency}</div>
                                                                    <div className="font-medium">18K (75% pure):</div>
                                                                    <div>{data.gold_rates.Price_18K} {currency}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TabsContent>

                                                    <TabsContent value="silver" className="pt-4">
                                                        <div>
                                                            <h3 className="text-lg font-medium mb-2">Units</h3>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="font-medium">Per Ounce (OZ):</div>
                                                                <div>{data.silver_rates.Price_OZ} {currency}</div>
                                                                <div className="font-medium">Per Gram (G):</div>
                                                                <div>{data.silver_rates.Price_G} {currency}</div>
                                                                <div className="font-medium">Per Kilogram (KG):</div>
                                                                <div>{data.silver_rates.Price_KG} {currency}</div>
                                                                <div className="font-medium">Per Tola:</div>
                                                                <div>{data.silver_rates.Price_Tola} {currency}</div>
                                                            </div>
                                                        </div>
                                                    </TabsContent>
                                                </Tabs>
                                            </CardContent>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="raw">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Raw API Response</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[500px] text-xs">
                                        {JSON.stringify(results, null, 2)}
                                    </pre>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
} 