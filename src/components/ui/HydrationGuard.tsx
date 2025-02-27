'use client'

import { useEffect } from 'react'
import { useStoreHydration } from '@/hooks/useStoreHydration'
import { logHydrationStatus } from '@/lib/utils/debug'

interface HydrationGuardProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

/**
 * HydrationGuard prevents rendering children until store hydration is complete
 * This helps prevent flashing of default values before persisted state is loaded
 */
export function HydrationGuard({ children, fallback }: HydrationGuardProps) {
    const isHydrated = useStoreHydration()

    // Log hydration status when it changes
    useEffect(() => {
        logHydrationStatus('HydrationGuard')
        console.log('HydrationGuard: Hydration status -', isHydrated ? 'Hydrated' : 'Not hydrated')
    }, [isHydrated])

    // Show fallback or nothing until hydrated
    if (!isHydrated) {
        return fallback || null
    }

    // Once hydrated, render children
    return <>{children}</>
} 