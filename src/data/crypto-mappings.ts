// Default fallback mapping in case API fetch fails
export const DEFAULT_MAPPINGS = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'USDT': 'tether',
    'BNB': 'binancecoin',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'SOL': 'solana',
    'DOT': 'polkadot',
    'MATIC': 'matic-network'
};

// Import the coin list from the JSON file
// This will be processed at build time by Next.js
import coinList from './coin_list.json';

// Export the symbol to ID mapping
export const SYMBOL_TO_ID: Record<string, string> = coinList || DEFAULT_MAPPINGS; 