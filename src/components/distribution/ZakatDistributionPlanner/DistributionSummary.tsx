'use client'

import { useZakatStore } from '@/store/zakatStore'
import { formatCurrency } from '@/lib/utils'

export function DistributionSummary() {
    const { getBreakdown, currency, getDistributionSummary } = useZakatStore()

    const breakdown = getBreakdown()
    const totalZakat = breakdown.combined.zakatDue
    const distributionSummary = getDistributionSummary()

    // Calculate percentage allocated
    const percentageAllocated = (distributionSummary.totalAllocated / totalZakat) * 100
    const isComplete = distributionSummary.isComplete

    return (
        <div className="flex flex-col gap-4 bg-white">
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-sm text-gray-500">Allocated</div>
                    <div className="text-xl sm:text-2xl font-medium">
                        <span className={isComplete ? "text-green-600" : "text-blue-600"}>
                            {formatCurrency(distributionSummary.totalAllocated, currency)}
                        </span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                        {Math.round(percentageAllocated)}% of total Zakat
                    </div>
                </div>
                <div>
                    <div className="text-sm text-gray-500">Remaining</div>
                    <div className="text-xl sm:text-2xl font-medium">
                        <span className="text-gray-900">
                            {formatCurrency(distributionSummary.remaining, currency)}
                        </span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                        {Math.round(100 - percentageAllocated)}% of total Zakat
                    </div>
                </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                    className={`h-2.5 rounded-full ${isComplete ? 'bg-green-600' : 'bg-blue-600'}`}
                    style={{ width: `${Math.min(100, percentageAllocated)}%` }}
                ></div>
            </div>
        </div>
    )
} 