import { formatCurrency } from "@/lib/utils"

interface TotalRowProps {
  totalAssets: number
  zakatableValue: number
  zakatDue: number
}

export function TotalRow({ totalAssets, zakatableValue, zakatDue }: TotalRowProps) {
  return (
    <div className="px-4 py-2.5 bg-gray-50 rounded-b-lg">
      <div className="flex justify-between text-sm font-medium">
        <span className="text-gray-900">Total</span>
        <div className="flex items-center gap-4">
          <span className="w-[140px] text-right text-gray-900">
            {formatCurrency(totalAssets)}
          </span>
          <span className="w-[140px] text-right text-gray-900">
            {formatCurrency(zakatableValue)}
          </span>
          <span className="w-[100px] text-right text-green-600">
            {formatCurrency(zakatDue)}
          </span>
        </div>
      </div>
    </div>
  )
} 