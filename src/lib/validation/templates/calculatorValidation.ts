import { CashValues, ForeignCurrencyEntry } from '@/store/types'

export interface CalculatorValidation<T> {
  validateValues: (values: T) => boolean
  validateCalculations: (total: number, breakdown: any) => boolean
  validateZakatableAmount: (values: T, hawlMet: boolean) => boolean
  validateNumericalFields: (values: T) => boolean
  validateRequiredFields: (values: T) => boolean
  validateBooleanFields?: (values: T) => boolean
  validateCustom?: (values: T) => boolean
}

export function createCalculatorValidation<T extends Record<string, any>>(config: {
  name: string
  requiredFields?: Array<keyof T>
  numericalFields?: Array<keyof T>
  booleanFields?: Array<keyof T>
  customValidation?: (values: T) => boolean
}): CalculatorValidation<T> {
  const validateRequiredFields = (values: T): boolean => {
    if (!config.requiredFields?.length) return true
    return config.requiredFields.every(field => {
      const value = values[field]
      if (field === 'foreign_currency_entries') {
        return Array.isArray(value)
      }
      return value !== undefined && value !== null
    })
  }

  const validateNumericalFields = (values: T): boolean => {
    if (!config.numericalFields?.length) return true
    return config.numericalFields.every(field => {
      const value = values[field]
      if (field === 'foreign_currency_entries') {
        if (!Array.isArray(value)) return false
        return (value as ForeignCurrencyEntry[]).every(entry => 
          typeof entry.amount === 'number' && 
          !isNaN(entry.amount) && 
          isFinite(entry.amount) && 
          entry.amount >= 0
        )
      }
      return (
        typeof value === 'number' && 
        !isNaN(value) && 
        isFinite(value) && 
        value >= 0
      )
    })
  }

  const validateBooleanFields = config.booleanFields?.length
    ? (values: T): boolean => {
        return config.booleanFields?.every(
          field => typeof values[field] === 'boolean'
        ) ?? true
      }
    : undefined

  return {
    validateValues: (values: T): boolean => {
      // Run all validations
      const validations = [
        () => validateRequiredFields(values),
        () => validateNumericalFields(values),
        config.booleanFields?.length ? () => validateBooleanFields?.(values) : null,
        config.customValidation ? () => config.customValidation?.(values) : null
      ].filter(Boolean)

      return validations.every(validation => validation?.() ?? true)
    },

    validateRequiredFields,
    validateNumericalFields,
    validateBooleanFields,
    validateCustom: config.customValidation,

    validateCalculations: (total: number, breakdown: any): boolean => {
      try {
        // Verify total matches sum of items
        const itemsTotal = Object.values(breakdown.items)
          .reduce((sum: number, item: any) => {
            if (typeof item !== 'object' || typeof item.value !== 'number') return sum
            return sum + item.value
          }, 0)

        return Math.abs(total - itemsTotal) <= 0.01
      } catch (error) {
        console.error(`Calculation validation error in ${config.name}:`, error)
        return false
      }
    },

    validateZakatableAmount: (values: T, hawlMet: boolean): boolean => {
      try {
        // This should be implemented specifically for each calculator
        // as zakatable amount rules vary by asset type
        return true
      } catch (error) {
        console.error(`Zakatable amount validation error in ${config.name}:`, error)
        return false
      }
    }
  }
} 