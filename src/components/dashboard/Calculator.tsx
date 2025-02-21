'use client'

import { CashCalculator } from '@/components/calculators/cash/CashCalculator'
import { PersonalJewelryForm } from '@/components/calculators/precious-metals/PersonalJewelryForm'
import { StockCalculator } from '@/components/calculators/stocks/StockCalculator'
import { RetirementCalculator } from '@/components/calculators/retirement/RetirementCalculator'
import { RealEstateCalculator } from '@/components/calculators/realestate/RealEstateCalculator'
import { CryptoCalculator } from '@/components/calculators/crypto/CryptoCalculator'
import { memo, useCallback, useEffect } from 'react'
import { useZakatStore } from '@/store/zakatStore'
import { formatCurrency, cn } from '@/lib/utils'
import { InfoIcon } from 'lucide-react'
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from '@/components/ui/tooltip'

// Add Nisab constants
const NISAB = {
  GOLD_GRAMS: 85,    // 85 grams of gold
  SILVER_GRAMS: 595  // 595 grams of silver
} as const

interface CalculatorProps {
  selectedAsset: string | null
  currency: string
  onUpdateValues: (values: Record<string, number>) => void
  onHawlUpdate: (hawlMet: boolean) => void
  initialValues?: Record<string, number>
  initialHawlMet?: boolean
}

const CashCalculatorMemo = memo(CashCalculator)
const PersonalJewelryFormMemo = memo(PersonalJewelryForm)
const StockCalculatorMemo = memo(StockCalculator)
const RetirementCalculatorMemo = memo(RetirementCalculator)
const RealEstateCalculatorMemo = memo(RealEstateCalculator)
const CryptoCalculatorMemo = memo(CryptoCalculator)

export function Calculator({ 
  selectedAsset, 
  currency, 
  onUpdateValues,
  onHawlUpdate,
  initialValues = {},
  initialHawlMet = true
}: CalculatorProps) {
  const handleUpdateValues = useCallback((values: Record<string, number>) => {
    onUpdateValues(values)
  }, [onUpdateValues])

  const handleHawlUpdate = useCallback((hawlMet: boolean) => {
    onHawlUpdate(hawlMet)
  }, [onHawlUpdate])

  const {
    getTotalAssets,
    getTotalZakatable,
    getZakatDue,
    cashHawlMet,
    metalsHawlMet
  } = useZakatStore()

  // Debug logging
  useEffect(() => {
    console.log('Calculator received props:', {
      selectedAsset,
      initialValues,
      initialHawlMet
    })
  }, [selectedAsset, initialValues, initialHawlMet])

  if (!selectedAsset) {
    return (
      <div className="text-gray-500 text-sm">
        Please select an asset type to begin calculation
      </div>
    )
  }

  const commonProps = {
    currency,
    onUpdateValues: handleUpdateValues,
    onHawlUpdate: handleHawlUpdate,
    initialValues,
    initialHawlMet
  }

  switch (selectedAsset) {
    case 'cash':
      return <CashCalculatorMemo {...commonProps} key={selectedAsset} />
    case 'precious-metals':
      return <PersonalJewelryFormMemo {...commonProps} key={selectedAsset} />
    case 'stocks':
      return <StockCalculatorMemo 
        {...commonProps}
        key={selectedAsset} 
      />
    case 'retirement':
      return <RetirementCalculatorMemo 
        {...commonProps}
        key={selectedAsset} 
      />
    case 'real-estate':
      return <RealEstateCalculatorMemo
        {...commonProps}
        key={selectedAsset}
      />
    case 'crypto':
      return <CryptoCalculatorMemo
        {...commonProps}
        key={selectedAsset}
      />
    default:
      return (
        <div className="text-gray-500 text-sm">
          Calculator for {selectedAsset} coming soon
        </div>
      )
  }
}

export function CalculatorSummary() {
  const { 
    getTotalAssets,
    getTotalZakatable,
    getZakatDue,
    getNisabStatus
  } = useZakatStore()

  const totalAssets = getTotalAssets()
  const totalZakatable = getTotalZakatable()
  const zakatDue = getZakatDue()
  const nisabStatus = getNisabStatus()

  return (
    <TooltipProvider>
      <div className="space-y-8">
        <div className="rounded-xl bg-gray-50 p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Total Assets & Zakat Due
            </h3>
            
            <div className="space-y-3">
              {/* Nisab Status */}
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium",
                    nisabStatus ? "text-green-600" : "text-gray-600"
                  )}>
                    Nisab Status:
                  </span>
                  <span className={cn(
                    "text-sm",
                    nisabStatus ? "text-green-600" : "text-gray-500"
                  )}>
                    {nisabStatus ? "Meets Nisab" : "Below Nisab"}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-gray-400 hover:text-gray-500">
                        <InfoIcon className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">
                        Nisab is met if you have either:<br/>
                        • {NISAB.GOLD_GRAMS}g of gold<br/>
                        • {NISAB.SILVER_GRAMS}g of silver
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Total Assets */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Assets</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(totalAssets)}
                </span>
              </div>

              {/* Zakatable Amount */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Zakatable Amount</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-gray-400 hover:text-gray-500">
                        <InfoIcon className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">
                        Only assets that:<br/>
                        • Meet nisab threshold<br/>
                        • Held for one lunar year<br/>
                        • Not for regular personal use
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(totalZakatable)}
                </span>
              </div>

              {/* Zakat Due */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-600">
                    Zakat Due (2.5%)
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(zakatDue)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
} 