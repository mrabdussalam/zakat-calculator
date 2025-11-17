import { createCalculatorValidation } from '../templates/calculatorValidation'
import { CashValues } from '@/store/types'
import '@testing-library/jest-dom'
import { useZakatStore } from '@/store/zakatStore'
import { createFreshStore } from './utils'

describe('Cash Calculator Validation', () => {
  // Mock console.error to prevent test output noise
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const cashValidation = createCalculatorValidation<CashValues>({
    name: 'Cash Calculator',
    requiredFields: [
      'cash_on_hand',
      'checking_account',
      'savings_account',
      'digital_wallets',
      'foreign_currency'
    ],
    numericalFields: [
      'cash_on_hand',
      'checking_account',
      'savings_account',
      'digital_wallets',
      'foreign_currency'
    ]
  })

  describe('validateValues', () => {
    it('should validate valid cash values', () => {
      const validValues: CashValues = {
        cash_on_hand: 1000,
        checking_account: 5000,
        savings_account: 10000,
        digital_wallets: 500,
        foreign_currency: 2000,
        foreign_currency_entries: []
      }

      expect(cashValidation.validateValues(validValues)).toBe(true)
    })

    it('should validate zero values', () => {
      const zeroValues: CashValues = {
        cash_on_hand: 0,
        checking_account: 0,
        savings_account: 0,
        digital_wallets: 0,
        foreign_currency: 0,
        foreign_currency_entries: []
      }

      expect(cashValidation.validateValues(zeroValues)).toBe(true)
    })

    it('should reject negative values', () => {
      const negativeValues: CashValues = {
        cash_on_hand: -100,
        checking_account: 5000,
        savings_account: 10000,
        digital_wallets: 500,
        foreign_currency: 2000,
        foreign_currency_entries: []
      }

      expect(cashValidation.validateValues(negativeValues)).toBe(false)
    })

    it('should reject missing required fields', () => {
      const missingFields: Partial<CashValues> = {
        cash_on_hand: 1000,
        checking_account: 5000
        // Missing other required fields
      }

      expect(cashValidation.validateValues(missingFields as CashValues)).toBe(false)
    })

    it('should reject non-numeric values', () => {
      const invalidTypes = {
        cash_on_hand: '1000' as any,
        checking_account: 5000,
        savings_account: 10000,
        digital_wallets: 500,
        foreign_currency: 2000,
        foreign_currency_entries: []
      }

      expect(cashValidation.validateValues(invalidTypes)).toBe(false)
    })
  })

  describe('validateCalculations', () => {
    it('should validate matching totals', () => {
      const total = 18500
      const breakdown = {
        items: {
          cash_on_hand: { value: 1000 },
          checking_account: { value: 5000 },
          savings_account: { value: 10000 },
          digital_wallets: { value: 500 },
          foreign_currency: { value: 2000 }
        }
      }

      expect(cashValidation.validateCalculations(total, breakdown)).toBe(true)
    })

    it('should reject mismatched totals', () => {
      const total = 20000 // Incorrect total
      const breakdown = {
        items: {
          cash_on_hand: { value: 1000 },
          checking_account: { value: 5000 },
          savings_account: { value: 10000 },
          digital_wallets: { value: 500 },
          foreign_currency: { value: 2000 }
        }
      }

      expect(cashValidation.validateCalculations(total, breakdown)).toBe(false)
    })

    it('should handle floating point values correctly', () => {
      const total = 1000.50
      const breakdown = {
        items: {
          cash_on_hand: { value: 100.25 },
          checking_account: { value: 200.10 },
          savings_account: { value: 500.05 },
          digital_wallets: { value: 100.05 },
          foreign_currency: { value: 100.05 }
        }
      }

      expect(cashValidation.validateCalculations(total, breakdown)).toBe(true)
    })
  })

  describe('validateZakatableAmount', () => {
    it('should validate when hawl is met', () => {
      const values: CashValues = {
        cash_on_hand: 1000,
        checking_account: 5000,
        savings_account: 10000,
        digital_wallets: 500,
        foreign_currency: 2000,
        foreign_currency_entries: []
      }

      expect(cashValidation.validateZakatableAmount(values, true)).toBe(true)
    })

    it('should validate when hawl is not met', () => {
      const values: CashValues = {
        cash_on_hand: 1000,
        checking_account: 5000,
        savings_account: 10000,
        digital_wallets: 500,
        foreign_currency: 2000,
        foreign_currency_entries: []
      }

      expect(cashValidation.validateZakatableAmount(values, false)).toBe(true)
    })
  })
})

