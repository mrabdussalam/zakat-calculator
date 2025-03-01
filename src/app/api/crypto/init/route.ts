import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DEFAULT_MAPPINGS } from '@/data/crypto-mappings';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

// This is a server-side only API route that will initialize the coin list
export async function GET() {
    try {
        // First try to use local JSON file if available
        try {
            const filePath = path.join(process.cwd(), 'src', 'data', 'coin_list.json');
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const symbolToId = JSON.parse(fileContent);
            console.log(`Loaded ${Object.keys(symbolToId).length} cryptocurrency symbols from coin_list.json`);

            return NextResponse.json({
                success: true,
                message: `Loaded ${Object.keys(symbolToId).length} cryptocurrency symbols from coin_list.json`,
                count: Object.keys(symbolToId).length
            });
        } catch (fileError) {
            console.log('Local coin_list.json not found or invalid, fetching from API...');
        }

        // If local file doesn't exist, fetch from API
        const response = await fetch(`${COINGECKO_API_URL}/coins/list`);

        if (!response.ok) {
            throw new Error(`Failed to fetch coin list: ${response.status}`);
        }

        const coins = await response.json();

        // Transform data: uppercase symbols as keys, coin ids as values
        const mapping: Record<string, string> = {};
        coins.forEach((coin: { id: string; symbol: string }) => {
            mapping[coin.symbol.toUpperCase()] = coin.id;
        });

        console.log(`Loaded ${Object.keys(mapping).length} cryptocurrency symbols from CoinGecko API`);

        // Save to file for future use
        try {
            const filePath = path.join(process.cwd(), 'src', 'data', 'coin_list.json');
            fs.writeFileSync(filePath, JSON.stringify(mapping, null, 2), 'utf8');
            console.log('Saved coin mapping to coin_list.json');
        } catch (saveError) {
            console.error('Failed to save coin mapping to file:', saveError);
        }

        return NextResponse.json({
            success: true,
            message: `Loaded ${Object.keys(mapping).length} cryptocurrency symbols from CoinGecko API`,
            count: Object.keys(mapping).length
        });

    } catch (error) {
        console.error('Error initializing coin mapping:', error);

        // Fall back to default mappings if everything fails
        return NextResponse.json({
            success: false,
            message: 'Failed to initialize coin mapping, using default mappings',
            count: Object.keys(DEFAULT_MAPPINGS).length,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 