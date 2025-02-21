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
      gold: 65.52,    // USD per gram
      silver: 0.85,   // USD per gram
      lastUpdated: new Date(),
      isCache: false
    })

    const nisab = store.calculateNisab()
    
    // Silver nisab (595g * 0.85 USD/g = 505.75 USD)
    expect(nisab.silver.value).toBe(505.75)
    
    // Log results for visibility
    console.log('Nisab Test Results:', {
      silverNisab: nisab.silver.value,
      goldNisab: nisab.gold.value
    })
  })

  test('correctly identifies assets meeting nisab', () => {
    const store = createFreshStore()
    
    // Set up test scenario
    store.setCashValue('cash_on_hand', 600) // Above silver nisab
    store.setMetalsValue('gold_investment', 90) // Above gold nisab (85g)
    
    const nisab = store.calculateNisab()
    
    expect(nisab.meets_nisab).toBe(true)
    console.log('Nisab Meeting Test:', {
      totalCash: store.getTotalCash(),
      meetsNisab: nisab.meets_nisab
    })
  })
}) 