describe('Cash Calculator Edge Cases', () => {
  test('handles extremely large numbers', () => {
    const store = createFreshStore()
    store.setCashValue('cash_on_hand', 999999999.99)
    expect(store.getTotalCash()).toBe(999999999.99)
  })

  test('handles decimal precision', () => {
    const store = createFreshStore()
    store.setCashValue('checking_account', 100.555) // Should round to 100.56
    expect(store.getTotalCash()).toBeCloseTo(100.56, 2)
  })

  test('prevents negative values', () => {
    const store = createFreshStore()
    store.setCashValue('savings_account', -100)
    expect(store.getTotalCash()).toBe(0)
  })

  test('handles multiple small decimal values', () => {
    const store = createFreshStore()
    store.setCashValue('digital_wallets', 0.1)
    store.setCashValue('foreign_currency', 0.2)
    expect(store.getTotalCash()).toBeCloseTo(0.3, 2)
  })
})

describe('Cash Calculator Hawl Status', () => {
  test('respects hawl status in zakatable calculations', () => {
    const store = createFreshStore()
    store.setCashValue('cash_on_hand', 1000)

    // When hawl is not met
    store.setCashHawlMet(false)
    expect(store.getTotalZakatableCash()).toBe(0)

    // When hawl is met
    store.setCashHawlMet(true)
    expect(store.getTotalZakatableCash()).toBe(1000)
  })

  test('persists hawl status through updates', () => {
    const store = createFreshStore()
    store.setCashHawlMet(true)
    store.setCashValue('checking_account', 500)
    expect(store.cashHawlMet).toBe(true)
    expect(store.getTotalZakatableCash()).toBe(500)
  })

  test('calculates zakat due correctly based on hawl', () => {
    const store = createFreshStore()
    store.setCashValue('savings_account', 1000)

    // With hawl met
    store.setCashHawlMet(true)
    expect(store.getCashBreakdown().zakatDue).toBe(25) // 2.5% of 1000

    // Without hawl
    store.setCashHawlMet(false)
    expect(store.getCashBreakdown().zakatDue).toBe(0)
  })
})

describe('Cash Calculator Reset', () => {
  test('resets all values to initial state', () => {
    const store = createFreshStore()

    // Set some values
    store.setCashValue('cash_on_hand', 1000)
    store.setCashValue('checking_account', 2000)
    store.setCashHawlMet(true)

    // Reset
    store.resetCashValues()

    // Verify all values are reset
    expect(store.getTotalCash()).toBe(0)
    expect(store.getTotalZakatableCash()).toBe(0)
    expect(store.getCashBreakdown().zakatDue).toBe(0)

    // Verify individual values
    const { cashValues } = store
    Object.values(cashValues).forEach(value => {
      expect(value).toBe(0)
    })
  })

  test('maintains hawl status after reset', () => {
    const store = createFreshStore()
    store.setCashHawlMet(true)
    store.resetCashValues()
    expect(store.cashHawlMet).toBe(true)
  })
  
  test('resets foreign currency entries correctly', () => {
    const store = createFreshStore()

    // Add foreign currency entries
    store.setCashValue('foreign_currency_entries', [
      { amount: 100, currency: 'EUR' },
      { amount: 200, currency: 'GBP' }
    ])

    // Get updated state after setting value (store is a snapshot)
    const updatedStore = useZakatStore.getState()

    // Verify entries were added
    expect(Array.isArray(updatedStore.cashValues.foreign_currency_entries)).toBe(true)
    expect(updatedStore.cashValues.foreign_currency_entries?.length).toBe(2)

    // Reset the store
    updatedStore.resetCashValues()

    // Get final state after reset
    const finalStore = useZakatStore.getState()

    // Verify foreign_currency_entries is reset to empty array
    expect(Array.isArray(finalStore.cashValues.foreign_currency_entries)).toBe(true)
    expect(finalStore.cashValues.foreign_currency_entries?.length || 0).toBe(0)
  })
})

