import { NextResponse } from 'next/server';

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

// Fallback values for testing when API is down
const FALLBACK_PRICES = {
    USD: { gold: 2400, silver: 30 },
    GBP: { gold: 1900, silver: 24 },
    EUR: { gold: 2200, silver: 27 },
    PKR: { gold: 670000, silver: 8400 },
    INR: { gold: 200000, silver: 2500 },
    SAR: { gold: 9000, silver: 112 }
};

/**
 * Test endpoint to fetch gold and silver prices in multiple currencies
 * with various unit conversions and purity levels
 */
export async function GET(request: Request) {
    // Get currencies from query params or default to USD
    const { searchParams } = new URL(request.url);
    const currencies = searchParams.get('currencies') || 'USD';
    const useFallback = searchParams.get('fallback') === 'true';

    // Split currencies if multiple are provided
    const currencyList = currencies.split(',');

    const results: Record<string, any> = {
        timestamp: new Date().toISOString(),
        sources: {},
        currencies: {}
    };

    // Test with GoldPrice API for each currency
    for (const currency of currencyList) {
        try {
            // If fallback is requested, use fallback values
            if (useFallback) {
                console.log(`Using fallback values for ${currency}`);
                addFallbackPrices(results, currency);
                continue;
            }

            console.log(`Testing Goldprice API for ${currency}...`);
            const apiUrl = `https://data-asg.goldprice.org/dbXRates/${currency}`;

            const response = await fetch(apiUrl, {
                cache: 'no-store',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Pragma': 'no-cache',
                    'Cache-Control': 'no-cache'
                },
                next: { revalidate: 0 }
            });

            if (!response.ok) {
                throw new Error(`Status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.items || data.items.length === 0) {
                throw new Error('Invalid data structure: no items found');
            }

            // Store raw data for debugging
            if (!results.sources[currency]) {
                results.sources[currency] = data;
            }

            // Get the item for this currency
            const item = data.items[0];
            const goldPriceOZ = item.xauPrice;
            const silverPriceOZ = item.xagPrice;

            // Calculate prices in different units
            const goldPriceG = goldPriceOZ / CONVERSION_RATES.OZ_TO_GRAM;
            const goldPriceKG = goldPriceG * CONVERSION_RATES.GRAM_TO_KG;
            const goldPriceTola = goldPriceG * CONVERSION_RATES.TOLA_TO_GRAM;

            // Calculate gold prices for different purities
            const goldPrice24K = goldPriceOZ * PURITY.K24;
            const goldPrice22K = goldPriceOZ * PURITY.K22;
            const goldPrice21K = goldPriceOZ * PURITY.K21;
            const goldPrice18K = goldPriceOZ * PURITY.K18;

            // Calculate silver prices in different units
            const silverPriceG = silverPriceOZ / CONVERSION_RATES.OZ_TO_GRAM;
            const silverPriceKG = silverPriceG * CONVERSION_RATES.GRAM_TO_KG;
            const silverPriceTola = silverPriceG * CONVERSION_RATES.TOLA_TO_GRAM;

            // Store calculated prices
            results.currencies[currency] = {
                gold_rates: {
                    Price_OZ: roundToTwo(goldPriceOZ),
                    Price_G: roundToTwo(goldPriceG),
                    Price_KG: roundToTwo(goldPriceKG),
                    Price_Tola: roundToTwo(goldPriceTola),
                    Price_24K: roundToTwo(goldPrice24K),
                    Price_22K: roundToTwo(goldPrice22K),
                    Price_21K: roundToTwo(goldPrice21K),
                    Price_18K: roundToTwo(goldPrice18K)
                },
                silver_rates: {
                    Price_OZ: roundToTwo(silverPriceOZ),
                    Price_G: roundToTwo(silverPriceG),
                    Price_KG: roundToTwo(silverPriceKG),
                    Price_Tola: roundToTwo(silverPriceTola)
                }
            };
        } catch (error) {
            console.error(`Error fetching ${currency} prices:`, error);

            // Use fallback values if API fails
            addFallbackPrices(results, currency, true, error);
        }
    }

    // Add usage instructions to the response
    results.usage = {
        description: "Test endpoint for gold and silver prices in multiple currencies",
        examples: [
            "/api/test-metals-multi-currency",
            "/api/test-metals-multi-currency?currencies=USD,EUR,GBP",
            "/api/test-metals-multi-currency?currencies=PKR,INR,SAR",
            "/api/test-metals-multi-currency?fallback=true"
        ]
    };

    return NextResponse.json(results);
}

// Helper function to add fallback prices
function addFallbackPrices(results: Record<string, any>, currency: string, isError = false, error?: any) {
    // Use fallback values if available, otherwise use USD values
    const fallback = FALLBACK_PRICES[currency as keyof typeof FALLBACK_PRICES] || FALLBACK_PRICES.USD;

    const goldPriceOZ = fallback.gold;
    const silverPriceOZ = fallback.silver;

    // Calculate prices in different units
    const goldPriceG = goldPriceOZ / CONVERSION_RATES.OZ_TO_GRAM;
    const goldPriceKG = goldPriceG * CONVERSION_RATES.GRAM_TO_KG;
    const goldPriceTola = goldPriceG * CONVERSION_RATES.TOLA_TO_GRAM;

    // Calculate gold prices for different purities
    const goldPrice24K = goldPriceOZ * PURITY.K24;
    const goldPrice22K = goldPriceOZ * PURITY.K22;
    const goldPrice21K = goldPriceOZ * PURITY.K21;
    const goldPrice18K = goldPriceOZ * PURITY.K18;

    // Calculate silver prices in different units
    const silverPriceG = silverPriceOZ / CONVERSION_RATES.OZ_TO_GRAM;
    const silverPriceKG = silverPriceG * CONVERSION_RATES.GRAM_TO_KG;
    const silverPriceTola = silverPriceG * CONVERSION_RATES.TOLA_TO_GRAM;

    results.currencies[currency] = {
        gold_rates: {
            Price_OZ: roundToTwo(goldPriceOZ),
            Price_G: roundToTwo(goldPriceG),
            Price_KG: roundToTwo(goldPriceKG),
            Price_Tola: roundToTwo(goldPriceTola),
            Price_24K: roundToTwo(goldPrice24K),
            Price_22K: roundToTwo(goldPrice22K),
            Price_21K: roundToTwo(goldPrice21K),
            Price_18K: roundToTwo(goldPrice18K)
        },
        silver_rates: {
            Price_OZ: roundToTwo(silverPriceOZ),
            Price_G: roundToTwo(silverPriceG),
            Price_KG: roundToTwo(silverPriceKG),
            Price_Tola: roundToTwo(silverPriceTola)
        },
        isFallback: true
    };

    if (isError && error) {
        results.currencies[currency].error = error instanceof Error ? error.message : String(error);
    }
}

// Helper function to round to 2 decimal places
function roundToTwo(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
} 