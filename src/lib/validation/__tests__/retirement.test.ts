import { createCalculatorValidation } from '../templates/calculatorValidation'
import { RetirementValues } from '@/store/types'
import '@testing-library/jest-dom'

describe('Retirement Calculator Validation', () => {
  // Mock console.error to prevent test output noise
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const retirementValidation = createCalculatorValidation<RetirementValues>({
    name: 'Retirement Calculator',
    requiredFields: [
      'traditional_401k',
      'roth_401k',
      'traditional_ira',
      'roth_ira',
      'pension',
      'other_retirement'
    ],
    numericalFields: [
      'traditional_401k',
      'roth_401k',
      'traditional_ira',
      'roth_ira',
      'pension',
      'other_retirement'
    ]
  })

  describe('validateValues', () => {
    it('should validate valid retirement values', () => {
      const validValues: RetirementValues = {
        traditional_401k: 100000,
        roth_401k: 50000,
        traditional_ira: 25000,
        roth_ira: 30000,
        pension: 75000,
        other_retirement: 10000
      }

      expect(retirementValidation.validateValues(validValues)).toBe(true)
    })

    it('should validate zero values', () => {
      const zeroValues: RetirementValues = {
        traditional_401k: 0,
        roth_401k: 0,
        traditional_ira: 0,
        roth_ira: 0,
        pension: 0,
        other_retirement: 0
      }

      expect(retirementValidation.validateValues(zeroValues)).toBe(true)
    })

    it('should reject negative values', () => {
      const negativeValues: RetirementValues = {
        traditional_401k: -1000,
        roth_401k: 50000,
        traditional_ira: 25000,
        roth_ira: 30000,
        pension: 75000,
        other_retirement: 10000
      }

      expect(retirementValidation.validateValues(negativeValues)).toBe(false)
    })

    it('should reject missing required fields', () => {
      const missingFields: Partial<RetirementValues> = {
        traditional_401k: 100000,
        roth_401k: 50000
        // Missing other required fields
      }

      expect(retirementValidation.validateValues(missingFields as RetirementValues)).toBe(false)
    })

    it('should reject non-numeric values', () => {
      const invalidTypes = {
        traditional_401k: '100000' as any,
        roth_401k: 50000,
        traditional_ira: 25000,
        roth_ira: 30000,
        pension: 75000,
        other_retirement: 10000
      }

      expect(retirementValidation.validateValues(invalidTypes)).toBe(false)
    })
  })

  describe('validateCalculations', () => {
    it('should validate matching totals', () => {
      const total = 290000
      const breakdown = {
        items: {
          traditional_401k: { value: 100000 },
          roth_401k: { value: 50000 },
          traditional_ira: { value: 25000 },
          roth_ira: { value: 30000 },
          pension: { value: 75000 },
          other_retirement: { value: 10000 }
        }
      }

      expect(retirementValidation.validateCalculations(total, breakdown)).toBe(true)
    })

    it('should reject mismatched totals', () => {
      const total = 300000 // Incorrect total
      const breakdown = {
        items: {
          traditional_401k: { value: 100000 },
          roth_401k: { value: 50000 },
          traditional_ira: { value: 25000 },
          roth_ira: { value: 30000 },
          pension: { value: 75000 },
          other_retirement: { value: 10000 }
        }
      }

      expect(retirementValidation.validateCalculations(total, breakdown)).toBe(false)
    })
  })

  describe('validateZakatableAmount', () => {
    it('should validate when hawl is met', () => {
      const values: RetirementValues = {
        traditional_401k: 100000,
        roth_401k: 50000,
        traditional_ira: 25000,
        roth_ira: 30000,
        pension: 75000,
        other_retirement: 10000
      }

      expect(retirementValidation.validateZakatableAmount(values, true)).toBe(true)
    })

    it('should validate when hawl is not met', () => {
      const values: RetirementValues = {
        traditional_401k: 100000,
        roth_401k: 50000,
        traditional_ira: 25000,
        roth_ira: 30000,
        pension: 75000,
        other_retirement: 10000
      }

      expect(retirementValidation.validateZakatableAmount(values, false)).toBe(true)
    })
  })
}) 