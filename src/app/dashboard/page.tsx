'use client'

import { useState, useEffect, useRef } from 'react'
import { AssetList, ASSETS, Calculator, Summary } from '@/components/dashboard'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useZakatStore } from '@/store/zakatStore'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SidebarToggle } from '@/components/ui/sidebar-toggle'
import { LockIcon } from '@/components/ui/icons/lock'
import { RetirementValues, StockValues, ActiveStock } from '@/store/types'
import { useDashboardCurrencyConversion } from '@/hooks/dashboard/useDashboardCurrencyConversion'
import { useDashboardState, DashboardState, DEFAULT_STATE } from '@/hooks/dashboard/useDashboardState'
import { FeedbackFormModal } from '@/components/ui/FeedbackFormModal'
import { RefreshIcon } from '@/components/ui/icons'
import Link from 'next/link'

// Local types not exported from the hook
interface ConvertedStock {
  symbol: string;
  company: string;
  shares: number;
  purchasePrice: number;
  currentPrice: number;
  marketValue: number;
  currency: string;
  dateAdded: string;
  notes?: string;
}

// Create a custom type for a stocks updater function since the built-in one doesn't work with arrays
type SetStocksFunction = (key: 'activeStocks', value: ActiveStock[]) => void;

const MotionScrollArea = motion(ScrollArea)

export default function DashboardPage() {
  // Use the custom hook to handle dashboard state
  const {
    state,
    isHydrated,
    prevCurrency,
    handleAssetSelect,
    handleUpdateValues,
    handleHawlUpdate,
    handleNisabUpdate,
    handleReset,
    isEligible
  } = useDashboardState()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [shouldAnimate, setShouldAnimate] = useState(false)

  // Use the currency conversion hook
  const { isConverting: isConvertingCurrency } = useDashboardCurrencyConversion({
    currency: state.currency,
    isHydrated,
    onNisabUpdated: handleNisabUpdate
  })

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

  // Force 'cash' to be the default selected asset when the dashboard loads
  useEffect(() => {
    // Wait for hydration to complete
    if (isHydrated) {
      // Set the selected asset to 'cash' on initial load
      handleAssetSelect('cash')
      console.log('Dashboard: Explicitly set selected asset to cash')
    }
  }, [isHydrated, handleAssetSelect])

  // Custom titles for calculators
  const CALCULATOR_TITLES = {
    stocks: 'Stocks & Investments'
  }

  // Add debug and emergency mechanism to fix any currency inconsistencies
  useEffect(() => {
    // Only run on client and after hydration
    if (!isHydrated) return;

    // Get the current state from the Zakat store
    const zakatStore = useZakatStore.getState();

    // Check if metalPrices exists and has a currency
    if (zakatStore.metalPrices && zakatStore.metalPrices.currency) {
      // If the currency doesn't match the dashboard currency
      if (zakatStore.metalPrices.currency !== state.currency) {
        console.warn('Currency inconsistency detected in Dashboard:', {
          dashboardCurrency: state.currency,
          metalPricesCurrency: zakatStore.metalPrices.currency
        });

        // If we're not in the middle of a conversion
        if (!isConvertingCurrency) {
          console.log('Attempting emergency currency fix in Dashboard');
        }
      }
    }
  }, [isHydrated, state.currency, isConvertingCurrency]);

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

  // Add debugging for localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Log localStorage contents on mount
      try {
        const savedState = localStorage.getItem('zakatState')
        console.log('🌟 Dashboard component mounted, localStorage state check:', {
          exists: !!savedState,
          keys: Object.keys(localStorage),
          hasZakatState: 'zakatState' in localStorage,
          stateSize: savedState ? savedState.length : 0
        })

        if (savedState) {
          try {
            const parsed = JSON.parse(savedState)
            const hasValues = parsed && parsed.assetValues ?
              Object.entries(parsed.assetValues).some(([type, values]) =>
                Object.keys(values || {}).length > 0
              ) : false

            console.log('🌟 Dashboard localStorage content check:', {
              hasAssetValues: !!parsed?.assetValues,
              hasValues,
              assetCount: parsed && parsed.assetValues ?
                Object.keys(parsed.assetValues).length : 0,
              currency: parsed?.currency
            })
          } catch (e) {
            console.error('❌ Error parsing zakatState in dashboard component:', e)
          }
        }
      } catch (error) {
        console.error('❌ Error checking localStorage in dashboard component:', error)
      }
    }
  }, [])

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
      {isConvertingCurrency && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-sm text-gray-600">Converting values to {state.currency}...</p>
          </div>
        </div>
      )}

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
                <FeedbackFormModal />
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
                    <h2 className="section-title">Assets</h2>
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
                    <h2 className="section-title">Summary</h2>
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
                  "section-title transition-opacity",
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
                  <h2 className="section-title">
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
                  <h2 className="section-title">Summary</h2>
                  <div className="flex items-center gap-2">
                    {/* Temporarily commented out until testing is complete
                    <Link href="/zakat-distribution">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                      >
                        Distribute Zakat
                      </Button>
                    </Link>
                    */}
                    <FeedbackFormModal />
                    <Button
                      onClick={handleReset}
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                    >
                      Reset
                    </Button>
                  </div>
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