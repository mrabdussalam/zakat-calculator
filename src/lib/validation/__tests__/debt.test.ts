import { debt } from '@/lib/assets/debt'
import {
  validateDebtValues,
  validateDebtAmount,
  validateReceivableEntry,
  validateLiabilityEntry,
  validateEntriesMatchTotals,
  validateBusinessRules,
  quickValidateDebtValues
} from '@/lib/validation/debtValidation'
import { DebtValues, ReceivableEntry, DebtEntry } from '@/store/types'
import { ZAKAT_RATE } from '@/lib/constants'

// Type assertion for breakdown items with isLiability
interface DebtBreakdownItem {
  value: number
  isZakatable: boolean
  zakatable: number
  zakatDue: number
  label: string
  tooltip?: string
  isLiability?: boolean
  isExempt?: boolean
}

describe('Debt Asset Calculator', () => {
  describe('calculateTotal', () => {
    it('should calculate net impact correctly with positive receivables', () => {
      const values: DebtValues = {
        receivables: 1000,
        short_term_liabilities: 200,
        long_term_liabilities_annual: 300,
        receivables_entries: [],
        liabilities_entries: []
      }

      // Net impact = 1000 - (200 + 300) = 500
      expect(debt.calculateTotal(values)).toBe(500)
    })

    it('should handle negative net impact', () => {
      const values: DebtValues = {
        receivables: 500,
        short_term_liabilities: 800,
        long_term_liabilities_annual: 200,
        receivables_entries: [],
        liabilities_entries: []
      }

      // Net impact = 500 - (800 + 200) = -500
      expect(debt.calculateTotal(values)).toBe(-500)
    })

    it('should handle zero values', () => {
      const values: DebtValues = {
        receivables: 0,
        short_term_liabilities: 0,
        long_term_liabilities_annual: 0,
        receivables_entries: [],
        liabilities_entries: []
      }

      expect(debt.calculateTotal(values)).toBe(0)
    })

    it('should handle only receivables', () => {
      const values: DebtValues = {
        receivables: 5000,
        short_term_liabilities: 0,
        long_term_liabilities_annual: 0,
        receivables_entries: [],
        liabilities_entries: []
      }

      expect(debt.calculateTotal(values)).toBe(5000)
    })

    it('should handle only liabilities', () => {
      const values: DebtValues = {
        receivables: 0,
        short_term_liabilities: 3000,
        long_term_liabilities_annual: 2000,
        receivables_entries: [],
        liabilities_entries: []
      }

      expect(debt.calculateTotal(values)).toBe(-5000)
    })
  })

  describe('calculateZakatable', () => {
    it('should return net impact when hawl met and positive', () => {
      const values: DebtValues = {
        receivables: 1000,
        short_term_liabilities: 200,
        long_term_liabilities_annual: 300,
        receivables_entries: [],
        liabilities_entries: []
      }

      // Net impact = 1000 - 500 = 500 (positive, so zakatable)
      expect(debt.calculateZakatable(values, null, true)).toBe(500)
    })

    it('should return negative net impact for deductions', () => {
      const values: DebtValues = {
        receivables: 500,
        short_term_liabilities: 800,
        long_term_liabilities_annual: 200,
        receivables_entries: [],
        liabilities_entries: []
      }

      // Net impact = 500 - 1000 = -500 (negative, acts as deduction)
      expect(debt.calculateZakatable(values, null, true)).toBe(-500)
    })

    it('should return 0 when hawl not met', () => {
      const values: DebtValues = {
        receivables: 1000,
        short_term_liabilities: 200,
        long_term_liabilities_annual: 300,
        receivables_entries: [],
        liabilities_entries: []
      }

      expect(debt.calculateZakatable(values, null, false)).toBe(0)
    })

    it('should handle null values', () => {
      expect(debt.calculateZakatable(null as any, null, true)).toBe(0)
    })
  })

  describe('getBreakdown', () => {
    it('should return correct breakdown structure', () => {
      const values: DebtValues = {
        receivables: 1000,
        short_term_liabilities: 200,
        long_term_liabilities_annual: 300,
        receivables_entries: [],
        liabilities_entries: []
      }

      const breakdown = debt.getBreakdown(values, null, true, 'USD')

      expect(breakdown.total).toBe(500) // Net impact
      expect(breakdown.zakatable).toBe(500)
      expect(breakdown.zakatDue).toBe(500 * ZAKAT_RATE)
      expect(breakdown.items.receivables).toBeDefined()
      expect(breakdown.items.short_term_liabilities).toBeDefined()
      expect(breakdown.items.long_term_liabilities_annual).toBeDefined()
      expect(breakdown.items.net_impact).toBeDefined()
    })

    it('should show liabilities as negative values', () => {
      const values: DebtValues = {
        receivables: 1000,
        short_term_liabilities: 200,
        long_term_liabilities_annual: 300,
        receivables_entries: [],
        liabilities_entries: []
      }

      const breakdown = debt.getBreakdown(values, null, true, 'USD')
      const shortTermItem = breakdown.items.short_term_liabilities as DebtBreakdownItem
      const longTermItem = breakdown.items.long_term_liabilities_annual as DebtBreakdownItem

      expect(shortTermItem.value).toBe(-200)
      expect(longTermItem.value).toBe(-300)
      expect(shortTermItem.isLiability).toBe(true)
      expect(longTermItem.isLiability).toBe(true)
    })

    it('should calculate zero zakat due when net impact is negative', () => {
      const values: DebtValues = {
        receivables: 500,
        short_term_liabilities: 800,
        long_term_liabilities_annual: 200,
        receivables_entries: [],
        liabilities_entries: []
      }

      const breakdown = debt.getBreakdown(values, null, true, 'USD')

      expect(breakdown.total).toBe(-500)
      expect(breakdown.zakatable).toBe(-500) // Still returns negative for deduction purposes
      expect(breakdown.zakatDue).toBe(0) // But no zakat due on negative
    })

    it('should handle hawl not met', () => {
      const values: DebtValues = {
        receivables: 1000,
        short_term_liabilities: 200,
        long_term_liabilities_annual: 300,
        receivables_entries: [],
        liabilities_entries: []
      }

      const breakdown = debt.getBreakdown(values, null, false, 'USD')

      expect(breakdown.zakatable).toBe(0)
      expect(breakdown.zakatDue).toBe(0)
      expect(breakdown.items.receivables.zakatable).toBe(0)
    })
  })
})

