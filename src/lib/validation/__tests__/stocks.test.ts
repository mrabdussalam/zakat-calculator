import { createCalculatorValidation } from '../templates/calculatorValidation'
import { StockValues } from '@/lib/assets/stocks'
import '@testing-library/jest-dom'
import { Investment, CompanyFinancials } from '@/lib/assets/types'

describe('Stocks Calculator Validation', () => {
  // Mock console.error to prevent test output noise
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const validValues: StockValues = {
    activeStocks: [
      {
        symbol: 'AAPL',
        shares: 100,
        currentPrice: 150,
        marketValue: 15000,
        zakatDue: 375
      }
    ],
    total_dividend_earnings: 1000,
    fund_value: 50000,
    is_passive_fund: false,
    market_value: 15000,
    zakatable_value: 15000,
    passiveInvestments: {
      version: "2.0" as const,
      method: 'quick',
      marketValue: 5000,
      zakatableValue: 1500,
      investments: [{
        id: '1',
        name: 'Test Investment',
        shares: 100,
        pricePerShare: 50,
        marketValue: 5000
      }],
      hawlStatus: {
        isComplete: false,
        startDate: new Date().toISOString()
      },
      displayProperties: {
        currency: 'USD',
        method: '30% Rule',
        totalLabel: 'Total Investments'
      }
    }
  }

  // Use 'any' for the generic since createCalculatorValidation requires Record<string, unknown>
  // but the canonical StockValues has typed properties. The validation logic operates at runtime.
  const stocksValidation = createCalculatorValidation<any>({
    name: 'Stocks Calculator',
    requiredFields: [
      'activeStocks',
      'market_value',
      'zakatable_value'
    ],
    numericalFields: [
      'market_value',
      'zakatable_value'
    ],
    booleanFields: ['is_passive_fund'],
    customValidations: [
      // Validate active stocks array structure
      (values: StockValues) => {
        if (!Array.isArray(values.activeStocks)) {
          console.error('activeStocks must be an array')
          return false
        }
        
        return values.activeStocks.every(stock => {
          if (typeof stock !== 'object') return false
          if (typeof stock.symbol !== 'string') return false
          if (typeof stock.shares !== 'number' || stock.shares < 0) return false
          if (typeof stock.currentPrice !== 'number' || stock.currentPrice < 0) return false
          if (typeof stock.marketValue !== 'number' || stock.marketValue < 0) return false
          if (typeof stock.zakatDue !== 'number' || stock.zakatDue < 0) return false
          return true
        })
      },
      // Validate passive investments structure
      (values: StockValues) => {
        if (!values.passiveInvestments) return true

        const { passiveInvestments } = values
        
        // Validate version
        if (passiveInvestments.version !== '2.0') {
          console.error('Invalid passive investments version')
          return false
        }

        // Validate method
        if (passiveInvestments.method !== 'quick' && passiveInvestments.method !== 'detailed') {
          console.error('Invalid passive investments method')
          return false
        }

        // Validate numerical values
        if (typeof passiveInvestments.marketValue !== 'number' || passiveInvestments.marketValue < 0) {
          console.error('Invalid market value in passive investments')
          return false
        }
        if (typeof passiveInvestments.zakatableValue !== 'number' || passiveInvestments.zakatableValue < 0) {
          console.error('Invalid zakatable value in passive investments')
          return false
        }

        // Validate investments array
        if (!Array.isArray(passiveInvestments.investments)) {
          console.error('Investments must be an array')
          return false
        }

        return passiveInvestments.investments.every(investment => {
          if (typeof investment !== 'object') return false
          if (typeof investment.id !== 'string') return false
          if (typeof investment.name !== 'string') return false
          if (typeof investment.shares !== 'number' || investment.shares < 0) return false
          if (typeof investment.pricePerShare !== 'number' || investment.pricePerShare < 0) return false
          if (typeof investment.marketValue !== 'number' || investment.marketValue < 0) return false
          return true
        })
      }
    ]
  })

  describe('validateValues', () => {
    it('should validate valid stock values', () => {
      expect(stocksValidation.validateValues(validValues)).toBe(true)
    })

    it('should validate zero values', () => {
      const zeroValues: StockValues = {
        activeStocks: [],
        total_dividend_earnings: 0,
        fund_value: 0,
        is_passive_fund: false,
        market_value: 0,
        zakatable_value: 0
      }

      expect(stocksValidation.validateValues(zeroValues)).toBe(true)
    })

    it('should reject negative values', () => {
      const negativeValues: StockValues = {
        activeStocks: [
          {
            symbol: 'AAPL',
            shares: -100, // Negative value
            currentPrice: 150,
            marketValue: 15000,
            zakatDue: 375
          }
        ],
        total_dividend_earnings: 1000,
        fund_value: 50000,
        is_passive_fund: false,
        market_value: 15000,
        zakatable_value: 15000
      }

      expect(stocksValidation.validateValues(negativeValues)).toBe(false)
    })

    it('should reject missing required fields', () => {
      const missingFields: Partial<StockValues> = {
        activeStocks: []
        // Missing market_value, zakatable_value
      }

      expect(stocksValidation.validateValues(missingFields as StockValues)).toBe(false)
    })

    it('should reject invalid active stocks structure', () => {
      const invalidStructure: StockValues = {
        activeStocks: [
          {
            symbol: 'AAPL',
            shares: 100,
            currentPrice: 150
            // Missing marketValue and zakatDue
          } as any
        ],
        total_dividend_earnings: 1000,
        fund_value: 50000,
        is_passive_fund: false,
        market_value: 15000,
        zakatable_value: 15000
      }

      expect(stocksValidation.validateValues(invalidStructure)).toBe(false)
    })
  })

  describe('validateCalculations', () => {
    it('should validate matching totals', () => {
      const total = 101000 // Total value
      const breakdown = {
        items: {
          active_trading: { value: 15000 },
          passive_investments: { value: 35000 },
          dividends: { value: 1000 },
          investment_funds: { value: 50000 }
        }
      }

      expect(stocksValidation.validateCalculations(total, breakdown)).toBe(true)
    })

    it('should reject mismatched totals', () => {
      const total = 110000 // Incorrect total
      const breakdown = {
        items: {
          active_trading: { value: 15000 },
          passive_investments: { value: 35000 },
          dividends: { value: 1000 },
          investment_funds: { value: 50000 }
        }
      }

      expect(stocksValidation.validateCalculations(total, breakdown)).toBe(false)
    })

    it('should handle floating point values correctly', () => {
      const total = 1000.50
      const breakdown = {
        items: {
          active_trading: { value: 250.25 },
          passive_investments: { value: 350.10 },
          dividends: { value: 150.10 },
          investment_funds: { value: 250.05 }
        }
      }

      expect(stocksValidation.validateCalculations(total, breakdown)).toBe(true)
    })
  })

  describe('validateZakatableAmount', () => {
    it('should validate when hawl is met', () => {
      expect(stocksValidation.validateZakatableAmount(validValues, true)).toBe(true)
    })

    it('should validate when hawl is not met', () => {
      expect(stocksValidation.validateZakatableAmount(validValues, false)).toBe(true)
    })
  })

  describe('Passive Investments Validation', () => {
    it('should validate valid passive investment state', () => {
      expect(stocksValidation.validateValues({
        ...validValues,
        passiveInvestments: {
          version: "2.0" as const,
          method: 'quick' as const,
          marketValue: 5000,
          zakatableValue: 1500,
          investments: [{
            id: '1',
            name: 'Test Investment',
            shares: 100,
            pricePerShare: 50,
            marketValue: 5000
          }],
          hawlStatus: {
            isComplete: false,
            startDate: new Date().toISOString()
          },
          displayProperties: {
            currency: 'USD',
            method: '30% Rule',
            totalLabel: 'Total Investments'
          }
        }
      })).toBe(true)
    })

    it('should validate detailed method company data', () => {
      expect(stocksValidation.validateValues({
        ...validValues,
        passiveInvestments: {
          version: "2.0",
          method: 'detailed' as const,
          marketValue: 35000,
          zakatableValue: 35000,
          investments: [],
          companyData: {
            cash: 10000,
            receivables: 5000,
            inventory: 20000,
            totalShares: 1000,
            yourShares: 100
          },
          hawlStatus: {
            isComplete: false,
            startDate: new Date().toISOString()
          },
          displayProperties: {
            currency: 'USD',
            method: 'CRI Method',
            totalLabel: 'Total Company Assets'
          }
        } as any
      })).toBe(true)
    })

    it('should reject invalid investment array items', () => {
      expect(stocksValidation.validateValues({
        ...validValues,
        passiveInvestments: {
          version: "2.0" as const,
          method: 'quick' as const,
          marketValue: 5000,
          zakatableValue: 1500,
          investments: [{
            id: '1',
            name: 'Test Investment',
            shares: -100, // Invalid negative value
            pricePerShare: 50,
            marketValue: 5000
          }],
          hawlStatus: {
            isComplete: false,
            startDate: new Date().toISOString()
          },
          displayProperties: {
            currency: 'USD',
            method: '30% Rule',
            totalLabel: 'Total Investments'
          }
        }
      })).toBe(false)
    })

    it('should validate zakatable calculations for quick method', () => {
      expect(stocksValidation.validateZakatableAmount({
        ...validValues,
        passiveInvestments: {
          version: "2.0" as const,
          method: 'quick' as const,
          marketValue: 5000,
          zakatableValue: 1500, // 30% of market value
          investments: [{
            id: '1',
            name: 'Test Investment',
            shares: 100,
            pricePerShare: 50,
            marketValue: 5000
          }],
          hawlStatus: {
            isComplete: false,
            startDate: new Date().toISOString()
          },
          displayProperties: {
            currency: 'USD',
            method: '30% Rule',
            totalLabel: 'Total Investments'
          }
        }
      }, true)).toBe(true)
    })

    it('should validate zakatable calculations for detailed method', () => {
      expect(stocksValidation.validateZakatableAmount({
        ...validValues,
        passiveInvestments: {
          version: "2.0",
          method: 'detailed' as const,
          marketValue: 35000,
          zakatableValue: 35000, // Full value of liquid assets
          investments: [],
          companyData: {
            cash: 10000,
            receivables: 5000,
            inventory: 20000,
            totalShares: 1000,
            yourShares: 100
          },
          hawlStatus: {
            isComplete: false,
            startDate: new Date().toISOString()
          },
          displayProperties: {
            currency: 'USD',
            method: 'CRI Method',
            totalLabel: 'Total Company Assets'
          }
        } as any
      }, true)).toBe(true)
    })

    // Add test for display properties validation
    it('should validate with empty investments array', () => {
      expect(stocksValidation.validateValues({
        ...validValues,
        passiveInvestments: {
          version: "2.0" as const,
          method: 'quick' as const,
          marketValue: 0,
          zakatableValue: 0,
          investments: [],
          hawlStatus: {
            isComplete: false,
            startDate: new Date().toISOString()
          },
          displayProperties: {
            currency: 'USD',
            method: '30% Rule',
            totalLabel: 'Total Investments'
          }
        }
      })).toBe(true)
    })
  })

  describe('Reset Functionality', () => {
    it('should validate reset to initial state', () => {
      const initialState: StockValues = {
        activeStocks: [],
        total_dividend_earnings: 0,
        fund_value: 0,
        is_passive_fund: false,
        market_value: 0,
        zakatable_value: 0,
        passiveInvestments: {
          version: "2.0" as const,
          method: 'quick' as const,
          marketValue: 0,
          zakatableValue: 0,
          investments: [],
          hawlStatus: {
            isComplete: false,
            startDate: new Date().toISOString()
          },
          displayProperties: {
            currency: 'USD',
            method: '30% Rule',
            totalLabel: 'Total Investments'
          }
        }
      }

      expect(stocksValidation.validateValues(initialState)).toBe(true)
    })
  })

  describe('UI State Validation', () => {
    it('should validate currency formatting', () => {
      const state: StockValues = {
        ...validValues,
        passiveInvestments: {
          ...validValues.passiveInvestments!,
          displayProperties: {
            currency: 'USD',
            method: '30% Rule',
            totalLabel: 'Total Investments'
          }
        }
      }

      expect(stocksValidation.validateValues(state)).toBe(true)
    })

    it('should validate display information', () => {
      const state: StockValues = {
        ...validValues,
        passiveInvestments: {
          ...validValues.passiveInvestments!,
          displayProperties: {
            currency: 'USD',
            method: '30% Rule',
            totalLabel: 'Total Investments'
          }
        }
      }

      expect(stocksValidation.validateValues(state)).toBe(true)
    })
  })

  describe('Data Persistence', () => {
    it('should validate state hydration', () => {
      const hydratedState: StockValues = {
        ...validValues,
        passiveInvestments: {
          ...validValues.passiveInvestments!,
          version: "2.0" as const,
          hawlStatus: {
            isComplete: true,
            startDate: new Date().toISOString()
          }
        }
      }

      expect(stocksValidation.validateValues(hydratedState)).toBe(true)
    })

    it('should validate state migration', () => {
      const oldState = {
        ...validValues,
        passiveInvestments: undefined
      }

      const migratedState: StockValues = {
        ...oldState,
        passiveInvestments: {
          version: "2.0" as const,
          method: 'quick' as const,
          marketValue: oldState.fund_value || 0,
          zakatableValue: (oldState.fund_value || 0) * 0.3,
          investments: [],
          hawlStatus: {
            isComplete: false,
            startDate: new Date().toISOString()
          },
          displayProperties: {
            currency: 'USD',
            method: '30% Rule',
            totalLabel: 'Total Investments'
          }
        }
      }

      expect(stocksValidation.validateValues(migratedState)).toBe(true)
    })
  })
}) 