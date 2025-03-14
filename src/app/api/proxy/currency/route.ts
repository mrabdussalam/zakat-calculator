import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side proxy for currency exchange rate APIs
 * This helps avoid CORS issues when fetching from client-side
 */
export async function GET(request: NextRequest) {
    // Get the base currency from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const base = searchParams.get('base') || 'USD';
    const symbols = searchParams.get('symbols');

    // Try multiple APIs in sequence until one succeeds
    try {
        // First try Frankfurter API
        console.log(`[Server] Trying Frankfurter API with base=${base}`);
        let url = `https://api.frankfurter.dev/v1/latest?base=${base}`;
        if (symbols) {
            url += `&symbols=${symbols}`;
        }

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`[Server] Successfully fetched rates from Frankfurter API`);
            return NextResponse.json(data);
        }

        console.log(`[Server] Frankfurter API failed with status ${response.status}`);

        // Try Open Exchange Rates API
        console.log(`[Server] Trying Open Exchange Rates API with base=${base}`);
        url = `https://open.er-api.com/v6/latest/${base}`;

        const fallbackResponse = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (fallbackResponse.ok) {
            const data = await fallbackResponse.json();
            console.log(`[Server] Successfully fetched rates from Open Exchange Rates API`);
            return NextResponse.json(data);
        }

        console.log(`[Server] Open Exchange Rates API failed with status ${fallbackResponse.status}`);

        // Try ExchangeRate.host API
        console.log(`[Server] Trying ExchangeRate.host API with base=${base}`);
        url = `https://api.exchangerate.host/latest?base=${base}`;
        if (symbols) {
            url += `&symbols=${symbols}`;
        }

        const secondFallbackResponse = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (secondFallbackResponse.ok) {
            const data = await secondFallbackResponse.json();
            console.log(`[Server] Successfully fetched rates from ExchangeRate.host API`);
            return NextResponse.json(data);
        }

        console.log(`[Server] ExchangeRate.host API failed with status ${secondFallbackResponse.status}`);

        // If all APIs fail, return fallback rates
        console.log(`[Server] All APIs failed, returning fallback rates`);

        // Create fallback rates
        const fallbackRates: Record<string, number> = {
            'USD': 1,
            'EUR': 0.92,
            'GBP': 0.78,
            'JPY': 150.5,
            'CAD': 1.35,
            'AUD': 1.52,
            'INR': 83.15,
            'PKR': 278.5,
            'AED': 3.67,
            'SAR': 3.75,
            'MYR': 4.65,
            'SGD': 1.35,
            'BDT': 110.5,
            'EGP': 30.9,
            'IDR': 15600,
            'KWD': 0.31,
            'NGN': 1550,
            'QAR': 3.64,
            'ZAR': 18.5
        };

        // Convert rates to the requested base currency if not USD
        const baseUpper = base.toUpperCase();
        if (baseUpper !== 'USD' && baseUpper in fallbackRates) {
            const baseRate = fallbackRates[baseUpper];
            const convertedRates: Record<string, number> = {};

            // Convert all rates to the new base
            Object.entries(fallbackRates).forEach(([currency, rate]) => {
                convertedRates[currency] = rate / baseRate;
            });

            // Set the base currency rate to 1
            convertedRates[baseUpper] = 1;

            return NextResponse.json({
                base: baseUpper,
                date: new Date().toISOString().split('T')[0],
                rates: convertedRates
            });
        }

        // If base is not in our fallback rates, return USD rates
        return NextResponse.json({
            base: 'USD',
            date: new Date().toISOString().split('T')[0],
            rates: fallbackRates
        });
    } catch (error) {
        console.error(`[Server] Error in currency proxy:`, error);

        // Return a 500 error with a helpful message
        return NextResponse.json(
            { error: 'Failed to fetch exchange rates', message: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
} 