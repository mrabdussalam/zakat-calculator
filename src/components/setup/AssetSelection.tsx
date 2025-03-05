'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form/form"
import { ASSET_CATEGORIES } from "@/config/asset-categories"
import { cn } from "@/lib/utils"
import { CashIcon } from "@/components/ui/icons/cash"
import { GoldIcon } from "@/components/ui/icons/gold"
import { StocksIcon } from "@/components/ui/icons/stocks"
import { RealEstateIcon } from "@/components/ui/icons/realestate"
import { CryptoIcon } from "@/components/ui/icons/crypto"
import { DebtIcon } from "@/components/ui/icons/debt"

// Map category IDs to their respective icons
const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  'cash': CashIcon,
  'precious-metals': GoldIcon,
  'stocks': StocksIcon,
  'retirement': StocksIcon,
  'real-estate': RealEstateIcon,
  'crypto': CryptoIcon,
  'other-financial': CashIcon,
  'debt-receivable': DebtIcon,
}

// Debug log to check category IDs
console.log('Category IDs:', Object.values(ASSET_CATEGORIES).map(cat => cat.id))
console.log('Available icons:', Object.keys(CATEGORY_ICONS))

// Color mapping for different asset categories
const categoryColors: Record<string, { bg: string, icon: string, selectedBg: string, selectedIcon: string }> = {
  'cash': {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    selectedBg: 'bg-purple-100',
    selectedIcon: 'text-purple-900',
  },
  'precious-metals': {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    selectedBg: 'bg-amber-100',
    selectedIcon: 'text-amber-900',
  },
  'stocks': {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    selectedBg: 'bg-blue-100',
    selectedIcon: 'text-blue-900',
  },
  'retirement': {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    selectedBg: 'bg-blue-100',
    selectedIcon: 'text-blue-900',
  },
  'real-estate': {
    bg: 'bg-pink-50',
    icon: 'text-pink-600',
    selectedBg: 'bg-pink-100',
    selectedIcon: 'text-pink-900',
  },
  'crypto': {
    bg: 'bg-cyan-50',
    icon: 'text-cyan-600',
    selectedBg: 'bg-cyan-100',
    selectedIcon: 'text-cyan-900',
  },
  'other-financial': {
    bg: 'bg-indigo-50',
    icon: 'text-indigo-600',
    selectedBg: 'bg-indigo-100',
    selectedIcon: 'text-indigo-900',
  },
  'debt-receivable': {
    bg: 'bg-violet-50',
    icon: 'text-violet-600',
    selectedBg: 'bg-violet-100',
    selectedIcon: 'text-violet-900',
  },
}

interface AssetSelectionProps {
  onSubmit: (selectedAssets: string[]) => void
  initialSelection?: string[]
  currency: string
}

export function AssetSelection({
  onSubmit,
  initialSelection = ['cash'],
  currency
}: AssetSelectionProps) {
  const [selectedAssets, setSelectedAssets] = useState<string[]>(initialSelection)

  const toggleAsset = (assetId: string) => {
    setSelectedAssets(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    )
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(selectedAssets)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-medium text-gray-900">Select Your Assets</h2>
        <p className="text-sm text-gray-500">
          Choose the types of assets to include in your {currency} Zakat calculation.
        </p>
      </div>

      <Form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          {Object.values(ASSET_CATEGORIES).map((category) => {
            const Icon = CATEGORY_ICONS[category.id]
            console.log(`Rendering category: ${category.id}, Icon:`, Icon ? 'found' : 'not found')
            if (!Icon) {
              console.warn(`No icon found for category: ${category.id}`)
              return null
            }

            const isSelected = selectedAssets.includes(category.id)
            const colors = categoryColors[category.id] || {
              bg: 'bg-gray-50',
              icon: 'text-gray-500',
              selectedBg: 'bg-gray-100',
              selectedIcon: 'text-gray-900'
            }

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleAsset(category.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 rounded-lg border text-left transition-colors",
                  "hover:border-gray-200 hover:bg-gray-50",
                  "focus:outline-none focus:ring-2 focus:ring-gray-200",
                  isSelected ? "border-gray-900 bg-gray-50" : "border-gray-100"
                )}
              >
                {/* Category Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  isSelected ? colors.selectedBg : colors.bg
                )}>
                  <Icon size={20} className={cn(
                    "transition-colors",
                    isSelected ? colors.selectedIcon : colors.icon
                  )} />
                </div>

                {/* Category Info */}
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-sm font-medium transition-colors",
                    isSelected ? "text-gray-900" : "text-gray-700"
                  )}>{category.name}</div>
                  <div className="text-xs text-gray-500">{category.description}</div>
                </div>

                {/* Selection Indicator */}
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 shrink-0 transition-colors",
                  isSelected
                    ? "border-gray-900 bg-gray-900"
                    : "border-gray-200"
                )}>
                  {isSelected && (
                    <svg
                      className="w-full h-full text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <Button type="submit" className="w-full">
          Continue
        </Button>
      </Form>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          You can always modify your asset selection later
        </p>
      </div>
    </div>
  )
} 