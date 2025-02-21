'use client'

import { cn } from "@/lib/utils"
import { CashIcon } from "@/components/ui/icons/cash"
import { GoldIcon } from "@/components/ui/icons/gold"
import { StocksIcon } from "@/components/ui/icons/stocks"
import { RetirementIcon } from "@/components/ui/icons/retirement"
import { RealEstateIcon } from "@/components/ui/icons/realestate"
import { CryptoIcon } from "@/components/ui/icons/crypto"
import { motion } from "framer-motion"

// Asset types with their display properties
export const ASSETS = [
  {
    id: 'cash',
    name: 'Cash & Cash Equivalents',
    description: 'Physical cash, bank accounts, digital wallets',
    icon: CashIcon,
  },
  {
    id: 'precious-metals',
    name: 'Precious Metals',
    description: 'Gold and silver in any form',
    icon: GoldIcon,
  },
  {
    id: 'stocks',
    name: 'Stocks & Investments',
    description: 'Stocks, mutual funds, ETFs',
    icon: StocksIcon,
  },
  {
    id: 'retirement',
    name: 'Retirement Accounts',
    description: '401(k), IRA, pension funds',
    icon: RetirementIcon,
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    description: 'Rental properties and properties for sale',
    icon: RealEstateIcon,
  },
  {
    id: 'crypto',
    name: 'Cryptocurrencies',
    description: 'Digital assets and tokens',
    icon: CryptoIcon,
  }
]

// Color mapping for different asset types (using the same colors as AssetBreakdown)
const assetColors = {
  'cash': {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    selectedBg: 'bg-purple-100',
    selectedIcon: 'text-purple-900',
    base: '#7C3AED', // Purple
  },
  'precious-metals': {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    selectedBg: 'bg-amber-100',
    selectedIcon: 'text-amber-900',
    base: '#F59E0B', // Amber
  },
  'stocks': {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    selectedBg: 'bg-blue-100',
    selectedIcon: 'text-blue-900',
    base: '#3B82F6', // Blue
  },
  'retirement': {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    selectedBg: 'bg-emerald-100',
    selectedIcon: 'text-emerald-900',
    base: '#10B981', // Emerald
  },
  'real-estate': {
    bg: 'bg-pink-50',
    icon: 'text-pink-600',
    selectedBg: 'bg-pink-100',
    selectedIcon: 'text-pink-900',
    base: '#EC4899', // Pink
  },
  'crypto': {
    bg: 'bg-cyan-50',
    icon: 'text-cyan-600',
    selectedBg: 'bg-cyan-100',
    selectedIcon: 'text-cyan-900',
    base: '#06B6D4', // Cyan
  }
} as const

interface AssetListProps {
  selectedAsset: string | null
  onAssetSelect: (assetId: string) => void
}

export function AssetList({ selectedAsset, onAssetSelect }: AssetListProps) {
  return (
    <div className="space-y-2">
      {ASSETS.map((asset) => {
        const Icon = asset.icon
        const isSelected = selectedAsset === asset.id
        const colors = assetColors[asset.id as keyof typeof assetColors]

        return (
          <button
            key={asset.id}
            onClick={() => onAssetSelect(asset.id)}
            className={cn(
              "w-full flex items-center gap-4 px-3 py-3 rounded-lg text-left",
              "relative box-border transition-all duration-200",
              "hover:bg-gray-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
              "before:absolute before:inset-0 before:rounded-lg before:border before:transition-all",
              isSelected 
                ? "bg-white shadow-sm ring-1 ring-gray-200 before:border-transparent" 
                : "bg-white shadow-xs before:border-gray-100 hover:before:border-gray-200"
            )}
          >
            <motion.div 
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                isSelected ? colors.selectedBg : "bg-gray-50"
              )}
              initial={false}
              animate={{ 
                scale: isSelected ? [1, 0.9, 1] : 1,
              }}
              transition={{ 
                duration: 0.2,
                times: [0, 0.5, 1]
              }}
            >
              <Icon 
                size={20} 
                className={cn(
                  "transition-all",
                  isSelected ? colors.selectedIcon : "text-gray-600"
                )} 
              />
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className={cn(
                "text-sm font-medium transition-colors",
                isSelected ? "text-gray-900" : "text-gray-700"
              )}>
                {asset.name}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
} 