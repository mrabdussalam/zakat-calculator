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
}

export function AssetList({ selectedAsset, onAssetSelect }: AssetListProps) {
  return (
    <div className="space-y-2.5">
      {ASSETS.map((asset) => {
        const Icon = asset.icon
        const isSelected = selectedAsset === asset.id
        const colors = ASSET_COLOR_VARIANTS[asset.id as keyof typeof ASSET_COLOR_VARIANTS]

        return (
          <button
            key={asset.id}
            onClick={() => onAssetSelect(asset.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group",
              "relative box-border transition-all duration-200 min-h-[68px]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
              "before:absolute before:inset-0 before:rounded-lg before:border before:transition-all",
              isSelected 
                ? "bg-black/[0.04] before:border-transparent" 
                : "bg-white before:border-gray-100 hover:before:border-gray-200"
            )}
          >
            <motion.div 
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden transition-colors",
                isSelected 
                  ? cn(
                      colors.selectedBg,
                      "border border-black/[0.08]",
                      colors.selectedIcon
                    )
                  : cn(
                      colors.bg,
                      "border-0",
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
                size={20}
                className="transition-all relative z-10"
              />
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className={cn(
                "text-sm font-medium transition-colors",
                isSelected ? "text-gray-900" : "text-gray-800"
              )}>
                {asset.name}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">{asset.description}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
} 