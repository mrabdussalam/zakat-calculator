'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/label'
import { useZakatStore } from '@/store/zakatStore'
import { CalculatorSummary } from '@/components/ui/calculator-summary'
import { FAQ } from '@/components/ui/faq'
import { ASSET_FAQS } from '@/config/faqs'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshIcon } from '@/components/ui/icons/refresh'
import { cn } from '@/lib/utils'
import { CalculatorNav } from '@/components/ui/calculator-nav'
import { Loader2, Trash2 } from 'lucide-react'
import { Info } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface CryptoCalculatorProps {
  currency: string
  onUpdateValues: (values: Record<string, number>) => void
  onHawlUpdate: (hawlMet: boolean) => void
  onCalculatorChange: (calculator: string) => void
  onOpenSummary?: () => void
  initialValues?: Record<string, number>
  initialHawlMet?: boolean
}

export function CryptoCalculator({
  currency,
  onUpdateValues,
  onHawlUpdate,
  onCalculatorChange,
  onOpenSummary,
  initialValues = {},
  initialHawlMet = true
}: CryptoCalculatorProps) {
  const {
    cryptoValues,
    cryptoHawlMet,
    isLoading,
    lastError,
    addCoin,
    removeCoin,
    updatePrices,
    setCryptoHawl,
    getTotalCrypto,
    getTotalZakatableCrypto,
    getCryptoBreakdown
  } = useZakatStore()

  // Add a state to track if store has been hydrated
  const [storeHydrated, setStoreHydrated] = useState(false)

  const [newSymbol, setNewSymbol] = useState('')
  const [newQuantity, setNewQuantity] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Add a listener for the store hydration event
  useEffect(() => {
    const handleHydrationComplete = () => {
      console.log('CryptoCalculator: Store hydration complete event received')
      setStoreHydrated(true)

      // After hydration, safely initialize form values from store with a small delay
      setTimeout(() => {
        console.log('CryptoCalculator: Initializing values from store after hydration');

        // Set hawl status first
        setCryptoHawl(cryptoHawlMet);
        onHawlUpdate(cryptoHawlMet);

        // Notify parent component of current values
        if (onUpdateValues) {
          onUpdateValues({
            total_crypto_value: getTotalCrypto(),
            zakatable_crypto_value: getTotalZakatableCrypto()
          });
        }

        console.log('CryptoCalculator: Values initialized from store after hydration');
      }, 50); // Small delay to ensure store is fully ready
    }

    // Listen for the custom hydration event
    window.addEventListener('zakatStoreHydrated', handleHydrationComplete)

    // Check if hydration already happened
    if (typeof window !== 'undefined') {
      // Safe way to check for custom property without TypeScript errors
      const win = window as any;
      if (win.zakatStoreHydrationComplete) {
        handleHydrationComplete();
      }
    }

    return () => {
      window.removeEventListener('zakatStoreHydrated', handleHydrationComplete)
    }
  }, [cryptoHawlMet, getTotalCrypto, getTotalZakatableCrypto, onHawlUpdate, onUpdateValues, setCryptoHawl])

  // Initialize component - only run after hydration is complete
  useEffect(() => {
    // Skip initialization during hydration to prevent overwriting store values
    if (!storeHydrated) return;

    setCryptoHawl(initialHawlMet)
  }, [initialHawlMet, setCryptoHawl, storeHydrated])

  // Add a listener to detect store resets
  useEffect(() => {
    // Only process resets after hydration is complete to prevent false resets
    if (!storeHydrated) return;

    const handleReset = () => {
      console.log('CryptoCalculator: Store reset event detected');

      // Check if this is still during initial page load
      if (typeof window !== 'undefined') {
        // Safe way to check for custom property without TypeScript errors
        const win = window as any;
        if (win.isInitialPageLoad) {
          console.log('CryptoCalculator: Ignoring reset during initial page load');
          return;
        }
      }

      // This is a user-initiated reset, so clear all local state
      console.log('CryptoCalculator: Clearing local state due to user-initiated reset');

      // Clear form inputs
      setNewSymbol('');
      setNewQuantity('');
      setError(null);

      // Ensure the total is updated after reset
      setTimeout(() => {
        onUpdateValues({
          total_crypto_value: 0,
          zakatable_crypto_value: 0
        });
      }, 100);
    };

    // Listen for both possible reset event names
    window.addEventListener('store-reset', handleReset);
    window.addEventListener('zakat-store-reset', handleReset);

    // Cleanup
    return () => {
      window.removeEventListener('store-reset', handleReset);
      window.removeEventListener('zakat-store-reset', handleReset);
    };
  }, [storeHydrated, onUpdateValues]);

  // Handle adding new coin
  const handleAddCoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSymbol || !newQuantity) return

    try {
      await addCoin(newSymbol, Number(newQuantity), currency)

      // Clear form
      setNewSymbol('')
      setNewQuantity('')

      // Update parent with new totals
      onUpdateValues({
        total_crypto_value: getTotalCrypto(),
        zakatable_crypto_value: getTotalZakatableCrypto()
      })
    } catch (error) {
      // Error is handled by the store
    }
  }

  // Handle removing a coin
  const handleRemoveCoin = (symbol: string) => {
    removeCoin(symbol)

    // Update parent with new totals
    onUpdateValues({
      total_crypto_value: getTotalCrypto(),
      zakatable_crypto_value: getTotalZakatableCrypto()
    })
  }

  // Handle refreshing prices
  const handleRefreshPrices = async () => {
    try {
      await updatePrices(currency)

      // Update parent with new totals
      onUpdateValues({
        total_crypto_value: getTotalCrypto(),
        zakatable_crypto_value: getTotalZakatableCrypto()
      })
    } catch (error) {
      // Set error message in the component
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Failed to update prices. Please try again.')
      }
    }
  }

  // Format currency helper
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return `${currency} 0.00`
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  // Get breakdown for summary
  const breakdown = getCryptoBreakdown()
  const totalValue = getTotalCrypto()
  const zakatableValue = getTotalZakatableCrypto()

  // Type guard for breakdown items
  interface CryptoBreakdownItem {
    value: number
    isZakatable: boolean
    isExempt: boolean
    zakatable: number
    zakatDue: number
    label: string
    tooltip: string
    percentage?: number
  }

  const isBreakdownItem = (item: unknown): item is CryptoBreakdownItem => {
    return typeof item === 'object' && item !== null &&
      'value' in item && typeof item.value === 'number' &&
      'isZakatable' in item && typeof item.isZakatable === 'boolean' &&
      'isExempt' in item && typeof item.isExempt === 'boolean' &&
      'zakatable' in item && typeof item.zakatable === 'number' &&
      'zakatDue' in item && typeof item.zakatDue === 'number' &&
      'label' in item && typeof item.label === 'string' &&
      'tooltip' in item && typeof item.tooltip === 'string'
  }

  // Prepare summary sections
  const summaryData = {
    title: "Cryptocurrency Portfolio",
    sections: [
      {
        title: "Portfolio Overview",
        items: [
          {
            label: "Total Portfolio Value",
            value: formatCurrency(totalValue),
            tooltip: "Combined value of all your cryptocurrency holdings",
            isZakatable: false,
            isExempt: false
          }
        ]
      },
      {
        title: "Holdings Breakdown",
        showBorder: true,
        items: Object.entries(breakdown.items)
          .map(([key, item]) => ({
            label: item.label || key,
            value: formatCurrency(item.value),
            tooltip: item.tooltip || `${key}: ${formatCurrency(item.value)}`,
            isZakatable: item.isZakatable,
            isExempt: item.isExempt || false
          }))
      }
    ]
  }

  // Update the CryptoHolding type to include isFallback
  interface CryptoHolding {
    symbol: string
    quantity: number
    currentPrice: number
    marketValue: number
    zakatDue: number
    currency?: string
    isFallback?: boolean
  }

  return (
    <div className="space-y-6">
      <FAQ
        title="Crypto"
        description="Enter your cryptocurrency holdings to calculate Zakat."
        items={[
          {
            question: "How is cryptocurrency Zakat calculated?",
            answer: "Cryptocurrency Zakat is calculated at 2.5% of the total market value when Hawl is met."
          },
          {
            question: "What cryptocurrencies are supported?",
            answer: "We support major cryptocurrencies including Bitcoin (BTC), Ethereum (ETH), and others. Enter the symbol to check if it's supported."
          },
          {
            question: "How are prices updated?",
            answer: "Prices are fetched from reliable cryptocurrency exchanges and can be manually refreshed using the 'Refresh Prices' button."
          }
        ]}
        defaultOpen={false}
      />

      {/* Add New Coin Form */}
      <form onSubmit={handleAddCoin} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="symbol">Coin/Token Symbol</Label>
            <Input
              id="symbol"
              value={newSymbol}
              onChange={e => setNewSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. BTC, ETH"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              step="any"
              min="0"
              value={newQuantity}
              onChange={e => setNewQuantity(e.target.value)}
              placeholder="Enter amount"
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-500">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || !newSymbol || !newQuantity}
          className="w-full"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding...
            </span>
          ) : 'Add Coin'}
        </Button>
      </form>

      {/* Holdings List */}
      <AnimatePresence>
        {cryptoValues?.coins && cryptoValues.coins.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.2, 0.4, 0.2, 1]
            }}
            className="mt-6 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-gray-700">Your Holdings</h4>
              <div className="flex items-center gap-2">
                {error && (
                  <p className="text-xs text-amber-600">
                    {error}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefreshPrices}
                  disabled={isLoading}
                  className="h-8 w-8 text-gray-500 hover:text-gray-900 rounded-full"
                >
                  <RefreshIcon className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  <span className="sr-only">Refresh prices</span>
                </Button>
              </div>
            </div>
            <motion.div
              className="space-y-2"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.08
                  }
                }
              }}
            >
              {cryptoValues.coins.map((coin: CryptoHolding, index: number) => (
                <motion.div
                  key={`${coin.symbol}-${index}`}
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  transition={{
                    duration: 0.4,
                    ease: [0.2, 0.4, 0.2, 1]
                  }}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="px-2 py-1 bg-gray-900 rounded-md">
                      <p className="font-mono text-xs font-medium text-white">{coin.symbol}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {coin.quantity.toLocaleString()} × {new Intl.NumberFormat(undefined, {
                        style: 'currency',
                        currency: coin.currency || currency,
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }).format(coin.currentPrice)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-medium text-gray-900">
                      {formatCurrency(coin.marketValue)}
                    </p>
                    <button
                      onClick={() => handleRemoveCoin(coin.symbol)}
                      className="text-gray-400 hover:text-red-500 transition-colors text-xs"
                    >
                      ×
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <p className="mt-2 text-xs text-gray-500">
              Cryptocurrency Zakat is calculated at 2.5% of the total market value.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4"
          >
            <motion.div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Temporarily hidden calculator summary
      {getTotalCrypto() > 0 && (
        <CalculatorSummary
          title="Cryptocurrency Portfolio Summary"
          sections={summaryData.sections}
          hawlMet={cryptoHawlMet}
          zakatAmount={zakatableValue * 0.025}
          footnote={{
            text: "Cryptocurrency Zakat is calculated at 2.5% of the total value when Hawl is met.",
            tooltip: "The entire value of your cryptocurrency holdings is considered zakatable."
          }}
        />
      )}
      */}

      {/* Navigation */}
      <CalculatorNav
        currentCalculator="crypto"
        onCalculatorChange={onCalculatorChange}
        onOpenSummary={onOpenSummary}
      />
    </div>
  )
} 