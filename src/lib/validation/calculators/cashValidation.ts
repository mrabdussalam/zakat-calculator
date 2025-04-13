import { CashValues } from '@/store/types'
import { CalculatorValidationTemplate } from '../templates/calculatorValidation'

/**
 * Validates that all values are non-negative
 */
const validateNonNegative = (values: CashValues): boolean => {
  return Object.entries(values).every(([key, value]) => {
    if (key === 'foreign_currency_entries') return true

    return typeof value === 'number' && value >= 0
  })
}

/**
 * Validates that all values are numerical
 */
const validateNumericalType = (values: CashValues): boolean => {
  return Object.entries(values).every(([key, value]) => {
    if (key === 'foreign_currency_entries') {
      // If it's undefined or null, it's valid
      if (!value) return true

      // Check that it's an array of objects with proper structure
      return Array.isArray(value) && value.every(entry =>
        typeof entry === 'object' &&
        typeof entry.amount === 'number' &&
        typeof entry.currency === 'string'
      )
    }

    return typeof value === 'number'
  })
}

/**
 * Cash validation template
 */
export const cashValidation: CalculatorValidationTemplate<CashValues> = {
  numericFields: ['cash_on_hand', 'checking_account', 'savings_account', 'digital_wallets', 'foreign_currency'],
  requiredFields: ['cash_on_hand', 'checking_account', 'savings_account', 'digital_wallets', 'foreign_currency'],
  booleanFields: [],
  validators: [validateNonNegative, validateNumericalType],
  isZakatableWithoutHawl: false
}

export default cashValidation 