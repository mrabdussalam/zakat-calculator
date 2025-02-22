import { motion } from "framer-motion"
import { formatCurrency } from "@/lib/utils"

interface AssetDetailsProps {
  items: Record<string, {
    value: number
    isZakatable: boolean
    zakatable: number
    zakatDue: number
    label: string
    tooltip?: string
    isExempt?: boolean
  }>
  currency: string
  hawlMet: boolean
}

export function AssetDetails({ items, currency, hawlMet }: AssetDetailsProps) {
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
        {Object.entries(items).map(([key, item]) => (
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
              <span className="text-gray-500">{item.label}</span>
              {item.isExempt && (
                <span className="text-xs text-gray-500">(Exempt)</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="w-[140px] text-right text-gray-500">
                {formatCurrency(item.value)}
              </span>
              <span className="w-[140px] text-right text-gray-500">
                {formatCurrency(item.zakatable)}
              </span>
              <span className="w-[100px] text-right text-gray-500">
                {formatCurrency(item.zakatDue)}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}