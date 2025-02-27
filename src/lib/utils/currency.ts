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
  // Handle null/undefined values
  if (value === undefined || value === null) return '';
  
  // Ensure we have a valid number
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    console.warn('Invalid number passed to formatCurrency:', value);
    value = 0;
  }
  
  // Validate currency - ensure it's one of our supported currencies or default to USD
  const validatedCurrency = SUPPORTED_CURRENCIES[currency as SupportedCurrency] ? currency : 'USD';
  
  // Get symbol for fallback formatting
  const symbol = SUPPORTED_CURRENCIES[validatedCurrency as SupportedCurrency]?.symbol || '$';
  
  // Format with toFixed for simple fallback
  const formattedValue = value.toFixed(2);
  
  // Safe formatted output using multiple fallback strategies
  try {
    // First try: The simplest and most reliable approach - no locale, just currency
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: validatedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch (error) {
    console.warn('Primary currency formatting failed:', error);
    
    // Fallback 1: Try with USD as a very safe default
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    } catch (e) {
      console.warn('Secondary currency formatting failed:', e);
      
      // Final fallback: Manual string formatting
      return `${symbol}${formattedValue}`;
    }
  }
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
  // Handle null/undefined values
  if (value === undefined || value === null) return '';
  
  // Ensure we have a valid number
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    console.warn('Invalid number passed to formatPercentage:', value);
    value = 0;
  }
  
  // Calculate percentage value
  const percentValue = value / 100;
  
  // Format with toFixed for reliability
  const formattedValue = (percentValue * 100).toFixed(maximumFractionDigits) + '%';
  
  // Try Intl.NumberFormat
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'percent',
      minimumFractionDigits,
      maximumFractionDigits
    }).format(percentValue);
  } catch (error) {
    console.error('Error formatting percentage:', error);
    // Fallback to basic formatting
    return formattedValue;
  }
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