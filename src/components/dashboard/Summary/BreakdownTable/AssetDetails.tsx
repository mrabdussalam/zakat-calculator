import { motion } from "framer-motion"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface AssetDetailsProps {
  items: Record<string, {
    value: number
    isZakatable: boolean
    zakatable: number
    zakatDue: number
    label: string
    tooltip?: string
    isExempt?: boolean
    isLiability?: boolean
  }>
  currency: string
  hawlMet: boolean
  isDebtRow?: boolean
}

export function AssetDetails({ items, currency, hawlMet, isDebtRow = false }: AssetDetailsProps) {
  return (
    <div className="pl-[58px] pr-2 pb-2 pt-1">
      <motion.div
        className="space-y-2"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05
            }
          }
        }}
      >
        {Object.entries(items).map(([key, item]) => {
          // Check if this is a liability item
          const isLiability = item.isLiability ||
            key.includes('liabilities') ||
            (item.label && (
              item.label.includes('Liabilities') ||
              item.label.includes('Debts')
            ));

          // Check for negative values
          const isNegativeValue = item.value < 0;

          return (
            <motion.div
              key={key}
              className="flex justify-between text-xs"
              variants={{
                hidden: { opacity: 0, y: 5 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{
                duration: 0.2,
                ease: [0.2, 0.4, 0.2, 1]
              }}
            >
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-gray-500",
                  !isLiability && isNegativeValue && "text-red-600"
                )}>
                  {item.label}
                  {!isLiability && isNegativeValue && " (-)"}
                </span>
                {item.isExempt && !isLiability && (
                  <span className="text-xs text-green-600">(Exempt)</span>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <span className={cn(
                  "w-[100px] sm:w-[140px] text-right text-gray-500",
                  isNegativeValue && "text-red-600"
                )}>
                  {formatCurrency(Math.abs(item.value), currency)}
                </span>
                <span className="hidden sm:block w-[140px] text-right text-gray-500">
                  {formatCurrency(item.zakatable, currency)}
                </span>
                <span className="w-[80px] sm:w-[100px] text-right text-gray-500">
                  {formatCurrency(item.zakatDue, currency)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  )
}