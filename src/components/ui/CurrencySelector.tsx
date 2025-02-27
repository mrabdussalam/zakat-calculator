"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { SUPPORTED_CURRENCIES, SupportedCurrency } from "@/lib/utils/currency"
import { motion, AnimatePresence } from "framer-motion"
import { CURRENCY_NAMES } from "@/lib/services/currency"
import { useZakatStore } from "@/store/zakatStore"

export interface CurrencySelectorProps {
  className?: string
  onChange?: (value: string) => void
}

// Helper function to get country code from currency code
const getCountryCode = (currencyCode: string): string => {
  // Currency code to country code mapping (exceptions for common currencies)
  const currencyToCountry: Record<string, string> = {
    USD: "US",
    EUR: "EU",
    GBP: "GB",
    JPY: "JP",
    AUD: "AU",
    CAD: "CA",
    CHF: "CH",
    CNY: "CN",
    HKD: "HK",
    NZD: "NZ",
    SEK: "SE",
    KRW: "KR",
    SGD: "SG",
    NOK: "NO",
    MXN: "MX",
    INR: "IN",
    RUB: "RU",
    ZAR: "ZA",
    TRY: "TR",
    BRL: "BR",
    TWD: "TW",
    DKK: "DK",
    PLN: "PL",
    THB: "TH",
    IDR: "ID",
    HUF: "HU",
    CZK: "CZ",
    ILS: "IL",
    CLP: "CL",
    PHP: "PH",
    AED: "AE",
    SAR: "SA",
    PKR: "PK",
    BDT: "BD",
    // Add more mappings as needed
  }
  
  // Get the country code from mapping or use first two letters of currency code
  return currencyToCountry[currencyCode] || 
         (currencyCode.slice(0, 2) === 'X' ? 'UN' : currencyCode.slice(0, 2))
}

