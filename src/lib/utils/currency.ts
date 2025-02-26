/**
 * Rounds a number to 2 decimal places for currency display
 */
export const roundCurrency = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100
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
 * Formats a number as currency with the specified currency code
 */
export const formatCurrency = (
  value: number,
  currency: string = 'USD'
): string => {
  const locale = getCurrencyLocale(currency)
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(roundCurrency(value))
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