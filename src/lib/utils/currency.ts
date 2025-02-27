/**
 * Rounds a number to 2 decimal places for currency display
 */
export function roundCurrency(value: number, precision = 2): number {
  const multiplier = Math.pow(10, precision)
  return Math.round(value * multiplier) / multiplier
}

/**
 * Currency configuration for supported currencies
 */
export const SUPPORTED_CURRENCIES = {
  USD: { code: "USD", locale: "en-US", symbol: "$", name: "US Dollar" },
  GBP: { code: "GBP", locale: "en-GB", symbol: "£", name: "British Pound" },
  SAR: { code: "SAR", locale: "ar-SA", symbol: "﷼", name: "Saudi Riyal" },
  AED: { code: "AED", locale: "ar-AE", symbol: "د.إ", name: "UAE Dirham" },
  INR: { code: "INR", locale: "en-IN", symbol: "₹", name: "Indian Rupee" },
  PKR: { code: "PKR", locale: "ur-PK", symbol: "₨", name: "Pakistani Rupee" }
}

export type SupportedCurrency = keyof typeof SUPPORTED_CURRENCIES

/**
 * Get the currency locale for a given currency code
 */
export const getCurrencyLocale = (currency: string): string => {
  return (SUPPORTED_CURRENCIES[currency as SupportedCurrency]?.locale) || 'en-US'
}

/**
 * Formats a currency value for display
 */
export function formatCurrency(
  value: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  if (value === undefined || value === null) return ''
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * Formats a percentage for display
 */
export function formatPercentage(
  value: number,
  locale = 'en-US',
  minimumFractionDigits = 2,
  maximumFractionDigits = 2
): string {
  if (value === undefined || value === null) return ''
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value / 100)
}

/**
 * Converts a currency string to a number
 */
export function parseCurrency(value: string): number {
  if (!value) return 0
  
  // Remove currency symbols and delimiters
  const cleanValue = value.replace(/[^\d.-]/g, '')
  
  // Convert to number
  return parseFloat(cleanValue) || 0
}

/**
 * Validates if a value is a valid currency amount
 */
export const isValidCurrencyAmount = (value: number): boolean => {
  return typeof value === 'number' && 
    isFinite(value) && 
    value >= 0 && 
    value <= Number.MAX_SAFE_INTEGER
} 