'use client'

import React from 'react'
import { InfoIcon } from 'lucide-react'
import { 
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip"
import { AssetType, AssetBreakdown, AssetBreakdownItem } from '@/lib/assets/types'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface BaseBreakdownItem {
  label: string
  value: string | number
  tooltip?: string
  isExempt: boolean
  isZakatable: boolean
  zakatable?: number
  zakatDue?: number
  percentage?: number
  displayProperties?: {
    showGrossAmount?: boolean
    grossAmount?: number | null
    netAmount?: number | null
  }
}

type BreakdownItem = BaseBreakdownItem

interface Section {
  title: string
  items: BreakdownItem[]
  showBorder?: boolean
}

interface CalculatorSummaryProps {
  title: string
  description?: string
  sections?: Section[]
  
  // New asset-based props
  assetType?: AssetType & {
    getFieldLabel?: (key: string) => string
    getFieldTooltip?: (key: string) => string
  }
  values?: Record<string, any>
  breakdown?: AssetBreakdown
  
  // Common props
  hawlMet?: boolean
  zakatAmount?: number
  footnote?: {
    text: string
    tooltip?: string
  }
}

export function CalculatorSummary({
  title,
  description,
  sections,
  assetType,
  values,
  breakdown,
  hawlMet,
  zakatAmount,
  footnote
}: CalculatorSummaryProps) {
  // Convert asset breakdown to sections if using new props
  const displaySections = React.useMemo(() => {
    if (sections) return sections

    if (assetType && breakdown) {
      // Convert breakdown items to display format
      const items = Object.entries(breakdown.items || {})
        .filter(([_, item]) => item.value !== 0) // Filter out zero-value items
        .map(([key, item]) => ({
          label: item.label || assetType.getFieldLabel?.(key) || key,
          value: formatCurrency(item.value),
          tooltip: item.tooltip || assetType.getFieldTooltip?.(key),
          isExempt: item.isExempt || false,
          isZakatable: item.isZakatable || false,
          displayProperties: item.displayProperties || {
            showGrossAmount: false
          },
          zakatable: item.zakatable ?? item.value
        }))

      // Add totals section
      const totalsItems = []

      // Only add total assets if there are any
      if (breakdown.total > 0) {
        totalsItems.push({
          label: 'Total Assets',
          value: formatCurrency(breakdown.total),
          tooltip: 'Total value of all assets before exemptions',
          isExempt: false,
          isZakatable: false,
          displayProperties: {
            showGrossAmount: false
          },
          zakatable: breakdown.total
        })
      }

      // Only add zakatable amount if there are zakatable assets
      if (breakdown.zakatable > 0) {
        totalsItems.push({
          label: 'Zakatable Amount',
          value: formatCurrency(breakdown.zakatable),
          tooltip: 'Amount subject to Zakat after exemptions',
          isExempt: false,
          isZakatable: true,
          displayProperties: {
            showGrossAmount: false
          },
          zakatable: breakdown.zakatable
        })
      }

      // Only add zakat due if there is zakat due
      if (breakdown.zakatDue > 0) {
        totalsItems.push({
          label: 'Zakat Due',
          value: formatCurrency(breakdown.zakatDue),
          tooltip: 'Zakat amount (2.5% of zakatable assets)',
          isExempt: false,
          isZakatable: true,
          displayProperties: {
            showGrossAmount: false
          },
          zakatable: breakdown.zakatDue
        })
      }

      const sections = []

      // Only add breakdown section if there are items
      if (items.length > 0) {
        sections.push({
          title: 'Asset Breakdown',
          items,
          showBorder: false
        })
      }

      // Only add totals section if there are totals
      if (totalsItems.length > 0) {
        sections.push({
          title: 'Totals',
          items: totalsItems,
          showBorder: true
        })
      }

      return sections
    }

    return []
  }, [sections, assetType, breakdown])

  // If no sections available, return null
  if (!displaySections.length) return null

  return (
    <section className="pt-6 border-t border-gray-100">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="mt-4 rounded-lg bg-gray-50 p-3">
        <div className="space-y-2">
          {displaySections.map((section, index) => (
            <div 
              key={section.title} 
              className={cn(
                "space-y-1.5",
                section.showBorder && "pt-2 border-t border-gray-100"
              )}
            >
              <div className="text-sm font-semibold text-gray-900">{section.title}</div>
              {section.items.map((item, itemIndex) => (
                <div 
                  key={`${item.label}-${itemIndex}`} 
                  className="text-sm flex flex-col gap-1"
                >
                  <div className="flex justify-between">
                    <div className="flex items-center gap-1.5 text-gray-900">
                      <span>{item.label}</span>
                      {item.tooltip && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors">
                              <InfoIcon className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {item.tooltip}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <span className={cn(
                      item.isExempt && "text-gray-600",
                      item.isZakatable && !item.isExempt && "text-green-600",
                      !item.isExempt && !item.isZakatable && "text-gray-900"
                    )}>
                      {item.value}
                    </span>
                  </div>
                  {/* Show net amount if this is a zakatable item with different gross/net amounts */}
                  {item.isZakatable && !item.isExempt && item.zakatable !== undefined && 
                   Number(item.value) !== item.zakatable && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Net Amount (After Tax & Penalties)</span>
                      <span className="text-green-600">{formatCurrency(item.zakatable)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Zakat Calculation if hawlMet */}
          {hawlMet && (zakatAmount || breakdown?.zakatDue) && breakdown?.zakatable && breakdown.zakatable > 0 && (
            <div className="text-sm flex justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-green-600">× Zakat Rate (2.5%)</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors">
                      <InfoIcon className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Zakat is calculated as 2.5% of your zakatable assets.
                    This applies once your total wealth meets or exceeds the nisab threshold.
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-medium text-green-600">
                {typeof zakatAmount === 'number' ? formatCurrency(zakatAmount) : formatCurrency(breakdown?.zakatDue || 0)}
              </span>
            </div>
          )}

          {/* Optional Footnote */}
          {footnote && (
            <div className="text-xs text-gray-500 pt-3 border-t border-gray-100 flex items-center gap-1.5">
              <span>{footnote.text}</span>
              {footnote.tooltip && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors">
                      <InfoIcon className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {footnote.tooltip}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
} 