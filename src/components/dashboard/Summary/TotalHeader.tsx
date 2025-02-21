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
        scale: value === 0 ? 1 : [1, 1.005, 1],
        color: value === 0 ? "#6B7280" : undefined // gray-500 if zero
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
          <div className="text-2xl font-medium text-gray-900">
            <AnimatedNumber value={totalAssets} />
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Zakat Due</div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <div className="text-2xl font-medium text-green-600">
                  <AnimatedNumber value={breakdown.combined.zakatDue} />
                </div>
                <div className="text-sm text-gray-500">
                  {!nisabStatus.meetsNisab ? 'No Zakat due (Below Nisab)' : '2.5% of eligible assets'}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-sm">
                {!nisabStatus.meetsNisab 
                  ? `Your total wealth (${formatCurrency(totalAssets)}) is below the Nisab threshold (${formatCurrency(nisabStatus.nisabValue)}). Zakat is only due when your wealth exceeds Nisab.`
                  : 'Zakat is calculated as 2.5% of your eligible assets that have completed their Hawl period.'}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
} 