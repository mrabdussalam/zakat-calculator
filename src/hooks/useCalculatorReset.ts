'use client'

import { useEffect } from 'react'

/**
 * Shared hook for handling store reset events in calculator components.
 * Listens for 'store-reset' and 'zakat-store-reset' events and calls
 * the provided callback, ignoring resets that occur during initial page load.
 */
export function useCalculatorReset(
  isHydrated: boolean,
  onReset: () => void
) {
  useEffect(() => {
    if (!isHydrated) return

    const handleReset = () => {
      if (typeof window !== 'undefined') {
        const win = window as typeof window & { isInitialPageLoad?: boolean }
        if (win.isInitialPageLoad) return
      }
      onReset()
    }

    window.addEventListener('store-reset', handleReset)
    window.addEventListener('zakat-store-reset', handleReset)

    return () => {
      window.removeEventListener('store-reset', handleReset)
      window.removeEventListener('zakat-store-reset', handleReset)
    }
  }, [isHydrated, onReset])
}
