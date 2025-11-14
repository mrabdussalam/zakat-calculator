// Define ValidationResult type directly in this file
// import { ValidationResult } from '../types'
import { roundCurrency } from '@/lib/utils/currency'

// Define the ValidationResult interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export type CalculatorValidationFn<T> = (values: T, hawlMet: boolean) => ValidationResult

export interface CalculatorValidationTemplate<T> {
  name?: string
  requiredFields?: string[]
  numericalFields?: string[]
  numericFields?: string[]
  booleanFields?: string[]
  customValidation?: (values: T) => boolean
  customValidations?: Array<(values: T) => ValidationResult | boolean>
  validateZakatableAmount?: CalculatorValidationFn<T>
}

export interface CalculatorValidator<T> {
  validateValues: (values: T) => boolean
  validateCalculations: (total: number, breakdown: { items: Record<string, { value: number }> }) => boolean
  validateZakatableAmount: (values: T, hawlMet: boolean) => boolean
}

/**
 * Creates a validator object for calculator values based on a template
 */
export function createCalculatorValidation<T extends Record<string, unknown>>(
  template: CalculatorValidationTemplate<T>
): CalculatorValidator<T> {
  return {
    validateValues: (values: T): boolean => {
      try {
        // Check required fields
        if (template.requiredFields) {
          for (const field of template.requiredFields) {
            if (values[field] === undefined || values[field] === null) {
              console.error(`Field '${field}' is required`)
              return false
            }
          }
        }

        // Check numerical fields (support both numericalFields and numericFields)
        const numFields = template.numericalFields || template.numericFields || []
        for (const field of numFields) {
          const value = values[field]
          if (value !== undefined && value !== null) {
            if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
              console.error(`Field '${field}' must be a valid number`)
              return false
            }
            if (value < 0) {
              console.error(`Field '${field}' cannot be negative`)
              return false
            }
          }
        }

        // Check boolean fields
        if (template.booleanFields) {
          for (const field of template.booleanFields) {
            const value = values[field]
            if (value !== undefined && value !== null && typeof value !== 'boolean') {
              console.error(`Field '${field}' must be a boolean value`)
              return false
            }
          }
        }

        // Run custom validations
        if (template.customValidations) {
          for (const validation of template.customValidations) {
            const result = validation(values)
            if (typeof result === 'boolean') {
              if (!result) return false
            } else {
              if (!result.isValid) return false
            }
          }
        }

        // Run single custom validation if provided
        if (template.customValidation) {
          if (!template.customValidation(values)) {
            return false
          }
        }

        return true
      } catch (error) {
        console.error('Validation error:', error)
        return false
      }
    },

    validateCalculations: (total: number, breakdown: { items: Record<string, { value: number }> }): boolean => {
      try {
        const sum = Object.values(breakdown.items).reduce((acc, item) => acc + item.value, 0)
        // Use a small epsilon for floating point comparison
        const epsilon = 0.01
        return Math.abs(sum - total) < epsilon
      } catch (error) {
        console.error('Calculation validation error:', error)
        return false
      }
    },

    validateZakatableAmount: (values: T, hawlMet: boolean): boolean => {
      try {
        // If custom zakatable validation is provided, use it
        if (template.validateZakatableAmount) {
          const result = template.validateZakatableAmount(values, hawlMet)
          return result.isValid
        }
        // Default: always valid
        return true
      } catch (error) {
        console.error('Zakatable amount validation error:', error)
        return false
      }
    }
  }
}

// Keep the old function-based validator for backward compatibility
export function createCalculatorValidator<T extends Record<string, unknown>>(template: CalculatorValidationTemplate<T>): CalculatorValidationFn<T> {
  return (values: T, hawlMet: boolean): ValidationResult => {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

    // Run template validations
    const validations = [
      template.requiredFields ? validateRequiredFields(template.requiredFields) : null,
      template.numericFields || template.numericalFields ? validateNumericFields(template.numericFields || template.numericFields || []) : null,
      template.booleanFields ? validateBooleanFields(template.booleanFields) : null,
    ].filter(Boolean) as CalculatorValidationFn<T>[]

    // Run each validation
    for (const validation of validations) {
      const validationResult = validation(values, hawlMet)
      if (!validationResult.isValid) {
        result.isValid = false
        result.errors.push(...validationResult.errors)
        result.warnings.push(...validationResult.warnings)
      }
    }

    // Run zakatable amount validation if provided and hawlMet
    if (hawlMet && template.validateZakatableAmount) {
      const zakatableValidation = template.validateZakatableAmount(values, hawlMet)
      if (!zakatableValidation.isValid) {
        result.isValid = false
        result.errors.push(...zakatableValidation.errors)
        result.warnings.push(...zakatableValidation.warnings)
      }
    }

    return result
  }
}

/**
 * Validates that required fields are present
 */
function validateRequiredFields<T extends Record<string, unknown>>(requiredFields: string[]): CalculatorValidationFn<T> {
  return (values: T): ValidationResult => {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

    for (const field of requiredFields) {
      if (values[field] === undefined || values[field] === null || values[field] === '') {
        result.isValid = false
        result.errors.push(`Field '${field}' is required`)
      }
    }

    return result
  }
}

/**
 * Validates that numeric fields contain valid numbers
 */
function validateNumericFields<T extends Record<string, unknown>>(numericFields: string[]): CalculatorValidationFn<T> {
  return (values: T): ValidationResult => {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

    for (const field of numericFields) {
      if (values[field] !== undefined && values[field] !== null) {
        const value = values[field]

        if (typeof value !== 'number' || isNaN(value)) {
          result.isValid = false
          result.errors.push(`Field '${field}' must be a valid number`)
        } else if (value < 0) {
          result.isValid = false
          result.errors.push(`Field '${field}' cannot be negative`)
        }
      }
    }

    return result
  }
}

/**
 * Validates that boolean fields contain valid boolean values
 */
function validateBooleanFields<T extends Record<string, unknown>>(booleanFields: string[]): CalculatorValidationFn<T> {
  return (values: T): ValidationResult => {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

    for (const field of booleanFields) {
      if (values[field] !== undefined && values[field] !== null) {
        if (typeof values[field] !== 'boolean') {
          result.isValid = false
          result.errors.push(`Field '${field}' must be a boolean value`)
        }
      }
    }

    return result
  }
}

// Removing unused parameters
export function validateNullCalculator(): ValidationResult {
  return { isValid: true, errors: [], warnings: [] }
} 