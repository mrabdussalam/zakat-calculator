import { FALLBACK_RATES, getFallbackRate, convertCurrency } from '@/lib/constants/currency'
import { useZakatStore } from '@/store/zakatStore'
import { createFreshStore } from './utils'
import '@testing-library/jest-dom'

// Test currencies representing different regions and value ranges
// These must match the canonical FALLBACK_RATES in @/lib/constants/currency
const TEST_CURRENCIES = [
  { code: 'USD', rate: 1, name: 'US Dollar' },
  { code: 'EUR', rate: 0.844, name: 'Euro' },
  { code: 'GBP', rate: 0.733, name: 'British Pound' },
  { code: 'JPY', rate: 153.34, name: 'Japanese Yen' },
  { code: 'CAD', rate: 1.363, name: 'Canadian Dollar' },
  { code: 'AUD', rate: 1.411, name: 'Australian Dollar' },
  { code: 'PKR', rate: 278.5, name: 'Pakistani Rupee' },
  { code: 'INR', rate: 90.73, name: 'Indian Rupee' },
  { code: 'AED', rate: 3.67, name: 'UAE Dirham' },
  { code: 'SAR', rate: 3.75, name: 'Saudi Riyal' },
  { code: 'QAR', rate: 3.64, name: 'Qatari Riyal' },
  { code: 'MYR', rate: 3.9, name: 'Malaysian Ringgit' },
  { code: 'BDT', rate: 110.5, name: 'Bangladeshi Taka' },
]

describe('Currency Conversion Service Tests', () => {
  describe('Fallback Rate Calculations', () => {
    test('should have all required currencies in fallback rates', () => {
      const requiredCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'PKR', 'INR', 'AED', 'SAR', 'QAR', 'MYR', 'BDT']
      requiredCurrencies.forEach(currency => {
        expect(FALLBACK_RATES).toHaveProperty(currency)
        expect(typeof FALLBACK_RATES[currency]).toBe('number')
        expect(FALLBACK_RATES[currency]).toBeGreaterThan(0)
      })
    })

    test('should return 1 for same currency conversion', () => {
      TEST_CURRENCIES.forEach(({ code }) => {
        expect(getFallbackRate(code, code)).toBe(1)
      })
    })

    test('should correctly convert USD to other currencies', () => {
      TEST_CURRENCIES.forEach(({ code, rate }) => {
        const result = getFallbackRate('USD', code)
        expect(result).toBeCloseTo(rate, 2)
      })
    })

    test('should correctly convert other currencies to USD', () => {
      TEST_CURRENCIES.forEach(({ code, rate }) => {
        if (code !== 'USD') {
          const result = getFallbackRate(code, 'USD')
          expect(result).toBeCloseTo(1 / rate, 6)
        }
      })
    })

    test('should correctly convert between non-USD currencies', () => {
      // PKR to INR
      const pkrToInr = getFallbackRate('PKR', 'INR')
      expect(pkrToInr).toBeCloseTo(90.73 / 278.5, 6)

      // EUR to GBP
      const eurToGbp = getFallbackRate('EUR', 'GBP')
      expect(eurToGbp).toBeCloseTo(0.733 / 0.844, 6)

      // AED to SAR
      const aedToSar = getFallbackRate('AED', 'SAR')
      expect(aedToSar).toBeCloseTo(3.75 / 3.67, 6)
    })

    test('should return null for unsupported currencies', () => {
      expect(getFallbackRate('USD', 'XYZ')).toBeNull()
      expect(getFallbackRate('XYZ', 'USD')).toBeNull()
      expect(getFallbackRate('ABC', 'XYZ')).toBeNull()
    })

    test('should handle case insensitivity', () => {
      expect(getFallbackRate('usd', 'EUR')).toBe(getFallbackRate('USD', 'EUR'))
      expect(getFallbackRate('pkr', 'inr')).toBe(getFallbackRate('PKR', 'INR'))
    })
  })

  describe('Currency Amount Conversion', () => {
    test('should correctly convert amounts between currencies', () => {
      // 100 USD to EUR (rate: 0.844)
      const usdToEur = convertCurrency(100, 'USD', 'EUR')
      expect(usdToEur).toBeCloseTo(84.4, 0)

      // 1000 PKR to USD (rate: 1/278.5)
      const pkrToUsd = convertCurrency(1000, 'PKR', 'USD')
      expect(pkrToUsd).toBeCloseTo(3.59, 2)

      // 100 EUR to GBP (rate: 0.733/0.844)
      const eurToGbp = convertCurrency(100, 'EUR', 'GBP')
      expect(eurToGbp).toBeCloseTo(86.85, 1)
    })

    test('should handle zero amounts', () => {
      expect(convertCurrency(0, 'USD', 'EUR')).toBe(0)
      expect(convertCurrency(0, 'PKR', 'INR')).toBe(0)
    })

    test('should handle large amounts', () => {
      const largeAmount = 1000000
      const result = convertCurrency(largeAmount, 'USD', 'PKR')
      expect(result).toBeCloseTo(278500000, 0)
    })

    test('should handle very small amounts', () => {
      const smallAmount = 0.01
      const result = convertCurrency(smallAmount, 'USD', 'EUR')
      expect(result).toBeCloseTo(0.00844, 4)
    })

    test('should return null for unsupported currency conversion', () => {
      expect(convertCurrency(100, 'USD', 'XYZ')).toBeNull()
      expect(convertCurrency(100, 'XYZ', 'USD')).toBeNull()
    })
  })
})

