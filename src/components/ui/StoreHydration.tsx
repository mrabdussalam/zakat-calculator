'use client'

import { useEffect } from 'react'
import { useZakatStore } from '@/store/zakatStore'
import { logStoreState, logHydrationStatus } from '@/lib/utils/debug'
import { useCurrencyStore } from '@/lib/services/currency'

/**
 * Component responsible for hydrating the Zustand store from localStorage
 * This component should be rendered at the top level of the application
 * It ensures that persisted state is properly loaded before rendering components
 */
export function StoreHydration() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    console.log('StoreHydration: Component mounted')
    logHydrationStatus('StoreHydration')
    logStoreState(useZakatStore, 'StoreHydration - Initial')

    // Function to handle successful hydration
    const handleHydrationSuccess = async () => {
      console.log('StoreHydration: Hydration successful')

        // Set global flag to indicate hydration is complete
        ; (window as any).zakatStoreHydrationComplete = true
        ; (window as any).hasDispatchedHydrationEvent = true

      // Dispatch custom event to notify components - using both event names for compatibility
      // First, dispatch the new event name
      const event1 = new Event('zakatStoreHydrated')
      window.dispatchEvent(event1)
      console.log('StoreHydration: Dispatched zakatStoreHydrated event')

      // Then, dispatch the old event name for backward compatibility
      const event2 = new Event('store-hydration-complete')
      window.dispatchEvent(event2)
      console.log('StoreHydration: Dispatched store-hydration-complete event for backward compatibility')

      logStoreState(useZakatStore, 'StoreHydration - After Hydration')

      // CRITICAL ADDITION: Initialize currency rates after hydration
      try {
        const zakatStore = useZakatStore.getState();
        const currencyStore = useCurrencyStore.getState();
        const currentCurrency = zakatStore.currency || 'USD';

        console.log('StoreHydration: Initializing currency rates for', currentCurrency);

        // Fetch exchange rates for the current currency
        await currencyStore.fetchRates(currentCurrency);
        console.log('StoreHydration: Successfully fetched exchange rates');
      } catch (error) {
        console.error('StoreHydration: Failed to initialize currency rates:', error);
      }
    }

    // Subscribe to the onRehydrateStorage callback
    const unsubHydrate = useZakatStore.persist.onHydrate(() => {
      console.log('StoreHydration: Hydration started')
    })

    // Subscribe to the onFinishHydration callback
    const unsubFinish = useZakatStore.persist.onFinishHydration(() => {
      console.log('StoreHydration: Hydration finished')
      handleHydrationSuccess()
    })

    // Check if store is already hydrated
    if (useZakatStore.persist.hasHydrated()) {
      console.log('StoreHydration: Store already hydrated on mount')
      handleHydrationSuccess()
    } else {
      console.log('StoreHydration: Store not yet hydrated, waiting...')

      // Set a fallback timer to ensure hydration completes
      const fallbackTimer = setTimeout(() => {
        console.log('StoreHydration: Fallback timer triggered - forcing hydration')

        // Force rehydration if it hasn't completed
        if (!useZakatStore.persist.hasHydrated()) {
          console.log('StoreHydration: Manually triggering rehydration')
          useZakatStore.persist.rehydrate()
        }

        // Assume hydration is complete after forcing it
        handleHydrationSuccess()
      }, 1500) // 1.5 second fallback

      return () => clearTimeout(fallbackTimer)
    }

    // Cleanup subscriptions
    return () => {
      unsubHydrate()
      unsubFinish()
    }
  }, [])

  // This component doesn't render anything
  return null
} 