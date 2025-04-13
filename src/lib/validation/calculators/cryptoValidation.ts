import { CryptoValues } from '@/store/types'
import { CalculatorValidationTemplate } from '../templates/calculatorValidation'

/**
 * Validates crypto values
 */
const validateCrypto = (values: CryptoValues, hawlMet: boolean): boolean => {
  // Check total_value and zakatable_value
  if (typeof values.total_value !== 'number' || typeof values.zakatable_value !== 'number') return false
  if (values.total_value < 0 || values.zakatable_value < 0) return false

  // Check coins array
  return values.coins.every(coin =>
    typeof coin.quantity === 'number' &&
    typeof coin.currentPrice === 'number' &&
    typeof coin.marketValue === 'number' &&
    typeof coin.zakatDue === 'number' &&
    typeof coin.symbol === 'string' &&
    coin.quantity >= 0 &&
    coin.currentPrice >= 0 &&
    coin.marketValue >= 0 &&
    coin.zakatDue >= 0
  )
}

/**
 * Crypto validation template
 */
export const cryptoValidation: CalculatorValidationTemplate<CryptoValues> = {
  numericFields: ['total_value', 'zakatable_value'],
  requiredFields: ['coins', 'total_value', 'zakatable_value'],
  booleanFields: [],
  customValidation: validateCrypto,
  isZakatableWithoutHawl: false
}

export default cryptoValidation 