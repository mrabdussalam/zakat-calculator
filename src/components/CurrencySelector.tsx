"use client"

import * as React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { CURRENCY_NAMES } from "@/lib/services/currency"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

type Currency = {
  code: string
  name: string
}

// Convert CURRENCY_NAMES to our Currency type format
const currencies: Currency[] = Object.entries(CURRENCY_NAMES).map(([code, name]) => ({
  code: code.toUpperCase(),
  name: name
})).sort((a, b) => a.name.localeCompare(b.name))

// Enhanced in-memory cache for successful prefetches to avoid showing errors during transitions
const localPriceCacheMemory: Record<string, {
  gold: number;
  silver: number;
  currency: string;
  timestamp: number;
  isValid: boolean;
}> = {};

// Cache validity period in milliseconds (5 minutes)
const CACHE_VALIDITY_PERIOD = 5 * 60 * 1000;

interface CurrencySelectorProps {
  value: string
  onValueChange: (value: string) => void
}

export function CurrencySelector({ value, onValueChange }: CurrencySelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [prefetchStatus, setPrefetchStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const abortControllerRef = useRef<AbortController | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCurrencies, setFilteredCurrencies] = useState<Currency[]>(currencies);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Filter currencies based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredCurrencies(currencies);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = currencies.filter(
      currency => 
        currency.code.toLowerCase().includes(query) || 
        currency.name.toLowerCase().includes(query)
    );
    
    setFilteredCurrencies(filtered);
    setSelectedIndex(-1); // Reset selection when search results change
  }, [searchQuery]);
  
  // Focus search input when popover opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!filteredCurrencies.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCurrencies.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleCurrencySelect(filteredCurrencies[selectedIndex].code);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  };
  
  // Enhanced prefetch function with retries, validation and cache management
  const prefetchMetalPrices = useCallback(async (currencyCode: string, retryCount = 3): Promise<boolean> => {
    try {
      // Cancel any previous prefetch requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create a new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      console.log(`Pre-fetching metal prices for currency: ${currencyCode} (attempt ${4 - retryCount})`);
      setPrefetchStatus('pending');
      
      // Check if we have valid cached data first
      const cachedData = localPriceCacheMemory[currencyCode];
      const now = Date.now();
      
      if (cachedData && cachedData.isValid && (now - cachedData.timestamp) < CACHE_VALIDITY_PERIOD) {
        console.log(`Using cached metal prices for ${currencyCode} (age: ${(now - cachedData.timestamp) / 1000}s)`);
        setPrefetchStatus('success');
        return true;
      }
      
      // Add a unique timestamp to avoid caching issues
      const cacheBuster = `t=${Date.now()}`;
      const response = await fetch(`/api/prices/metals?currency=${currencyCode}&${cacheBuster}`, {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        console.warn(`Failed to pre-fetch prices for ${currencyCode}: HTTP ${response.status}`);
        
        if (retryCount > 0) {
          console.log(`Retrying prefetch for ${currencyCode} (${retryCount} attempts left)`);
          // Increasing delay between retries: 300ms, 600ms, 900ms
          const delay = 300 * (4 - retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          return prefetchMetalPrices(currencyCode, retryCount - 1);
        }
        
        setPrefetchStatus('error');
        return false;
      }
      
      const data = await response.json();
      
      // More strict validation of prices with detailed logging
      if (!data) {
        console.error(`Pre-fetched data for ${currencyCode} is null or undefined`);
        
        if (retryCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 400));
          return prefetchMetalPrices(currencyCode, retryCount - 1);
        }
        
        setPrefetchStatus('error');
        return false;
      }
      
      // Specifically validate gold and silver prices
      const isGoldValid = typeof data.gold === 'number' && data.gold > 0;
      const isSilverValid = typeof data.silver === 'number' && data.silver > 0;
      
      if (!isGoldValid || !isSilverValid) {
        console.warn(`Invalid prices in response for ${currencyCode}:`, {
          gold: data.gold,
          silver: data.silver,
          goldValid: isGoldValid,
          silverValid: isSilverValid,
          timestamp: new Date().toISOString()
        });
        
        if (retryCount > 0) {
          console.log(`Retrying prefetch for ${currencyCode} due to invalid data (${retryCount} attempts left)`);
          // Longer delay for invalid data cases
          await new Promise(resolve => setTimeout(resolve, 500));
          return prefetchMetalPrices(currencyCode, retryCount - 1);
        }
        
        setPrefetchStatus('error');
        return false;
      }
      
      // Strong verification step - double check the values
      if (data.gold < 10 && currencyCode !== 'JPY') {
        console.warn(`Gold price for ${currencyCode} seems suspiciously low: ${data.gold}`);
      }
      
      // Store in local memory cache with validity flag
      localPriceCacheMemory[currencyCode] = {
        gold: data.gold,
        silver: data.silver,
        currency: data.currency || currencyCode,
        timestamp: Date.now(),
        isValid: true
      };
      
      console.log(`Successfully pre-fetched and cached metal prices for ${currencyCode}:`, {
        gold: data.gold,
        silver: data.silver,
        currency: data.currency,
        source: data.source || 'API'
      });
      
      // Short delay to ensure the cache is properly populated before proceeding
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setPrefetchStatus('success');
      return true;
    } catch (error) {
      // Ignore aborted requests
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log(`Prefetch for ${currencyCode} was aborted for a new request`);
        return false;
      }
      
      console.error(`Error pre-fetching data for ${currencyCode}:`, error);
      
      if (retryCount > 0) {
        console.log(`Retrying prefetch for ${currencyCode} after error (${retryCount} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return prefetchMetalPrices(currencyCode, retryCount - 1);
      }
      
      setPrefetchStatus('error');
      return false;
    }
  }, []);

  // Handle currency selection
  const handleCurrencySelect = async (currencyCode: string) => {
    // Skip if the value hasn't actually changed
    if (currencyCode === value) {
      console.log(`Currency value unchanged (${value}), skipping reset`);
      setOpen(false);
      return;
    }

    // Validate the currency code
    if (!currencyCode || typeof currencyCode !== 'string' || currencyCode.length !== 3) {
      console.error(`Invalid currency code provided: ${currencyCode}`);
      // Use USD as a safe fallback
      currencyCode = 'USD';
    }
    
    // Force to uppercase for consistency
    currencyCode = currencyCode.toUpperCase();

    console.log(`Currency changing from ${value} to ${currencyCode}`);
    setIsLoading(true);
    setOpen(false);
    
    // Pass the value to parent component immediately
    onValueChange(currencyCode);
    
    // Prefetch in background
    prefetchMetalPrices(currencyCode)
      .finally(() => {
        // Always reset loading state
        setIsLoading(false);
      });
  };

  // Find the current currency name
  const currentCurrency = currencies.find(c => c.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={isLoading}
          className={cn(
            "w-full justify-between bg-white border border-input pl-3 pr-8 h-10 text-left font-normal relative rounded-lg",
            "hover:border-input/80 transition-colors shadow-sm",
            "focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-input/80",
            isLoading && "opacity-50 cursor-wait" // Subtle loading indicator
          )}
        >
          <div className="flex items-center gap-2 w-full overflow-hidden">
            <span className="text-sm text-gray-900 font-medium">{value}</span>
            {currentCurrency && (
              <span className="text-gray-500 truncate text-sm">{currentCurrency.name}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50 absolute right-3 top-1/2 -translate-y-1/2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[280px] p-0 overflow-hidden rounded-lg border border-gray-900 bg-gray-950 text-gray-50 shadow-xl animate-in fade-in-80 ring-1 ring-gray-900 ring-opacity-30" 
        align="start"
        sideOffset={5}
        side="bottom"
        avoidCollisions={true}
      >
        <div className="flex items-center border-b border-gray-800 px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 text-gray-300" />
          <input
            ref={searchInputRef}
            placeholder="Search currencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-10 w-full px-0 text-sm bg-transparent focus:outline-none text-gray-50 placeholder:text-gray-500"
          />
        </div>
        <div className="max-h-[240px] overflow-auto py-1 
          scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900
          [&::-webkit-scrollbar]:w-[6px]
          [&::-webkit-scrollbar-track]:bg-gray-900
          [&::-webkit-scrollbar-thumb]:bg-gray-700 
          [&::-webkit-scrollbar-thumb]:rounded-full
          [scrollbar-color:theme(colors.gray.700)_theme(colors.gray.900)]">
          {filteredCurrencies.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">
              No currencies found
            </div>
          ) : (
            filteredCurrencies.map((currency, index) => (
              <div
                key={currency.code}
                onClick={() => handleCurrencySelect(currency.code)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center py-1.5 pl-3 pr-8 text-sm outline-none hover:bg-gray-800 hover:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                  (value === currency.code || selectedIndex === index) && "bg-gray-800 text-white"
                )}
              >
                <div className="flex items-center gap-2 w-full min-w-0">
                  <span className={cn(
                    "font-mono font-medium w-12 shrink-0 text-gray-50",
                    (value === currency.code || selectedIndex === index) && "text-white"
                  )}>{currency.code}</span>
                  <span className={cn(
                    "text-gray-400 shrink-0",
                    (value === currency.code || selectedIndex === index) && "text-gray-300"
                  )}>-</span>
                  <span className={cn(
                    "truncate text-gray-400 min-w-0",
                    (value === currency.code || selectedIndex === index) && "text-gray-200"
                  )}>{currency.name}</span>
                </div>
                {(value === currency.code || selectedIndex === index) && (
                  <Check className="absolute right-2 h-4 w-4 text-gray-50" />
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
} 