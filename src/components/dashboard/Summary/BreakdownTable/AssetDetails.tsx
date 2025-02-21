import { formatCurrency } from "@/lib/utils"
import { InfoIcon } from "@/components/ui/icons"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
    <div className="pl-10 py-2">
      <div className="space-y-2">
        {Object.entries(items).map(([key, item]) => (
          <div key={key} className="flex justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">{item.label}</span>
              {item.tooltip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-3 w-3 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">{item.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {item.isExempt && (
                <span className="text-xs text-gray-500">(Exempt)</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="w-[140px] text-right text-gray-500">
                {item.value.toLocaleString(undefined, { style: 'currency', currency })}
              </span>
              <span className="w-[140px] text-right text-gray-500">
                {item.zakatable.toLocaleString(undefined, { style: 'currency', currency })}
              </span>
              <span className="w-[100px] text-right text-gray-500">
                {(item.zakatDue || 0).toLocaleString(undefined, { style: 'currency', currency })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}