import { CryptoValues } from '@/store/types'
import cryptoValidation from '../calculators/cryptoValidation'
import '@testing-library/jest-dom'

describe('Crypto Calculator Validation', () => {
  // Mock console.error to prevent test output noise
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { })
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
      }
    ],
    total_value: 105000,
    zakatable_value: 105000
  }

  describe('Validation', () => {
    it('should pass with valid values', () => {
      expect(cryptoValidation.customValidation?.(validValues, true)).toBe(true)
    })

    it('should reject negative values', () => {
      const negativeValues: CryptoValues = {
        coins: [
          {
            symbol: 'BTC',
            quantity: 1.5,
            currentPrice: 50000,
            marketValue: 75000,
            zakatDue: 1875
          }
        ],
        total_value: -1000,
        zakatable_value: 105000
      }

      expect(cryptoValidation.customValidation?.(negativeValues, true)).toBe(false)
    })

    it('should reject non-numeric values', () => {
      const invalidValues = {
        coins: [
          {
            symbol: 'BTC',
            quantity: 1.5,
            currentPrice: 50000,
            marketValue: 75000,
            zakatDue: 1875
          }
        ],
        total_value: "1000" as any,
        zakatable_value: 105000
      } as CryptoValues

      expect(cryptoValidation.customValidation?.(invalidValues, true)).toBe(false)
    })

    it('should reject invalid coin structure', () => {
      const invalidStructure = {
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
      } as CryptoValues

      expect(cryptoValidation.customValidation?.(invalidStructure, true)).toBe(false)
    })
  })

  describe('Required Fields', () => {
    it('should include all required crypto fields', () => {
      const requiredFields = ['coins', 'total_value', 'zakatable_value']
      expect(cryptoValidation.requiredFields).toEqual(expect.arrayContaining(requiredFields))
    })
  })
}) 