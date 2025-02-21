import { createCalculatorValidation } from '../templates/calculatorValidation'
import { CryptoValues } from '@/store/types'

// Define crypto-specific validation rules
const cryptoValidation = createCalculatorValidation<CryptoValues>({
  name: 'Crypto Calculator',
  requiredFields: ['coins', 'total_value', 'zakatable_value'],
  numericalFields: ['total_value', 'zakatable_value'],
  customValidations: [
    // Validate coins array structure
    (values: CryptoValues) => {
      if (!Array.isArray(values.coins)) {
        console.error('coins must be an array')
        return false
      }
      
      return values.coins.every(coin => {
        if (typeof coin !== 'object') return false
        if (typeof coin.symbol !== 'string') return false
        if (typeof coin.quantity !== 'number' || coin.quantity < 0) return false
        if (typeof coin.currentPrice !== 'number' || coin.currentPrice < 0) return false
        if (typeof coin.marketValue !== 'number' || coin.marketValue < 0) return false
        if (typeof coin.zakatDue !== 'number' || coin.zakatDue < 0) return false
        return true
      })
    }
  ]
})

// Add crypto-specific zakatable amount validation
const validateCryptoZakatable = (values: CryptoValues, hawlMet: boolean): boolean => {
  if (!hawlMet) return true // If hawl not met, no zakat is due

  try {
    // Calculate total market value
    const totalMarketValue = values.coins.reduce((sum, coin) => 
      sum + (coin.marketValue || 0), 0)

    // All crypto is zakatable when hawl is met
    const zakatableAmount = hawlMet ? totalMarketValue : 0

    // Validate calculations
    if (zakatableAmount < 0) {
      console.error('Zakatable amount cannot be negative')
      return false
    }

    if (zakatableAmount !== values.zakatable_value) {
      console.error('Zakatable amount does not match calculated value')
      return false
    }

    return true
  } catch (error) {
    console.error('Error validating crypto zakatable amount:', error)
    return false
  }
}

// Override the template's zakatable validation with crypto-specific logic
cryptoValidation.validateZakatableAmount = validateCryptoZakatable

export default cryptoValidation 