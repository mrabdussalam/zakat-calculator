import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { AssetBreakdown } from "../types"
import { AssetDetails } from "./AssetDetails"
import { cn } from "@/lib/utils"
import { ASSET_COLORS } from "../constants"

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
  const hasDetails = breakdown && Object.keys(breakdown.items).length > 0
  const percentage = totalAssets > 0 ? ((total / totalAssets) * 100).toFixed(1) : '0.0'

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
          "px-2 py-2.5 rounded-lg", 
          hasDetails && "cursor-pointer hover:bg-gray-50"
        )}
        onClick={handleClick}
        onKeyDown={handleKeyPress}
        role={hasDetails ? "button" : undefined}
        tabIndex={hasDetails ? 0 : undefined}
        aria-expanded={hasDetails ? isExpanded : undefined}
      >
        <div className="flex justify-between text-sm">
          <div className="flex items-center">
            <div className="w-8 flex items-center justify-center">
              {hasDetails && (
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 transition-transform",
                    !isExpanded && "-rotate-90"
                  )}
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: ASSET_COLORS[assetType] }}
              />
              <span className="text-gray-900">{title}</span>
              <span className="text-xs text-gray-500">
                {percentage}%
              </span>
              {!hawlMet && (
                <span className="text-xs text-amber-600">(Hawl not met)</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="w-[140px] text-right text-gray-900">
              {total.toLocaleString(undefined, { style: 'currency', currency })}
            </span>
            <span className="w-[140px] text-right text-gray-900">
              {zakatableAmount.toLocaleString(undefined, { style: 'currency', currency })}
            </span>
            <span className="w-[100px] text-right text-gray-900">
              {zakatDue.toLocaleString(undefined, { style: 'currency', currency })}
            </span>
          </div>
        </div>
      </div>

      {isExpanded && hasDetails && (
        <AssetDetails
          items={breakdown.items}
          currency={currency}
          hawlMet={hawlMet}
        />
      )}
    </div>
  )
} 