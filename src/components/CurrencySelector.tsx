"use client"

import * as React from "react"
import * as Select from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { CURRENCY_NAMES } from "@/lib/services/currency"

type Currency = {
  code: string
  name: string
}

// Convert CURRENCY_NAMES to our Currency type format
const currencies: Currency[] = Object.entries(CURRENCY_NAMES).map(([code, name]) => ({
  code: code.toUpperCase(),
  name: name
})).sort((a, b) => a.name.localeCompare(b.name))

// Calculate the width needed for the longest currency name
// Add extra space for the code (48px), dash, padding, and chevron
const longestName = currencies.reduce((max, curr) => 
  curr.name.length > max.length ? curr.name : max, 
  currencies[0].name
)
const SELECTOR_WIDTH = 420 // Fixed width to accommodate longest names

interface CurrencySelectorProps {
  value: string
  onValueChange: (value: string) => void
}

export function CurrencySelector({ value, onValueChange }: CurrencySelectorProps) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        className="flex h-10 items-center justify-between rounded-lg border border-input bg-muted/50 pl-12 pr-8 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 relative"
        style={{ width: SELECTOR_WIDTH }}
        aria-label="Select currency"
      >
        <div className="absolute inset-y-0 left-3 flex items-center">
          <span className={cn(
            "text-sm",
            value ? "font-medium text-gray-900" : "text-muted-foreground"
          )}>{value || "Select"}</span>
        </div>
        <Select.Value placeholder="Select currency">
          {value ? (
            <div className="flex items-center gap-2 w-full">
              <span className="truncate max-w-[300px]">{CURRENCY_NAMES[value.toLowerCase()]}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <span className="text-muted-foreground">Select currency</span>
            </div>
          )}
        </Select.Value>
        <Select.Icon className="absolute right-2 inset-y-0 flex items-center pointer-events-none">
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content 
          className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900 text-gray-100 shadow-md animate-in fade-in-80"
          style={{ width: SELECTOR_WIDTH }}
          position="popper"
          sideOffset={5}
          align="start"
          side="bottom"
          avoidCollisions={true}
        >
          <Select.Viewport 
            className="p-1"
            style={{ maxHeight: '200px' }}
          >
            {currencies.map((currency) => (
              <Select.Item
                key={currency.code}
                value={currency.code}
                className={cn(
                  "relative flex w-full cursor-default select-none items-center rounded-lg py-1.5 pl-3 pr-8 text-sm outline-none focus:bg-gray-700 focus:text-white hover:bg-gray-700 hover:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                  value === currency.code && "bg-gray-700 text-white",
                )}
              >
                <Select.ItemText className="flex-1 truncate">
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium w-[48px] shrink-0">{currency.code}</span>
                    <span className={cn(
                      "text-gray-400 shrink-0",
                      value === currency.code && "text-gray-300"
                    )}>-</span>
                    <span className={cn(
                      "truncate text-gray-300",
                      value === currency.code && "text-white"
                    )}>{currency.name}</span>
                  </div>
                </Select.ItemText>
                <Select.ItemIndicator className="absolute right-2">
                  <Check className="h-4 w-4 text-white" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
} 