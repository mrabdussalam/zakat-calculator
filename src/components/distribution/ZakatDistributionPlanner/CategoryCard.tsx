'use client'

import { useState, useEffect, useRef } from 'react'
import { useZakatStore } from '@/store/zakatStore'
import { DistributionAllocation } from '@/store/modules/distribution'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Info as InfoIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface CategoryCardProps {
    category: {
        id: string
        name: string
        description: string
        examples: string[]
        color: string
        scholarlyInfo: string
    }
    allocation: DistributionAllocation
    totalZakat: number
    currency: string
    isExpanded: boolean // Kept for compatibility but not used
    onToggleExpand: () => void // Kept for compatibility but not used
}

export function CategoryCard({
    category,
    allocation,
    totalZakat,
    currency,
    isExpanded,
    onToggleExpand
}: CategoryCardProps) {
    const { setAllocationPercentage } = useZakatStore()
    const [isHovering, setIsHovering] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [dragPercentage, setDragPercentage] = useState(allocation.percentage)
    const [dragStartX, setDragStartX] = useState(0)
    const cardRef = useRef<HTMLDivElement>(null)
    const [cardHeight, setCardHeight] = useState(0)

    // Update drag percentage when allocation changes
    useEffect(() => {
        if (!isDragging) {
            setDragPercentage(allocation.percentage)
        }
    }, [allocation, isDragging])

    // Calculate percentage from mouse position
    const getPercentageFromMousePosition = (clientX: number) => {
        if (!cardRef.current) return 0

        const rect = cardRef.current.getBoundingClientRect()
        const x = clientX - rect.left
        const width = rect.width

        return Math.min(100, Math.max(0, (x / width) * 100))
    }

    // Handle mouse down on the card
    const handleMouseDown = (e: React.MouseEvent) => {
        // Start dragging
        setIsDragging(true)
        setDragStartX(e.clientX)

        // Calculate percentage based on mouse position
        const percentage = getPercentageFromMousePosition(e.clientX)
        setDragPercentage(percentage)

        // Prevent other events
        e.stopPropagation()
    }

    // Handle mouse move over the card
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return

        // Update percentage based on mouse position
        const percentage = getPercentageFromMousePosition(e.clientX)
        setDragPercentage(percentage)

        // Prevent other events
        e.stopPropagation()
    }

    // Handle mouse up
    const handleMouseUp = (e: React.MouseEvent) => {
        if (isDragging) {
            // Stop dragging
            setIsDragging(false)

            // Update the actual allocation
            setAllocationPercentage(category.id, dragPercentage)
        }
    }

    // Add global mouse up and mouse move event listeners
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isDragging) {
                setIsDragging(false)
                setAllocationPercentage(category.id, dragPercentage)
            }
        }

        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (isDragging && cardRef.current) {
                const percentage = getPercentageFromMousePosition(e.clientX)
                setDragPercentage(percentage)
            }
        }

        window.addEventListener('mouseup', handleGlobalMouseUp)
        window.addEventListener('mousemove', handleGlobalMouseMove)

        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp)
            window.removeEventListener('mousemove', handleGlobalMouseMove)
        }
    }, [isDragging, category.id, dragPercentage, setAllocationPercentage])

    // Get the current percentage value based on drag state
    const currentPercentage = isDragging ? dragPercentage : allocation.percentage

    // Get the current amount value based on drag state
    const currentAmount = isDragging ? (dragPercentage / 100) * totalZakat : allocation.amount

    // Get card height on mount and resize
    useEffect(() => {
        if (cardRef.current) {
            const updateHeight = () => {
                if (cardRef.current) {
                    setCardHeight(cardRef.current.clientHeight)
                }
            }

            updateHeight()
            window.addEventListener('resize', updateHeight)

            return () => {
                window.removeEventListener('resize', updateHeight)
            }
        }
    }, [])

    return (
        <div className="relative">
            <div
                className="border border-gray-100 rounded-full overflow-hidden transition-all duration-200"
                ref={cardRef}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                <div
                    className="flex items-center justify-between px-4 py-3 select-none relative overflow-hidden"
                >
                    {/* Background fill for slider effect */}
                    <div
                        className="absolute inset-0 origin-left"
                        style={{
                            backgroundColor: category.color,
                            opacity: isDragging ? 0.35 : 0.25,
                            transform: `scaleX(${currentPercentage / 100})`,
                            transformOrigin: 'left',
                            zIndex: 0,
                            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                        }}
                    />

                    {/* Full-height line handle at the end of the fill - only on hover */}
                    {isHovering && (
                        <div
                            className={`absolute ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                            style={{
                                left: `${currentPercentage}%`,
                                top: 0,
                                bottom: 0,
                                width: '20px',
                                marginLeft: '-10px',
                                zIndex: 5,
                                transition: isDragging ? 'none' : 'left 0.2s ease-out'
                            }}
                        >
                            <div
                                className="absolute rounded-md"
                                style={{
                                    width: '6px',
                                    height: '100%',
                                    backgroundColor: category.color,
                                    opacity: 0.9,
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    border: `1px solid white`
                                }}
                            />
                        </div>
                    )}

                    <div className="flex items-center min-w-0 z-10">
                        <div className="flex items-center gap-2 min-w-0">
                            <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: category.color }}
                            ></div>
                            <span className="text-sm font-medium text-gray-900 truncate">{category.name}</span>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                                {currentPercentage.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 text-xs flex-shrink-0 z-10">
                        <span className="w-[100px] sm:w-[120px] text-right font-medium text-gray-900">
                            {formatCurrency(currentAmount, currency)}
                        </span>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button className="text-gray-400 hover:text-gray-500">
                                    <InfoIcon className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-white shadow-md border border-gray-200 text-gray-900 p-3 max-w-xs">
                                <div className="space-y-2">
                                    <div>
                                        <h4 className="font-medium text-sm text-gray-900">{category.name}</h4>
                                        <p className="text-xs text-gray-600 mt-1">{category.description}</p>
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-medium text-gray-700">Examples:</h5>
                                        <ul className="list-disc pl-4 text-xs text-gray-600 mt-1 space-y-1">
                                            {category.examples.map((example, index) => (
                                                <li key={index}>{example}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-medium text-gray-700">Scholarly Information:</h5>
                                        <p className="text-xs text-gray-600 mt-1">{category.scholarlyInfo}</p>
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </div>
    )
} 