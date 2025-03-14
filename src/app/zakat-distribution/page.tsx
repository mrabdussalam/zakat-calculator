'use client'

import { useState, useEffect } from 'react'
import { useZakatStore } from '@/store/zakatStore'
import { ASNAF_CATEGORIES } from '@/store/modules/distribution'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { ZakatDistributionPlanner } from '@/components/distribution/ZakatDistributionPlanner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'

export default function ZakatDistributionPage() {
    const { getBreakdown, currency, getNisabStatus, distributeEqually } = useZakatStore()
    const [isHydrated, setIsHydrated] = useState(false)
    const [shouldAnimate, setShouldAnimate] = useState(false)

    // Hydration check
    useEffect(() => {
        setIsHydrated(true)
    }, [])

    // Initialize equal distribution when component mounts and after hydration
    useEffect(() => {
        if (isHydrated) {
            distributeEqually()
        }
    }, [isHydrated, distributeEqually])

    // Animation setup
    useEffect(() => {
        // Small delay to ensure smooth transition
        setTimeout(() => {
            setShouldAnimate(true)
        }, 100)
    }, [])

    const breakdown = getBreakdown()
    const nisabStatus = getNisabStatus()
    const totalZakat = breakdown.combined.zakatDue
    const meetsNisab = nisabStatus.meetsNisab

    // Animation variants
    const containerVariants = {
        hidden: {
            opacity: 0
        },
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.15,
                duration: 0.2
            }
        }
    }

    const itemVariants = {
        hidden: {
            opacity: 0,
            y: 20
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3
            }
        }
    }

    if (!isHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-pulse text-gray-400">Loading...</div>
            </div>
        )
    }

    return (
        <TooltipProvider>
            <motion.div
                className="min-h-screen bg-white flex flex-col"
                initial="hidden"
                animate={shouldAnimate ? "visible" : "hidden"}
                variants={containerVariants}
            >
                {!meetsNisab ? (
                    <div className="flex-1 p-4">
                        <div className="mx-auto px-4">
                            <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-gray-100 p-6">
                                <h2 className="text-xl text-gray-900 font-medium mb-4">No Zakat Due</h2>
                                <p className="text-gray-600 mb-4">
                                    Your assets are below the Nisab threshold, so no Zakat is due at this time.
                                    You can still use this planner to understand how Zakat distribution works for future reference.
                                </p>
                                <Link href="/dashboard">
                                    <Button variant="outline">Return to Dashboard</Button>
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                ) : totalZakat <= 0 ? (
                    <div className="flex-1 p-4">
                        <div className="mx-auto px-4">
                            <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-gray-100 p-6">
                                <h2 className="text-xl text-gray-900 font-medium mb-4">No Zakat Amount to Distribute</h2>
                                <p className="text-gray-600 mb-4">
                                    You don't have any Zakat amount to distribute at this time.
                                    Please calculate your Zakat due on the dashboard first.
                                </p>
                                <Link href="/dashboard">
                                    <Button variant="outline">Return to Dashboard</Button>
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                ) : (
                    <motion.div
                        variants={itemVariants}
                        className="flex-1"
                    >
                        <div className="h-full">
                            <ZakatDistributionPlanner />
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </TooltipProvider>
    )
} 