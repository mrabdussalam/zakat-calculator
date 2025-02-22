import { formatCurrency } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { useEffect } from "react"

// Animated number component
function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(value)
  const rounded = useTransform(motionValue, latest => {
    return formatCurrency(Math.round(latest * 100) / 100)
  })

  useEffect(() => {
    const controls = animate(motionValue, value, {
      type: "tween",
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1], // Ultra smooth easing
      onComplete: () => {
        motionValue.set(value)
      }
    })

    return controls.stop
  }, [value, motionValue])

  return (
    <motion.span
      initial={false}
      animate={{ 
        scale: value === 0 ? 1 : [1, 1.005, 1]
      }}
      transition={{ duration: 0.15 }}
    >
      {rounded}
    </motion.span>
  )
}

interface TotalHeaderProps {
  totalAssets: number
  breakdown: {
    combined: {
      zakatDue: number
    }
  }
  nisabStatus: {
    meetsNisab: boolean
    nisabValue: number
  }
  currency: string
}

export function TotalHeader({ totalAssets, breakdown, nisabStatus, currency }: TotalHeaderProps) {
  return (
    <div className="flex flex-col gap-4 bg-white rounded-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-500">Total Assets</div>
          <div className="text-2xl font-medium">
            <motion.span
              initial={false}
              animate={{ 
                scale: totalAssets === 0 ? 1 : [1, 1.005, 1]
              }}
              transition={{ duration: 0.15 }}
              className="text-gray-900"
            >
              {formatCurrency(totalAssets)}
            </motion.span>
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Zakat Due</div>
          <div>
            <div className="text-2xl font-medium">
              <motion.span
                initial={false}
                animate={{ 
                  scale: breakdown.combined.zakatDue === 0 ? 1 : [1, 1.005, 1]
                }}
                transition={{ duration: 0.15 }}
                className="text-green-600"
              >
                {formatCurrency(breakdown.combined.zakatDue)}
              </motion.span>
            </div>
            <div className="text-sm text-gray-500">
              {!nisabStatus.meetsNisab ? 'No Zakat due (Below Nisab)' : '2.5% of eligible assets'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 