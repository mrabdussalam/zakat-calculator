'use client'

import { useCallback, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { InfoIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip"
import { useZakatStore } from '@/store/zakatStore'
import { evaluateExpression, formatCurrency as formatCurrencyBase } from '@/lib/utils'
import type { StockValues } from '@/lib/assets/stocks'
import type { PassiveInvestment } from '@/store/types'
import { Tabs } from '@/components/ui/tabs'
import { ActiveTradingTab } from './tabs/ActiveTradingTab'
import { PassiveInvestmentsTab, type PassiveCalculations } from './tabs/PassiveInvestmentsTab'
import { DividendEarningsTab } from './tabs/DividendEarningsTab'
import { CalculatorSummary } from '@/components/ui/calculator-summary'
import { getAssetType } from '@/lib/assets/registry'
import { CalculatorNav } from '@/components/ui/calculator-nav'
import { ExtendedWindow } from '@/types'
import { CalculatorProps } from '@/types/calculator'
import { useStoreHydration } from '@/hooks/useStoreHydration'
import { useCalculatorReset } from '@/hooks/useCalculatorReset'

interface StockHolding {
  ticker: string
  shares: number
  currentPrice: number
  lastUpdated: Date
}

// Define the PassiveInvestmentState interface directly in this file
interface CompanyFinancials {
  cash: number
  receivables: number
  inventory: number
  totalShares: number
  yourShares: number
  displayProperties?: {
    currency: string
    sharePercentage: number
  }
}

interface PassiveInvestmentState {
  version: '2.0'
  method: 'quick' | 'detailed'
  investments: PassiveInvestment[]
  marketValue: number
  zakatableValue: number
  companyData?: CompanyFinancials
  hawlStatus: {
    isComplete: boolean
    startDate?: string
    endDate?: string
  }
  displayProperties: {
    currency: string
    method: string
    totalLabel: string
  }
}

// Define the stock fields that need to be reset
const STOCK_FIELDS = [
  'passive_investments',
  'active_stocks'
] as const;

export function StockCalculator({
  currency,
  onUpdateValues,
  onHawlUpdate,
  onCalculatorChange,
  onOpenSummary,
  initialValues = {},
  initialHawlMet = true
}: CalculatorProps) {
  const {
    stockValues,
    stockHawlMet,
    stockPrices,
    setStockHawl,
    getTotalStocks,
    getTotalZakatableStocks,
    addActiveStock,
    removeActiveStock,
    updateStockPrices,
    getActiveStocksBreakdown,
    setStockValue,
    updatePassiveInvestments: updatePassiveInvestmentsStore,
    passiveInvestments,
    resetStockValues
  } = useZakatStore()

  const stockAsset = getAssetType('stocks')

  const [newTicker, setNewTicker] = useState('')
  const [newShares, setNewShares] = useState('')
  const [newPricePerShare, setNewPricePerShare] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passiveCalculations, setPassiveCalculations] = useState<PassiveCalculations | null>(null)

  const isHydrated = useStoreHydration()

  // Post-hydration initialization
  useEffect(() => {
    if (!isHydrated) return
    if (stockValues) {
      setStockHawl(stockHawlMet)
      onHawlUpdate(stockHawlMet)

      // Restore passiveCalculations from persisted store so summary shows correct values
      const pi = stockValues.passiveInvestments
      if (pi && pi.marketValue > 0 && !passiveCalculations) {
        setPassiveCalculations({
          totalMarketValue: pi.marketValue,
          zakatableValue: pi.zakatableValue,
          method: pi.method,
          breakdown: {
            marketValue: pi.marketValue,
            liquidValue: pi.zakatableValue,
            items: (pi.investments || []).map(inv => ({
              id: inv.id,
              label: inv.name || 'Unnamed Investment',
              value: inv.marketValue,
              zakatableValue: inv.marketValue * 0.3,
              percentage: pi.marketValue > 0 ? (inv.marketValue / pi.marketValue) * 100 : 0,
              isExempt: false,
              displayProperties: {
                shares: inv.shares,
                pricePerShare: inv.pricePerShare,
                currency
              }
            }))
          },
          displayProperties: pi.displayProperties
        })
      }
    }
  }, [isHydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle store resets
  const handleStoreReset = useCallback(() => {
    setNewTicker('');
    setNewShares('');
    setNewPricePerShare('');
    setError(null);
    setPassiveCalculations(null);
    resetStockValues();
    onUpdateValues({
      total_stock_value: 0,
      zakatable_stock_value: 0,
      passive_total_value: 0,
      passive_zakatable_value: 0
    });
  }, [onUpdateValues, resetStockValues])

  useCalculatorReset(isHydrated, handleStoreReset)

  // Handle value changes for passive/dividend/fund tabs
  const handleValueChange = (fieldId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value

    // Only allow numbers, decimal points, and basic math operators
    if (!/^[\d+\-*/.() ]*$/.test(inputValue) && inputValue !== '') {
      return // Ignore invalid characters
    }

    // Always update the store with the raw input value to maintain what the user is typing
    setStockValue(fieldId as keyof typeof stockValues, inputValue as any)

    try {
      // Allow empty input
      if (!inputValue) {
        // Update the store with zero
        setStockValue(fieldId as keyof typeof stockValues, 0)

        // Update parent with new totals
        if (stockAsset) {
          const updatedValues = {
            ...stockValues,
            [fieldId]: 0
          }

          const total = stockAsset.calculateTotal(updatedValues, stockPrices)
          const zakatable = stockAsset.calculateZakatable(updatedValues, stockPrices, stockHawlMet)

          onUpdateValues({
            total_stock_value: total,
            zakatable_stock_value: zakatable
          })
        }
        return
      }

      // Only evaluate if the expression is complete (not ending with an operator or open parenthesis)
      if (!/[+\-*/.()]$/.test(inputValue) && !/\(\s*$/.test(inputValue)) {
        // Remove any commas from the input before evaluating
        const cleanInput = inputValue.replace(/,/g, '')

        try {
          // Convert to numeric value (handles calculations)
          const numericValue = evaluateExpression(cleanInput)

          // Only update store if we have a valid number
          if (!isNaN(numericValue) && isFinite(numericValue) && stockAsset) {
            // Update the store with the numeric result
            setStockValue(fieldId as keyof typeof stockValues, numericValue)

            // Get updated totals using the asset type system
            const updatedValues = {
              ...stockValues,
              [fieldId]: numericValue
            }

            const total = stockAsset.calculateTotal(updatedValues, stockPrices)
            const zakatable = stockAsset.calculateZakatable(updatedValues, stockPrices, stockHawlMet)

            // Update parent with new totals
            onUpdateValues({
              total_stock_value: total,
              zakatable_stock_value: zakatable
            })
          }
        } catch (evalError) {
          console.warn('Error evaluating expression:', evalError)
          // Keep the raw input in the store but don't update numeric calculations
        }
      }
    } catch (error) {
      // Invalid calculation - don't update store with the numeric value
      // but keep the raw input value for user experience
      console.warn('Invalid calculation:', error)
    }
  }

  // Handle passive investments calculations
  const handlePassiveCalculations = useCallback((calculations: PassiveCalculations) => {
    if (!stockAsset) return

    setPassiveCalculations(calculations)

    // Create new passive investment state
    const newPassiveState: PassiveInvestmentState = {
      version: '2.0',
      method: calculations.method,
      investments: calculations.method === 'quick' ?
        calculations.breakdown.items.map(item => ({
          id: item.id,
          name: item.label,
          shares: item.displayProperties.shares || 0,
          pricePerShare: item.displayProperties.pricePerShare || 0,
          marketValue: item.value
        })) : [],
      marketValue: calculations.totalMarketValue,
      zakatableValue: calculations.zakatableValue,
      companyData: calculations.method === 'detailed' ? {
        cash: 0,
        receivables: 0,
        inventory: 0,
        totalShares: 0,
        yourShares: 0,
        displayProperties: {
          currency,
          sharePercentage: 0
        }
      } : undefined,
      hawlStatus: {
        isComplete: stockHawlMet,
        startDate: new Date().toISOString()
      },
      displayProperties: {
        currency,
        method: calculations.method === 'quick' ? '30% Rule' : 'CRI Method',
        totalLabel: calculations.method === 'quick' ? 'Total Investments' : 'Total Company Assets'
      }
    }

    // Update the store with new state
    updatePassiveInvestmentsStore(calculations.method, {
      investments: newPassiveState.investments,
      companyData: newPassiveState.companyData
    }, {
      marketValue: calculations.totalMarketValue,
      zakatableValue: calculations.zakatableValue,
      method: calculations.method
    })

    // Update parent with all values
    onUpdateValues({
      total_stock_value: stockAsset.calculateTotal({ ...stockValues, passiveInvestments: newPassiveState }, stockPrices),
      zakatable_stock_value: stockAsset.calculateZakatable({ ...stockValues, passiveInvestments: newPassiveState }, stockPrices, stockHawlMet),
      passive_total_value: calculations.totalMarketValue,
      passive_zakatable_value: calculations.zakatableValue
    })
  }, [stockValues, stockPrices, stockHawlMet, stockAsset, onUpdateValues, currency])

  // Add new stock holding
  const handleAddStock = async (e: React.FormEvent, manualPrice?: number) => {
    if (!stockAsset) return

    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Pass currency when adding stock
      await addActiveStock(newTicker, Number(newShares), manualPrice, currency)

      // Clear form
      setNewTicker('')
      setNewShares('')

      // Get fresh state from store after async update (closure-captured stockValues is stale)
      const freshState = useZakatStore.getState()
      const total = stockAsset.calculateTotal(freshState.stockValues, freshState.stockPrices)
      const zakatable = stockAsset.calculateZakatable(freshState.stockValues, freshState.stockPrices, freshState.stockHawlMet)

      // Update parent with new totals
      onUpdateValues({
        total_stock_value: total,
        zakatable_stock_value: zakatable
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add stock. Please check the ticker and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Remove stock holding
  const handleRemoveStock = (ticker: string) => {
    if (!stockAsset) return

    removeActiveStock(ticker)

    // Get fresh state from store after update (closure-captured stockValues is stale)
    const freshState = useZakatStore.getState()
    const total = stockAsset.calculateTotal(freshState.stockValues, freshState.stockPrices)
    const zakatable = stockAsset.calculateZakatable(freshState.stockValues, freshState.stockPrices, freshState.stockHawlMet)

    // Update parent with new totals
    onUpdateValues({
      total_stock_value: total,
      zakatable_stock_value: zakatable
    })
  }

  // Manual refresh of prices
  const handleRefreshPrices = async () => {
    if (!stockAsset) return

    setIsLoading(true)

    try {
      // Pass currency to the update function
      await updateStockPrices(currency)

      // Get fresh state from store after async update (closure-captured stockValues is stale)
      const freshState = useZakatStore.getState()
      const total = stockAsset.calculateTotal(freshState.stockValues, freshState.stockPrices)
      const zakatable = stockAsset.calculateZakatable(freshState.stockValues, freshState.stockPrices, freshState.stockHawlMet)

      // Update parent with new totals
      onUpdateValues({
        total_stock_value: total,
        zakatable_stock_value: zakatable
      })
    } catch (err) {
      setError('Failed to refresh prices. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const { stocks, total } = getActiveStocksBreakdown()
  const activeStocksValue = total.marketValue || 0
  const passiveValue = passiveCalculations?.totalMarketValue || 0
  const passiveZakatableValue = passiveCalculations?.zakatableValue || 0
  const dividendValue = stockValues.total_dividend_earnings || 0

  // Calculate total zakatable amount
  const totalZakatable = stockHawlMet ? (
    activeStocksValue + // Active trading - full value
    (passiveCalculations?.zakatableValue || 0) + // Passive - 30% or CRI value
    dividendValue // Dividends - full value
  ) : 0

  // Format currency helper
  const formatCurrency = (value: number) => formatCurrencyBase(value, currency)

  // Prepare summary sections
  const summaryData = {
    title: "Stocks & Investments",
    description: "Review your stock portfolio's zakatable assets and calculated Zakat amount.",
    sections: [
      {
        title: "Portfolio Overview",
        items: [
          {
            label: "Total Portfolio Value",
            value: formatCurrency(activeStocksValue + (passiveCalculations?.totalMarketValue || 0) + dividendValue),
            tooltip: "Combined value of all your stock investments"
          }
        ]
      },
      {
        title: "Calculation Details",
        showBorder: true,
        items: [
          ...(activeStocksValue > 0 ? [{
            label: "Active Trading",
            value: formatCurrency(stockHawlMet ? activeStocksValue : 0),
            tooltip: "100% of market value is zakatable"
          }] : []),
          ...(passiveCalculations?.totalMarketValue ? [{
            label: passiveCalculations?.method === 'quick' ? "Passive Investments (30% Rule)" : "Passive Investments (CRI)",
            value: formatCurrency(stockHawlMet ? passiveCalculations?.zakatableValue || 0 : 0),
            tooltip: passiveCalculations?.method === 'quick'
              ? "30% of market value is considered zakatable"
              : "Based on your share of company's liquid assets",
            marketValue: passiveCalculations.totalMarketValue, // Add full market value for reference
            zakatableValue: passiveCalculations.zakatableValue // Add zakatable value for reference
          }] : []),
          ...(dividendValue > 0 ? [{
            label: "Dividend Earnings",
            value: formatCurrency(stockHawlMet ? dividendValue : 0),
            tooltip: "Total dividend earnings are fully zakatable"
          }] : []),
        ]
      }
    ]
  }

  const tabs = [
    {
      id: 'active',
      label: 'Active',
      content: (
        <ActiveTradingTab
          currency={currency}
          holdings={stocks}
          onAddStock={handleAddStock}
          onRemoveStock={(symbol: string) => handleRemoveStock(symbol)}
          onRefreshPrices={handleRefreshPrices}
          isLoading={isLoading}
          error={error}
          newTicker={newTicker}
          setNewTicker={setNewTicker}
          newShares={newShares}
          setNewShares={setNewShares}
          inputValues={stockValues}
          onValueChange={handleValueChange}
        />
      )
    },
    {
      id: 'passive',
      label: 'Passive',
      content: (
        <PassiveInvestmentsTab
          currency={currency}
          inputValues={stockValues}
          onValueChange={handleValueChange}
          onCalculate={handlePassiveCalculations}
          updatePassiveInvestments={(state: PassiveInvestmentState) => {
            updatePassiveInvestmentsStore(state.method, {
              investments: state.investments,
              companyData: state.companyData
            })
          }}
          passiveInvestments={passiveInvestments as PassiveInvestmentState | undefined}
        />
      )
    },
    {
      id: 'dividend',
      label: 'Dividends',
      content: (
        <DividendEarningsTab
          currency={currency}
          inputValues={stockValues}
          onValueChange={handleValueChange}
        />
      )
    },
  ]

  return (
    <div className="space-y-6">
      <Tabs
        tabs={tabs}
        defaultTab="active"
      />

      {/* Navigation */}
      <CalculatorNav
        currentCalculator="stocks"
        onCalculatorChange={onCalculatorChange}
        onOpenSummary={onOpenSummary}
      />
    </div>
  )
} 