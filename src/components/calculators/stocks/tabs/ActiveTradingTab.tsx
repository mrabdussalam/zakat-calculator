'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/label'
import { InfoIcon } from '@/components/ui/icons'
import { Check, ChevronDown, Search } from 'lucide-react'
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import { 
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip"
import { cn } from '@/lib/utils'
import { StockValues } from '@/lib/assets/stocks'
import { FAQ } from '@/components/ui/faq'
import { ASSET_FAQS } from '@/config/faqs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface StockSearchResult {
  symbol: string
  name: string
  exchange: string
}

interface ActiveTradingTabProps {
  currency: string
  holdings: Array<{
    ticker: string
    shares: number
    currentPrice: number
    marketValue: number
    zakatDue: number
  }>
  onAddStock: (e: React.FormEvent, manualPrice?: number) => Promise<void>
  onRemoveStock: (index: number) => void
  onRefreshPrices: () => Promise<void>
  isLoading: boolean
  error: string | null | undefined
  newTicker: string
  setNewTicker: (value: string) => void
  newShares: string
  setNewShares: (value: string) => void
  inputValues: StockValues
  onValueChange: (fieldId: keyof StockValues, event: React.ChangeEvent<HTMLInputElement>) => void
}

export function ActiveTradingTab({
  currency,
  holdings,
  onAddStock,
  onRemoveStock,
  onRefreshPrices,
  isLoading,
  error,
  newTicker,
  setNewTicker,
  newShares,
  setNewShares,
  inputValues,
  onValueChange
}: ActiveTradingTabProps) {
  const [showManualPrice, setShowManualPrice] = useState(false)
  const [manualPrice, setManualPrice] = useState('')
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSearch = async (query: string) => {
    if (!query) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/search/stocks?q=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('Failed to search stocks')
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Error searching stocks:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(manualPrice)
    if (!isNaN(price) && price > 0) {
      await onAddStock(e, price)
    } else {
      await onAddStock(e)
    }
    setManualPrice('')
  }

  return (
    <div className="pt-6">
      <div className="space-y-6">
        <div>
          <FAQ
            title="Active Trading"
            description="Enter details for stocks that you actively trade (buy and sell frequently for profit)."
            items={ASSET_FAQS.stocks.active}
            defaultOpen={false}
          />
        </div>

        {/* Add New Stock Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ticker">Search Stock</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between bg-muted/50 border border-input pl-3 pr-8 h-10 text-left font-normal relative"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium text-sm",
                        newTicker ? "text-gray-900" : "text-muted-foreground"
                      )}>{newTicker}</span>
                      {newTicker && (
                        <>
                          <span className="text-gray-400">-</span>
                          <span className="text-gray-500 truncate">{searchResults.find(r => r.symbol === newTicker)?.name}</span>
                        </>
                      )}
                      {!newTicker && <span className="text-muted-foreground">Company name or ticker</span>}
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50 absolute right-3 top-1/2 -translate-y-1/2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[420px] overflow-hidden rounded-lg border border-gray-800 bg-gray-900 text-gray-100 shadow-md animate-in fade-in-80" 
                  align="start"
                  sideOffset={5}
                  side="bottom"
                  avoidCollisions={true}
                >
                  <Command shouldFilter={false} className="bg-gray-900">
                    <div className="flex items-center border-b border-gray-800/20 px-3">
                      <Search className="mr-2 h-4 w-4 shrink-0 text-white" />
                      <CommandInput
                        placeholder="Company name or ticker"
                        onValueChange={handleSearch}
                        className="h-11 px-0 text-sm bg-transparent focus:outline-none text-white placeholder:text-gray-400"
                      />
                    </div>
                    <CommandList className="max-h-[200px] overflow-auto p-1 bg-gray-900">
                      <CommandEmpty className="py-6 text-center text-sm text-gray-400">
                        {isSearching ? "Searching..." : "No results found"}
                      </CommandEmpty>
                      <CommandGroup className="bg-gray-900">
                        {searchResults.map((result) => (
                          <CommandItem
                            key={result.symbol}
                            value={result.symbol}
                            onSelect={(value) => {
                              setNewTicker(value)
                              setOpen(false)
                            }}
                            className={cn(
                              "relative flex w-full cursor-default select-none items-center rounded-lg py-1.5 pl-3 pr-8 text-sm outline-none hover:bg-gray-700 hover:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                              newTicker === result.symbol && "bg-gray-700 text-white"
                            )}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <span className={cn(
                                "font-medium w-[48px] shrink-0 text-white",
                                newTicker === result.symbol && "text-white"
                              )}>{result.symbol}</span>
                              <span className={cn(
                                "text-gray-300 shrink-0",
                                newTicker === result.symbol && "text-gray-300"
                              )}>-</span>
                              <span className={cn(
                                "truncate text-gray-300",
                                newTicker === result.symbol && "text-white"
                              )}>{result.name}</span>
                              <span className={cn(
                                "text-xs text-gray-400 shrink-0",
                                newTicker === result.symbol && "text-gray-300"
                              )}>{result.exchange}</span>
                            </div>
                            {newTicker === result.symbol && (
                              <Check className="absolute right-2 h-4 w-4 text-white" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shares"># of Shares</Label>
              <Input
                id="shares"
                type="number"
                min="0"
                step="any"
                value={newShares}
                onChange={e => setNewShares(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
          </div>

          {error && (
            <div className="space-y-3">
              <div className="text-sm text-red-500">
                {error}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="manual-price">Enter price manually</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center">
                    <span className="text-sm font-medium text-gray-900">{currency}</span>
                  </div>
                  <Input
                    id="manual-price"
                    type="number"
                    min="0"
                    step="any"
                    value={manualPrice}
                    onChange={e => setManualPrice(e.target.value)}
                    placeholder="Enter price per share"
                    className="pl-12"
                  />
                </div>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isLoading || !newTicker || !newShares || Boolean(error && !manualPrice)}
            className="w-full"
          >
            {isLoading ? 'Adding...' : 'Add Stock'}
          </Button>
        </form>

        {/* Stock Holdings List */}
        {holdings.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-gray-700">Your Holdings</h4>
              <div className="flex items-center gap-2">
                {error && (
                  <p className="text-xs text-amber-600">
                    {error}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefreshPrices}
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Refresh Prices'}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {holdings.map((holding, index) => (
                <div 
                  key={`${holding.ticker}-${index}`}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-white px-2 py-1 rounded-md border border-gray-100">
                      <p className="font-mono text-xs font-medium text-gray-900">{holding.ticker}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {holding.shares.toLocaleString()} × {currency} {holding.currentPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-medium text-gray-900">
                      {currency} {holding.marketValue.toLocaleString()}
                    </p>
                    <button
                      onClick={() => onRemoveStock(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors text-xs"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 