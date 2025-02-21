import { useZakatStore } from '@/store/zakatStore'

// Helper to create a fresh store instance for each test
export const createFreshStore = () => {
  const store = useZakatStore.getState()
  store.resetCashValues()
  store.resetMetalsValues()
  return useZakatStore.getState()
} 