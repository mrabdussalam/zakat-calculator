import {
  validateInitialState,
  validateValueTypes,
  validateCalculations,
  validateValuePropagation
} from '../store'
import { ZakatState, CashValues, MetalsValues, StockValues } from '@/store/types'
import '@testing-library/jest-dom'

describe('Store Validation Tests', () => {
  // Mock console.error to prevent test output noise
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('validateInitialState', () => {
    it('should return true for valid initial state', () => {
      const validState: Partial<ZakatState> = {
        cashValues: {
          cash_on_hand: 0,
          checking_account: 0,
          savings_account: 0,
          digital_wallets: 0,
          foreign_currency: 0
        },
        metalsValues: {
          gold_regular: 0,
          gold_regular_purity: '24K',
          gold_occasional: 0,
          gold_occasional_purity: '24K',
          gold_investment: 0,
          gold_investment_purity: '24K',
          silver_regular: 0,
          silver_occasional: 0,
          silver_investment: 0
        },
        stockValues: {
          activeStocks: [],
          active_shares: 0,
          active_price_per_share: 0,
          passive_shares: 0,
          company_cash: 0,
          company_receivables: 0,
          company_inventory: 0,
          total_shares_issued: 0,
          total_dividend_earnings: 0,
          fund_value: 0,
          is_passive_fund: false
        },
        metalPrices: { gold: 0, silver: 0, lastUpdated: new Date(), isCache: false },
        stockPrices: { currentMarketPrice: 0, lastUpdated: new Date() },
        cashHawlMet: true,
        metalsHawlMet: true,
        stockHawlMet: true,
        realEstateHawlMet: true
      }

      expect(validateInitialState(validState)).toBe(true)
      expect(console.error).not.toHaveBeenCalled()
    })

    it('should return false when required slices are missing', () => {
      const invalidState: Partial<ZakatState> = {
        cashValues: {
          cash_on_hand: 0,
          checking_account: 0,
          savings_account: 0,
          digital_wallets: 0,
          foreign_currency: 0
        },
        // Missing metalsValues
        stockValues: {
          activeStocks: [],
          active_shares: 0,
          active_price_per_share: 0,
          passive_shares: 0,
          company_cash: 0,
          company_receivables: 0,
          company_inventory: 0,
          total_shares_issued: 0,
          total_dividend_earnings: 0,
          fund_value: 0,
          is_passive_fund: false
        }
      }

      expect(validateInitialState(invalidState)).toBe(false)
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Missing required slice'))
    })

    it('should return false for invalid hawl status', () => {
      const invalidState: Partial<ZakatState> = {
        cashValues: {},
        metalsValues: {
          gold_regular: 0,
          gold_regular_purity: '24K',
          gold_occasional: 0,
          gold_occasional_purity: '24K',
          gold_investment: 0,
          gold_investment_purity: '24K',
          silver_regular: 0,
          silver_occasional: 0,
          silver_investment: 0
        },
        stockValues: {},
        metalPrices: { gold: 0, silver: 0, lastUpdated: new Date(), isCache: false },
        stockPrices: { currentMarketPrice: 0, lastUpdated: new Date() },
        cashHawlMet: true,
        metalsHawlMet: 'invalid' as any, // Invalid type
        stockHawlMet: true,
        realEstateHawlMet: true
      }

      expect(validateInitialState(invalidState)).toBe(false)
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Invalid hawl status'))
    })
  })

  describe('validateValueTypes', () => {
    it('should validate cash values correctly', () => {
      const validState: Partial<ZakatState> = {
        cashValues: {
          cash_on_hand: 100,
          checking_account: 500,
          savings_account: 1000
        }
      }

      expect(validateValueTypes(validState)).toBe(true)
      expect(console.error).not.toHaveBeenCalled()
    })

    it('should reject negative cash values', () => {
      const invalidState: Partial<ZakatState> = {
        cashValues: {
          cash_on_hand: -100 // Negative value
        }
      }

      expect(validateValueTypes(invalidState)).toBe(false)
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Invalid cash value'))
    })

    it('should validate stock values correctly', () => {
      const validState: Partial<ZakatState> = {
        stockValues: {
          activeStocks: [
            {
              ticker: 'AAPL',
              shares: 10,
              currentPrice: 150,
              marketValue: 1500,
              zakatDue: 37.5
            }
          ]
        }
      }

      expect(validateValueTypes(validState)).toBe(true)
      expect(console.error).not.toHaveBeenCalled()
    })

    it('should reject invalid stock structures', () => {
      const invalidState: Partial<ZakatState> = {
        stockValues: {
          activeStocks: [
            {
              ticker: 'AAPL',
              shares: 'invalid' as any, // Invalid type
              currentPrice: 150
            }
          ]
        }
      }

      expect(validateValueTypes(invalidState)).toBe(false)
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Invalid active stock structure'))
    })
  })

  describe('validateCalculations', () => {
    it('should validate matching totals', () => {
      const validState: Partial<ZakatState> = {
        getTotalStocks: () => 1000,
        getStocksBreakdown: () => ({
          total: 1000,
          zakatable: 1000,
          zakatDue: 25,
          items: {
            stocks: { value: 1000, isZakatable: true }
          }
        })
      }

      expect(validateCalculations(validState)).toBe(true)
      expect(console.error).not.toHaveBeenCalled()
    })

    it('should detect calculation mismatches', () => {
      const invalidState: Partial<ZakatState> = {
        getTotalStocks: () => 1000,
        getStocksBreakdown: () => ({
          total: 900, // Mismatch with getTotalStocks
          zakatable: 900,
          zakatDue: 22.5,
          items: {
            stocks: { value: 900, isZakatable: true }
          }
        })
      }

      expect(validateCalculations(invalidState)).toBe(false)
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('calculations mismatch'))
    })
  })

  describe('validateValuePropagation', () => {
    it('should validate correct value propagation', () => {
      const validState: Partial<ZakatState> = {
        stockHawlMet: true,
        getStocksBreakdown: () => ({
          total: 1000,
          zakatable: 1000,
          zakatDue: 25,
          items: {
            stocks: { value: 1000, isZakatable: true }
          }
        })
      }

      expect(validateValuePropagation(validState)).toBe(true)
      expect(console.error).not.toHaveBeenCalled()
    })

    it('should detect total mismatch with items', () => {
      const invalidState: Partial<ZakatState> = {
        stockHawlMet: true,
        getStocksBreakdown: () => ({
          total: 1000,
          zakatable: 1000,
          zakatDue: 25,
          items: {
            stocks: { value: 900, isZakatable: true } // Sum of items doesn't match total
          }
        })
      }

      expect(validateValuePropagation(invalidState)).toBe(false)
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('breakdown total mismatch'))
    })

    it('should detect zakatable amount mismatch', () => {
      const invalidState: Partial<ZakatState> = {
        stockHawlMet: true,
        getStocksBreakdown: () => ({
          total: 1000,
          zakatable: 1000,
          zakatDue: 25,
          items: {
            stocks: { value: 1000, isZakatable: false } // Item marked as not zakatable but included in zakatable total
          }
        })
      }

      expect(validateValuePropagation(invalidState)).toBe(false)
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('zakatable amount mismatch'))
    })
  })
}) 