describe('Cash Calculator Currency Handling', () => {
  test('handles foreign currency conversion', () => {
    const store = createFreshStore()
    store.setCashValue('foreign_currency', 100) // 100 in base currency
    expect(store.getTotalCash()).toBe(100)
  })

  test('handles multiple currency entries', () => {
    const store = createFreshStore()
    store.setCashValue('foreign_currency', 100)
    store.setCashValue('cash_on_hand', 200)
    expect(store.getTotalCash()).toBe(300)
  })

  test('maintains precision in calculations', () => {
    const store = createFreshStore()
    store.setCashValue('foreign_currency', 33.33)
    store.setCashValue('cash_on_hand', 66.67)
    expect(store.getTotalCash()).toBeCloseTo(100, 2)
  })

  test('calculates zakat on total converted amount', () => {
    const store = createFreshStore()
    store.setCashValue('foreign_currency', 1000)
    store.setCashHawlMet(true)
    expect(store.getCashBreakdown().zakatDue).toBe(25) // 2.5% of 1000
  })
})

describe('Cash Calculator Validation Requirements', () => {
  test('validates required fields', () => {
    const store = createFreshStore()
    const breakdown = store.getCashBreakdown()
    
    // Check all required fields exist
    const requiredFields = [
      'cash_on_hand',
      'checking_account',
      'savings_account',
      'digital_wallets',
      'foreign_currency'
    ]
    
    requiredFields.forEach(field => {
      expect(breakdown.items).toHaveProperty(field)
    })
  })

  test('validates numerical fields', () => {
    const store = createFreshStore()
    store.setCashValue('cash_on_hand', '1000' as any) // Type coercion should handle this
    expect(store.getTotalCash()).toBe(1000)
  })

  test('validates calculation accuracy', () => {
    const store = createFreshStore()
    store.setCashValue('checking_account', 1000)
    store.setCashValue('savings_account', 2000)
    
    const breakdown = store.getCashBreakdown()
    expect(breakdown.total).toBe(3000)
    expect(breakdown.zakatDue).toBe(75) // 2.5% of 3000
  })

  test('validates type constraints', () => {
    const store = createFreshStore()
    
    // Test with invalid types
    const invalidInputs: Array<[string, any]> = [
      ['checking_account', 'invalid'],
      ['savings_account', {}],
      ['digital_wallets', []],
      ['foreign_currency', null]
    ]
    
    invalidInputs.forEach(([field, value]) => {
      store.setCashValue(field as keyof CashValues, value)
      expect(store.getTotalCash()).toBe(0)
    })
  })
})

describe('Cash Calculator Advanced Validation', () => {
  test('handles concurrent updates correctly', () => {
    const store = createFreshStore()
    
    // Simulate concurrent updates
    Promise.all([
      store.setCashValue('cash_on_hand', 100),
      store.setCashValue('checking_account', 200),
      store.setCashValue('savings_account', 300)
    ]).then(() => {
      expect(store.getTotalCash()).toBe(600)
    })
  })

  test('validates calculation precision', () => {
    const store = createFreshStore()
    
    // Test with many decimal places
    store.setCashValue('cash_on_hand', 100.12345)
    store.setCashValue('checking_account', 200.98765)
    
    // Should maintain 2 decimal precision
    expect(store.getTotalCash()).toBeCloseTo(301.11, 2)
  })

  test('handles boundary values', () => {
    const store = createFreshStore()
    
    // Test with very small numbers
    store.setCashValue('digital_wallets', 0.000001)
    expect(store.getTotalCash()).toBeCloseTo(0, 2)
    
    // Test with very large numbers
    store.setCashValue('foreign_currency', 1e9)
    expect(store.getTotalCash()).toBe(1e9)
  })

  test('validates combined calculations', () => {
    const store = createFreshStore()

    // Set multiple values
    store.setCashValue('cash_on_hand', 1234.56)
    store.setCashValue('checking_account', 7890.12)
    store.setCashValue('savings_account', 3456.78)
    store.setCashHawlMet(true)

    const breakdown = store.getCashBreakdown()

    // Verify total
    expect(breakdown.total).toBeCloseTo(12581.46, 2)

    // Verify zakat calculation
    expect(breakdown.zakatDue).toBeCloseTo(314.54, 2) // 2.5% of total

    // Verify individual items
    expect(breakdown.items.cash_on_hand.value).toBeCloseTo(1234.56, 2)
    expect(breakdown.items.checking_account.value).toBeCloseTo(7890.12, 2)
    expect(breakdown.items.savings_account.value).toBeCloseTo(3456.78, 2)
  })
})

