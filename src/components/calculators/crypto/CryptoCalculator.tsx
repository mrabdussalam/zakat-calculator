'use client'

import { useState, useEffect } from 'react'
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

interface CryptoCalculatorProps {
  currency: string
  onUpdateValues: (values: Record<string, number>) => void
  onHawlUpdate: (hawlMet: boolean) => void
  onCalculatorChange: (calculator: string) => void
  initialValues?: Record<string, number>
  initialHawlMet?: boolean
}

export function CryptoCalculator({
  currency,
  onUpdateValues,
  onHawlUpdate,
  onCalculatorChange,
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

  const [newSymbol, setNewSymbol] = useState('')
  const [newQuantity, setNewQuantity] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Initialize component
  useEffect(() => {
    setCryptoHawl(initialHawlMet)
  }, [initialHawlMet, setCryptoHawl])

  // Handle adding new coin
  const handleAddCoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSymbol || !newQuantity) return

    try {
      await addCoin(newSymbol, Number(newQuantity))
      
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
      await updatePrices()
      
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
  interface BreakdownItem {
    value: number
    isZakatable: boolean
    isExempt: boolean
    label?: string
    tooltip?: string
  }

  const isBreakdownItem = (item: unknown): item is BreakdownItem => {
    return typeof item === 'object' && item !== null &&
      'value' in item && typeof item.value === 'number' &&
      'isZakatable' in item && typeof item.isZakatable === 'boolean' &&
      'isExempt' in item && typeof item.isExempt === 'boolean'
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
          .filter((entry): entry is [string, BreakdownItem] => {
            const [_, item] = entry
            return isBreakdownItem(item)
          })
          .map(([key, item]) => ({
            label: item.label || key,
            value: formatCurrency(item.value),
            tooltip: item.tooltip,
            isZakatable: item.isZakatable,
            isExempt: item.isExempt || false
          }))
      }
    ]
  }

  return (
    <div className="space-y-6">
      <FAQ
        title="Cryptocurrency"
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
          {isLoading ? 'Adding...' : 'Add Coin'}
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
              {cryptoValues.coins.map((coin: {
                symbol: string
                quantity: number
                currentPrice: number
                marketValue: number
                zakatDue: number
              }, index: number) => (
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
                      {coin.quantity.toLocaleString()} × {currency} {coin.currentPrice.toFixed(2)}
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
      />
    </div>
  )
} 