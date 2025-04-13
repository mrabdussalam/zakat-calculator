import { useState } from "react"
import { ChevronDown, ChevronRight, Info } from "lucide-react"
import { AssetBreakdown } from "../types"
import { AssetDetails } from "./AssetDetails"
import { cn, formatCurrency } from "@/lib/utils"
import { ASSET_COLORS } from "@/config/colors"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export interface AssetRowProps {
  title: string
  total: number
  breakdown: AssetBreakdown
  hawlMet: boolean
  currency: string
  assetType: keyof typeof ASSET_COLORS
  totalAssets: number
  isExpanded: boolean
  onToggle: () => void
  sumOfAbsoluteValues?: number
}

export function AssetRow({
  title,
  total,
  breakdown,
  hawlMet,
  currency,
  assetType,
  totalAssets,
  isExpanded,
  onToggle,
  sumOfAbsoluteValues
}: AssetRowProps) {
  const hasDetails = breakdown &&
    Object.keys(breakdown.items).length > 0 &&
    Object.values(breakdown.items).some(item => item.value > 0)

  // Calculate percentage based on the sum of absolute values if provided
  // Otherwise, fall back to the old calculation
  let percentage = '0.0';
  if (sumOfAbsoluteValues && sumOfAbsoluteValues > 0) {
    percentage = ((Math.abs(total) / sumOfAbsoluteValues) * 100).toFixed(1);
  } else if (totalAssets > 0) {
    percentage = ((total / totalAssets) * 100).toFixed(1);
  }

  const isNegativeTotal = total < 0;
  const displayPercentage = isNegativeTotal ? `-${percentage}` : percentage;
  const color = ASSET_COLORS[assetType as keyof typeof ASSET_COLORS]

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (hasDetails) {
      onToggle()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (hasDetails) {
        onToggle()
      }
    }
  }

  // Special handling for debt - we need to check if this is the debt row
  const isDebtRow = assetType === 'debt'

  // Calculate zakatable amount and zakat due based on hawl status
  const zakatableAmount = hawlMet ? breakdown.zakatable : 0
  const zakatDue = hawlMet ? breakdown.zakatDue : 0

  // For debt row, find the receivables item to display in the zakatable column
  let displayZakatableAmount = zakatableAmount;
  if (isDebtRow && breakdown.items && Object.keys(breakdown.items).length > 0) {
    // Find the receivables item (usually has key 'receivables')
    const receivablesItem = Object.entries(breakdown.items).find(([key, item]) =>
      key === 'receivables' || item.label === 'Money Owed to You'
    );

    if (receivablesItem && receivablesItem[1]) {
      // For debt rows, the zakatable amount should be limited to the net impact (total)
      // if it's positive and hawl is met
      if (hawlMet && !isNegativeTotal) {
        // Use the net impact (total) as the zakatable amount, not the full receivables
        displayZakatableAmount = total;
      } else {
        displayZakatableAmount = 0;
      }
    }
  }

  return (
    <div>
      <div
        className={cn(
          "px-2 py-2.5 rounded-lg select-none",
          hasDetails && "cursor-pointer hover:bg-gray-50"
        )}
        onClick={handleClick}
        onKeyDown={handleKeyPress}
        role={hasDetails ? "button" : undefined}
        tabIndex={hasDetails ? 0 : undefined}
        aria-expanded={hasDetails ? isExpanded : undefined}
      >
        <div className="flex justify-between text-sm">
          <div className="flex items-center min-w-0">
            <div className="w-8 flex-shrink-0 flex items-center justify-center">
              <motion.div
                initial={false}
                animate={{ rotate: isExpanded ? 0 : -90 }}
                transition={{ duration: 0.2, ease: [0.2, 0.4, 0.2, 1] }}
              >
                <ChevronDown className={cn(
                  "h-4 w-4",
                  hasDetails ? "text-gray-900" : "text-gray-300"
                )} />
              </motion.div>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-gray-900 truncate">{title}</span>
              {isDebtRow && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs p-3 bg-gray-800">
                      <div className="space-y-2">
                        <p className="font-medium text-white">Receivables:</p>
                        <p className="text-white">Debts owed to you that you are confident will be repaid are considered zakatable assets. This includes personal loans to friends or family.</p>

                        <p className="font-medium text-white">Liabilities:</p>
                        <p className="text-white">Liabilities, such as debts you owe, are deducted from your total zakatable assets to determine your net zakatable wealth. While liabilities reduce your overall zakatable assets, they do not specifically reduce the zakatable amount of receivables. Instead, they decrease your total zakatable wealth, which includes receivables and other assets.</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <span className="text-xs text-gray-500 flex-shrink-0">
                {displayPercentage}%
              </span>
              {!hawlMet && (
                <span className="hidden sm:inline-block text-xs text-amber-600 flex-shrink-0">(Hawl not met)</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-xs flex-shrink-0">
            <span className={cn(
              "w-[100px] sm:w-[140px] text-right",
              isNegativeTotal ? "text-red-600" : "text-gray-900"
            )}>
              {isNegativeTotal ? "-" : ""}{Math.abs(total).toLocaleString(undefined, { style: 'currency', currency })}
            </span>
            <span className="hidden sm:block w-[140px] text-right text-gray-900">
              {displayZakatableAmount.toLocaleString(undefined, { style: 'currency', currency })}
            </span>
            <span className="w-[80px] sm:w-[100px] text-right text-gray-900">
              {zakatDue.toLocaleString(undefined, { style: 'currency', currency })}
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.2, 0.4, 0.2, 1]
            }}
            style={{ overflow: "hidden" }}
          >
            <AssetDetails
              items={breakdown.items}
              currency={currency}
              hawlMet={hawlMet}
              isDebtRow={isDebtRow}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 