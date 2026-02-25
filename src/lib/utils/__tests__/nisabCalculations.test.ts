import { calculateNisabThresholds, validateNisabValues } from '../nisabCalculations'

// Mock CurrencyConversionService
jest.mock('@/lib/services/currencyConversion', () => ({
  CurrencyConversionService: {
    convert: jest.fn((amount: number, from: string, to: string) => {
      // Simple mock: multiply by a known rate for testing
      const rates: Record<string, number> = {
        'USD': 1,
        'EUR': 0.92,
        'GBP': 0.79,
        'INR': 83,
        'PKR': 278,
        'AED': 3.67,
        'SAR': 3.75
      }
      if (from === to) return amount
      const fromRate = rates[from] || 1
      const toRate = rates[to] || 1
      return amount * (toRate / fromRate)
    })
  }
}))

// Mock CacheValidationService
jest.mock('@/lib/services/cacheValidation', () => ({
  CacheValidationService: {
    isFutureTimestamp: jest.fn(() => false),
    getSafeTimestamp: jest.fn(() => Date.now())
  },
  MetalPriceEntry: {}
}))

// Mock currency store
jest.mock('@/lib/services/currency', () => ({
  useCurrencyStore: {
    getState: jest.fn(() => ({
      forceRefreshRates: jest.fn()
    }))
  }
}))

// Suppress console logs during tests
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('calculateNisabThresholds', () => {
  describe('USD direct prices', () => {
    it('should calculate thresholds using 612.36g silver weight', () => {
      const result = calculateNisabThresholds(
        {
          gold: 160.57,
          silver: 2.47,
          currency: 'USD'
        },
        'USD'
      )

      // Gold: 160.57 * 85 = 13648.45
      expect(result.goldThreshold).toBeCloseTo(13648.45, 1)
      // Silver: 2.47 * 612.36 = 1512.53
      expect(result.silverThreshold).toBeCloseTo(1512.53, 0)
      // Nisab should be the lower value (silver)
      expect(result.nisabValue).toBeCloseTo(1512.53, 0)
      expect(result.metalUsed).toBe('silver')
      expect(result.isDirectGoldPrice).toBe(true)
      expect(result.isDirectSilverPrice).toBe(true)
      expect(result.usedFallback).toBe(false)
    })

    it('should use gold nisab weight of 85g', () => {
      const result = calculateNisabThresholds(
        {
          gold: 160,
          silver: 2.5,
          currency: 'USD'
        },
        'USD'
      )

      // Gold: 160 * 85 = 13600
      expect(result.goldThreshold).toBe(13600)
      // Silver: 2.5 * 612.36 = 1530.9
      expect(result.silverThreshold).toBeCloseTo(1530.9, 1)
    })
  })

  describe('fallback path', () => {
    it('should use fallback values when validation fails with zero prices', () => {
      const result = calculateNisabThresholds(
        {
          gold: 0,
          silver: 0,
          currency: 'USD'
        },
        'USD'
      )

      // When prices are zero, thresholds will be zero, which triggers validation failure
      // and returns hardcoded fallback values for USD
      expect(result.usedFallback).toBe(true)
      expect(result.goldThreshold).toBeGreaterThan(0)
      expect(result.silverThreshold).toBeGreaterThan(0)
    })

    it('should return fallback nisab values for USD when validation fails', () => {
      // Use prices that will produce out-of-range thresholds
      const result = calculateNisabThresholds(
        {
          gold: 1, // way too low
          silver: 0.01,
          currency: 'USD'
        },
        'USD'
      )

      // Should have fallen back since 1*85=85 is way below expected range [10000, 18000]
      expect(result.usedFallback).toBe(true)
      expect(result.goldThreshold).toBe(13648)
      expect(result.silverThreshold).toBe(1513)
    })
  })

  describe('currency conversion', () => {
    it('should convert prices from USD to target currency', () => {
      const result = calculateNisabThresholds(
        {
          gold: 160.57,
          silver: 2.47,
          currency: 'USD'
        },
        'EUR'
      )

      // Prices should be converted via mock: amount * (EUR_rate / USD_rate)
      // Gold EUR: 160.57 * 0.92 = 147.72
      // Silver EUR: 2.47 * 0.92 = 2.2724
      // Gold threshold: 147.72 * 85 ≈ 12556.56
      // Silver threshold: 2.2724 * 612.36 ≈ 1392.31
      expect(result.goldThreshold).toBeGreaterThan(0)
      expect(result.silverThreshold).toBeGreaterThan(0)
      expect(result.nisabValue).toBeLessThan(result.goldThreshold)
    })

    it('should use goldUSD/silverUSD when available', () => {
      const result = calculateNisabThresholds(
        {
          gold: 147.72,   // EUR price
          silver: 2.27,  // EUR price
          currency: 'EUR',
          goldUSD: 160.57,
          silverUSD: 2.47
        },
        'USD'
      )

      // Should use goldUSD/silverUSD directly for USD target
      expect(result.goldThreshold).toBeCloseTo(13648.45, 1)
      expect(result.silverThreshold).toBeCloseTo(1512.53, 0)
      expect(result.isDirectGoldPrice).toBe(true)
      expect(result.isDirectSilverPrice).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle same source and target currency', () => {
      const result = calculateNisabThresholds(
        {
          gold: 160.57,
          silver: 2.47,
          currency: 'USD'
        },
        'USD'
      )

      expect(result.isDirectGoldPrice).toBe(true)
      expect(result.isDirectSilverPrice).toBe(true)
    })

    it('should handle currency not in fallback map gracefully', () => {
      const result = calculateNisabThresholds(
        {
          gold: 160.57,
          silver: 2.47,
          currency: 'USD'
        },
        'BDT'
      )

      // Should still produce positive thresholds via conversion
      expect(result.goldThreshold).toBeGreaterThan(0)
      expect(result.silverThreshold).toBeGreaterThan(0)
    })
  })
})

describe('validateNisabValues', () => {
  it('should validate USD thresholds within expected range', () => {
    const result = validateNisabValues(13648, 1513, 'USD')
    expect(result.isValid).toBe(true)
  })

  it('should reject thresholds far outside expected range', () => {
    const result = validateNisabValues(100, 10, 'USD')
    expect(result.isValid).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('should accept unknown currencies as valid', () => {
    const result = validateNisabValues(1, 1, 'XYZ')
    expect(result.isValid).toBe(true)
  })

  it('should validate PKR thresholds within expected range', () => {
    const result = validateNisabValues(3800000, 420000, 'PKR')
    expect(result.isValid).toBe(true)
  })

  it('should reject PKR thresholds outside expected range', () => {
    const result = validateNisabValues(100, 100, 'PKR')
    expect(result.isValid).toBe(false)
  })
})
