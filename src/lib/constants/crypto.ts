/**
 * Canonical fallback prices for major cryptocurrencies (USD, updated Feb 2026)
 *
 * Used when all live API sources (CoinGecko, CoinCap, CryptoCompare) fail.
 * Single source of truth — imported by both client-side and server-side code.
 */
export const FALLBACK_CRYPTO_PRICES: Record<string, number> = {
  'BTC': 68000,
  'ETH': 2000,
}
