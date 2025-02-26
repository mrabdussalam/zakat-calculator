"use client"

import { cn } from "@/lib/utils"

type LoadingSpinnerProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

export default function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  // Map sizes to tailwind classes
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4', 
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div 
      className={cn(
        "animate-spin rounded-full border-t-2 border-primary",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  )
} 