import { cn, formatCurrency } from "@/lib/utils"
import { useZakatStore } from "@/store/zakatStore"
import { ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"

interface NisabStatusProps {
  nisabStatus: {
    meetsNisab: boolean
    totalValue: number
    nisabValue: number
    thresholds: {
      gold: number
      silver: number
    }
  }
  currency: string
}

export function NisabStatus({ nisabStatus, currency }: NisabStatusProps) {
  const { metalPrices } = useZakatStore()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="rounded-xl bg-gray-50/80">
      {/* Status Header - Always Visible */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-2 w-2 rounded-full",
            nisabStatus.meetsNisab ? "bg-green-500" : "bg-gray-300"
          )} />
          <div className="font-medium text-gray-900">
            {nisabStatus.meetsNisab ? "Meets Nisab" : "Below Nisab"}
          </div>
        </div>
        <motion.div
          initial={false}
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400 group-hover:text-gray-500"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Explanation */}
              <div className="text-sm text-gray-600 leading-relaxed">
                Nisab is the minimum amount of wealth that must be owned before Zakat becomes obligatory.
                It is calculated based on the value of either gold (85g) or silver (595g), whichever is lower.
              </div>

              {/* Thresholds */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white/50 p-3">
                  <div className="text-xs text-gray-500 mb-1">Gold Nisab (85g)</div>
                  <div className="font-medium text-gray-900">{formatCurrency(nisabStatus.thresholds.gold)}</div>
                </div>
                <div className="rounded-lg bg-white/50 p-3">
                  <div className="text-xs text-gray-500 mb-1">Silver Nisab (595g)</div>
                  <div className="font-medium text-gray-900">{formatCurrency(nisabStatus.thresholds.silver)}</div>
                </div>
              </div>

              {/* Status Message */}
              <div className={cn(
                "text-sm font-medium rounded-lg p-3",
                nisabStatus.meetsNisab 
                  ? "bg-green-500/10 text-green-700" 
                  : "bg-gray-500/5 text-gray-700"
              )}>
                {nisabStatus.meetsNisab
                  ? `Your assets exceed the nisab threshold of ${formatCurrency(nisabStatus.nisabValue)}`
                  : `You need ${formatCurrency(nisabStatus.nisabValue - nisabStatus.totalValue)} more to reach nisab`}
              </div>

              {/* Last Updated */}
              <div className="text-[11px] text-gray-400">
                Prices last updated: {new Date(metalPrices?.lastUpdated || Date.now()).toLocaleString()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 