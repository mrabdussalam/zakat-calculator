'use client'

import { useState, useEffect } from 'react'
import { useZakatStore } from '@/store/zakatStore'
import { logStoreState, logHydrationStatus } from '@/lib/utils/debug'

/**
 * Hook to track Zustand store hydration status
 * Returns a boolean indicating if the store has been hydrated
 */
export function useStoreHydration() {
    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
        // Handler for when hydration completes
        const handleHydrationComplete = () => {
            console.log('useStoreHydration: Hydration complete event received')
            logHydrationStatus('useStoreHydration')
            setIsHydrated(true)
        }

        // Listen for both custom hydration events for compatibility
        window.addEventListener('zakatStoreHydrated', handleHydrationComplete)
        window.addEventListener('store-hydration-complete', handleHydrationComplete)

        // Check if hydration already happened using either flag
        if (typeof window !== 'undefined') {
            const win = window as any
            if (win.zakatStoreHydrationComplete || win.hasDispatchedHydrationEvent) {
                console.log('useStoreHydration: Global hydration flag already set')
                handleHydrationComplete()
            } else {
                // Check if we can detect hydration by examining store state
                // This is a fallback in case the event was missed
                const currency = useZakatStore.getState().currency
                if (currency) {
                    console.log('useStoreHydration: Detected hydration via store state check')
                    logStoreState(useZakatStore, 'useStoreHydration - Detected via state')
                    setIsHydrated(true)
                    // Set both flags so other components know hydration happened
                    win.zakatStoreHydrationComplete = true
                    win.hasDispatchedHydrationEvent = true
                }
            }
        }

        // Set a fallback timer to prevent indefinite loading
        const fallbackTimer = setTimeout(() => {
            console.log('useStoreHydration: Fallback timer triggered - assuming hydration complete')
            logStoreState(useZakatStore, 'useStoreHydration - Fallback timer')
            setIsHydrated(true)
            if (typeof window !== 'undefined') {
                const win = window as any
                win.zakatStoreHydrationComplete = true
                win.hasDispatchedHydrationEvent = true
            }
        }, 3000) // 3 second fallback

        return () => {
            window.removeEventListener('zakatStoreHydrated', handleHydrationComplete)
            window.removeEventListener('store-hydration-complete', handleHydrationComplete)
            clearTimeout(fallbackTimer)
        }
    }, [])

    return isHydrated
} 