/**
 * Enhanced Debt & Liabilities Validation
 *
 * Provides comprehensive validation for debt values including:
 * - Input validation (type, range, format)
 * - Cross-field validation (entries match totals)
 * - Business logic rules (Islamic finance compliance)
 */

import { DebtValues, DebtEntry, ReceivableEntry } from '@/store/types'
import type { DebtValues as DV, DebtEntry as DE, ReceivableEntry as RE } from '@/store/types'

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  warnings: Record<string, string>
}

/**
 * Validates a single numeric debt value
 */
export function validateDebtAmount(
  value: number,
  fieldName: string,
  options: {
    allowNegative?: boolean
    maxValue?: number
    minValue?: number
  } = {}
): { isValid: boolean; error?: string } {
  const { allowNegative = false, maxValue = Number.MAX_SAFE_INTEGER } = options
  // Set minValue based on allowNegative if not explicitly provided
  const minValue = options.minValue !== undefined
    ? options.minValue
    : (allowNegative ? -Number.MAX_SAFE_INTEGER : 0)

  // Type check
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { isValid: false, error: `${fieldName} must be a valid number` }
  }

  // Negative check (only if allowNegative is false)
  if (!allowNegative && value < 0) {
    return { isValid: false, error: `${fieldName} cannot be negative` }
  }

  // Range check
  if (value < minValue) {
    return { isValid: false, error: `${fieldName} must be at least ${minValue}` }
  }

  if (value > maxValue) {
    return { isValid: false, error: `${fieldName} cannot exceed ${maxValue}` }
  }

  return { isValid: true }
}

/**
 * Validates receivable entry structure and data
 */
export function validateReceivableEntry(entry: ReceivableEntry): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // ID check
  if (!entry.id || typeof entry.id !== 'string') {
    errors.push('Entry must have a valid ID')
  }

  // Description check
  if (!entry.description || typeof entry.description !== 'string') {
    errors.push('Entry must have a description')
  } else if (entry.description.trim().length === 0) {
    errors.push('Entry description cannot be empty')
  } else if (entry.description.length > 200) {
    errors.push('Entry description is too long (max 200 characters)')
  }

  // Amount check
  const amountValidation = validateDebtAmount(entry.amount, 'Entry amount')
  if (!amountValidation.isValid) {
    errors.push(amountValidation.error!)
  }

  // Certainty check
  const validCertainties = ['certain', 'likely', 'unlikely']
  if (!validCertainties.includes(entry.certainty)) {
    errors.push('Entry must have a valid certainty level (certain, likely, or unlikely)')
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Validates liability entry structure and data
 */
export function validateLiabilityEntry(entry: DebtEntry): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // ID check
  if (!entry.id || typeof entry.id !== 'string') {
    errors.push('Entry must have a valid ID')
  }

  // Description check
  if (!entry.description || typeof entry.description !== 'string') {
    errors.push('Entry must have a description')
  } else if (entry.description.trim().length === 0) {
    errors.push('Entry description cannot be empty')
  } else if (entry.description.length > 200) {
    errors.push('Entry description is too long (max 200 characters)')
  }

  // Amount check
  const amountValidation = validateDebtAmount(entry.amount, 'Entry amount')
  if (!amountValidation.isValid) {
    errors.push(amountValidation.error!)
  }

  // Term type check
  if (typeof entry.is_short_term !== 'boolean') {
    errors.push('Entry must specify if it is short-term or long-term')
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Cross-field validation: ensures entries match totals
 */
export function validateEntriesMatchTotals(values: DebtValues): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate receivables entries match total
  if (values.receivables_entries && values.receivables_entries.length > 0) {
    const calculatedTotal = values.receivables_entries.reduce((sum, entry) => sum + entry.amount, 0)
    const difference = Math.abs(calculatedTotal - values.receivables)

    if (difference > 0.01) {
      // Allow small floating point differences
      errors.push(
        `Receivables total (${values.receivables.toFixed(2)}) does not match sum of entries (${calculatedTotal.toFixed(2)}). Difference: ${difference.toFixed(2)}`
      )
    }
  }

  // Validate liabilities entries match totals
  if (values.liabilities_entries && values.liabilities_entries.length > 0) {
    const shortTermTotal = values.liabilities_entries
      .filter((e) => e.is_short_term)
      .reduce((sum, entry) => sum + entry.amount, 0)

    const longTermTotal = values.liabilities_entries
      .filter((e) => !e.is_short_term)
      .reduce((sum, entry) => sum + entry.amount, 0)

    const shortTermDiff = Math.abs(shortTermTotal - values.short_term_liabilities)
    const longTermDiff = Math.abs(longTermTotal - values.long_term_liabilities_annual)

    if (shortTermDiff > 0.01) {
      errors.push(
        `Short-term liabilities (${values.short_term_liabilities.toFixed(2)}) does not match sum of short-term entries (${shortTermTotal.toFixed(2)})`
      )
    }

    if (longTermDiff > 0.01) {
      errors.push(
        `Long-term liabilities annual (${values.long_term_liabilities_annual.toFixed(2)}) does not match sum of long-term entries (${longTermTotal.toFixed(2)})`
      )
    }
  }

  return { isValid: errors.length === 0, errors, warnings }
}

/**
 * Business logic validation: Islamic finance rules
 */
export function validateBusinessRules(values: DebtValues): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for unreasonable debt-to-receivable ratio
  const totalLiabilities = values.short_term_liabilities + values.long_term_liabilities_annual
  const netImpact = values.receivables - totalLiabilities

  // Warning: Very high liabilities compared to receivables
  if (totalLiabilities > 0 && values.receivables > 0) {
    const ratio = totalLiabilities / values.receivables
    if (ratio > 10) {
      warnings.push(
        `Your liabilities (${totalLiabilities.toFixed(2)}) are ${ratio.toFixed(1)}x your receivables. Please verify these amounts are correct.`
      )
    }
  }

  // Warning: Net negative impact is very large
  if (netImpact < -100000) {
    warnings.push(
      `You have a large net debt deduction of ${Math.abs(netImpact).toFixed(2)}. This will significantly reduce your zakatable wealth.`
    )
  }

  // Warning: Uncertain receivables
  if (values.receivables_entries && values.receivables_entries.length > 0) {
    const uncertainAmount = values.receivables_entries
      .filter((e) => e.certainty === 'unlikely')
      .reduce((sum, e) => sum + e.amount, 0)

    if (uncertainAmount > 0) {
      warnings.push(
        `You have ${uncertainAmount.toFixed(2)} in uncertain receivables (unlikely to be paid). Consider excluding these from Zakat calculation or consult a scholar.`
      )
    }

    const likelyAmount = values.receivables_entries
      .filter((e) => e.certainty === 'likely')
      .reduce((sum, e) => sum + e.amount, 0)

    if (likelyAmount > values.receivables * 0.5) {
      warnings.push(
        `More than half of your receivables (${likelyAmount.toFixed(2)}) are marked as "likely" rather than "certain". You may want to be cautious in including these.`
      )
    }
  }

  // Check for empty entries with non-zero totals
  if (
    values.receivables_entries.length === 0 &&
    values.receivables > 0 &&
    values.receivables > 10000
  ) {
    warnings.push(
      `You have ${values.receivables.toFixed(2)} in receivables but no detailed entries. Consider adding entry details for better tracking.`
    )
  }

  if (
    values.liabilities_entries.length === 0 &&
    totalLiabilities > 0 &&
    totalLiabilities > 10000
  ) {
    warnings.push(
      `You have ${totalLiabilities.toFixed(2)} in liabilities but no detailed entries. Consider adding entry details for better tracking.`
    )
  }

  return { isValid: errors.length === 0, errors, warnings }
}

