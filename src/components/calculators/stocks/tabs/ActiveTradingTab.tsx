'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/label'
import { InfoIcon } from '@/components/ui/icons'
import { Check, ChevronDown, Search, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { StockValues, StockHolding } from '@/lib/assets/stocks'
import { FAQ } from '@/components/ui/faq'
import { ASSET_FAQS } from '@/config/faqs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RefreshIcon } from '@/components/ui/icons/refresh'

interface StockSearchResult {
  symbol: string
  name: string
  exchange: string
}

function formatCurrency(value: number | undefined, currency: string = 'USD'): string {
  if (typeof value !== 'number' || !isFinite(value)) {
    return `${currency} 0.00`
  }
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function formatSharesAndPrice(shares: number | undefined, price: number | undefined, currency: string): string {
  const formattedShares = typeof shares === 'number' && isFinite(shares) 
    ? shares.toLocaleString(undefined, { maximumFractionDigits: 8 })
    : '0'
  
  const formattedPrice = typeof price === 'number' && isFinite(price)
    ? price.toLocaleString(undefined, { 
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    : `${currency} 0.00`

  return `${formattedShares} × ${formattedPrice}`
}

interface ActiveTradingTabProps {
  currency: string
  holdings: StockHolding[]
  onAddStock: (e: React.FormEvent, manualPrice?: number) => Promise<void>
  onRemoveStock: (symbol: string) => void
  onRefreshPrices: () => Promise<void>
  isLoading: boolean
  error: string | null | undefined
  newTicker: string
  setNewTicker: (value: string) => void
  newShares: string
  setNewShares: (value: string) => void
  inputValues: StockValues
  onValueChange: (fieldId: keyof StockHolding, event: React.ChangeEvent<HTMLInputElement>) => void
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
  const sharesInputRef = useRef<HTMLInputElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)
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
      setSelectedIndex(-1) // Reset selection when search results change
    } catch (error) {
      console.error('Error searching stocks:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!searchResults.length) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleStockSelect(searchResults[selectedIndex].symbol)
        }
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
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

  const handleStockSelect = (symbol: string) => {
    setNewTicker(symbol)
    setOpen(false)
    // Focus the shares input after a brief delay to ensure the popover has closed
    setTimeout(() => {
      sharesInputRef.current?.focus()
    }, 50)
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
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticker">Search Stock</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between bg-muted/50 border border-input pl-3 pr-8 h-10 text-left font-normal relative rounded-lg"
                  >
                    <div className="flex items-center gap-2 w-full overflow-hidden">
                      <span className={cn(
                        "font-medium text-sm shrink-0",
                        newTicker ? "text-gray-900" : "text-muted-foreground"
                      )}>{newTicker}</span>
                      {newTicker && (
                        <>
                          <span className="text-gray-400 shrink-0">-</span>
                          <span className="text-gray-500 truncate">{searchResults.find(r => r.symbol === newTicker)?.name}</span>
                        </>
                      )}
                      {!newTicker && <span className="text-muted-foreground truncate">Company name or ticker</span>}
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50 absolute right-3 top-1/2 -translate-y-1/2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[420px] overflow-hidden rounded-lg border border-gray-900 bg-gray-950 text-gray-50 shadow-lg animate-in fade-in-80" 
                  align="start"
                  sideOffset={5}
                  side="bottom"
                  avoidCollisions={true}
                >
                  <div className="flex items-center border-b border-gray-800 px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 text-gray-300" />
                    <input
                      placeholder="Search company or ticker..."
                      className="h-11 w-full px-0 text-sm bg-transparent focus:outline-none text-gray-50 placeholder:text-gray-500"
                      onChange={(e) => handleSearch(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                  <div className="max-h-[200px] overflow-auto p-1">
                    {isSearching ? (
                      <div className="py-6 text-center text-sm text-gray-500">
                        Searching...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="py-6 text-center text-sm text-gray-500">
                        No results found
                      </div>
                    ) : (
                      searchResults.map((result, index) => (
                        <div
                          key={result.symbol}
                          onClick={() => handleStockSelect(result.symbol)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={cn(
                            "relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 pl-3 pr-8 text-sm outline-none hover:bg-gray-800 hover:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                            (newTicker === result.symbol || selectedIndex === index) && "bg-gray-800 text-white"
                          )}
                        >
                          <div className="flex items-center gap-2 w-full min-w-0">
                            <span className={cn(
                              "font-medium w-[48px] shrink-0 text-gray-50",
                              (newTicker === result.symbol || selectedIndex === index) && "text-white"
                            )}>{result.symbol}</span>
                            <span className={cn(
                              "text-gray-400 shrink-0",
                              (newTicker === result.symbol || selectedIndex === index) && "text-gray-300"
                            )}>-</span>
                            <span className={cn(
                              "truncate text-gray-400 min-w-0",
                              (newTicker === result.symbol || selectedIndex === index) && "text-gray-200"
                            )}>{result.name}</span>
                            <span className={cn(
                              "text-xs text-gray-500 shrink-0 ml-auto pl-2",
                              (newTicker === result.symbol || selectedIndex === index) && "text-gray-400"
                            )}>{result.exchange}</span>
                          </div>
                          {(newTicker === result.symbol || selectedIndex === index) && (
                            <Check className="absolute right-2 h-4 w-4 text-gray-50" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shares"># of Shares</Label>
              <Input
                id="shares"
                ref={sharesInputRef}
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
            <div className="space-y-4">
              <div className="text-sm text-red-500">
                {error}
              </div>
              <div className="space-y-2">
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
        <AnimatePresence>
          {holdings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ 
                duration: 0.3,
                ease: [0.2, 0.4, 0.2, 1]
              }}
              className="mt-6 overflow-hidden"
            >
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
                    size="icon"
                    onClick={onRefreshPrices}
                    disabled={isLoading}
                    className="h-8 w-8 text-gray-500 hover:text-gray-900"
                  >
                    <RefreshIcon className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    <span className="sr-only">Refresh prices</span>
                  </Button>
                </div>
              </div>
              <motion.div 
                className="space-y-2"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.08
                    }
                  }
                }}
              >
                {holdings.map((holding, index) => (
                  <motion.div
                    key={`${holding.symbol}-${index}`}
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    transition={{ 
                      duration: 0.4,
                      ease: [0.2, 0.4, 0.2, 1]
                    }}
                    className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-white px-2 py-1 rounded-md border border-gray-100">
                        <p className="font-mono text-xs font-medium text-gray-900">{holding.symbol}</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatSharesAndPrice(holding.shares, holding.currentPrice, currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-medium text-gray-900">
                        {formatCurrency(holding.marketValue, currency)}
                      </p>
                      <button
                        onClick={() => onRemoveStock(holding.symbol)}
                        className="text-gray-400 hover:text-red-500 transition-colors text-xs"
                      >
                        ×
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 