'use client'

import { cn } from "@/lib/utils"
import { CashIcon } from "@/components/ui/icons/cash"
import { GoldIcon } from "@/components/ui/icons/gold"
import { StocksIcon } from "@/components/ui/icons/stocks"
import { RetirementIcon } from "@/components/ui/icons/retirement"
import { RealEstateIcon } from "@/components/ui/icons/realestate"
import { CryptoIcon } from "@/components/ui/icons/crypto"
import { motion } from "framer-motion"
import { ASSET_COLOR_VARIANTS } from '@/config/colors'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Asset types with their display properties
export const ASSETS = [
  {
    id: 'cash',
    name: 'Cash',
    description: 'Bank accounts & savings',
    icon: CashIcon,
  },
  {
    id: 'precious-metals',
    name: 'Precious Metals',
    description: 'Gold & silver holdings',
    icon: GoldIcon,
  },
  {
    id: 'stocks',
    name: 'Stocks',
    description: 'Stocks & mutual funds',
    icon: StocksIcon,
  },
  {
    id: 'retirement',
    name: 'Retirement',
    description: '401(k) & IRA accounts',
    icon: RetirementIcon,
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    description: 'Properties & rentals',
    icon: RealEstateIcon,
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    description: 'Digital assets',
    icon: CryptoIcon,
  },
] as const

interface AssetListProps {
  selectedAsset: string | null
  onAssetSelect: (assetId: string) => void
  isCollapsed?: boolean
}

export function AssetList({ selectedAsset, onAssetSelect, isCollapsed }: AssetListProps) {
  return (
    <div className={cn(
      "space-y-2.5 rounded-3xl",
      !isCollapsed && "space-y-3"
    )}>
      {ASSETS.map((asset) => {
        const Icon = asset.icon
        const isSelected = selectedAsset === asset.id
        const colors = ASSET_COLOR_VARIANTS[asset.id as keyof typeof ASSET_COLOR_VARIANTS]

        return (
          <TooltipProvider key={asset.id} delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onAssetSelect(asset.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg text-left group",
                    "relative box-border transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
                    "before:absolute before:inset-0 before:rounded-lg before:border before:transition-all",
                    isSelected
                      ? "bg-white before:border-transparent shadow-sm"
                      : "bg-transparent before:border-transparent hover:bg-white/80",
                    isCollapsed
                      ? "px-2 py-2"
                      : "px-3 py-3"
                  )}
                >
                  <motion.div
                    className={cn(
                      "rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden transition-colors",
                      isCollapsed ? "w-8 h-8" : "w-10 h-10",
                      isSelected
                        ? cn(
                          colors.selectedBg,
                          "border border-black/[0.12]",
                          colors.selectedIcon
                        )
                        : cn(
                          colors.bg,
                          "border border-black/[0.05] shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
                          colors.icon
                        )
                    )}
                    initial={false}
                    animate={{
                      scale: isSelected ? [1, 0.9, 1] : 1,
                    }}
                    whileHover={!isSelected ? { scale: 1.1 } : undefined}
                    transition={{
                      duration: 0.2,
                      times: [0, 0.5, 1]
                    }}
                  >
                    <Icon
                      size={isCollapsed ? 18 : 20}
                      className="transition-all relative z-10"
                    />
                  </motion.div>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "text-sm transition-colors",
                        isSelected ? "text-gray-900 font-semibold" : "text-gray-800 font-medium"
                      )}>
                        {asset.name}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{asset.description}</div>
                    </div>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5} className={!isCollapsed ? "hidden" : undefined}>
                <div>
                  <div className="font-medium">{asset.name}</div>
                  <div className="text-xs text-gray-500">{asset.description}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}
    </div>
  )
} 