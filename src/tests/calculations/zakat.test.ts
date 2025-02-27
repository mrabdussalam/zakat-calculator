import { describe, test, expect } from 'vitest'
import { useZakatStore } from '@/store/zakatStore'

// Helper to create a fresh store instance for each test
const createFreshStore = () => {
  const store = useZakatStore.getState()
  // Reset store to initial state before each test
  store.resetCashValues()
  store.resetMetalsValues()
  return store
}

describe('Zakat Calculations', () => {
  test('calculates nisab threshold correctly', () => {
    const store = createFreshStore()

    // Set metal prices
    store.setMetalPrices({
      gold: 93.98,    // USD per gram (updated to match other fallback values)
      silver: 1.02,   // USD per gram (updated to match other fallback values)
      lastUpdated: new Date(),
      isCache: false,
      currency: 'USD'  // Add required currency property
    })

    // Use getNisabStatus instead of calculateNisab
    const nisabStatus = store.getNisabStatus()

    // Silver nisab (595g * 1.02 USD/g = 606.90 USD)
    expect(nisabStatus.thresholds.silver).toBe(606.90)

    // Log results for visibility
    console.log('Nisab Test Results:', {
      silverNisab: nisabStatus.thresholds.silver,
      goldNisab: nisabStatus.thresholds.gold
    })
  })

  test('correctly identifies assets meeting nisab', () => {
    const store = createFreshStore()

    // Set up test scenario
    store.setCashValue('cash_on_hand', 600) // Above silver nisab
    store.setMetalsValue('gold_investment', 90) // Above gold nisab (85g)

    // Set metal prices with currency
    store.setMetalPrices({
      gold: 93.98,
      silver: 1.02,
      lastUpdated: new Date(),
      isCache: false,
      currency: 'USD'
    })

    // Use getNisabStatus instead of calculateNisab
    const nisabStatus = store.getNisabStatus()

    expect(nisabStatus.meetsNisab).toBe(true)
    console.log('Nisab Meeting Test:', {
      totalCash: store.getTotalCash(),
      meetsNisab: nisabStatus.meetsNisab
    })
  })
}) 