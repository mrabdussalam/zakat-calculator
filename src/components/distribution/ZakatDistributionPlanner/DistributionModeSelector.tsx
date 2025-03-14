'use client'

import { RadioGroup, RadioGroupCard } from '@/components/ui/form/radio-group'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DistributionModeSelectorProps {
    currentMode: 'equal' | 'scholar' | 'local' | 'custom'
    onDistributeEqually: () => void
    onDistributeByScholar: () => void
    onReset: () => void
}

export function DistributionModeSelector({
    currentMode,
    onDistributeEqually,
    onDistributeByScholar,
    onReset
}: DistributionModeSelectorProps) {
    const handleValueChange = (value: string) => {
        if (value === 'equal') {
            onDistributeEqually();
        } else if (value === 'scholar') {
            onDistributeByScholar();
        }
    };

    return (
        <div className="space-y-4">
            <RadioGroup
                value={currentMode}
                onValueChange={handleValueChange}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
                <RadioGroupCard
                    value="equal"
                    title="Equal Distribution"
                    description="Distributes your Zakat equally across all eight categories (12.5% each)."
                    className="text-gray-900"
                />

                <RadioGroupCard
                    value="scholar"
                    title="Scholar Recommended"
                    description="Follows scholarly recommendations with emphasis on the poor and needy."
                    className="text-gray-900"
                />
            </RadioGroup>
        </div>
    )
} 