/**
 * Main validation function - validates all aspects of debt values
 */
export function validateDebtValues(values: DebtValues): ValidationResult {
  const errors: Record<string, string> = {}
  const warnings: Record<string, string> = {}

  // 1. Validate individual numeric fields
  const receivablesCheck = validateDebtAmount(values.receivables, 'Receivables')
  if (!receivablesCheck.isValid) {
    errors.receivables = receivablesCheck.error!
  }

  const shortTermCheck = validateDebtAmount(values.short_term_liabilities, 'Short-term liabilities')
  if (!shortTermCheck.isValid) {
    errors.short_term_liabilities = shortTermCheck.error!
  }

  const longTermCheck = validateDebtAmount(
    values.long_term_liabilities_annual,
    'Long-term liabilities annual'
  )
  if (!longTermCheck.isValid) {
    errors.long_term_liabilities_annual = longTermCheck.error!
  }

  // 2. Validate receivable entries
  if (values.receivables_entries && values.receivables_entries.length > 0) {
    for (let i = 0; i < values.receivables_entries.length; i++) {
      const entryValidation = validateReceivableEntry(values.receivables_entries[i])
      if (!entryValidation.isValid) {
        errors[`receivables_entry_${i}`] = entryValidation.errors.join('; ')
      }
    }
  }

  // 3. Validate liability entries
  if (values.liabilities_entries && values.liabilities_entries.length > 0) {
    for (let i = 0; i < values.liabilities_entries.length; i++) {
      const entryValidation = validateLiabilityEntry(values.liabilities_entries[i])
      if (!entryValidation.isValid) {
        errors[`liabilities_entry_${i}`] = entryValidation.errors.join('; ')
      }
    }
  }

  // 4. Cross-field validation
  const crossFieldValidation = validateEntriesMatchTotals(values)
  if (!crossFieldValidation.isValid) {
    errors.entries_mismatch = crossFieldValidation.errors.join('; ')
  }
  if (crossFieldValidation.warnings.length > 0) {
    warnings.entries = crossFieldValidation.warnings.join('; ')
  }

  // 5. Business logic validation
  const businessRulesValidation = validateBusinessRules(values)
  if (!businessRulesValidation.isValid) {
    errors.business_rules = businessRulesValidation.errors.join('; ')
  }
  if (businessRulesValidation.warnings.length > 0) {
    warnings.business_rules = businessRulesValidation.warnings.join('; ')
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  }
}

/**
 * Quick validation - only checks for blocking errors, skips warnings
 */
export function quickValidateDebtValues(values: DebtValues): boolean {
  // Check basic numeric validity
  if (
    typeof values.receivables !== 'number' ||
    !Number.isFinite(values.receivables) ||
    values.receivables < 0
  ) {
    return false
  }

  if (
    typeof values.short_term_liabilities !== 'number' ||
    !Number.isFinite(values.short_term_liabilities) ||
    values.short_term_liabilities < 0
  ) {
    return false
  }

  if (
    typeof values.long_term_liabilities_annual !== 'number' ||
    !Number.isFinite(values.long_term_liabilities_annual) ||
    values.long_term_liabilities_annual < 0
  ) {
    return false
  }

  return true
}
