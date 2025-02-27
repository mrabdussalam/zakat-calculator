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
  requiredFields?: string[]
  numericFields?: string[]
  booleanFields?: string[]
  customValidations?: CalculatorValidationFn<T>[]
  validateZakatableAmount?: CalculatorValidationFn<T>
}

/**
 * Creates a validator function for calculator values based on a template
 */
export function createCalculatorValidator<T extends Record<string, unknown>>(template: CalculatorValidationTemplate<T>): CalculatorValidationFn<T> {
  return (values: T, hawlMet: boolean): ValidationResult => {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }
    
    // Run template validations
    const validations = [
      template.requiredFields ? validateRequiredFields(template.requiredFields) : null,
      template.numericFields ? validateNumericFields(template.numericFields) : null,
      template.booleanFields ? validateBooleanFields(template.booleanFields) : null,
      ...(template.customValidations || []),
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