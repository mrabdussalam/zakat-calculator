import { useState, useEffect, useRef, useCallback } from 'react'
import { useZakatStore } from '@/store/zakatStore'
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
    'debt-receivable': {}
  },
  hawlMet: {
    cash: true,
    'precious-metals': true,
    stocks: true,
    retirement: true,
    'real-estate': true,
    crypto: true,
    'debt-receivable': true
  },
  currency: 'USD',
  setupCompleted: true
}

// Add a simple version tracking mechanism
const LOCAL_STATE_VERSION = "1.1"; // Increment this when making changes to state structure

// Helper function to ensure state always has complete structure
function ensureCompleteState(state: Partial<DashboardState>): DashboardState {
  const completeState: DashboardState = {
    ...DEFAULT_STATE,
    ...state,
    // Always set selectedAsset to 'cash' if it's not specified or is null
    selectedAsset: state.selectedAsset || 'cash',
    assetValues: {
      cash: {},
      'precious-metals': {},
      stocks: {},
      retirement: {},
      'real-estate': {},
      crypto: {},
      'debt-receivable': {},
      ...state.assetValues,
    },
    hawlMet: {
      ...DEFAULT_STATE.hawlMet,
      ...(state.hawlMet || {})
    }
  };

  // Ensure each asset type object exists
  const assetTypes = ['cash', 'precious-metals', 'stocks', 'retirement', 'real-estate', 'crypto', 'debt-receivable'];
  assetTypes.forEach(type => {
    if (!completeState.assetValues[type]) {
      completeState.assetValues[type] = {};
    }
  });

  return completeState;
}

interface UseDashboardStateProps {
  onNisabUpdate?: (amount: number) => void
}

