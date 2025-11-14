/**
 * Shared currency exchange rate constants
 *
 * IMPORTANT: All rates in FALLBACK_RATES represent "units of that currency per 1 USD"
 *
 * For example:
 * - 'PKR': 278.5 means 1 USD = 278.5 PKR
 * - 'GBP': 0.78 means 1 USD = 0.78 GBP
 *
 * To convert from currency A to currency B:
 * rate = FALLBACK_RATES[B] / FALLBACK_RATES[A]
 *
 * Example: To convert PKR to INR:
 * rate = FALLBACK_RATES['INR'] / FALLBACK_RATES['PKR']
 * rate = 83.15 / 278.5 = 0.2986
 * This means 1 PKR = 0.2986 INR
 *
 * Why this formula works:
 * 1 PKR = (1 / 278.5) USD = 0.00359 USD
 * 0.00359 USD = 0.00359 * 83.15 INR = 0.2986 INR
 * Which simplifies to: 83.15 / 278.5 = 0.2986
 */

export const FALLBACK_RATES: Record<string, number> = {
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
  'ZAR': 18.5,
  'RUB': 91.5,
  'CNY': 7.24,    // Chinese Yuan
  'TRY': 31.5,    // Turkish Lira
  'BRL': 5.0,     // Brazilian Real
  'MXN': 17.5,    // Mexican Peso
  'KRW': 1320,    // South Korean Won
  'THB': 35.5,    // Thai Baht
  'PHP': 56.5,    // Philippine Peso
  'VND': 24500,   // Vietnamese Dong
  'IQD': 1310,    // Iraqi Dinar
  'MAD': 10.1,    // Moroccan Dirham
  'JOD': 0.71,    // Jordanian Dinar
  'LBP': 89500,   // Lebanese Pound
  'OMR': 0.385,   // Omani Rial
  'BHD': 0.376,   // Bahraini Dinar
};

/**
 * Get fallback exchange rate between two currencies
 * @param from Source currency code (e.g., 'PKR')
 * @param to Target currency code (e.g., 'INR')
 * @returns Exchange rate or null if either currency is not supported
 *
 * @example
 * // Convert PKR to INR
 * const rate = getFallbackRate('PKR', 'INR');
 * // rate = 0.2986 (meaning 1 PKR = 0.2986 INR)
 * const amount = 1000; // PKR
 * const converted = amount * rate; // 298.6 INR
 */
export function getFallbackRate(from: string, to: string): number | null {
  const fromUpper = from.toUpperCase();
  const toUpper = to.toUpperCase();

  // If currencies are the same, no conversion needed
  if (fromUpper === toUpper) {
    return 1;
  }

  // Check if both currencies are in our fallback rates
  if (FALLBACK_RATES[fromUpper] && FALLBACK_RATES[toUpper]) {
    // Convert via USD: (to units per USD) / (from units per USD)
    const rate = FALLBACK_RATES[toUpper] / FALLBACK_RATES[fromUpper];
    return rate;
  }

  return null;
}

/**
 * Convert an amount from one currency to another using fallback rates
 * @param amount Amount to convert
 * @param from Source currency code
 * @param to Target currency code
 * @returns Converted amount or null if conversion not possible
 */
export function convertCurrency(amount: number, from: string, to: string): number | null {
  const rate = getFallbackRate(from, to);
  if (rate === null) {
    return null;
  }
  return amount * rate;
}
