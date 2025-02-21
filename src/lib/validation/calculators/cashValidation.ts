import { CashValues } from '@/store/types'
import { createCalculatorValidation } from '../templates/calculatorValidation'

// Custom validation for negative values
const validateNonNegative = (values: CashValues): boolean => {
  return Object.values(values).every(value => {
    if (Array.isArray(value)) {
      return value.every(entry => typeof entry.amount === 'number' && entry.amount >= 0)
    }
    return typeof value === 'number' && !isNaN(value) && isFinite(value) && value >= 0
  })
}

// Custom validation for numerical type
const validateNumericalType = (values: CashValues): boolean => {
  return Object.entries(values).every(([key, value]) => {
    if (key === 'foreign_currency_entries') {
      return Array.isArray(value) && value.every(entry => 
        typeof entry.amount === 'number' && !isNaN(entry.amount) && isFinite(entry.amount)
      )
    }
    return typeof value === 'number' && !isNaN(value) && isFinite(value)
  })
}

// Custom validation for precision
const validatePrecision = (values: CashValues): boolean => {
  return Object.entries(values).every(([key, value]) => {
    if (key === 'foreign_currency_entries') {
      return Array.isArray(value) && value.every(entry => {
        if (typeof entry.amount !== 'number' || isNaN(entry.amount)) return false
        const decimalPlaces = (entry.amount.toString().split('.')[1] || '').length
        return decimalPlaces <= 2
      })
    }
    if (typeof value !== 'number' || isNaN(value)) return false
    const decimalPlaces = (value.toString().split('.')[1] || '').length
    return decimalPlaces <= 2
  })
}

// Custom validation for boundaries
const validateBoundaries = (values: CashValues): boolean => {
  return Object.entries(values).every(([key, value]) => {
    if (key === 'foreign_currency_entries') {
      return Array.isArray(value) && value.every(entry => {
        if (typeof entry.amount !== 'number' || isNaN(entry.amount)) return false
        return entry.amount <= Number.MAX_SAFE_INTEGER && entry.amount >= 0
      })
    }
    if (typeof value !== 'number' || isNaN(value)) return false
    return value <= Number.MAX_SAFE_INTEGER && value >= 0
  })
}

export const cashValidation = createCalculatorValidation<CashValues>({
  name: 'Cash Calculator',
  requiredFields: [
    'cash_on_hand',
    'checking_account',
    'savings_account',
    'digital_wallets',
    'foreign_currency',
    'foreign_currency_entries'
  ],
  numericalFields: [
    'cash_on_hand',
    'checking_account',
    'savings_account',
    'digital_wallets',
    'foreign_currency'
  ],
  customValidation: (values: CashValues) => {
    return (
      validateNonNegative(values) &&
      validateNumericalType(values) &&
      validatePrecision(values) &&
      validateBoundaries(values)
    )
  }
})

export default cashValidation 