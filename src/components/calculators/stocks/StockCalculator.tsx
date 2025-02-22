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
import { evaluateExpression } from '@/lib/utils'
import type { StockValues } from '@/lib/assets/stocks'
import type { PassiveInvestmentState } from '@/store/types'
import { Tabs } from '@/components/ui/tabs'
import { ActiveTradingTab } from './tabs/ActiveTradingTab'
import { PassiveInvestmentsTab, type PassiveCalculations } from './tabs/PassiveInvestmentsTab'
import { DividendEarningsTab } from './tabs/DividendEarningsTab'
import { CalculatorSummary } from '@/components/ui/calculator-summary'
import { getAssetType } from '@/lib/assets/registry'

interface StockCalculatorProps {
  currency: string
  onUpdateValues: (values: Record<string, number>) => void
  onHawlUpdate: (hawlMet: boolean) => void
  initialValues?: Record<string, number>
  initialHawlMet?: boolean
}

interface StockHolding {
  ticker: string
  shares: number
  currentPrice: number
  lastUpdated: Date
}

export function StockCalculator({ 
  currency,
  onUpdateValues,
  onHawlUpdate,
  initialValues = {},
  initialHawlMet = true
}: StockCalculatorProps) {
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
    passiveInvestments
  } = useZakatStore()

  const stockAsset = getAssetType('stocks')
  
  const [newTicker, setNewTicker] = useState('')
  const [newShares, setNewShares] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passiveCalculations, setPassiveCalculations] = useState<PassiveCalculations | null>(null)

  // Initialize component
  useEffect(() => {
    setStockHawl(initialHawlMet)
  }, [])

  // Handle value changes for passive/dividend/fund tabs
  const handleValueChange = (fieldId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value
    
    // Only allow numbers, decimal points, and basic math operators
    if (!/^[\d+\-*/.() ]*$/.test(inputValue) && inputValue !== '') {
      return // Ignore invalid characters
    }

    try {
      // Convert to numeric value (handles calculations)
      const numericValue = evaluateExpression(inputValue)
      
      // Only update store if we have a valid number
      if (!isNaN(numericValue) && stockAsset) {
        // Update the store
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
    } catch (error) {
      // Invalid calculation - don't update store
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
        cash: stockValues.company_cash || 0,
        receivables: stockValues.company_receivables || 0,
        inventory: stockValues.company_inventory || 0,
        totalShares: stockValues.total_shares_issued || 0,
        yourShares: stockValues.passive_shares || 0,
        displayProperties: {
          currency,
          sharePercentage: stockValues.total_shares_issued > 0 ? 
            (stockValues.passive_shares / stockValues.total_shares_issued) * 100 : 0
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
    }, calculations)
    
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
      await addActiveStock(newTicker, Number(newShares), manualPrice)
      
      // Clear form
      setNewTicker('')
      setNewShares('')

      // Get updated totals using the asset type system
      const total = stockAsset.calculateTotal(stockValues, stockPrices)
      const zakatable = stockAsset.calculateZakatable(stockValues, stockPrices, stockHawlMet)

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
    
    // Get updated totals using the asset type system
    const total = stockAsset.calculateTotal(stockValues, stockPrices)
    const zakatable = stockAsset.calculateZakatable(stockValues, stockPrices, stockHawlMet)

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
      await updateStockPrices()
      
      // Get updated totals using the asset type system
      const total = stockAsset.calculateTotal(stockValues, stockPrices)
      const zakatable = stockAsset.calculateZakatable(stockValues, stockPrices, stockHawlMet)

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
  const formatCurrency = (value: number) => `${currency} ${value.toLocaleString()}`

  // Prepare summary sections
  const summaryData = {
    title: "Stock Portfolio Summary",
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

      {/* Summary Section - Only show if there are values */}
      {(activeStocksValue + passiveValue + dividendValue) > 0 && (
        <CalculatorSummary
          {...summaryData}
          hawlMet={stockHawlMet}
          zakatAmount={totalZakatable * 0.025}
          footnote={{
            text: "Different calculation methods apply to different types of investments.",
            tooltip: "Active trading uses full market value, while passive investments may use 30% or CRI method."
          }}
        />
      )}
    </div>
  )
} 