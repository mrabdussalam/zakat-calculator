'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AssetList, ASSETS } from '@/components/dashboard/AssetList'
import { Calculator } from '@/components/dashboard/Calculator'
import { Summary } from '@/components/dashboard/Summary/index'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useZakatStore } from '@/store/zakatStore'
import { cn } from '@/lib/utils'
import { DEFAULT_HAWL_STATUS } from '@/store/constants'

interface DashboardState {
  selectedAsset: string | null
  assetValues: Record<string, Record<string, number>>
  hawlMet: Record<string, boolean>
  nisabThreshold?: number
  currency: string
}

// Default state that will be the same on both server and client
const DEFAULT_STATE: DashboardState = {
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
  currency: 'USD'
}

export default function DashboardPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const prevCurrency = useRef(DEFAULT_STATE.currency)
  
  // Initialize with default state and load from localStorage if available
  const [state, setState] = useState<DashboardState>(() => {
    // Try to load saved state
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zakatState')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // Validate the structure matches our expected state
          if (parsed && 
              typeof parsed === 'object' && 
              parsed.assetValues && 
              parsed.hawlMet) {
            return parsed as DashboardState
          }
        } catch (e) {
          console.error('Failed to parse saved state:', e)
        }
      }
    }
    return DEFAULT_STATE
  })
  
  // Save state changes to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('zakatState', JSON.stringify(state))
    }
  }, [state, isHydrated])

  // Only set hydration state after first render
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const handleAssetSelect = (assetId: string) => {
    setState(prev => ({
      ...prev,
      selectedAsset: assetId
    }))
  }

  const handleUpdateValues = (newValues: Record<string, number>) => {
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
  }

  const handleHawlUpdate = (hawlMet: boolean) => {
    if (!isHydrated) return // Don't update state before hydration

    setState(prev => ({
      ...prev,
      hawlMet: {
        ...prev.hawlMet,
        [prev.selectedAsset!]: hawlMet
      }
    }))
  }

  const handleNisabUpdate = (amount: number) => {
    if (!isHydrated) return // Don't update state before hydration

    setState(prev => ({
      ...prev,
      nisabThreshold: amount
    }))
  }

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

  // Update nisab threshold when currency changes
  useEffect(() => {
    // Only fetch if currency has actually changed
    if (prevCurrency.current !== state.currency) {
      const fetchNisab = async () => {
        try {
          const response = await fetch(`/api/nisab?currency=${state.currency}`)
          if (!response.ok) throw new Error('Failed to fetch nisab')
          const data = await response.json()
          setState(prev => ({
            ...prev,
            nisabThreshold: data.nisabThreshold
          }))
        } catch (error) {
          console.error('Error fetching nisab:', error)
        }
      }
      fetchNisab()
      prevCurrency.current = state.currency
    }
  }, [state.currency])

  const isEligible = anyHawlMet && totalZakatable >= (state.nisabThreshold || 0)

  // Reset all state
  const handleReset = useCallback(() => {
    // Reset local state
    setState(DEFAULT_STATE)
    // Clear localStorage
    localStorage.removeItem('zakatState')
    // Reset Zustand store
    useZakatStore.getState().reset()
  }, [])

  // Don't render calculator until hydration is complete
  if (!isHydrated) {
    return (
      <div className="fixed inset-0 bg-white">
        <div className="w-full h-full grid grid-cols-[280px_1fr_1.5fr]">
          {/* Show loading state or skeleton UI */}
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="fixed inset-0 bg-white">
        <div className="w-full h-full grid grid-cols-[280px_1fr_1.5fr]">
          {/* Left Column - Asset Selection */}
          <div className="min-h-0 w-full max-w-[280px]">
            <div className="h-full flex flex-col">
              <div className="p-6 flex-none">
                <h2 className="text-xl font-medium text-gray-900">Assets</h2>
              </div>
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="px-6 pb-8">
                    <AssetList
                      selectedAsset={state.selectedAsset}
                      onAssetSelect={handleAssetSelect}
                    />
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          {/* Middle Column - Smart Calculator */}
          <div className="min-h-0 border-l border-gray-100">
            <div className="h-full flex flex-col">
              <div className="p-6 flex-none">
                <h2 className="text-xl font-medium text-gray-900">
                  {state.selectedAsset 
                    ? ASSETS.find(a => a.id === state.selectedAsset)?.name 
                    : "Select an asset to begin"}
                </h2>
              </div>
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="px-6 pb-8">
                    <Calculator
                      selectedAsset={state.selectedAsset}
                      currency={state.currency}
                      onUpdateValues={handleUpdateValues}
                      onHawlUpdate={handleHawlUpdate}
                      onAssetSelect={handleAssetSelect}
                      initialValues={state.selectedAsset ? state.assetValues[state.selectedAsset] : {}}
                      initialHawlMet={state.selectedAsset ? state.hawlMet[state.selectedAsset] : true}
                    />
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          {/* Right Column - Dashboard/Summary */}
          <div className="min-h-0 border-l border-gray-100">
            <div className="h-full flex flex-col">
              <div className="p-6 flex-none">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-medium text-gray-900">Summary</h2>
                  <Button
                    onClick={handleReset}
                    variant="ghost"
                    size="sm"
                  >
                    Reset
                  </Button>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="px-6 pb-8">
                    <div className="rounded-xl border border-gray-100 bg-white p-6">
                      <Summary
                        currency={state.currency}
                      />
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
} 