describe('Cash Calculator Error Handling', () => {
  test('handles invalid calculations gracefully', () => {
    const store = createFreshStore()
    
    // Test with invalid math expressions
    store.setCashValue('cash_on_hand', NaN)
    expect(store.getTotalCash()).toBe(0)
    
    store.setCashValue('checking_account', Infinity)
    expect(store.getTotalCash()).toBe(0)
  })

  test('maintains state consistency during errors', () => {
    const store = createFreshStore()
    
    // Set valid initial state
    store.setCashValue('cash_on_hand', 1000)
    
    // Attempt invalid updates
    store.setCashValue('checking_account', NaN)
    store.setCashValue('savings_account', -500)
    
    // Verify valid state maintained
    expect(store.getTotalCash()).toBe(1000)
  })
})

describe('Cash Calculator Currency Conversion', () => {
  test('converts foreign currencies correctly', () => {
    const store = createFreshStore()
    
    // Mock exchange rates
    const mockRates = {
      USD: 1,
      EUR: 1.1,  // 1 EUR = 1.1 USD
      GBP: 1.3,  // 1 GBP = 1.3 USD
      JPY: 0.009 // 1 JPY = 0.009 USD
    }
    
    // Test EUR conversion
    store.setCashValue('foreign_currency', 100 * mockRates.EUR) // 100 EUR
    expect(store.getTotalCash()).toBeCloseTo(110, 2) // 110 USD
    
    // Reset
    store.resetCashValues()
    
    // Test GBP conversion
    store.setCashValue('foreign_currency', 100 * mockRates.GBP) // 100 GBP
    expect(store.getTotalCash()).toBeCloseTo(130, 2) // 130 USD
    
    // Reset
    store.resetCashValues()
    
    // Test JPY conversion
    store.setCashValue('foreign_currency', 10000 * mockRates.JPY) // 10000 JPY
    expect(store.getTotalCash()).toBeCloseTo(90, 2) // 90 USD
  })

  test('handles multiple foreign currencies', () => {
    const store = createFreshStore()

    // Mock having multiple foreign currency holdings
    const holdings = [
      { amount: 100, rate: 1.1 },  // EUR
      { amount: 200, rate: 1.3 },  // GBP
      { amount: 10000, rate: 0.009 } // JPY
    ]

    // Calculate expected total in USD
    const expectedTotal = holdings.reduce((total, { amount, rate }) => {
      return total + (amount * rate)
    }, 0)

    // Set the total converted amount in foreign_currency field
    // Note: setCashValue replaces values, doesn't accumulate
    store.setCashValue('foreign_currency', expectedTotal)

    expect(store.getTotalCash()).toBeCloseTo(expectedTotal, 2)
  })

  test('handles currency precision edge cases', () => {
    const store = createFreshStore()

    // Test very small currency amounts
    store.setCashValue('foreign_currency', 0.0001) // Tiny amount
    expect(store.getTotalCash()).toBeCloseTo(0, 4)

    // Test large currency amounts with decimals
    store.setCashValue('foreign_currency', 999999.99)
    expect(store.getTotalCash()).toBe(999999.99)

    // Test sum of small amounts (setCashValue replaces, doesn't accumulate)
    const smallAmounts = [0.01, 0.02, 0.03, 0.04, 0.05]
    const totalSmallAmounts = smallAmounts.reduce((sum, amt) => sum + amt, 0)
    store.resetCashValues()
    store.setCashValue('foreign_currency', totalSmallAmounts)
    expect(store.getTotalCash()).toBeCloseTo(0.15, 2)
  })

  test('validates currency calculations with hawl', () => {
    const store = createFreshStore()

    // Add mixed currency holdings
    store.setCashValue('cash_on_hand', 1000) // USD
    store.setCashValue('foreign_currency', 1100) // Converted amount
    store.setCashHawlMet(true)

    const breakdown = store.getCashBreakdown()
    expect(breakdown.total).toBe(2100)
    expect(breakdown.zakatDue).toBe(52.5) // 2.5% of 2100

    // Verify foreign currency is included in zakatable amount
    expect(breakdown.items.foreign_currency.value).toBe(1100)
    expect(breakdown.items.foreign_currency.isZakatable).toBe(true)
  })

  test('handles currency conversion errors', () => {
    const store = createFreshStore()
    
    // Test with invalid conversion rates
    store.setCashValue('foreign_currency', NaN)
    expect(store.getTotalCash()).toBe(0)
    
    // Test with infinity
    store.setCashValue('foreign_currency', Infinity)
    expect(store.getTotalCash()).toBe(0)
    
    // Test with very large numbers that might cause overflow
    store.setCashValue('foreign_currency', Number.MAX_SAFE_INTEGER)
    expect(store.getTotalCash()).toBe(Number.MAX_SAFE_INTEGER)
  })
}) 