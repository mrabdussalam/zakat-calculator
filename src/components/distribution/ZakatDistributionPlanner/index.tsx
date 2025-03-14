'use client'

import { useState } from 'react'
import { useZakatStore } from '@/store/zakatStore'
import { ASNAF_CATEGORIES } from '@/store/modules/distribution'
import { DistributionModeSelector } from './DistributionModeSelector'
import { CategoryCard } from './CategoryCard'
import { RecipientTracker } from './RecipientTracker'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export function ZakatDistributionPlanner() {
    const {
        getBreakdown,
        currency,
        allocations,
        distributionMode,
        getDistributionSummary,
        distributeEqually,
        distributeByScholar,
        resetDistribution
    } = useZakatStore()

    const breakdown = getBreakdown()
    const totalZakat = breakdown.combined.zakatDue
    const distributionSummary = getDistributionSummary()

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 bg-white h-full w-full px-4">
            {/* Navigation Bar */}
            <div className="lg:col-span-12 border-b border-gray-100 bg-white">
                <div className="py-4 flex justify-between items-center">
                    <Link href="/dashboard">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Return to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Left column - Category cards */}
            <div className="lg:col-span-6 min-h-0 border-r border-gray-100 bg-white">
                <div className="h-full flex flex-col">
                    {/* Distribution Methods Row */}
                    <div className="p-4 pb-2">
                        <DistributionModeSelector
                            currentMode={distributionMode}
                            onDistributeEqually={distributeEqually}
                            onDistributeByScholar={distributeByScholar}
                            onReset={resetDistribution}
                        />
                    </div>

                    {/* Categories Section */}
                    <div className="p-4 flex-none">
                        <h2 className="text-base font-medium text-gray-900">
                            Recipient Categories
                        </h2>
                    </div>

                    <div className="flex-1 min-h-0 overflow-auto">
                        <div className="px-4 pb-4 space-y-4">
                            <p className="text-[14px] text-gray-500 mb-4">
                                Allocate your Zakat across these eight categories of eligible recipients (asnaf).
                                Hover over any category to learn more about it.
                            </p>

                            {ASNAF_CATEGORIES.map(category => (
                                <CategoryCard
                                    key={category.id}
                                    category={category}
                                    allocation={allocations[category.id]}
                                    totalZakat={totalZakat}
                                    currency={currency}
                                    isExpanded={false}
                                    onToggleExpand={() => { }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right column - Recipient Tracker */}
            <div className="lg:col-span-6 min-h-0 bg-white">
                <div className="h-full flex flex-col p-4">
                    <div className="flex-1 min-h-0 overflow-auto">
                        <div className="space-y-6">
                            {/* Recipient Tracker */}
                            <div className="bg-white">
                                <RecipientTracker />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 