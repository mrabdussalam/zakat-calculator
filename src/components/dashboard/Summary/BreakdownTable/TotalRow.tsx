import { formatCurrency } from "@/lib/utils"

interface TotalRowProps {
  totalAssets: number
  zakatableValue: number
  zakatDue: number
  currency: string
}

export function TotalRow({ totalAssets, zakatableValue, zakatDue, currency }: TotalRowProps) {
  return (
    <div className="px-2 py-2.5 bg-gray-50 mt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Total</span>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="w-[100px] sm:w-[140px] text-right text-xs font-medium text-gray-900">
            {formatCurrency(totalAssets, currency)}
          </span>
          <span className="hidden sm:block w-[140px] text-right text-xs font-medium text-gray-900">
            {formatCurrency(zakatableValue, currency)}
          </span>
          <span className="w-[80px] sm:w-[100px] text-right text-xs font-medium text-green-600">
            {formatCurrency(zakatDue, currency)}
          </span>
        </div>
      </div>
    </div>
  )
} 