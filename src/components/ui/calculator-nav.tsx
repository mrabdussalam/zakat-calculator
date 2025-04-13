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
  'crypto': 'Cryptocurrencies',
  'debt': 'Debt & Liabilities'
} as const

// Asset types in order
const CALCULATOR_ORDER = [
  'cash',
  'precious-metals',
  'stocks',
  'retirement',
  'real-estate',
  'crypto',
  'debt'
] as const

interface NavButtonProps {
  direction: 'prev' | 'next'
  calculator: string
  onClick: () => void
}

function NavButton({ direction, calculator, onClick }: NavButtonProps) {
  const label = CALCULATOR_NAMES[calculator as keyof typeof CALCULATOR_NAMES]

  return (
    <div className="relative">
      <Button
        variant="secondary"
        onClick={onClick}
        className={cn(
          "h-11 group overflow-hidden transition-all duration-200 ease-out",
          "bg-gray-100/80 hover:bg-gray-900 rounded-full",
          direction === 'prev' ?
            "w-11 px-0" :
            "w-auto px-3"
        )}
      >
        <div className={cn(
          "flex items-center gap-2",
          direction === 'prev' ? "flex-row" : "flex-row-reverse"
        )}>
          <div className={cn(
            "transition-transform duration-200 ease-out text-gray-600 group-hover:text-white",
            direction === 'prev'
              ? "group-hover:-translate-x-0.5"
              : "group-hover:translate-x-0.5"
          )}>
            {direction === 'prev' ? (
              <ChevronLeftIcon className="h-5 w-5 shrink-0" />
            ) : (
              <ChevronRightIcon className="h-5 w-5 shrink-0" />
            )}
          </div>
          {direction === 'next' && (
            <span className="text-sm font-medium whitespace-nowrap pl-1.5 text-gray-600 group-hover:text-white transition-colors">
              {label}
            </span>
          )}
        </div>
      </Button>
    </div>
  )
}

interface CalculatorNavProps {
  currentCalculator: string
  onCalculatorChange: (calculator: string) => void
  className?: string
  onOpenSummary?: () => void
}

export function CalculatorNav({
  currentCalculator,
  onCalculatorChange,
  className,
  onOpenSummary
}: CalculatorNavProps) {
  // Find current index
  const currentIndex = CALCULATOR_ORDER.indexOf(currentCalculator as typeof CALCULATOR_ORDER[number])

  // Get prev/next calculators
  const prevCalculator = currentIndex > 0 ? CALCULATOR_ORDER[currentIndex - 1] : null
  const nextCalculator = currentIndex < CALCULATOR_ORDER.length - 1 ? CALCULATOR_ORDER[currentIndex + 1] : null

  // Check if we're on the last calculator
  const isLastCalculator = currentIndex === CALCULATOR_ORDER.length - 1

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
        {/* Previous button */}
        <div>
          {prevCalculator && (
            <NavButton
              direction="prev"
              calculator={prevCalculator}
              onClick={() => onCalculatorChange(prevCalculator)}
            />
          )}
        </div>

        {/* Empty middle space */}
        <div className="flex-1" />

        {/* Next button or Summary button on mobile */}
        <div>
          {isLastCalculator && onOpenSummary ? (
            <div className="lg:hidden">
              <Button
                variant="secondary"
                onClick={onOpenSummary}
                className="h-11 px-4 bg-gray-100/80 hover:bg-gray-200/80 rounded-full"
              >
                <span className="text-sm font-medium">View Summary</span>
              </Button>
            </div>
          ) : nextCalculator && (
            <NavButton
              direction="next"
              calculator={nextCalculator}
              onClick={() => onCalculatorChange(nextCalculator)}
            />
          )}
        </div>
      </div>
    </motion.nav>
  )
} 