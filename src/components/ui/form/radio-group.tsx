'use client'

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-4", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-5 w-5 rounded-full border border-gray-200",
        "text-gray-900 ring-offset-white",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-gray-900 data-[state=checked]:bg-gray-900",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <div className="h-2.5 w-2.5 rounded-full bg-white" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

const RadioGroupCard = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
    title: string
    description?: string
    children?: React.ReactNode
    disabled?: boolean
  }
>(({ className, title, description, children, disabled, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      disabled={disabled}
      className={cn(
        "relative rounded-lg border border-gray-100 p-4",
        "outline-none ring-0",
        "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        !disabled && "hover:border-gray-200 hover:bg-gray-50/50",
        !disabled && "data-[state=checked]:border-gray-900 data-[state=checked]:bg-gray-50",
        "before:absolute before:inset-0 before:rounded-lg before:transition-colors",
        "overflow-hidden text-left transition-all",
        !disabled && "cursor-pointer",
        disabled && "cursor-not-allowed bg-gray-50/50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="absolute inset-0 bg-gray-50/50" />
      <div className="relative z-[1]">
        {title && (
          <h4 className={cn(
            "text-sm font-medium",
            disabled ? "text-gray-800" : "text-gray-900"
          )}>{title}</h4>
        )}
        {description && (
          <p className={cn(
            "text-sm mt-2",
            disabled ? "text-gray-700" : "text-gray-600"
          )}>{description}</p>
        )}
        {children}
      </div>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupCard.displayName = "RadioGroupCard"

export { RadioGroup, RadioGroupItem, RadioGroupCard } 