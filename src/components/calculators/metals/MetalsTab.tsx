'use client'

import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/label'
import { InfoIcon, FAQIcon } from '@/components/ui/icons'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { 
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip"
import { MetalsValues } from '@/store/types/index'

const HELP_ITEMS = [
  {
    title: "Do I Pay Zakat on Unused Gold Jewelry?",
    description: "If jewelry is NOT regularly worn (e.g., stored for long periods), many scholars say Zakat is due on it. If in doubt, consult a scholar."
  },
  {
    title: "What If I Have Gold/Silver ETFs or Digital Gold?",
    description: "Gold ETFs, digital gold, or silver-backed investments are treated as investment assets, meaning Zakat applies at 2.5% on the full market value."
  }
]

interface MetalsTabProps {
  currency: string
  inputValues: MetalsValues
  onValueChange: (fieldId: keyof MetalsValues, event: React.ChangeEvent<HTMLInputElement>) => void
}

export function MetalsTab({ 
  currency,
  inputValues,
  onValueChange
}: MetalsTabProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  return (
    <div className="pt-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">Precious Metals</h3>
          <button
            onClick={() => setIsHelpOpen(!isHelpOpen)}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md",
              "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
              "transition-colors duration-200",
              isHelpOpen && "text-gray-900 bg-gray-50"
            )}
          >
            <FAQIcon className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Help</span>
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Enter the weight of your gold and silver holdings in grams.
        </p>
      </div>

      {/* FAQ Panel */}
      <div className={cn(
        "mt-4 overflow-hidden transition-all duration-200 ease-in-out",
        isHelpOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          {HELP_ITEMS.map((item, index) => (
            <div 
              key={index} 
              className={cn(
                "space-y-1",
                index > 0 && "pt-4 border-t border-gray-200"
              )}
            >
              <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form fields will go here */}
      <div className="mt-6 space-y-4">
        {/* Your existing form fields */}
      </div>
    </div>
  )
} 