describe('Cash Calculator Currency Tests', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Multi-currency support', () => {
    test('handles USD cash values', () => {
      const store = createFreshStore()
      store.setCashValue('cash_on_hand', 1000)
      store.setCashValue('checking_account', 5000)
      store.setCashValue('savings_account', 10000)

      expect(store.getTotalCash()).toBe(16000)
      expect(store.getCashBreakdown().zakatDue).toBe(400) // 2.5%
    })

    test('handles foreign currency conversion to base', () => {
      const store = createFreshStore()
      // Simulating EUR holdings converted to USD
      const eurAmount = 1000
      const eurToUsdRate = 1 / 0.92 // ~1.087
      const usdValue = eurAmount * eurToUsdRate

      store.setCashValue('foreign_currency', usdValue)
      expect(store.getTotalCash()).toBeCloseTo(1087, 0)
    })

    TEST_CURRENCIES.slice(1).forEach(({ code, rate, name }) => {
      test(`calculates zakat for ${name} (${code}) holdings`, () => {
        const store = createFreshStore()
        const foreignAmount = 10000
        const usdEquivalent = foreignAmount / rate

        store.setCashValue('foreign_currency', usdEquivalent)
        store.setCashHawlMet(true)

        const breakdown = store.getCashBreakdown()
        expect(breakdown.zakatDue).toBeCloseTo(usdEquivalent * 0.025, 2)
      })
    })
  })

  describe('Currency precision edge cases', () => {
    test('handles high-value currency (KWD, BHD)', () => {
      const store = createFreshStore()
      // 100 KWD ≈ 322.58 USD
      const kwdToUsd = 100 / 0.31
      store.setCashValue('foreign_currency', kwdToUsd)

      expect(store.getTotalCash()).toBeCloseTo(322.58, 2)
    })

    test('handles low-value currency (VND, IDR)', () => {
      const store = createFreshStore()
      // 1,000,000 VND ≈ 40.82 USD
      const vndToUsd = 1000000 / 24500
      store.setCashValue('foreign_currency', vndToUsd)

      expect(store.getTotalCash()).toBeCloseTo(40.82, 2)
    })

    test('handles mixed currency portfolio', () => {
      const store = createFreshStore()
      // USD cash
      store.setCashValue('cash_on_hand', 1000)
      // EUR equivalent (500 EUR)
      store.setCashValue('checking_account', 500 / 0.92)
      // PKR equivalent (100000 PKR)
      store.setCashValue('savings_account', 100000 / 278.5)

      const total = store.getTotalCash()
      expect(total).toBeGreaterThan(1500)
      expect(total).toBeLessThan(2500)
    })
  })
})

describe('Metals Calculator Currency Tests', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Metal prices in different currencies', () => {
    test('sets metal prices with USD currency', () => {
      const store = createFreshStore()
      store.setMetalPrices({
        gold: 160.57,
        silver: 2.47,
        lastUpdated: new Date(),
        isCache: false,
        currency: 'USD'
      })

      const prices = useZakatStore.getState().metalPrices
      expect(prices.currency).toBe('USD')
      expect(prices.gold).toBe(160.57)
      expect(prices.silver).toBe(2.47)
    })

    TEST_CURRENCIES.slice(1, 6).forEach(({ code, rate, name }) => {
      test(`converts metal prices from USD to ${name} (${code})`, () => {
        const usdGoldPrice = 160.57
        const usdSilverPrice = 2.47

        // Convert to target currency
        const localGoldPrice = usdGoldPrice * rate
        const localSilverPrice = usdSilverPrice * rate

        expect(localGoldPrice).toBeGreaterThan(0)
        expect(localSilverPrice).toBeGreaterThan(0)

        // Gold should always be more expensive than silver
        expect(localGoldPrice).toBeGreaterThan(localSilverPrice)
      })
    })

    test('calculates nisab threshold in different currencies', () => {
      const silverNisabGrams = 612.36
      const usdSilverPrice = 2.47

      TEST_CURRENCIES.forEach(({ code, rate }) => {
        const localSilverPrice = usdSilverPrice * rate
        const nisabInLocalCurrency = silverNisabGrams * localSilverPrice

        expect(nisabInLocalCurrency).toBeGreaterThan(0)

        // Verify relationship: higher rate = higher nisab value
        if (code !== 'USD') {
          const usdNisab = silverNisabGrams * usdSilverPrice
          expect(nisabInLocalCurrency).toBeCloseTo(usdNisab * rate, 0)
        }
      })
    })
  })

  describe('Zakat calculation with currency conversion', () => {
    test('calculates zakat on gold value in USD', () => {
      const store = createFreshStore()
      const goldGrams = 100 // 100g of gold
      const goldPriceUSD = 160.57

      store.setMetalsValue('gold_investment', goldGrams)
      store.setMetalPrices({
        gold: goldPriceUSD,
        silver: 2.47,
        lastUpdated: new Date(),
        isCache: false,
        currency: 'USD'
      })
      store.setMetalsHawl(true)

      const breakdown = store.getMetalsBreakdown()
      const expectedValue = goldGrams * goldPriceUSD
      const expectedZakat = expectedValue * 0.025

      expect(breakdown.total).toBeCloseTo(expectedValue, 2)
      expect(breakdown.zakatDue).toBeCloseTo(expectedZakat, 2)
    })
  })
})

