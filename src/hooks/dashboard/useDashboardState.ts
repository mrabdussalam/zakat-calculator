import { useState, useEffect, useCallback } from 'react'
import { useZakatStore } from '@/store/zakatStore'
import { ZakatState } from '@/store/types'
import { toast } from '@/components/ui/toast'

// Define the types used by the dashboard state
export interface DashboardState {
  selectedAsset: string | null
  assetValues: Record<string, Record<string, number>>
  hawlMet: Record<string, boolean>
  nisabThreshold?: number
  currency: string
  setupCompleted: boolean
}

// Default state that will be the same on both server and client
export const DEFAULT_STATE: DashboardState = {
  selectedAsset: 'cash',
  assetValues: {
    cash: {},
    'precious-metals': {},
    stocks: {},
    retirement: {},
    'real-estate': {},
    crypto: {},
    'debt-receivable': {},
    'debt': {}
  },
  hawlMet: {
    cash: true,
    'precious-metals': true,
    stocks: true,
    retirement: true,
    'real-estate': true,
    crypto: true,
    'debt-receivable': true,
    'debt': true
  },
  currency: 'USD',
  setupCompleted: true
}

// Extracts numeric asset values from Zustand store for a given asset type
function getAssetValuesFromStore(assetId: string | null, store: ZakatState): Record<string, number> {
  if (!assetId) return {}
  switch (assetId) {
    case 'cash':
      return Object.entries(store.cashValues)
        .filter(([key, value]) => typeof value === 'number' && key !== 'foreign_currency_entries')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value as number }), {} as Record<string, number>)
    case 'precious-metals':
      return Object.entries(store.metalsValues)
        .filter(([_, value]) => typeof value === 'number')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value as number }), {} as Record<string, number>)
    case 'stocks':
      return Object.entries(store.stockValues)
        .filter(([key, value]) => typeof value === 'number' && key !== 'activeStocks')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value as number }), {} as Record<string, number>)
    case 'retirement':
      return Object.entries(store.retirement)
        .filter(([_, value]) => typeof value === 'number')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value as number }), {} as Record<string, number>)
    case 'real-estate':
      return Object.entries(store.realEstateValues)
        .filter(([key, value]) => typeof value === 'number' || key === 'property_for_sale_active' || key === 'vacant_land_sold')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value as any }), {} as Record<string, number>)
    case 'crypto':
      return store.cryptoValues && typeof store.cryptoValues.total_value === 'number'
        ? { total_value: store.cryptoValues.total_value } : {}
    case 'debt':
      return Object.entries(store.debtValues || {})
        .filter(([_, value]) => typeof value === 'number')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value as number }), {} as Record<string, number>)
    default:
      return {}
  }
}

// Gets hawl status from Zustand store for a given asset type
function getHawlFromStore(assetId: string | null, store: ZakatState): boolean {
  if (!assetId) return true
  switch (assetId) {
    case 'cash': return store.cashHawlMet
    case 'precious-metals': return store.metalsHawlMet
    case 'stocks': return store.stockHawlMet
    case 'retirement': return store.retirementHawlMet
    case 'real-estate': return store.realEstateHawlMet
    case 'crypto': return store.cryptoHawlMet
    case 'debt': return store.debtHawlMet
    default: return true
  }
}

interface UseDashboardStateProps {
  onNisabUpdate?: (amount: number) => void
}

export function useDashboardState({ onNisabUpdate }: UseDashboardStateProps = {}) {
  // Genuinely local UI state
  const [selectedAsset, setSelectedAsset] = useState<string | null>('cash')
  const [isHydrated, setIsHydrated] = useState(false)

  // Read reactively from the Zustand store (re-renders on store changes)
  const store = useZakatStore()

  // Set hydration state after first render
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Metal price fetching and nisab updates are handled by useNisabStatus (single owner).
  // This hook no longer fetches metal prices to avoid redundant API calls and cascading
  // updateNisabWithPrices() invocations.

  // Handle asset selection
  const handleAssetSelect = useCallback((assetId: string) => {
    setSelectedAsset(assetId)
  }, [])

  // No-op: calculators already write directly to Zustand store
  const handleUpdateValues = useCallback((_newValues: Record<string, number>) => {
    // Intentionally empty — calculators write to Zustand directly.
    // This callback is kept to preserve the prop contract.
  }, [])

  // No-op: calculators already write directly to Zustand store
  const handleHawlUpdate = useCallback((_hawlMet: boolean) => {
    // Intentionally empty — calculators write to Zustand directly.
    // This callback is kept to preserve the prop contract.
  }, [])

  // Handle nisab update
  const handleNisabUpdate = useCallback((amount: number) => {
    if (!isHydrated) return

    if (onNisabUpdate) {
      onNisabUpdate(amount)
    }
  }, [isHydrated, onNisabUpdate])

  // Listen for store resets from other components
  useEffect(() => {
    if (!isHydrated) return

    const handleStoreReset = () => {
      // Check if this is still during initial page load
      if (typeof window !== 'undefined' && 'isInitialPageLoad' in window) {
        const w = window as any
        if (w.isInitialPageLoad) {
          return
        }
      }
    }

    window.addEventListener('store-reset', handleStoreReset)
    return () => {
      window.removeEventListener('store-reset', handleStoreReset)
    }
  }, [isHydrated])

  // Handle reset button click
  const handleReset = useCallback(() => {
    try {
      const zakatStore = useZakatStore.getState()

      if (typeof zakatStore.reset === 'function') {
        zakatStore.reset()
      } else {
        console.error('Reset function not found in Zustand store')
      }

      toast({
        title: 'Reset successful',
        description: 'All calculator values have been reset',
        variant: 'success'
      })

      return true
    } catch (error) {
      console.error('Reset failed with error:', error)

      toast({
        title: 'Reset failed',
        description: 'An error occurred while resetting. Please try again.',
        variant: 'destructive'
      })

      return false
    }
  }, [])

  return {
    state: {
      selectedAsset,
      currency: store.currency,
      assetValues: {
        [selectedAsset!]: getAssetValuesFromStore(selectedAsset, store)
      },
      hawlMet: {
        [selectedAsset!]: getHawlFromStore(selectedAsset, store)
      },
      setupCompleted: true,
    },
    isHydrated,
    handleAssetSelect,
    handleUpdateValues,
    handleHawlUpdate,
    handleNisabUpdate,
    handleReset,
  }
}
