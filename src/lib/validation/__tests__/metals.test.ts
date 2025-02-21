import { createCalculatorValidation } from '../templates/calculatorValidation'
import { MetalsValues } from '@/store/types'
import '@testing-library/jest-dom'

describe('Metals Calculator Validation', () => {
  // Mock console.error to prevent test output noise
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const metalsValidation = createCalculatorValidation<MetalsValues>({
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
    ]
  })

  describe('validateValues', () => {
    it('should validate valid metals values', () => {
      const validValues: MetalsValues = {
        gold_regular: 50,
        gold_occasional: 25,
        gold_investment: 100,
        silver_regular: 500,
        silver_occasional: 250,
        silver_investment: 1000
      }

      expect(metalsValidation.validateValues(validValues)).toBe(true)
    })

    it('should validate zero values', () => {
      const zeroValues: MetalsValues = {
        gold_regular: 0,
        gold_occasional: 0,
        gold_investment: 0,
        silver_regular: 0,
        silver_occasional: 0,
        silver_investment: 0
      }

      expect(metalsValidation.validateValues(zeroValues)).toBe(true)
    })

    it('should reject negative values', () => {
      const negativeValues: MetalsValues = {
        gold_regular: -10,
        gold_occasional: 25,
        gold_investment: 100,
        silver_regular: 500,
        silver_occasional: 250,
        silver_investment: 1000
      }

      expect(metalsValidation.validateValues(negativeValues)).toBe(false)
    })

    it('should reject missing required fields', () => {
      const missingFields: Partial<MetalsValues> = {
        gold_regular: 50,
        gold_occasional: 25
        // Missing other required fields
      }

      expect(metalsValidation.validateValues(missingFields as MetalsValues)).toBe(false)
    })

    it('should reject non-numeric values', () => {
      const invalidTypes = {
        gold_regular: '50' as any,
        gold_occasional: 25,
        gold_investment: 100,
        silver_regular: 500,
        silver_occasional: 250,
        silver_investment: 1000
      }

      expect(metalsValidation.validateValues(invalidTypes)).toBe(false)
    })
  })

  describe('validateCalculations', () => {
    it('should validate matching totals', () => {
      const total = 1925 // Total grams
      const breakdown = {
        items: {
          gold_regular: { value: 50, weight: 50 },
          gold_occasional: { value: 25, weight: 25 },
          gold_investment: { value: 100, weight: 100 },
          silver_regular: { value: 500, weight: 500 },
          silver_occasional: { value: 250, weight: 250 },
          silver_investment: { value: 1000, weight: 1000 }
        }
      }

      expect(metalsValidation.validateCalculations(total, breakdown)).toBe(true)
    })

    it('should reject mismatched totals', () => {
      const total = 2000 // Incorrect total
      const breakdown = {
        items: {
          gold_regular: { value: 50, weight: 50 },
          gold_occasional: { value: 25, weight: 25 },
          gold_investment: { value: 100, weight: 100 },
          silver_regular: { value: 500, weight: 500 },
          silver_occasional: { value: 250, weight: 250 },
          silver_investment: { value: 1000, weight: 1000 }
        }
      }

      expect(metalsValidation.validateCalculations(total, breakdown)).toBe(false)
    })

    it('should handle floating point weights correctly', () => {
      const total = 100.50
      const breakdown = {
        items: {
          gold_regular: { value: 20.25, weight: 20.25 },
          gold_occasional: { value: 15.10, weight: 15.10 },
          gold_investment: { value: 25.05, weight: 25.05 },
          silver_regular: { value: 15.05, weight: 15.05 },
          silver_occasional: { value: 10.05, weight: 10.05 },
          silver_investment: { value: 15, weight: 15 }
        }
      }

      expect(metalsValidation.validateCalculations(total, breakdown)).toBe(true)
    })
  })

  describe('validateZakatableAmount', () => {
    it('should validate when hawl is met', () => {
      const values: MetalsValues = {
        gold_regular: 50,
        gold_occasional: 25,
        gold_investment: 100,
        silver_regular: 500,
        silver_occasional: 250,
        silver_investment: 1000
      }

      expect(metalsValidation.validateZakatableAmount(values, true)).toBe(true)
    })

    it('should validate when hawl is not met', () => {
      const values: MetalsValues = {
        gold_regular: 50,
        gold_occasional: 25,
        gold_investment: 100,
        silver_regular: 500,
        silver_occasional: 250,
        silver_investment: 1000
      }

      expect(metalsValidation.validateZakatableAmount(values, false)).toBe(true)
    })
  })
}) 