export function useDashboardState({ onNisabUpdate }: UseDashboardStateProps = {}) {
  // Create prevCurrency ref before state initialization to avoid reference error
  const prevCurrency = useRef<string>(DEFAULT_STATE.currency)

  // Initialize with default state and load from localStorage if available
  const [state, setState] = useState<DashboardState>(() => {
    // Client-side only
    if (typeof window === 'undefined') {
      console.log('🟡 Server-side rendering, using default state')
      return DEFAULT_STATE
    }

    console.log('🟢 Initializing dashboard state on client')

    try {
      // Check what's in localStorage currently
      const allKeys = Object.keys(localStorage)
      console.log('🟢 Current localStorage keys:', allKeys)

      // First, try to load the complete state from localStorage
      const saved = localStorage.getItem('zakatState')
      console.log('🟢 Found saved state in localStorage:', !!saved)

      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          console.log('🟢 Successfully parsed saved state:', {
            type: typeof parsed,
            isObject: typeof parsed === 'object',
            hasAssetValues: parsed && parsed.assetValues ? true : false,
            version: parsed?.version || 'not found'
          })

          if (parsed && typeof parsed === 'object') {
            // Check if the saved state has any values
            const savedHasValues = Object.entries(parsed.assetValues || {}).some(([assetType, values]: [string, any]) =>
              Object.keys(values || {}).length > 0
            )

            console.log('🟢 Saved state has values:', savedHasValues, {
              assetTypes: Object.keys(parsed.assetValues || {}),
              valueDetails: Object.entries(parsed.assetValues || {}).map(([key, value]: [string, any]) =>
                `${key}: ${Object.keys(value || {}).length} fields`
              )
            })

            // Create a complete state with fallbacks to defaults and ensure structure integrity
            const restoredState = ensureCompleteState({
              ...parsed,
              setupCompleted: true
            });

            // Check if we have a user currency preference (highest priority)
            const userCurrencyPreference = localStorage.getItem('selected-currency')
            if (userCurrencyPreference) {
              restoredState.currency = userCurrencyPreference
              console.log('🟢 Applied user currency preference to restored state:', userCurrencyPreference)
            }

            // Set prevCurrency to match the current state to prevent unwanted conversions
            prevCurrency.current = restoredState.currency

            console.log('🟢 Successfully restored state from localStorage:', {
              currency: restoredState.currency,
              selectedAsset: restoredState.selectedAsset,
              hasValues: Object.keys(restoredState.assetValues).some(key =>
                Object.keys(restoredState.assetValues[key]).length > 0
              ),
              assetValueCount: Object.keys(restoredState.assetValues).reduce((acc, key) => {
                const assetKey = key as keyof typeof restoredState.assetValues;
                return acc + Object.keys(restoredState.assetValues[assetKey]).length
              }, 0)
            })

            return restoredState
          }
        } catch (error) {
          console.error('🔴 Error parsing saved state:', error)
        }
      }

      // If we get here, either there was no saved state or it was invalid
      console.log('🟢 Using default state (no valid saved state found)')
      return DEFAULT_STATE
    } catch (error) {
      console.error('🔴 Error initializing dashboard state:', error)
      return DEFAULT_STATE
    }
  })

  // Track if the component is mounted
  const isMounted = useRef(false)

  // Track if we've initialized the nisab data
  const hasInitializedNisab = useRef(false)

  // Get the store's nisab and metal prices functions
  const {
    fetchNisabData,
    updateNisabWithPrices,
    metalPrices,
    setMetalPrices
  } = useZakatStore()

  // Track if the store is hydrated
  const [isHydrated, setIsHydrated] = useState(false)

  // Get the store's hydration status
  const storeState = useZakatStore()
  const isStoreHydrated = typeof storeState === 'object' && Object.keys(storeState).length > 0

  // Add effect to fetch metal prices and update nisab on initialization
  useEffect(() => {
    // Only run on client and after hydration
    if (typeof window === 'undefined' || !isHydrated || !isStoreHydrated || hasInitializedNisab.current) {
      return
    }

    const fetchMetalPricesAndUpdateNisab = async () => {
      console.log('Dashboard: Fetching metal prices and updating nisab on initialization')

      try {
        // Fetch metal prices
        const response = await fetch(`/api/prices/metals?currency=${state.currency}`)

        if (!response.ok) {
          console.warn(`Dashboard: Using fallback prices. API returned: ${response.status}`)
          return
        }

        const data = await response.json()

        // Log the API response for debugging
        console.log(`Dashboard: Received metal prices:`, {
          gold: data.gold,
          silver: data.silver,
          currency: data.currency || 'USD',
          isCache: data.isCache,
          source: data.source
        })

        // Update metal prices in the store
        setMetalPrices({
          gold: data.gold,
          silver: data.silver,
          lastUpdated: new Date(data.lastUpdated || new Date()),
          isCache: data.isCache || false,
          currency: data.currency || state.currency
        })

        // Update nisab with the new prices
        if (updateNisabWithPrices) {
          console.log('Dashboard: Triggering immediate nisab update with new prices')

          // Ensure we have a valid lastUpdated from the API response
          const lastUpdated = data.lastUpdated instanceof Date ?
            data.lastUpdated :
            (typeof data.lastUpdated === 'string' ?
              new Date(data.lastUpdated) :
              new Date())

          updateNisabWithPrices({
            gold: data.gold,
            silver: data.silver,
            currency: data.currency || state.currency,
            lastUpdated: lastUpdated,
            isCache: data.isCache || false
          })
        }
      } catch (error) {
        console.error('Dashboard: Error fetching metal prices:', error)
      }

      // Mark as initialized to prevent duplicate fetches
      hasInitializedNisab.current = true
    }

    // Execute the fetch
    fetchMetalPricesAndUpdateNisab()
  }, [isHydrated, isStoreHydrated, state.currency, setMetalPrices, updateNisabWithPrices])

  // Add effect to update nisab when metal prices change
  useEffect(() => {
    // Only run on client and after hydration
    if (typeof window === 'undefined' || !isHydrated || !isStoreHydrated || !metalPrices) {
      return
    }

    // If metal prices exist and currency matches, update nisab
    if (metalPrices.currency === state.currency && updateNisabWithPrices) {
      console.log('Dashboard: Updating nisab with current metal prices')
      updateNisabWithPrices(metalPrices)
    }
  }, [isHydrated, isStoreHydrated, metalPrices, state.currency, updateNisabWithPrices])

  // Save state changes to localStorage
  useEffect(() => {
    if (isHydrated) {
      // Save the complete state to ensure asset values persist on refresh
      localStorage.setItem('zakatState', JSON.stringify({
        currency: state.currency,
        selectedAsset: state.selectedAsset,
        assetValues: state.assetValues,
        hawlMet: state.hawlMet,
        nisabThreshold: state.nisabThreshold,
        setupCompleted: true
      }))
    }
  }, [
    isHydrated,
    state.currency,
    state.selectedAsset,
    state.assetValues,
    state.hawlMet,
    state.nisabThreshold
  ])

  // Log changes to state.assetValues for debugging
  useEffect(() => {
    if (!isHydrated) return

    // Debug log to see if values are changing
    const hasValues = Object.entries(state.assetValues).some(([assetType, values]) =>
      Object.keys(values).length > 0
    )

    console.log('Asset values updated:', {
      hasValues,
      selectedAsset: state.selectedAsset,
      assetValueCount: Object.keys(state.assetValues).reduce((acc, key) =>
        acc + Object.keys(state.assetValues[key]).length, 0
      )
    })
  }, [isHydrated, state.assetValues])

  // Set hydration state after first render
  useEffect(() => {
    setIsHydrated(true)
    console.log('🟣 Dashboard state hydrated')

    // Check localStorage after hydration to detect any potential resets
    try {
      const savedAfterHydration = localStorage.getItem('zakatState')
      const parsedAfterHydration = savedAfterHydration ? JSON.parse(savedAfterHydration) : null
      const hasValuesAfterHydration = parsedAfterHydration ?
        Object.entries(parsedAfterHydration.assetValues || {}).some(([assetType, values]: [string, any]) =>
          Object.keys(values || {}).length > 0
        ) : false

      console.log('🟣 localStorage check after hydration:', {
        exists: !!savedAfterHydration,
        hasValues: hasValuesAfterHydration,
        parsedCurrency: parsedAfterHydration?.currency,
        stateCurrency: state.currency,
        keysMatch: parsedAfterHydration && state ?
          JSON.stringify(Object.keys(parsedAfterHydration).sort()) ===
          JSON.stringify(Object.keys({ ...state, version: '' }).sort()) :
          false
      })
    } catch (error) {
      console.error('❌ Error checking localStorage after hydration:', error)
    }

    // Get values from Zustand store after hydration
    try {
      const zakatStore = useZakatStore.getState()

      // Import values from Zustand store into dashboard state
      const updatedAssetValues = { ...state.assetValues }

      // Import cash values
      if (zakatStore.cashValues) {
        updatedAssetValues.cash = Object.entries(zakatStore.cashValues)
          .filter(([key, value]) => typeof value === 'number' && key !== 'foreign_currency_entries')
          .reduce((acc, [key, value]) => ({
            ...acc,
            [key]: value
          }), {})
      }

      // Import metals values
      if (zakatStore.metalsValues) {
        updatedAssetValues['precious-metals'] = Object.entries(zakatStore.metalsValues)
          .filter(([key, value]) => typeof value === 'number')
          .reduce((acc, [key, value]) => ({
            ...acc,
            [key]: value
          }), {})
      }

      // Import stock values
      if (zakatStore.stockValues) {
        updatedAssetValues.stocks = Object.entries(zakatStore.stockValues)
          .filter(([key, value]) => typeof value === 'number' && key !== 'activeStocks')
          .reduce((acc, [key, value]) => ({
            ...acc,
            [key]: value
          }), {})
      }

      // Import retirement values
      if (zakatStore.retirement) {
        updatedAssetValues.retirement = Object.entries(zakatStore.retirement)
          .filter(([key, value]) => typeof value === 'number')
          .reduce((acc, [key, value]) => ({
            ...acc,
            [key]: value
          }), {})
      }

      // Import real estate values
      if (zakatStore.realEstateValues) {
        updatedAssetValues['real-estate'] = Object.entries(zakatStore.realEstateValues)
          .filter(([key, value]) => typeof value === 'number' || key === 'property_for_sale_active' || key === 'vacant_land_sold')
          .reduce((acc, [key, value]) => ({
            ...acc,
            [key]: value
          }), {})
      }

      // Import crypto total value
      if (zakatStore.cryptoValues && typeof zakatStore.cryptoValues.total_value === 'number') {
        updatedAssetValues.crypto = {
          total_value: zakatStore.cryptoValues.total_value
        }
      }

      // Import hawl status
      const updatedHawlMet = { ...state.hawlMet }
      updatedHawlMet.cash = zakatStore.cashHawlMet
      updatedHawlMet['precious-metals'] = zakatStore.metalsHawlMet
      updatedHawlMet.stocks = zakatStore.stockHawlMet
      updatedHawlMet.retirement = zakatStore.retirementHawlMet
      updatedHawlMet['real-estate'] = zakatStore.realEstateHawlMet
      updatedHawlMet.crypto = zakatStore.cryptoHawlMet

      // Check if we have any values to update
      const hasZustandValues = Object.values(updatedAssetValues).some(assetType =>
        Object.keys(assetType).length > 0 &&
        Object.values(assetType).some(value => typeof value === 'number' && value > 0)
      )

      console.log('🟣 Found values in Zustand store:', hasZustandValues, {
        cash: Object.keys(updatedAssetValues.cash).length,
        metals: Object.keys(updatedAssetValues['precious-metals']).length,
        stocks: Object.keys(updatedAssetValues.stocks).length,
        retirement: Object.keys(updatedAssetValues.retirement).length,
        realEstate: Object.keys(updatedAssetValues['real-estate']).length,
        crypto: Object.keys(updatedAssetValues.crypto).length
      })

      if (hasZustandValues) {
        // Update state with values from Zustand store
        setState(prevState => ({
          ...prevState,
          assetValues: updatedAssetValues,
          hawlMet: updatedHawlMet
        }))

        console.log('🟣 Imported values from Zustand store to dashboard state')
      }

      // Sync currency with Zustand
      if (zakatStore.metalPrices?.currency !== state.currency && typeof zakatStore.setCurrency === 'function') {
        console.log('Syncing Zustand store with dashboard currency:', state.currency)
        zakatStore.setCurrency(state.currency)

        // Update metal prices currency if needed
        if (zakatStore.metalPrices) {
          zakatStore.setMetalPrices({
            ...zakatStore.metalPrices,
            currency: state.currency
          })
        }
      }
    } catch (error) {
      console.error('Error synchronizing with Zustand after hydration:', error)
    }
  }, [])

  // Add effect to ensure Zustand values get synced back to dashboard after user input
  useEffect(() => {
    // Only run after hydration
    if (!isHydrated) return

    // Listen for Zustand store changes
    try {
      const zakatStore = useZakatStore.getState()

      // Create an interval to check for Zustand store changes
      const syncInterval = setInterval(() => {
        const currentStore = useZakatStore.getState()
        // Check if any of our tracked asset values have changed

        // Check cash values
        const cashValues = Object.entries(currentStore.cashValues)
          .filter(([key, value]) => typeof value === 'number' && key !== 'foreign_currency_entries')
          .reduce((acc, [key, value]) => ({
            ...acc,
            [key]: value
          }), {})

        const hasCashChanges = Object.keys(cashValues).some(key => {
          // Ensure state.assetValues.cash exists before accessing its properties
          const currentValue = state.assetValues?.cash?.[key] || 0;
          return cashValues[key as keyof typeof cashValues] !== currentValue;
        });

        if (hasCashChanges) {
          console.log('🔄 Detected cash changes in Zustand store, syncing to dashboard state')
          setState(prevState => ({
            ...prevState,
            assetValues: {
              ...prevState.assetValues,
              cash: {
                ...(prevState.assetValues?.cash || {}),
                ...cashValues
              }
            }
          }))
        }

        // Similarly check other asset types
        // We could add them here, but let's keep the code simple for now

      }, 5000) // Check every 5 seconds

      return () => clearInterval(syncInterval)
    } catch (error) {
      console.error('Error in Zustand sync effect:', error)
    }
  }, [isHydrated, state.assetValues])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isHydrated) return

    try {
      // Ensure assetValues structure is complete before saving
      const completeAssetValues = {
        cash: state.assetValues?.cash || {},
        'precious-metals': state.assetValues?.['precious-metals'] || {},
        stocks: state.assetValues?.stocks || {},
        retirement: state.assetValues?.retirement || {},
        'real-estate': state.assetValues?.['real-estate'] || {},
        crypto: state.assetValues?.crypto || {},
        'debt-receivable': state.assetValues?.['debt-receivable'] || {}
      }

      // Create a serializable version of the state with complete structure
      const stateToSave = {
        ...state,
        assetValues: completeAssetValues,
        version: LOCAL_STATE_VERSION
      }

      // Check if there are any values before saving
      const hasValues = Object.entries(completeAssetValues).some(([assetType, values]) =>
        Object.keys(values).length > 0
      )

      // Save to localStorage
      localStorage.setItem('zakatState', JSON.stringify(stateToSave))
      console.log('🔵 Saved dashboard state to localStorage:', {
        hasValues,
        currency: state.currency,
        selectedAsset: state.selectedAsset,
        assetValueCount: Object.keys(completeAssetValues).reduce((acc, key) => {
          const assetKey = key as keyof typeof completeAssetValues;
          return acc + Object.keys(completeAssetValues[assetKey]).length;
        }, 0)
      })

      // Immediately verify that the data was saved properly
      const savedData = localStorage.getItem('zakatState')
      const parsedSaved = savedData ? JSON.parse(savedData) : null
      const savedHasValues = parsedSaved ? Object.entries(parsedSaved.assetValues).some(([assetType, values]: [string, any]) =>
        Object.keys(values).length > 0
      ) : false

      console.log('🔵 Verification of saved state:', {
        dataExists: !!savedData,
        savedHasValues,
        savedCurrency: parsedSaved?.currency,
        savedAsset: parsedSaved?.selectedAsset
      })
    } catch (error) {
      console.error('❌ Error saving state to localStorage:', error)
    }
  }, [isHydrated, state])

  // Handle asset selection
  const handleAssetSelect = useCallback((assetId: string) => {
    setState(prev => ({
      ...prev,
      selectedAsset: assetId
    }))
  }, [])

  // Handle updating values
  const handleUpdateValues = useCallback((newValues: Record<string, number>) => {
    if (!isHydrated || !state.selectedAsset) return // Don't update state before hydration or if no asset selected

    setState(prev => {
      // Create a fresh copy of asset values
      const updatedAssetValues = {
        ...prev.assetValues,
        [state.selectedAsset!]: {} as Record<string, number> // Clear previous values for this asset type with proper typing
      }

      // Only add non-zero values
      Object.entries(newValues).forEach(([key, value]) => {
        if (typeof value === 'number' && value !== 0 && state.selectedAsset) {
          updatedAssetValues[state.selectedAsset][key] = value
        }
      })

      return {
        ...prev,
        assetValues: updatedAssetValues
      }
    })
  }, [isHydrated, state.selectedAsset])

  // Handle hawl update
  const handleHawlUpdate = useCallback((hawlMet: boolean) => {
    if (!isHydrated) return // Don't update state before hydration

    setState(prev => ({
      ...prev,
      hawlMet: {
        ...prev.hawlMet,
        [prev.selectedAsset!]: hawlMet
      }
    }))
  }, [isHydrated])

  // Handle nisab update
  const handleNisabUpdate = useCallback((amount: number) => {
    if (!isHydrated) return // Don't update state before hydration

    setState(prev => ({
      ...prev,
      nisabThreshold: amount
    }))

    // Call the callback if provided
    if (onNisabUpdate) {
      onNisabUpdate(amount)
    }
  }, [isHydrated, onNisabUpdate])

  // Add a listener to detect store resets from other components
  useEffect(() => {
    // Only add the listener if we're properly hydrated
    if (!isHydrated) return

    const handleStoreReset = (event: Event) => {
      console.log('Dashboard: Store reset event detected from another component')

      // Check if this is still during initial page load
      if (typeof window !== 'undefined' && 'isInitialPageLoad' in window) {
        const w = window as any
        if (w.isInitialPageLoad) {
          console.log('Dashboard: Ignoring reset during initial page load')
          return
        }
      }

      // This is coming from another component or action
      console.log('Dashboard: Processing external reset event')

      // Reset local dashboard state to match the store reset
      setState(prev => ({
        ...prev,
        selectedAsset: prev.selectedAsset, // Keep the currently selected asset
        assetValues: {}, // Clear all values
        hawlMet: {}, // Clear hawl status
        // Keep user preferences like currency and completed setup
      }))
    }

    // Listen for the store-reset event
    window.addEventListener('store-reset', handleStoreReset)

    // Cleanup
    return () => {
      window.removeEventListener('store-reset', handleStoreReset)
    }
  }, [isHydrated])

  // Handle reset button click
  const handleReset = useCallback(() => {
    try {
      console.log('Resetting the application state')

      // Use the Zustand store's reset function which now has enhanced handling
      const zakatStore = useZakatStore.getState()

      // Call the reset function directly
      if (typeof zakatStore.reset === 'function') {
        zakatStore.reset()
        console.log('Zustand store reset completed')
      } else {
        console.error('Reset function not found in Zustand store')
      }

      // Also reset the local dashboard state
      setState(prev => ({
        ...prev,
        selectedAsset: prev.selectedAsset, // Keep the currently selected asset
        assetValues: {}, // Clear all values
        hawlMet: {}, // Clear hawl status
        // Keep user preferences like currency and completed setup
      }))

      // For additional cleanup, clear any temporary calculation records
      localStorage.removeItem('currency-conversion-record')

      // Confirm reset to user - using the correct toast pattern
      toast({
        title: 'Reset successful',
        description: 'All calculator values have been reset',
        variant: 'success'
      })

      return true
    } catch (error) {
      console.error('Reset failed with error:', error)

      // Show error toast - using the correct toast pattern
      toast({
        title: 'Reset failed',
        description: 'An error occurred while resetting. Please try again.',
        variant: 'destructive'
      })

      return false
    }
  }, [])

  // Process asset values for summary
  const processedValues = Object.entries(state.assetValues).reduce((acc, [assetType, values]) => {
    // Skip empty asset types
    if (Object.keys(values).length === 0) return acc

    // Calculate total for this asset type (only from direct values)
    const assetTotal = Object.entries(values).reduce((sum, [key, value]) => {
      // Skip derived/total values to prevent double counting
      if (key.includes('total') || key.includes('zakatable')) return sum
      return sum + (typeof value === 'number' ? value : 0)
    }, 0)

    // Add the base total
    acc[`${assetType}_total`] = assetTotal

    // Add individual values with proper prefixing
    Object.entries(values).forEach(([key, value]) => {
      if (typeof value === 'number') {
        // Prevent duplicate prefixing
        const cleanKey = key.startsWith(assetType) ? key : `${assetType}_${key}`
        acc[cleanKey] = value
      }
    })

    return acc
  }, {} as Record<string, number>)

  // Calculate total assets by asset type (only counting base values)
  const assetTotals = Object.entries(state.assetValues).reduce((acc, [assetType, values]) => {
    acc[assetType] = Object.entries(values).reduce((sum, [key, value]) => {
      // Skip derived/total values to prevent double counting
      if (key.includes('total') || key.includes('zakatable')) return sum
      return sum + (typeof value === 'number' ? value : 0)
    }, 0)
    return acc
  }, {} as Record<string, number>)

  // Calculate zakatable totals by asset type
  const zakatableTotals = Object.entries(state.assetValues).reduce((acc, [assetType, values]) => {
    // For precious metals, use the zakatable field if present
    if (assetType === 'precious-metals' && values.zakatable) {
      acc[assetType] = values.zakatable
    } else {
      // For other assets, use the total if hawl is met
      acc[assetType] = state.hawlMet[assetType] ? (assetTotals[assetType] || 0) : 0
    }
    return acc
  }, {} as Record<string, number>)

  // Calculate total assets and zakatable amount
  const totalAssets = Object.values(assetTotals).reduce((sum, value) =>
    sum + (typeof value === 'number' ? value : 0), 0)

  const totalZakatable = Object.values(zakatableTotals).reduce((sum, value) =>
    sum + (typeof value === 'number' ? value : 0), 0)

  // Check if any asset type with non-zero zakatable amount meets hawl
  const anyHawlMet = Object.entries(state.hawlMet).some(([assetType, hawlMet]) => {
    const zakatableAmount = zakatableTotals[assetType] || 0
    return hawlMet && zakatableAmount > 0
  })

  // Calculate if eligible for Zakat
  const isEligible = anyHawlMet && totalZakatable >= (state.nisabThreshold || 0)

  return {
    // State values
    state,
    isHydrated,
    prevCurrency: prevCurrency.current,

    // Calculated values
    processedValues,
    assetTotals,
    zakatableTotals,
    totalAssets,
    totalZakatable,
    anyHawlMet,
    isEligible,

    // Event handlers
    handleAssetSelect,
    handleUpdateValues,
    handleHawlUpdate,
    handleNisabUpdate,
    handleReset,

    // Other methods
    setState
  }
} 