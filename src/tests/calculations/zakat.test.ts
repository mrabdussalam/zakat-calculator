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

    // Set metal prices (updated Feb 2026)
    store.setMetalPrices({
      gold: 160.57,    // USD per gram
      silver: 2.47,   // USD per gram
      lastUpdated: new Date(),
      isCache: false,
      currency: 'USD'
    })

    // Use getNisabStatus instead of calculateNisab
    const nisabStatus = store.getNisabStatus()

    // Silver nisab (612.36g * 2.47 USD/g = 1512.53 USD)
    expect(nisabStatus.thresholds.silver).toBeCloseTo(1512.53, 0)

    // Log results for visibility
    console.log('Nisab Test Results:', {
      silverNisab: nisabStatus.thresholds.silver,
      goldNisab: nisabStatus.thresholds.gold
    })
  })

  test('correctly identifies assets meeting nisab', () => {
    const store = createFreshStore()

    // Set up test scenario
    store.setCashValue('cash_on_hand', 1600) // Above silver nisab ($1512.53)
    store.setMetalsValue('gold_investment', 90) // Above gold nisab (85g)

    // Set metal prices with currency
    store.setMetalPrices({
      gold: 160.57,
      silver: 2.47,
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
