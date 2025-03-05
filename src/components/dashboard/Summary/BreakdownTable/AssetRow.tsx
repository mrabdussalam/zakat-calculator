import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { AssetBreakdown } from "../types"
import { AssetDetails } from "./AssetDetails"
import { cn } from "@/lib/utils"
import { ASSET_COLORS } from "@/config/colors"
import { motion, AnimatePresence } from "framer-motion"

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
  onToggle
}: AssetRowProps) {
  const hasDetails = breakdown &&
    Object.keys(breakdown.items).length > 0 &&
    Object.values(breakdown.items).some(item => item.value > 0)
  const percentage = totalAssets > 0 ? ((total / totalAssets) * 100).toFixed(1) : '0.0'
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
              <span className="text-xs text-gray-500 flex-shrink-0">
                {percentage}%
              </span>
              {!hawlMet && (
                <span className="hidden sm:inline-block text-xs text-amber-600 flex-shrink-0">(Hawl not met)</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-xs flex-shrink-0">
            <span className="w-[100px] sm:w-[140px] text-right text-gray-900">
              {total.toLocaleString(undefined, { style: 'currency', currency })}
            </span>
            <span className="hidden sm:block w-[140px] text-right text-gray-900">
              {zakatableAmount.toLocaleString(undefined, { style: 'currency', currency })}
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
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 