describe('Debt Validation', () => {
  describe('validateDebtAmount', () => {
    it('should validate positive numbers', () => {
      expect(validateDebtAmount(100, 'Test').isValid).toBe(true)
      expect(validateDebtAmount(0, 'Test').isValid).toBe(true)
      expect(validateDebtAmount(1000000, 'Test').isValid).toBe(true)
    })

    it('should reject negative numbers by default', () => {
      const result = validateDebtAmount(-100, 'Test')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('negative')
    })

    it('should allow negative numbers when specified', () => {
      const result = validateDebtAmount(-100, 'Test', { allowNegative: true })
      expect(result.isValid).toBe(true)
    })

    it('should reject NaN and Infinity', () => {
      expect(validateDebtAmount(NaN, 'Test').isValid).toBe(false)
      expect(validateDebtAmount(Infinity, 'Test').isValid).toBe(false)
      expect(validateDebtAmount(-Infinity, 'Test').isValid).toBe(false)
    })

    it('should enforce max value', () => {
      const result = validateDebtAmount(1000, 'Test', { maxValue: 500 })
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('exceed')
    })
  })

  describe('validateReceivableEntry', () => {
    it('should validate correct entry', () => {
      const entry: ReceivableEntry = {
        id: 'test-1',
        description: 'Loan to friend',
        amount: 1000,
        certainty: 'certain'
      }

      const result = validateReceivableEntry(entry)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty description', () => {
      const entry: ReceivableEntry = {
        id: 'test-1',
        description: '   ',
        amount: 1000,
        certainty: 'certain'
      }

      const result = validateReceivableEntry(entry)
      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes('empty'))).toBe(true)
    })

    it('should reject invalid certainty', () => {
      const entry = {
        id: 'test-1',
        description: 'Test',
        amount: 1000,
        certainty: 'invalid' as any
      }

      const result = validateReceivableEntry(entry)
      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes('certainty'))).toBe(true)
    })

    it('should validate all certainty levels', () => {
      const certainties: Array<'certain' | 'likely' | 'unlikely'> = ['certain', 'likely', 'unlikely']

      certainties.forEach((certainty) => {
        const entry: ReceivableEntry = {
          id: 'test-1',
          description: 'Test',
          amount: 1000,
          certainty
        }
        expect(validateReceivableEntry(entry).isValid).toBe(true)
      })
    })
  })

  describe('validateLiabilityEntry', () => {
    it('should validate correct short-term entry', () => {
      const entry: DebtEntry = {
        id: 'test-1',
        description: 'Credit card',
        amount: 500,
        is_short_term: true
      }

      const result = validateLiabilityEntry(entry)
      expect(result.isValid).toBe(true)
    })

    it('should validate correct long-term entry', () => {
      const entry: DebtEntry = {
        id: 'test-1',
        description: 'Mortgage payment',
        amount: 2000,
        is_short_term: false
      }

      const result = validateLiabilityEntry(entry)
      expect(result.isValid).toBe(true)
    })

    it('should reject missing is_short_term', () => {
      const entry = {
        id: 'test-1',
        description: 'Test',
        amount: 1000
      } as any

      const result = validateLiabilityEntry(entry)
      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes('short-term'))).toBe(true)
    })
  })

  describe('validateEntriesMatchTotals', () => {
    it('should pass when entries match totals', () => {
      const values: DebtValues = {
        receivables: 1500,
        receivables_entries: [
          { id: '1', description: 'A', amount: 1000, certainty: 'certain' },
          { id: '2', description: 'B', amount: 500, certainty: 'likely' }
        ],
        short_term_liabilities: 300,
        long_term_liabilities_annual: 700,
        liabilities_entries: [
          { id: '3', description: 'C', amount: 300, is_short_term: true },
          { id: '4', description: 'D', amount: 700, is_short_term: false }
        ]
      }

      const result = validateEntriesMatchTotals(values)
      expect(result.isValid).toBe(true)
    })

    it('should fail when receivables entries do not match', () => {
      const values: DebtValues = {
        receivables: 1000,
        receivables_entries: [
          { id: '1', description: 'A', amount: 500, certainty: 'certain' },
          { id: '2', description: 'B', amount: 300, certainty: 'likely' } // Sum = 800, not 1000
        ],
        short_term_liabilities: 0,
        long_term_liabilities_annual: 0,
        liabilities_entries: []
      }

      const result = validateEntriesMatchTotals(values)
      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes('Receivables total'))).toBe(true)
    })

    it('should fail when liability entries do not match', () => {
      const values: DebtValues = {
        receivables: 0,
        receivables_entries: [],
        short_term_liabilities: 500,
        long_term_liabilities_annual: 300,
        liabilities_entries: [
          { id: '1', description: 'A', amount: 400, is_short_term: true }, // Should be 500
          { id: '2', description: 'B', amount: 300, is_short_term: false }
        ]
      }

      const result = validateEntriesMatchTotals(values)
      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes('Short-term liabilities'))).toBe(true)
    })

    it('should allow small floating point differences', () => {
      const values: DebtValues = {
        receivables: 100.009, // Tiny difference due to floating point
        receivables_entries: [
          { id: '1', description: 'A', amount: 100.01, certainty: 'certain' }
        ],
        short_term_liabilities: 0,
        long_term_liabilities_annual: 0,
        liabilities_entries: []
      }

      const result = validateEntriesMatchTotals(values)
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateBusinessRules', () => {
    it('should warn about high debt-to-receivable ratio', () => {
      const values: DebtValues = {
        receivables: 100,
        short_term_liabilities: 5000,
        long_term_liabilities_annual: 6000, // 110x ratio
        receivables_entries: [],
        liabilities_entries: []
      }

      const result = validateBusinessRules(values)
      expect(result.warnings.some((w) => w.includes('liabilities'))).toBe(true)
    })

    it('should warn about large net debt deduction', () => {
      const values: DebtValues = {
        receivables: 0,
        short_term_liabilities: 50000,
        long_term_liabilities_annual: 60000, // -110,000 net
        receivables_entries: [],
        liabilities_entries: []
      }

      const result = validateBusinessRules(values)
      expect(result.warnings.some((w) => w.includes('large net debt'))).toBe(true)
    })

    it('should warn about uncertain receivables', () => {
      const values: DebtValues = {
        receivables: 5000,
        receivables_entries: [
          { id: '1', description: 'A', amount: 3000, certainty: 'unlikely' },
          { id: '2', description: 'B', amount: 2000, certainty: 'certain' }
        ],
        short_term_liabilities: 0,
        long_term_liabilities_annual: 0,
        liabilities_entries: []
      }

      const result = validateBusinessRules(values)
      expect(result.warnings.some((w) => w.includes('uncertain receivables'))).toBe(true)
    })

    it('should pass with reasonable values', () => {
      const values: DebtValues = {
        receivables: 5000,
        receivables_entries: [{ id: '1', description: 'A', amount: 5000, certainty: 'certain' }],
        short_term_liabilities: 2000,
        long_term_liabilities_annual: 1000,
        liabilities_entries: [
          { id: '2', description: 'B', amount: 2000, is_short_term: true },
          { id: '3', description: 'C', amount: 1000, is_short_term: false }
        ]
      }

      const result = validateBusinessRules(values)
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateDebtValues (comprehensive)', () => {
    it('should validate correct values', () => {
      const values: DebtValues = {
        receivables: 1000,
        short_term_liabilities: 200,
        long_term_liabilities_annual: 300,
        receivables_entries: [],
        liabilities_entries: []
      }

      const result = validateDebtValues(values)
      expect(result.isValid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it('should reject negative receivables', () => {
      const values: DebtValues = {
        receivables: -100,
        short_term_liabilities: 0,
        long_term_liabilities_annual: 0,
        receivables_entries: [],
        liabilities_entries: []
      }

      const result = validateDebtValues(values)
      expect(result.isValid).toBe(false)
      expect(result.errors.receivables).toBeDefined()
    })

    it('should reject negative liabilities', () => {
      const values: DebtValues = {
        receivables: 1000,
        short_term_liabilities: -50,
        long_term_liabilities_annual: 0,
        receivables_entries: [],
        liabilities_entries: []
      }

      const result = validateDebtValues(values)
      expect(result.isValid).toBe(false)
      expect(result.errors.short_term_liabilities).toBeDefined()
    })

    it('should collect multiple errors', () => {
      const values: DebtValues = {
        receivables: -100,
        short_term_liabilities: -50,
        long_term_liabilities_annual: -30,
        receivables_entries: [],
        liabilities_entries: []
      }

      const result = validateDebtValues(values)
      expect(result.isValid).toBe(false)
      expect(Object.keys(result.errors).length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('quickValidateDebtValues', () => {
    it('should return true for valid values', () => {
      const values: DebtValues = {
        receivables: 1000,
        short_term_liabilities: 200,
        long_term_liabilities_annual: 300,
        receivables_entries: [],
        liabilities_entries: []
      }

      expect(quickValidateDebtValues(values)).toBe(true)
    })

    it('should return false for negative values', () => {
      const values: DebtValues = {
        receivables: -100,
        short_term_liabilities: 200,
        long_term_liabilities_annual: 300,
        receivables_entries: [],
        liabilities_entries: []
      }

      expect(quickValidateDebtValues(values)).toBe(false)
    })

    it('should return false for NaN', () => {
      const values: DebtValues = {
        receivables: NaN,
        short_term_liabilities: 200,
        long_term_liabilities_annual: 300,
        receivables_entries: [],
        liabilities_entries: []
      }

      expect(quickValidateDebtValues(values)).toBe(false)
    })

    it('should return false for Infinity', () => {
      const values: DebtValues = {
        receivables: 1000,
        short_term_liabilities: Infinity,
        long_term_liabilities_annual: 300,
        receivables_entries: [],
        liabilities_entries: []
      }

      expect(quickValidateDebtValues(values)).toBe(false)
    })
  })
})
