/**
 * Rounds a number to 2 decimal places for currency display
 */
export const roundCurrency = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Formats a number as currency with the specified locale and currency code
 */
export const formatCurrency = (
  value: number,
  locale: string = 'en-US',
  currency: string = 'USD'
): string => {
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