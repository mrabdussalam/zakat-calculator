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
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform, animate } from 'framer-motion'
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from '@/components/ui/tooltip'

// Animation variants for the slide effect
const slideAnimation = {
  initial: { 
    opacity: 0, 
    x: 4,
  },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "tween",
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1]
    }
  },
  exit: { 
    opacity: 0, 
    x: -4,
    transition: {
      duration: 0.1
    }
  }
}

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
  onAssetSelect: (assetId: string) => void
  initialValues?: Record<string, number>
  initialHawlMet?: boolean
}

interface CommonCalculatorProps {
  currency: string
  onUpdateValues: (values: Record<string, number>) => void
  onHawlUpdate: (hawlMet: boolean) => void
  onCalculatorChange: (calculator: string) => void
  initialValues?: Record<string, number>
  initialHawlMet?: boolean
}

const CashCalculatorMemo = memo(CashCalculator) as React.FC<CommonCalculatorProps>
const PersonalJewelryFormMemo = memo(PersonalJewelryForm) as React.FC<CommonCalculatorProps>
const StockCalculatorMemo = memo(StockCalculator) as React.FC<CommonCalculatorProps>
const RetirementCalculatorMemo = memo(RetirementCalculator) as React.FC<CommonCalculatorProps>
const RealEstateCalculatorMemo = memo(RealEstateCalculator) as React.FC<CommonCalculatorProps>
const CryptoCalculatorMemo = memo(CryptoCalculator) as React.FC<CommonCalculatorProps>

// Animated number component
function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(value)
  const rounded = useTransform(motionValue, latest => {
    return formatCurrency(Math.round(latest * 100) / 100)
  })

  useEffect(() => {
    const controls = animate(motionValue, value, {
      type: "tween",
      duration: 0.5,
      ease: [0.32, 0.72, 0, 1], // Custom easing for smooth counter effect
      onComplete: () => {
        // Ensure we end up with the exact value
        motionValue.set(value)
      }
    })

    return controls.stop
  }, [value, motionValue])

  return (
    <motion.span
      initial={false}
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {rounded}
    </motion.span>
  )
}

export function Calculator({ 
  selectedAsset, 
  currency, 
  onUpdateValues,
  onHawlUpdate,
  onAssetSelect,
  initialValues = {},
  initialHawlMet = true
}: CalculatorProps) {
  const handleUpdateValues = useCallback((values: Record<string, number>) => {
    onUpdateValues(values)
  }, [onUpdateValues])

  const handleHawlUpdate = useCallback((hawlMet: boolean) => {
    onHawlUpdate(hawlMet)
  }, [onHawlUpdate])

  const handleCalculatorChange = useCallback((calculator: string) => {
    onAssetSelect(calculator)
  }, [onAssetSelect])

  const { getBreakdown } = useZakatStore()

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
    onCalculatorChange: handleCalculatorChange,
    initialValues,
    initialHawlMet
  }

  const renderCalculator = () => {
    switch (selectedAsset) {
      case 'cash':
        return <CashCalculatorMemo {...commonProps} />
      case 'precious-metals':
        return <PersonalJewelryFormMemo {...commonProps} />
      case 'stocks':
        return <StockCalculatorMemo {...commonProps} />
      case 'retirement':
        return <RetirementCalculatorMemo {...commonProps} />
      case 'real-estate':
        return <RealEstateCalculatorMemo {...commonProps} />
      case 'crypto':
        return <CryptoCalculatorMemo {...commonProps} />
      default:
        return (
          <div className="text-gray-500 text-sm">
            Calculator for {selectedAsset} coming soon
          </div>
        )
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedAsset}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={slideAnimation}
        className="w-full max-w-full overflow-hidden"
      >
        {renderCalculator()}
      </motion.div>
    </AnimatePresence>
  )
}

export function CalculatorSummary() {
  const { getBreakdown } = useZakatStore()
  const breakdown = getBreakdown()

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
                    breakdown.combined.meetsNisab.meetsNisab ? "text-green-600" : "text-gray-600"
                  )}>
                    Nisab Status:
                  </span>
                  <span className={cn(
                    "text-sm",
                    breakdown.combined.meetsNisab.meetsNisab ? "text-green-600" : "text-gray-500"
                  )}>
                    {breakdown.combined.meetsNisab.meetsNisab ? "Meets Nisab" : "Below Nisab"}
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
                  <AnimatedNumber value={breakdown.combined.totalValue} />
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
                  <AnimatedNumber value={breakdown.combined.zakatableValue} />
                </span>
              </div>

              {/* Zakat Due */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-600">
                    Zakat Due (2.5%)
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    <AnimatedNumber value={breakdown.combined.zakatDue} />
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