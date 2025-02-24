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
import { Menu, X, ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SidebarToggle } from '@/components/ui/sidebar-toggle'

interface DashboardState {
  selectedAsset: string | null
  assetValues: Record<string, Record<string, number>>
  hawlMet: Record<string, boolean>
  nisabThreshold?: number
  currency: string
  setupCompleted: boolean
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
  currency: 'USD',
  setupCompleted: true
}

const MotionScrollArea = motion(ScrollArea)

export default function DashboardPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const prevCurrency = useRef<string>(DEFAULT_STATE.currency)
  const [shouldAnimate, setShouldAnimate] = useState(false)
  
  // Add window size detection
  useEffect(() => {
    const handleResize = () => {
      // Auto collapse on screens smaller than 1440px
      if (window.innerWidth < 1440) {
        setIsCollapsed(true)
      } else {
        setIsCollapsed(false)
      }
    }

    // Initial check
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Check if we're coming from the loading transition
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const transitionTime = params.get('t')
    
    if (transitionTime) {
      // If we have a transition timestamp, wait a bit before starting animations
      setTimeout(() => {
        setShouldAnimate(true)
      }, 100) // Small delay to ensure smooth transition
    } else {
      // If direct navigation, animate immediately
      setShouldAnimate(true)
    }
  }, [])

  // Custom titles for calculators
  const CALCULATOR_TITLES = {
    stocks: 'Stocks & Investments'
  }

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
            return {
              ...parsed,
              setupCompleted: true
            } as DashboardState
          }
        } catch (e) {
          console.error('Failed to parse saved state:', e)
        }
      }
      
      // If no saved state, initialize with setup completed
      localStorage.setItem('zakatState', JSON.stringify({
        ...DEFAULT_STATE,
        setupCompleted: true
      }))
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

  // Animation variants
  const containerVariants = {
    hidden: { 
      opacity: 0
    },
    visible: { 
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.15,
        duration: 0.2
      }
    }
  }

  const columnVariants = {
    hidden: { 
      opacity: 0,
      x: -20
    },
    visible: { 
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3
      }
    }
  }

  // Remove variants from inner elements to prevent double animation
  const innerVariants = {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
  }

  // Don't render until hydration is complete
  if (!isHydrated) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-white"
      />
    )
  }

  return (
    <TooltipProvider>
      <motion.div 
        className="h-screen w-screen overflow-hidden bg-white relative"
        initial="hidden"
        animate={shouldAnimate ? "visible" : "hidden"}
        variants={containerVariants}
      >
        {/* Mobile Top Bar */}
        <motion.div 
          variants={innerVariants}
          className="lg:hidden fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-100"
        >
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="rounded-full md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                >
                  Reset
                </Button>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button
                    onClick={() => setIsMobileSummaryOpen(true)}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                  >
                    Summary
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              className="md:hidden fixed inset-0 z-50 bg-black/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <motion.div 
                className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-lg flex flex-col"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="font-medium text-gray-900">Assets</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-full"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close menu</span>
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-4">
                    {ASSETS.map(asset => (
                      <Button
                        key={asset.id}
                        variant={state.selectedAsset === asset.id ? 'default' : 'ghost'}
                        onClick={() => {
                          handleAssetSelect(asset.id)
                          setIsMobileMenuOpen(false)
                        }}
                        className="w-full justify-start text-left mb-2"
                      >
                        {asset.name}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Summary Overlay */}
        <AnimatePresence>
          {isMobileSummaryOpen && (
            <motion.div 
              className="lg:hidden fixed inset-0 z-50 bg-white"
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="h-full flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Summary</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMobileSummaryOpen(false)}
                      className="rounded-full"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close summary</span>
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      <Summary currency={state.currency} />
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Layout */}
        <div className="w-full h-full grid lg:grid-cols-[auto_minmax(500px,1fr)_minmax(400px,1.5fr)] md:grid-cols-[auto_1fr] grid-cols-[100%] transition-all duration-200">
          {/* Left Column - Asset Selection */}
          <motion.div 
            variants={innerVariants}
            className={cn(
              "min-h-0 md:block hidden relative transition-all duration-200 bg-gray-50/80",
              isCollapsed ? "w-[68px]" : "w-[280px]"
            )}
          >
            {/* Collapse Toggle Button */}
            <SidebarToggle
              isCollapsed={isCollapsed}
              onToggle={() => setIsCollapsed(!isCollapsed)}
            />

            <div className="h-full flex flex-col">
              <motion.div 
                variants={innerVariants}
                className="p-6 flex-none"
              >
                <h2 className={cn(
                  "text-2xl font-nb-international text-gray-900 transition-opacity font-medium tracking-tight",
                  isCollapsed ? "opacity-0" : "opacity-100"
                )}>
                  Assets
                </h2>
              </motion.div>
              <div className="flex-1 min-h-0">
                <MotionScrollArea 
                  variants={innerVariants}
                  className="h-full"
                >
                  <div className={cn(
                    "pb-8",
                    isCollapsed ? "px-3" : "px-6",
                    "space-y-2"
                  )}>
                    <AssetList
                      selectedAsset={state.selectedAsset}
                      onAssetSelect={handleAssetSelect}
                      isCollapsed={isCollapsed}
                    />
                  </div>
                </MotionScrollArea>
              </div>
            </div>
          </motion.div>

          {/* Middle Column - Smart Calculator */}
          <motion.div 
            variants={innerVariants}
            className={cn(
              "min-h-0 border-l border-gray-100 lg:pt-0 pt-16 w-full transition-all duration-200",
              isCollapsed ? "lg:pl-6" : "lg:pl-0"
            )}
          >
            <div className="h-full flex flex-col">
              <motion.div 
                variants={innerVariants}
                className="p-4 sm:p-6 flex-none"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-nb-international text-gray-900 font-medium tracking-tight">
                    {state.selectedAsset 
                      ? CALCULATOR_TITLES[state.selectedAsset as keyof typeof CALCULATOR_TITLES] || 
                        ASSETS.find(a => a.id === state.selectedAsset)?.name 
                      : "Select an asset to begin"}
                  </h2>
                </div>
              </motion.div>
              <div className="flex-1 min-h-0">
                <MotionScrollArea 
                  variants={innerVariants}
                  className="h-full"
                >
                  <div className="px-4 sm:px-6 pb-8">
                    <div className="max-w-[800px] overflow-hidden rounded-lg mx-auto">
                      <div className="p-0.5">
                        <Calculator
                          selectedAsset={state.selectedAsset}
                          currency={state.currency}
                          onUpdateValues={handleUpdateValues}
                          onHawlUpdate={handleHawlUpdate}
                          onAssetSelect={handleAssetSelect}
                          onOpenSummary={() => setIsMobileSummaryOpen(true)}
                          initialValues={state.selectedAsset ? state.assetValues[state.selectedAsset] : {}}
                          initialHawlMet={state.selectedAsset ? state.hawlMet[state.selectedAsset] : true}
                        />
                      </div>
                    </div>
                  </div>
                </MotionScrollArea>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Dashboard/Summary */}
          <motion.div 
            variants={innerVariants}
            className="min-h-0 border-l border-gray-100 lg:block hidden"
          >
            <div className="h-full flex flex-col">
              <motion.div 
                variants={innerVariants}
                className="p-6 flex-none"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-nb-international text-gray-900 font-medium tracking-tight">Summary</h2>
                  <Button
                    onClick={handleReset}
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                  >
                    Reset
                  </Button>
                </div>
              </motion.div>
              <div className="flex-1 min-h-0">
                <MotionScrollArea 
                  variants={innerVariants}
                  className="h-full"
                >
                  <div className="px-6 pb-8">
                    <div className="rounded-3xl border border-gray-100 bg-white p-6">
                      <Summary
                        currency={state.currency}
                      />
                    </div>
                  </div>
                </MotionScrollArea>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </TooltipProvider>
  )
} 