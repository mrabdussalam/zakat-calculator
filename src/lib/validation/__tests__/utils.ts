import { useZakatStore } from '@/store/zakatStore'

// Helper to create a fresh store instance for each test
export const createFreshStore = () => {
  const store = useZakatStore.getState()
  
  // Reset all values
  store.resetCashValues()
  store.resetCryptoValues?.()
  
  // Reset hawl status
  store.setCashHawlMet(true)
  store.setCryptoHawl?.(true)
  
  return useZakatStore.getState()
} 