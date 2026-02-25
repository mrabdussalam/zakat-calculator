import { debt } from '@/lib/assets/debt'
import { validateDebtValues } from '@/lib/validation/debt'
import { DebtValues } from '@/store/types'

describe('Debt & Liabilities Calculator', () => {
  const defaultValues: DebtValues = {
    receivables: 0,
    short_term_liabilities: 0,
    long_term_liabilities_annual: 0
  }

  describe('calculateTotal', () => {
    it('should return 0 for empty values', () => {
      expect(debt.calculateTotal(defaultValues)).toBe(0)
    })

    it('should return net impact (receivables - liabilities)', () => {
      const values: DebtValues = {
        receivables: 1000,
        short_term_liabilities: 200,
        long_term_liabilities_annual: 300
      }
      expect(debt.calculateTotal(values)).toBe(500)
    })

    it('should return negative when liabilities exceed receivables', () => {
      const values: DebtValues = {
        receivables: 100,
        short_term_liabilities: 500,
        long_term_liabilities_annual: 200
      }
      expect(debt.calculateTotal(values)).toBe(-600)
    })

    it('should return only receivables when no liabilities', () => {
      const values: DebtValues = {
        receivables: 5000,
        short_term_liabilities: 0,
        long_term_liabilities_annual: 0
      }
      expect(debt.calculateTotal(values)).toBe(5000)
    })
  })

  describe('calculateZakatable', () => {
    it('should return 0 when hawl is not met', () => {
      const values: DebtValues = {
        receivables: 1000,
        short_term_liabilities: 200,
        long_term_liabilities_annual: 300
      }
      expect(debt.calculateZakatable(values, null, false)).toBe(0)
    })

    it('should return receivables when hawl is met', () => {
      const values: DebtValues = {
        receivables: 1000,
        short_term_liabilities: 200,
        long_term_liabilities_annual: 300
      }
      expect(debt.calculateZakatable(values, null, true)).toBe(1000)
    })

    it('should return 0 when no receivables', () => {
      const values: DebtValues = {
        receivables: 0,
        short_term_liabilities: 500,
        long_term_liabilities_annual: 200
      }
      expect(debt.calculateZakatable(values, null, true)).toBe(0)
    })
  })

  describe('getBreakdown', () => {
    it('should return correct breakdown for values with receivables and liabilities', () => {
      const values: DebtValues = {
        receivables: 1000,
        short_term_liabilities: 200,
        long_term_liabilities_annual: 300
      }
      const breakdown = debt.getBreakdown(values, null, true, 'USD')

      expect(breakdown.total).toBe(500) // net impact
      expect(breakdown.zakatable).toBe(500) // net impact (receivables - liabilities)
      expect(breakdown.zakatDue).toBeCloseTo(12.5) // 500 * 0.025
    })

    it('should return zero zakatable when hawl not met', () => {
      const values: DebtValues = {
        receivables: 1000,
        short_term_liabilities: 200,
        long_term_liabilities_annual: 300
      }
      const breakdown = debt.getBreakdown(values, null, false, 'USD')

      expect(breakdown.total).toBe(500)
      expect(breakdown.zakatable).toBe(0)
      expect(breakdown.zakatDue).toBe(0)
    })

    it('should include liability items with negative values', () => {
      const values: DebtValues = {
        receivables: 1000,
        short_term_liabilities: 200,
        long_term_liabilities_annual: 300
      }
      const breakdown = debt.getBreakdown(values, null, true, 'USD')

      expect(breakdown.items.short_term_liabilities.value).toBe(-200)
      expect(breakdown.items.long_term_liabilities_annual.value).toBe(-300)
      expect((breakdown.items.short_term_liabilities as any).isLiability).toBe(true)
      expect((breakdown.items.long_term_liabilities_annual as any).isLiability).toBe(true)
    })

    it('should show liability items with negative zakatable (deductions)', () => {
      const values: DebtValues = {
        receivables: 1000,
        short_term_liabilities: 200,
        long_term_liabilities_annual: 300
      }
      const breakdown = debt.getBreakdown(values, null, true, 'USD')

      // Liabilities show as deductions from zakatable
      expect(breakdown.items.short_term_liabilities.zakatable).toBe(-200)
      expect(breakdown.items.long_term_liabilities_annual.zakatable).toBe(-300)
      // Receivables show full zakatable
      expect(breakdown.items.receivables.zakatable).toBe(1000)
    })

    it('should return negative zakatable when liabilities exceed receivables', () => {
      const values: DebtValues = {
        receivables: 100,
        short_term_liabilities: 500,
        long_term_liabilities_annual: 200
      }
      const breakdown = debt.getBreakdown(values, null, true, 'USD')

      expect(breakdown.total).toBe(-600) // net impact
      expect(breakdown.zakatable).toBe(-600) // negative = deduction from other assets
      expect(breakdown.zakatDue).toBeCloseTo(-15) // -600 * 0.025
    })

    it('should not include zero-value liability items', () => {
      const values: DebtValues = {
        receivables: 1000,
        short_term_liabilities: 0,
        long_term_liabilities_annual: 0
      }
      const breakdown = debt.getBreakdown(values, null, true, 'USD')

      expect(breakdown.items.short_term_liabilities).toBeUndefined()
      expect(breakdown.items.long_term_liabilities_annual).toBeUndefined()
    })
  })

  describe('validateDebtValues', () => {
    it('should pass for valid values', () => {
      const values: DebtValues = {
        receivables: 1000,
        short_term_liabilities: 500,
        long_term_liabilities_annual: 200
      }
      const result = validateDebtValues(values)
      expect(result.isValid).toBe(true)
      expect(Object.keys(result.errors).length).toBe(0)
    })

    it('should fail for negative receivables', () => {
      const values: DebtValues = {
        receivables: -100,
        short_term_liabilities: 0,
        long_term_liabilities_annual: 0
      }
      const result = validateDebtValues(values)
      expect(result.isValid).toBe(false)
      expect(result.errors.receivables).toBeDefined()
    })

    it('should fail for negative liabilities', () => {
      const values: DebtValues = {
        receivables: 0,
        short_term_liabilities: -100,
        long_term_liabilities_annual: 0
      }
      const result = validateDebtValues(values)
      expect(result.isValid).toBe(false)
      expect(result.errors.short_term_liabilities).toBeDefined()
    })

    it('should detect entry total mismatch for receivables', () => {
      const values: DebtValues = {
        receivables: 1000,
        short_term_liabilities: 0,
        long_term_liabilities_annual: 0,
        receivables_entries: [
          { description: 'Loan to friend', amount: 500 },
          { description: 'Business receivable', amount: 300 }
        ]
      }
      const result = validateDebtValues(values)
      expect(result.isValid).toBe(false)
      expect(result.errors.receivables).toBeDefined()
    })

    it('should pass when entry totals match', () => {
      const values: DebtValues = {
        receivables: 800,
        short_term_liabilities: 0,
        long_term_liabilities_annual: 0,
        receivables_entries: [
          { description: 'Loan to friend', amount: 500 },
          { description: 'Business receivable', amount: 300 }
        ]
      }
      const result = validateDebtValues(values)
      expect(result.isValid).toBe(true)
    })
  })
})
