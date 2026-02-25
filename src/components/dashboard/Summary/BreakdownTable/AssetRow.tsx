import { useState } from "react"
import { ChevronDown, ChevronRight, Info } from "lucide-react"
import { AssetBreakdown } from "../types"
import { AssetDetails } from "./AssetDetails"
import { cn } from "@/lib/utils"
import { ASSET_COLORS } from "@/config/colors"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslations } from 'next-intl'

export interface AssetRowProps {
  title: string
  total: number
  breakdown: AssetBreakdown
  hawlMet: boolean
  currency: string
  assetType: keyof typeof ASSET_COLORS
  totalAssets: number
  sumOfAbsoluteValues?: number
  isExpanded: boolean
  onToggle: () => void
}

export function AssetRow({
  title,
  total,
  breakdown,
  hawlMet,
  currency,
  assetType,
  totalAssets,
  sumOfAbsoluteValues,
  isExpanded,
  onToggle
}: AssetRowProps) {
  const t = useTranslations('summary')

  const hasDetails = breakdown &&
    Object.keys(breakdown.items).length > 0 &&
    Object.values(breakdown.items).some(item => item.value !== 0)

  // Use sumOfAbsoluteValues for percentage to avoid broken values when debts reduce totalAssets
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

  // Calculate zakatable amount and zakat due based on hawl status
  const zakatableAmount = hawlMet ? breakdown.zakatable : 0
  const zakatDue = hawlMet ? breakdown.zakatDue : 0

  // Debt row special handling
  const isDebtRow = assetType === 'debt'

  let displayZakatableAmount = zakatableAmount;
  if (isDebtRow && breakdown.items && Object.keys(breakdown.items).length > 0) {
    const receivablesItem = Object.entries(breakdown.items).find(([key, item]) =>
      key === 'receivables' || item.label === 'Money Owed to You'
    );
    if (receivablesItem && receivablesItem[1]) {
      if (hawlMet && !isNegativeTotal) {
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
                      <Info className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs p-3 bg-gray-800">
                      <div className="space-y-2">
                        <p className="font-medium text-white">{t('debtReceivables')}</p>
                        <p className="text-white">{t('debtReceivablesDesc')}</p>

                        <p className="font-medium text-white">{t('debtLiabilities')}</p>
                        <p className="text-white">{t('debtLiabilitiesDesc')}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <span className="text-xs text-gray-500 flex-shrink-0">
                {displayPercentage}%
              </span>
              {!hawlMet && (
                <span className="hidden sm:inline-block text-xs text-amber-600 flex-shrink-0">({t('hawlNotMet')})</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-xs flex-shrink-0">
            <span className="w-[100px] sm:w-[140px] text-right text-gray-900">
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