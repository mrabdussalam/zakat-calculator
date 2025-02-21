import { formatCurrency } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
            {formatCurrency(totalAssets)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Zakat Due</div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <div className="text-2xl font-medium text-green-600">
                  {formatCurrency(breakdown.combined.zakatDue)}
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