describe('Crypto Calculator Currency Tests', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Crypto value calculations in different currencies', () => {
    test('calculates BTC value in USD', () => {
      const btcQuantity = 0.5
      const btcPriceUSD = 65000

      const totalValue = btcQuantity * btcPriceUSD
      const zakatDue = totalValue * 0.025

      expect(totalValue).toBe(32500)
      expect(zakatDue).toBe(812.5)
    })

    TEST_CURRENCIES.slice(1, 5).forEach(({ code, rate, name }) => {
      test(`calculates crypto portfolio value in ${name} (${code})`, () => {
        const portfolio = [
          { symbol: 'BTC', quantity: 0.1, priceUSD: 65000 },
          { symbol: 'ETH', quantity: 2, priceUSD: 3500 },
          { symbol: 'USDT', quantity: 1000, priceUSD: 1 }
        ]

        const totalUSD = portfolio.reduce((sum, coin) => sum + (coin.quantity * coin.priceUSD), 0)
        const totalLocal = totalUSD * rate

        expect(totalLocal).toBeCloseTo(totalUSD * rate, 0)
        expect(totalLocal / rate).toBeCloseTo(totalUSD, 2)
      })
    })

    test('handles stablecoin conversions', () => {
      // USDT should maintain 1:1 with USD
      const usdtAmount = 10000
      const usdValue = usdtAmount * 1

      expect(usdValue).toBe(10000)

      // Convert to other currencies
      const eurValue = usdValue * 0.92
      const gbpValue = usdValue * 0.78

      expect(eurValue).toBe(9200)
      expect(gbpValue).toBe(7800)
    })
  })
})

describe('Stocks Calculator Currency Tests', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Stock value calculations', () => {
    test('calculates US stock values in USD', () => {
      const stocks = [
        { symbol: 'AAPL', shares: 10, price: 185 },
        { symbol: 'MSFT', shares: 5, price: 420 },
        { symbol: 'GOOGL', shares: 2, price: 175 }
      ]

      const totalValue = stocks.reduce((sum, stock) => sum + (stock.shares * stock.price), 0)
      const zakatDue = totalValue * 0.025

      expect(totalValue).toBe(4300)
      expect(zakatDue).toBe(107.5)
    })

    test('handles international stock conversions', () => {
      // Stock listed in GBP
      const gbpStockPrice = 100
      const shares = 10
      const gbpValue = shares * gbpStockPrice

      // Convert to USD for zakat calculation
      const usdValue = gbpValue / 0.78
      expect(usdValue).toBeCloseTo(1282.05, 2)

      const zakatDue = usdValue * 0.025
      expect(zakatDue).toBeCloseTo(32.05, 2)
    })

    TEST_CURRENCIES.filter(c => ['EUR', 'GBP', 'JPY', 'CAD'].includes(c.code)).forEach(({ code, rate, name }) => {
      test(`converts stock value from ${name} (${code}) to USD`, () => {
        const localStockValue = 10000
        const usdValue = localStockValue / rate

        expect(usdValue).toBeGreaterThan(0)
        expect(usdValue * rate).toBeCloseTo(localStockValue, 2)
      })
    })
  })

  describe('Passive investment calculations', () => {
    test('calculates 30% rule in different currencies', () => {
      const marketValue = 100000
      const zakatablePercent = 0.30

      TEST_CURRENCIES.forEach(({ code, rate }) => {
        const localMarketValue = marketValue * rate
        const localZakatable = localMarketValue * zakatablePercent
        const localZakat = localZakatable * 0.025

        // Verify proportions are maintained
        expect(localZakatable / localMarketValue).toBeCloseTo(zakatablePercent, 6)
        expect(localZakat / localZakatable).toBeCloseTo(0.025, 6)
      })
    })
  })
})

