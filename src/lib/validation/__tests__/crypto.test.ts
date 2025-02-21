import { createCalculatorValidation } from '../templates/calculatorValidation'
import { CryptoValues } from '@/store/types'
import '@testing-library/jest-dom'

describe('Crypto Calculator Validation', () => {
  // Mock console.error to prevent test output noise
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const validValues: CryptoValues = {
    coins: [
      {
        symbol: 'BTC',
        quantity: 1.5,
        currentPrice: 50000,
        marketValue: 75000,
        zakatDue: 1875
      },
      {
        symbol: 'ETH',
        quantity: 10,
        currentPrice: 3000,
        marketValue: 30000,
        zakatDue: 750
      }
    ],
    total_value: 105000,
    zakatable_value: 105000
  }

  const cryptoValidation = createCalculatorValidation<CryptoValues>({
    name: 'Crypto Calculator',
    requiredFields: ['coins', 'total_value', 'zakatable_value'],
    numericalFields: ['total_value', 'zakatable_value'],
    customValidations: [
      // Validate coins array structure
      (values: CryptoValues) => {
        if (!Array.isArray(values.coins)) {
          console.error('coins must be an array')
          return false
        }
        
        return values.coins.every(coin => {
          if (typeof coin !== 'object') return false
          if (typeof coin.symbol !== 'string') return false
          if (typeof coin.quantity !== 'number' || coin.quantity < 0) return false
          if (typeof coin.currentPrice !== 'number' || coin.currentPrice < 0) return false
          if (typeof coin.marketValue !== 'number' || coin.marketValue < 0) return false
          if (typeof coin.zakatDue !== 'number' || coin.zakatDue < 0) return false
          return true
        })
      }
    ]
  })

  describe('validateValues', () => {
    it('should validate valid crypto values', () => {
      expect(cryptoValidation.validateValues(validValues)).toBe(true)
    })

    it('should validate zero values', () => {
      const zeroValues: CryptoValues = {
        coins: [],
        total_value: 0,
        zakatable_value: 0
      }

      expect(cryptoValidation.validateValues(zeroValues)).toBe(true)
    })

    it('should reject negative values', () => {
      const negativeValues: CryptoValues = {
        coins: [
          {
            symbol: 'BTC',
            quantity: -1.5, // Negative value
            currentPrice: 50000,
            marketValue: 75000,
            zakatDue: 1875
          }
        ],
        total_value: 75000,
        zakatable_value: 75000
      }

      expect(cryptoValidation.validateValues(negativeValues)).toBe(false)
    })

    it('should reject missing required fields', () => {
      const missingFields: Partial<CryptoValues> = {
        coins: []
        // Missing total_value and zakatable_value
      }

      expect(cryptoValidation.validateValues(missingFields as CryptoValues)).toBe(false)
    })

    it('should reject invalid coin structure', () => {
      const invalidStructure: CryptoValues = {
        coins: [
          {
            symbol: 'BTC',
            quantity: 1.5,
            currentPrice: 50000
            // Missing marketValue and zakatDue
          } as any
        ],
        total_value: 75000,
        zakatable_value: 75000
      }

      expect(cryptoValidation.validateValues(invalidStructure)).toBe(false)
    })
  })

  describe('validateCalculations', () => {
    it('should validate matching totals', () => {
      const total = 105000 // Total value
      const breakdown = {
        items: {
          btc: { value: 75000 },
          eth: { value: 30000 }
        }
      }

      expect(cryptoValidation.validateCalculations(total, breakdown)).toBe(true)
    })

    it('should reject mismatched totals', () => {
      const total = 110000 // Incorrect total
      const breakdown = {
        items: {
          btc: { value: 75000 },
          eth: { value: 30000 }
        }
      }

      expect(cryptoValidation.validateCalculations(total, breakdown)).toBe(false)
    })

    it('should handle floating point values correctly', () => {
      const total = 1000.50
      const breakdown = {
        items: {
          btc: { value: 600.25 },
          eth: { value: 400.25 }
        }
      }

      expect(cryptoValidation.validateCalculations(total, breakdown)).toBe(true)
    })
  })

  describe('validateZakatableAmount', () => {
    it('should validate when hawl is met', () => {
      expect(cryptoValidation.validateZakatableAmount(validValues, true)).toBe(true)
    })

    it('should validate when hawl is not met', () => {
      expect(cryptoValidation.validateZakatableAmount(validValues, false)).toBe(true)
    })

    it('should validate with empty coins array', () => {
      const emptyValues: CryptoValues = {
        coins: [],
        total_value: 0,
        zakatable_value: 0
      }

      expect(cryptoValidation.validateZakatableAmount(emptyValues, true)).toBe(true)
    })
  })
}) 