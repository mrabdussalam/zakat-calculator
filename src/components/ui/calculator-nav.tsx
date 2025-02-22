'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from "framer-motion"

// Asset names mapping
const CALCULATOR_NAMES = {
  'cash': 'Cash & Cash Equivalents',
  'precious-metals': 'Precious Metals',
  'stocks': 'Stocks & Investments',
  'retirement': 'Retirement Accounts',
  'real-estate': 'Real Estate',
  'crypto': 'Cryptocurrencies'
} as const

// Asset types in order
const CALCULATOR_ORDER = [
  'cash',
  'precious-metals',
  'stocks',
  'retirement',
  'real-estate',
  'crypto'
] as const

interface CalculatorNavProps {
  currentCalculator: string
  onCalculatorChange: (calculator: string) => void
  className?: string
}

export function CalculatorNav({ currentCalculator, onCalculatorChange, className }: CalculatorNavProps) {
  // Find current index
  const currentIndex = CALCULATOR_ORDER.indexOf(currentCalculator as typeof CALCULATOR_ORDER[number])
  
  // Get prev/next calculators
  const prevCalculator = currentIndex > 0 ? CALCULATOR_ORDER[currentIndex - 1] : null
  const nextCalculator = currentIndex < CALCULATOR_ORDER.length - 1 ? CALCULATOR_ORDER[currentIndex + 1] : null

  return (
    <motion.nav
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
      className={cn(
        "sticky bottom-0 left-0 right-0 bg-white/80 backdrop-blur-[2px] py-2",
        className
      )}
    >
      <div className="flex justify-between items-center">
        {/* Previous button container with fixed width */}
        <div className="w-[44px] flex items-center">
          {prevCalculator && (
            <Button
              variant="secondary"
              size="icon"
              onClick={() => onCalculatorChange(prevCalculator)}
              className="h-11 w-11 bg-gray-100/80 hover:bg-gray-200/80 transition-colors rounded-full"
            >
              <ChevronLeftIcon className="h-5 w-5" />
              <span className="sr-only">Previous calculator</span>
            </Button>
          )}
        </div>
        
        {/* Empty middle space */}
        <div className="flex-1" />
        
        {/* Next button container with fixed width */}
        <div className="w-[44px] flex items-center">
          {nextCalculator && (
            <Button
              variant="secondary"
              size="icon"
              onClick={() => onCalculatorChange(nextCalculator)}
              className="h-11 w-11 bg-gray-100/80 hover:bg-gray-200/80 transition-colors rounded-full"
            >
              <ChevronRightIcon className="h-5 w-5" />
              <span className="sr-only">Next calculator</span>
            </Button>
          )}
        </div>
      </div>
    </motion.nav>
  )
} 