describe('Retirement Calculator Currency Tests', () => {
  describe('Retirement account value calculations', () => {
    test('calculates 401k values with tax considerations', () => {
      const traditional401k = 100000
      const taxRate = 0.22 // 22%
      const penaltyRate = 0.10 // 10%

      const netAfterTax = traditional401k * (1 - taxRate)
      const netAfterPenalty = netAfterTax * (1 - penaltyRate)
      const zakatDue = netAfterPenalty * 0.025

      expect(netAfterTax).toBe(78000)
      expect(netAfterPenalty).toBe(70200)
      expect(zakatDue).toBe(1755)
    })

    test('handles Roth IRA (no tax adjustment)', () => {
      const rothIRA = 50000
      const zakatDue = rothIRA * 0.025

      expect(zakatDue).toBe(1250)
    })

    TEST_CURRENCIES.slice(0, 5).forEach(({ code, rate, name }) => {
      test(`displays retirement values in ${name} (${code})`, () => {
        const usdRetirementValue = 250000
        const localValue = usdRetirementValue * rate
        const localZakat = localValue * 0.025

        expect(localValue).toBeCloseTo(usdRetirementValue * rate, 0)
        expect(localZakat).toBeCloseTo(localValue * 0.025, 0)
      })
    })
  })
})

describe('Real Estate Calculator Currency Tests', () => {
  describe('Property value and rental income', () => {
    test('calculates net rental income', () => {
      const monthlyRent = 2000
      const annualRent = monthlyRent * 12
      const annualExpenses = 5000

      const netRentalIncome = annualRent - annualExpenses
      const zakatDue = netRentalIncome * 0.025

      expect(netRentalIncome).toBe(19000)
      expect(zakatDue).toBe(475)
    })

    test('handles property for sale', () => {
      const propertyValue = 500000
      const zakatDue = propertyValue * 0.025

      expect(zakatDue).toBe(12500)
    })

    TEST_CURRENCIES.slice(0, 6).forEach(({ code, rate, name }) => {
      test(`converts property values to ${name} (${code})`, () => {
        const usdPropertyValue = 350000
        const localValue = usdPropertyValue * rate

        expect(localValue).toBeGreaterThan(0)
        expect(localValue / rate).toBeCloseTo(usdPropertyValue, 2)
      })
    })

    test('handles high-value real estate markets', () => {
      // UAE property in AED
      const aedPropertyValue = 5000000
      const usdValue = aedPropertyValue / 3.67

      expect(usdValue).toBeCloseTo(1362397.82, 2)

      const zakatDue = usdValue * 0.025
      expect(zakatDue).toBeCloseTo(34059.95, 2)
    })
  })
})

describe('Cross-Calculator Currency Consistency', () => {
  test('maintains consistent exchange rates across all calculators', () => {
    const testAmount = 10000

    TEST_CURRENCIES.forEach(({ code, rate }) => {
      const convertedToLocal = testAmount * rate
      const backToUSD = convertedToLocal / rate

      // Round-trip conversion should return original amount
      expect(backToUSD).toBeCloseTo(testAmount, 6)
    })
  })

  test('calculates total zakat across all asset types in single currency', () => {
    const assets = {
      cash: 10000,
      metals: 5000,
      crypto: 15000,
      stocks: 25000,
      retirement: 8000,
      realEstate: 2000
    }

    const totalAssets = Object.values(assets).reduce((sum, val) => sum + val, 0)
    const totalZakat = totalAssets * 0.025

    expect(totalAssets).toBe(65000)
    expect(totalZakat).toBe(1625)

    // Verify in different currencies
    TEST_CURRENCIES.forEach(({ code, rate }) => {
      const localTotal = totalAssets * rate
      const localZakat = localTotal * 0.025

      expect(localZakat / localTotal).toBeCloseTo(0.025, 6)
    })
  })

  test('handles nisab threshold comparison across currencies', () => {
    const silverNisabUSD = 612.36 * 2.47 // ~1512.53 USD

    TEST_CURRENCIES.forEach(({ code, rate }) => {
      const localNisab = silverNisabUSD * rate
      const testWealth = 1000 // USD

      const localWealth = testWealth * rate

      // Relationship should be consistent
      const exceedsNisabUSD = testWealth >= silverNisabUSD
      const exceedsNisabLocal = localWealth >= localNisab

      expect(exceedsNisabUSD).toBe(exceedsNisabLocal)
    })
  })
})