// Flag component that uses SVG files from the public directory
const CountryFlag = ({ countryCode }: { countryCode: string }) => {
  const [flagLoaded, setFlagLoaded] = React.useState(false);
  const [flagError, setFlagError] = React.useState(false);
  
  // Generate a consistent color based on the country code (for fallback)
  const getColorFromCode = (code: string): string => {
    const colors = [
      "#e53935", "#d81b60", "#8e24aa", "#5e35b1", 
      "#3949ab", "#1e88e5", "#039be5", "#00acc1",
      "#00897b", "#43a047", "#7cb342", "#c0ca33", 
      "#fdd835", "#ffb300", "#fb8c00", "#f4511e"
    ];
    
    // Simple hash function to get consistent color
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }
  
  const backgroundColor = getColorFromCode(countryCode);
  
  // Try to preload the image to see if it exists
  React.useEffect(() => {
    const img = new Image();
    img.onload = () => setFlagLoaded(true);
    img.onerror = () => setFlagError(true);
    img.src = `/flags/${countryCode.toUpperCase()}.svg`;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [countryCode]);
  
  // If flag failed to load, or is still loading, show the fallback
  if (!flagLoaded || flagError) {
    return (
      <svg width="100%" height="100%" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="20" fill={backgroundColor} />
        <text
          x="50%"
          y="50%"
          fontFamily="sans-serif"
          fontSize="16"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {countryCode}
        </text>
      </svg>
    );
  }
  
  // If flag loaded successfully, show it
  return (
    <img 
      src={`/flags/${countryCode.toUpperCase()}.svg`}
      alt={`${countryCode} flag`}
      className="w-full h-full object-cover rounded-full"
    />
  );
};

// Helper to get currency name
const getCurrencyName = (code: string): string => {
  const lowerCode = code.toLowerCase()
  return CURRENCY_NAMES[lowerCode] || code
}

export function CurrencySelector({ className, onChange }: CurrencySelectorProps) {
  const [value, setValue] = React.useState("USD")
  const [hoveredCurrency, setHoveredCurrency] = React.useState<string | null>(null)
  
  // Convert currencies object to array for display
  const currencyArray = Object.values(SUPPORTED_CURRENCIES)
  
  // Sort currencies to prioritize specific ones in custom order
  const priorityOrder = ["USD", "PKR", "GBP", "SAR", "AED", "INR"];
  
  // Sort the currency array based on priority
  const sortedCurrencyArray = [...currencyArray].sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a.code);
    const bIndex = priorityOrder.indexOf(b.code);
    
    // If both currencies are in the priority list
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    
    // If only a is in the priority list
    if (aIndex !== -1) {
      return -1;
    }
    
    // If only b is in the priority list
    if (bIndex !== -1) {
      return 1;
    }
    
    // If neither is in the priority list, maintain original order
    return 0;
  });
  
  // Animation variants
  const textVariants = {
    initial: { opacity: 0, y: 5 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -5 }
  }
  
  const handleValueChange = (newValue: string) => {
    console.log(`Currency selection: ${value} -> ${newValue}`)
    
    if (newValue === value) return
    
    // Track if this is the first-ever selection on page load
    const isInitialPageLoad = !localStorage.getItem('has-selected-currency');
    
    // Check if this is a page refresh (rather than user interaction)
    // This is determined by checking if this currency selection is happening 
    // during the initial component mount and matches what was previously stored
    const previouslySavedCurrency = localStorage.getItem('selected-currency');
    const isPageRefresh = !isInitialPageLoad && 
                          previouslySavedCurrency === newValue && 
                          !document.hasFocus(); // Additional check: page likely refreshed if not focused
    
    // Mark that we've now selected a currency at least once
    try {
      localStorage.setItem('has-selected-currency', 'true');
    } catch (error) {
      console.error('Failed to set currency selection flag:', error);
    }
    
    setValue(newValue)
    
    // Call the onChange handler if provided
    if (onChange) {
      onChange(newValue)
    }
    
    // If this is the initial page load or a browser refresh, just set the value without resetting
    if (isInitialPageLoad || isPageRefresh) {
      console.log('Initial currency selection or page refresh - skipping reset:', newValue);
      
      // Store the selected currency
      try {
        localStorage.setItem('selected-currency', newValue)
      } catch (error) {
        console.error('Failed to save currency preference:', error)
      }
      
      // Update the store's currency but don't trigger a full reset
      try {
        const zakatStore = useZakatStore.getState()
        if (zakatStore && typeof zakatStore.setCurrency === 'function') {
          zakatStore.setCurrency(newValue)
        }
      } catch (error) {
        console.error('Failed to set currency in store:', error)
      }
      
      return;
    }
    
    // For user-initiated currency selections, perform a regular currency change
    // Try to get the Zustand store to perform a hard reset
    try {
      const zakatStore = useZakatStore.getState()
      if (zakatStore && typeof zakatStore.resetWithCurrencyChange === 'function') {
        console.log('Performing hard reset with currency change from selector to:', newValue)
        zakatStore.resetWithCurrencyChange(newValue)
        
        // Don't dispatch an event or set localStorage directly since resetWithCurrencyChange does it
        return
      }
    } catch (error) {
      console.error('Failed to use resetWithCurrencyChange, falling back to event dispatch:', error)
    }
    
    // Fallback: Dispatch a currency change event for the app to handle
    const event = new CustomEvent('currency-changed', {
      detail: {
        from: value,
        to: newValue,
        shouldForceReload: true,
        isInitialLoad: isInitialPageLoad
      }
    })
    window.dispatchEvent(event)
    
    // Also store the selected currency
    try {
      localStorage.setItem('selected-currency', newValue)
    } catch (error) {
      console.error('Failed to save currency preference:', error)
    }
  }
  
  // Load saved currency on mount
  React.useEffect(() => {
    try {
      const savedCurrency = localStorage.getItem('selected-currency')
      if (savedCurrency && Object.keys(SUPPORTED_CURRENCIES).includes(savedCurrency)) {
        setValue(savedCurrency)
      }
    } catch (error) {
      console.error('Failed to load currency preference:', error)
    }
  }, [])

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-3 w-full">
        {sortedCurrencyArray.map((currency) => (
          <button
            key={currency.code}
            type="button"
            onClick={() => handleValueChange(currency.code)}
            onMouseEnter={() => setHoveredCurrency(currency.code)}
            onMouseLeave={() => setHoveredCurrency(null)}
            className={cn(
              "flex flex-col items-center justify-center py-3 rounded-xl transition-all",
              value === currency.code 
                ? "bg-white ring-2 ring-primary ring-offset-2 shadow-md border border-gray-100" 
                : "bg-white hover:bg-gray-50 border border-gray-200"
            )}
          >
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center mb-1 bg-gray-50 border border-gray-100">
              <CountryFlag countryCode={getCountryCode(currency.code)} />
            </div>
            <div className="h-8 flex items-center justify-center px-1 overflow-hidden relative w-full">
              <AnimatePresence mode="wait" initial={false}>
                {hoveredCurrency === currency.code ? (
                  <motion.span 
                    key="full-name"
                    className="font-medium text-[0.65rem] text-gray-900 text-center line-clamp-2 leading-tight w-full"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={textVariants}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  >
                    {getCurrencyName(currency.code)}
                  </motion.span>
                ) : (
                  <motion.span 
                    key="code"
                    className="font-medium text-sm text-gray-900 w-full text-center"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={textVariants}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  >
                    {currency.code}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
} 