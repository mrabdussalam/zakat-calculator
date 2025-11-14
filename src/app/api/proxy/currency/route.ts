import { NextRequest, NextResponse } from 'next/server';
import { fetchExchangeRates } from '@/lib/services/exchangeRateService';

/**
 * Server-side proxy for currency exchange rate APIs
 * This helps avoid CORS issues when fetching from client-side
 */
export async function GET(request: NextRequest) {
    try {
        // Get the base currency from the query parameters
        const searchParams = request.nextUrl.searchParams;
        const base = searchParams.get('base') || 'USD';
        const symbols = searchParams.get('symbols') || undefined;

        console.log(`[Proxy] Fetching exchange rates for base=${base}, symbols=${symbols || 'all'}`);

        // Use the shared exchange rate service
        const data = await fetchExchangeRates(base, symbols);

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
            },
        });
    } catch (error) {
        console.error(`[Proxy] Error in currency proxy:`, error);

        // Return a 500 error with a helpful message
        return NextResponse.json(
            {
                error: 'Failed to fetch exchange rates',
                message: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
} 