'use client'

import { motion } from 'framer-motion'
import { ReactNode, useEffect, useState } from 'react'

interface PageTransitionProps {
    children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        // Skip initial animation
        setIsLoaded(true)
    }, [])

    return (
        <motion.div
            className="min-h-screen"
            initial={isLoaded ? { filter: 'blur(0.2px)' } : false}
            animate={{ filter: 'blur(0px)' }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
        >
            {children}
        </motion.div>
    )
} 