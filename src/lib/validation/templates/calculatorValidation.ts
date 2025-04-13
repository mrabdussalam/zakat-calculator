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
  name?: string;
  requiredFields?: Array<keyof T | string>;
  numericFields?: Array<keyof T | string>;
  booleanFields?: Array<keyof T | string>;
  customValidation?: (values: T, hawlMet: boolean) => boolean;
  customValidations?: CalculatorValidationFn<T>[];
  validateZakatableAmount?: CalculatorValidationFn<T>;
  validators?: Array<(values: T) => boolean>;
  isZakatableWithoutHawl?: boolean;
}

/**
 * Creates a validator function for calculator values based on a template
 */
export function createCalculatorValidator<T>(template: CalculatorValidationTemplate<T>): CalculatorValidationFn<T> {
  return (values: T, hawlMet: boolean): ValidationResult => {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

    // Run template validations
    const validations = [
      template.requiredFields ? validateRequiredFields(template.requiredFields) : null,
      template.numericFields ? validateNumericFields(template.numericFields) : null,
      template.booleanFields ? validateBooleanFields(template.booleanFields) : null,
      ...(template.customValidations || []),
    ].filter(Boolean) as CalculatorValidationFn<T>[]

    // Run custom validation if provided
    if (template.customValidation) {
      const isValid = template.customValidation(values, hawlMet);
      if (!isValid) {
        result.isValid = false;
        result.errors.push(`Custom validation failed for ${template.name || 'calculator'}`);
      }
    }

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
function validateRequiredFields<T>(requiredFields: Array<keyof T | string>): CalculatorValidationFn<T> {
  return (values: T): ValidationResult => {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

    for (const field of requiredFields) {
      const value = values[field as keyof T];
      if (value === undefined || value === null || value === '') {
        result.isValid = false
        result.errors.push(`Field '${String(field)}' is required`)
      }
    }

    return result
  }
}

/**
 * Validates that numeric fields contain valid numbers
 */
function validateNumericFields<T>(numericFields: Array<keyof T | string>): CalculatorValidationFn<T> {
  return (values: T): ValidationResult => {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

    for (const field of numericFields) {
      const value = values[field as keyof T];
      if (value !== undefined && value !== null) {
        if (typeof value !== 'number' || isNaN(value)) {
          result.isValid = false
          result.errors.push(`Field '${String(field)}' must be a valid number`)
        } else if (value < 0) {
          result.isValid = false
          result.errors.push(`Field '${String(field)}' cannot be negative`)
        }
      }
    }

    return result
  }
}

/**
 * Validates that boolean fields contain valid boolean values
 */
function validateBooleanFields<T>(booleanFields: Array<keyof T | string>): CalculatorValidationFn<T> {
  return (values: T): ValidationResult => {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

    for (const field of booleanFields) {
      const value = values[field as keyof T];
      if (value !== undefined && value !== null) {
        if (typeof value !== 'boolean') {
          result.isValid = false
          result.errors.push(`Field '${String(field)}' must be a boolean value`)
        }
      }
    }

    return result
  }
}

// Add validation methods for the result object
export interface ValidationMethods<T> {
  validateValues: (values: T) => boolean;
  validateCalculations: (total: number, breakdown: any) => boolean;
  validateZakatableAmount: (values: T, hawlMet: boolean) => boolean;
}

/**
 * Creates a validator function with additional helper methods
 */
export function createCalculatorValidation<T>(
  template: CalculatorValidationTemplate<T>
): CalculatorValidationFn<T> & ValidationMethods<T> {
  const validatorFn = createCalculatorValidator<T>(template);

  // Add helper methods
  const enhancedValidator = validatorFn as CalculatorValidationFn<T> & ValidationMethods<T>;

  // Method to validate just the values
  enhancedValidator.validateValues = (values: T): boolean => {
    const result = validatorFn(values, true);
    return result.isValid;
  };

  // Method to validate calculations
  enhancedValidator.validateCalculations = (total: number, breakdown: any): boolean => {
    // Simple validation for now - check if total matches breakdown total
    return Math.abs(total - breakdown.total) < 0.01;
  };

  // Method to validate zakatable amount
  enhancedValidator.validateZakatableAmount = (values: T, hawlMet: boolean): boolean => {
    // Default implementation just checks hawl status
    return true;
  };

  return enhancedValidator;
}

// Removing unused parameters
export function validateNullCalculator(): ValidationResult {
  return { isValid: true, errors: [], warnings: [] }
} 