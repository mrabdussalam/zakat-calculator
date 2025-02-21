"use client"

import * as React from "react"
import * as Select from "@radix-ui/react-select"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

type Currency = {
  code: string
  name: string
}

const currencies: Currency[] = [
  { code: "USD", name: "United States Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound Sterling" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "NZD", name: "New Zealand Dollar" },
]

export function CurrencySelector() {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  const [search, setSearch] = React.useState("")

  const filteredCurrencies = currencies.filter(
    (currency) =>
      currency.name.toLowerCase().includes(search.toLowerCase()) ||
      currency.code.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <Select.Root open={open} onOpenChange={setOpen} value={value} onValueChange={setValue}>
      <Select.Trigger
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Select currency"
      >
        <Select.Value placeholder="Select currency" />
        <Select.Icon>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80">
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-8 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search currencies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select.Viewport className="p-1">
            {filteredCurrencies.length > 0 ? (
              filteredCurrencies.map((currency) => (
                <Select.Item
                  key={currency.code}
                  value={currency.code}
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    value === currency.code && "bg-accent text-accent-foreground",
                  )}
                >
                  <Select.ItemText>
                    {currency.code} - {currency.name}
                  </Select.ItemText>
                  <Select.ItemIndicator className="absolute left-2 inline-flex items-center justify-center">
                    <Check className="h-4 w-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">No currencies found</div>
            )}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

