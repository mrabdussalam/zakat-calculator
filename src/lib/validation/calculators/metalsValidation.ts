import { createCalculatorValidation } from '../templates/calculatorValidation'
import { MetalsValues } from '@/store/types'

// Define metals-specific validation rules
export const metalsValidation = createCalculatorValidation<MetalsValues>({
  name: 'Metals Calculator',
  requiredFields: [
    'gold_regular',
    'gold_occasional',
    'gold_investment',
    'silver_regular',
    'silver_occasional',
    'silver_investment'
  ],
  numericalFields: [
    'gold_regular',
    'gold_occasional',
    'gold_investment',
    'silver_regular',
    'silver_occasional',
    'silver_investment'
  ],
  customValidation: (values: MetalsValues) => {
    // Additional validation for decimal precision
    return Object.entries(values).every(([key, value]) => {
      // Allow decimals up to 3 places for precise measurements
      if (typeof value === 'number') {
        const decimalPlaces = (value.toString().split('.')[1] || '').length
        return decimalPlaces <= 3
      }
      return false
    })
  }
}) 