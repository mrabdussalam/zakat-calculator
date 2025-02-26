import { cn, formatCurrency } from "@/lib/utils"
import { useZakatStore } from "@/store/zakatStore"
import { ChevronDown, AlertCircle, Wifi, WifiOff, Info } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { useCurrencyStore } from "@/lib/services/currency"
import { RefreshIcon } from "@/components/ui/icons"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Add debounce mechanism
const CURRENCY_CHANGE_DEBOUNCE_MS = 3000; // 3 seconds
let lastNisabFetchTimestamp = 0;

interface NisabStatusProps {
  nisabStatus: {
    meetsNisab: boolean
    totalValue: number
    nisabValue: number
    thresholds: {
      gold: number
      silver: number
    }
    currency?: string // Add optional currency
  }
  currency: string
}

export function NisabStatus({ nisabStatus, currency }: NisabStatusProps) {
  const { metalPrices, fetchNisabData, isFetchingNisab, fetchError } = useZakatStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const currencyStore = useCurrencyStore()
  const prevCurrencyRef = useRef<string>(currency)
  
  // Convert values if currencies don't match
  const [convertedValues, setConvertedValues] = useState({
    nisabValue: nisabStatus.nisabValue,
    totalValue: nisabStatus.totalValue,
    goldThreshold: nisabStatus.thresholds.gold,
    silverThreshold: nisabStatus.thresholds.silver
  })
  
  // Add a flag to track if we're fetching new data
  const [isFetching, setIsFetching] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  
  // Update isFetching state immediately when currency changes for better UX
  useEffect(() => {
    // CRITICAL: Only set fetching flag when currency has actually changed
    if (prevCurrencyRef.current !== currency) {
      console.log(`NisabStatus: Currency changed from ${prevCurrencyRef.current} to ${currency}`);
      setIsFetching(true);
      setLocalError(null); // Clear previous errors on currency change
      setRetryCount(0); // Reset retry count
    }
  }, [currency]);
  
  // Always refresh nisab data when currency changes
  useEffect(() => {
    const currencyChanged = prevCurrencyRef.current !== currency;
    const now = Date.now();
    
    // Skip if no change or already fetching from store or debounce is active
    if (!currencyChanged || isFetchingNisab || (now - lastNisabFetchTimestamp < CURRENCY_CHANGE_DEBOUNCE_MS)) {
      return;
    }
    
    console.log(`NisabStatus: Triggering nisab refresh for currency change: ${currency}`);
    setIsFetching(true);
    setLocalError(null);
    lastNisabFetchTimestamp = now;
    
    // Update reference before the fetch to prevent duplicate requests
    prevCurrencyRef.current = currency;
    
    // Function to handle fetch with automatic retries
    const fetchWithRetries = async (maxRetries = 2) => {
      let currentRetry = 0;
      
      while (currentRetry <= maxRetries) {
        try {
          await fetchNisabData();
          console.log(`NisabStatus: Successfully refreshed nisab data for ${currency}`);
          setLastFetchTime(Date.now());
          setRetryCount(0);
          return; // Success, exit the retry loop
        } catch (err: any) {
          console.error(`NisabStatus: Failed to refresh nisab data for ${currency} (attempt ${currentRetry + 1}):`, err);
          
          // Check if this is our last retry
          if (currentRetry === maxRetries) {
            setLocalError(err.message || 'Failed to fetch nisab data');
            setRetryCount(currentRetry + 1);
            break;
          }
          
          // Wait before retrying - exponential backoff
          const delay = Math.pow(2, currentRetry) * 1000;
          console.log(`NisabStatus: Waiting ${delay}ms before retry ${currentRetry + 1}...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          currentRetry++;
          setRetryCount(currentRetry);
        }
      }
    };
    
    // Start fetch with retries
    fetchWithRetries()
      .finally(() => {
        setIsFetching(false);
      });
  }, [currency, fetchNisabData, isFetchingNisab]);
  
  // Handle currency mismatches
  useEffect(() => {
    // Skip processing if we're currently fetching new data from API
    if (isFetching || isFetchingNisab) {
      return;
    }
    
    if (nisabStatus.currency && nisabStatus.currency !== currency) {
      console.log(`Currency mismatch in NisabStatus: nisab is ${nisabStatus.currency}, display is ${currency}`);
      
      // Convert all values to the display currency
      const convertValue = (value: number) => {
        return currencyStore.convertAmount(value, nisabStatus.currency || 'USD', currency);
      };
      
      setConvertedValues({
        nisabValue: convertValue(nisabStatus.nisabValue),
        totalValue: convertValue(nisabStatus.totalValue),
        goldThreshold: convertValue(nisabStatus.thresholds.gold),
        silverThreshold: convertValue(nisabStatus.thresholds.silver)
      });
      
      // Trigger a background refresh of nisab data with the correct currency
      // but only if we haven't fetched recently and aren't currently fetching
      const now = Date.now();
      if (!isFetching && !isFetchingNisab && (now - lastNisabFetchTimestamp > CURRENCY_CHANGE_DEBOUNCE_MS)) {
        setIsFetching(true);
        setLocalError(null);
        lastNisabFetchTimestamp = now;
        
        fetchNisabData()
          .catch((err: Error) => {
            console.error('Failed to refresh nisab data with correct currency:', err);
            setLocalError(err.message || 'Failed to fetch nisab data');
          })
          .finally(() => {
            setIsFetching(false);
            setLastFetchTime(Date.now());
          });
      }
    } else {
      // Use the original values if currencies match
      setConvertedValues({
        nisabValue: nisabStatus.nisabValue,
        totalValue: nisabStatus.totalValue,
        goldThreshold: nisabStatus.thresholds.gold,
        silverThreshold: nisabStatus.thresholds.silver
      });
    }
  }, [nisabStatus, currency, currencyStore, fetchNisabData, isFetching, isFetchingNisab]);
  
  // Recalculate eligibility with converted values
  const meetsNisab = convertedValues.totalValue >= convertedValues.nisabValue;
  
  // Calculate how much more is needed to reach Nisab with proper validation
  const calculateMoreNeeded = () => {
    // Return 0 if already meets Nisab
    if (meetsNisab) return 0;
    
    // Handle the case where total value is zero or very small
    // This prevents showing the full Nisab value as "needed more" when user has no assets
    const amountNeeded = Math.max(0, convertedValues.nisabValue - convertedValues.totalValue);
    
    if (convertedValues.totalValue <= 0) {
      // Log that user has no assets, which is why they're under Nisab
      console.log('User has no assets, showing full Nisab threshold as needed amount');
    }
    
    return amountNeeded;
  };
  
  // Get the formatted message for Nisab status
  const getNisabStatusMessage = () => {
    if (meetsNisab) {
      return `Your assets exceed the nisab threshold of ${formatCurrency(convertedValues.nisabValue, currency)}`;
    } else {
      // Show different message depending on whether user has assets
      if (convertedValues.totalValue <= 0) {
        return `You need to have at least ${formatCurrency(convertedValues.nisabValue, currency)} in assets to reach nisab`;
      } else {
        return `You need ${formatCurrency(calculateMoreNeeded(), currency)} more to reach nisab`;
      }
    }
  };

  // Determine which metal is being used for nisab threshold
  const getNisabMetalUsed = () => {
    if (convertedValues.goldThreshold <= convertedValues.silverThreshold) {
      return "gold";
    } else {
      return "silver";
    }
  };

  // Handle manual refresh of nisab data
  const handleRefresh = () => {
    if (isFetchingNisab || isFetching) return;
    
    setIsFetching(true);
    setLocalError(null);
    setRetryCount(0);
    lastNisabFetchTimestamp = Date.now();
    
    // Function to handle fetch with automatic retries
    const fetchWithRetries = async (maxRetries = 2) => {
      let currentRetry = 0;
      
      while (currentRetry <= maxRetries) {
        try {
          await fetchNisabData();
          console.log('Manually refreshed nisab data successfully');
          setLastFetchTime(Date.now());
          setRetryCount(0);
          return; // Success, exit the retry loop
        } catch (err: any) {
          console.error(`Manual refresh failed (attempt ${currentRetry + 1}):`, err);
          
          // Check if this is our last retry
          if (currentRetry === maxRetries) {
            setLocalError(err.message || 'Failed to fetch nisab data');
            setRetryCount(currentRetry + 1);
            break;
          }
          
          // Wait before retrying - exponential backoff
          const delay = Math.pow(2, currentRetry) * 1000;
          console.log(`Waiting ${delay}ms before retry ${currentRetry + 1}...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          currentRetry++;
          setRetryCount(currentRetry);
        }
      }
    };
    
    // Start fetch with retries
    fetchWithRetries()
      .finally(() => {
        setIsFetching(false);
      });
  };

  // Determine error message (use local or global error)
  const errorMessage = localError || fetchError;
  
  // Get a user-friendly error message
  const getUserFriendlyErrorMessage = () => {
    if (!errorMessage) return null;
    
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      return 'The nisab calculation service is temporarily unavailable.';
    } else if (errorMessage.includes('Failed to fetch')) {
      return 'Could not connect to the nisab calculation service.';
    } else {
      return 'There was an issue getting the latest nisab data.';
    }
  };
  
  const friendlyErrorMessage = getUserFriendlyErrorMessage();

  return (
    <div className="rounded-xl bg-gray-50/80">
      {/* Status Header - Always Visible */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-2 w-2 rounded-full",
            errorMessage ? "bg-amber-500" : (meetsNisab ? "bg-green-500" : "bg-gray-300")
          )} />
          <div className="font-medium text-gray-900">
            {errorMessage ? "Nisab Status" : (meetsNisab ? "Meets Nisab" : "Below Nisab")}
          </div>
          {(isFetching || isFetchingNisab) && (
            <div className="h-3 w-3 ml-1 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
          )}
          {errorMessage && (
            <div className="flex items-center gap-1 text-amber-600">
              <WifiOff className="h-3 w-3" />
              <span className="text-[10px]">Using local calculation</span>
            </div>
          )}
        </div>
        <motion.div
          initial={false}
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400 group-hover:text-gray-500"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Error Message */}
              {errorMessage && (
                <div className="text-sm bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{friendlyErrorMessage}</p>
                    <p className="text-xs mt-1">
                      Using local calculations based on current metal prices. 
                      {retryCount > 0 && (
                        <span className="block mt-1">
                          Tried {retryCount} {retryCount === 1 ? 'time' : 'times'} to reconnect.
                        </span>
                      )}
                      <button 
                        onClick={handleRefresh}
                        className="text-amber-700 font-medium inline-flex items-center hover:underline ml-1"
                      >
                        Try again
                        <RefreshIcon className="h-3 w-3 ml-1" />
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div className="text-sm text-gray-600 leading-relaxed">
                Nisab is the minimum amount of wealth that must be owned before Zakat becomes obligatory.
                It is calculated based on the value of either gold (85g) or silver (595g), whichever is lower.
              </div>

              {/* Thresholds */}
              <div className="grid grid-cols-2 gap-3">
                <div className={cn(
                  "rounded-lg p-3", 
                  getNisabMetalUsed() === "gold" 
                    ? "bg-yellow-50/50 ring-1 ring-yellow-100" 
                    : "bg-white/50"
                )}>
                  <div className="text-xs text-gray-500 mb-1 flex items-center">
                    Gold Nisab (85g)
                  </div>
                  <div className={cn(
                    "font-medium", 
                    getNisabMetalUsed() === "gold" ? "text-yellow-700" : "text-gray-900"
                  )}>
                    {formatCurrency(convertedValues.goldThreshold, currency)}
                  </div>
                </div>
                <div className={cn(
                  "rounded-lg p-3", 
                  getNisabMetalUsed() === "silver" 
                    ? "bg-gray-50/50 ring-1 ring-gray-100" 
                    : "bg-white/50"
                )}>
                  <div className="text-xs text-gray-500 mb-1 flex items-center">
                    Silver Nisab (595g)
                  </div>
                  <div className={cn(
                    "font-medium", 
                    getNisabMetalUsed() === "silver" ? "text-gray-700" : "text-gray-900"
                  )}>
                    {formatCurrency(convertedValues.silverThreshold, currency)}
                  </div>
                </div>
              </div>

              {/* Status Message */}
              <div className={cn(
                "text-sm font-medium rounded-lg p-3",
                errorMessage 
                  ? "bg-gray-100 text-gray-700"
                  : (meetsNisab 
                    ? "bg-green-500/10 text-green-700" 
                    : "bg-gray-500/5 text-gray-700")
              )}>
                <div className="flex items-center gap-1.5">
                  {getNisabStatusMessage()}
                </div>
              </div>

              {/* Last Updated */}
              <div className="text-[11px] text-gray-400 flex items-center justify-between">
                <div>
                  {errorMessage ? (
                    <span className="flex items-center gap-1">
                      <WifiOff className="h-3 w-3" /> 
                      Using local calculation
                    </span>
                  ) : (
                    <>
                      Prices last updated: {metalPrices?.lastUpdated ? new Date(metalPrices.lastUpdated).toLocaleString() : new Date().toLocaleString()}
                      {nisabStatus.currency && nisabStatus.currency !== currency && (
                        <span className="ml-1 text-amber-500">
                          (converted from {nisabStatus.currency})
                        </span>
                      )}
                    </>
                  )}
                </div>
                
                {/* Refresh button */}
                {!isFetching && !isFetchingNisab && (
                  <button
                    onClick={handleRefresh}
                    className="text-gray-400 hover:text-gray-600 flex items-center text-[11px]"
                  >
                    <RefreshIcon className="h-3 w-3 mr-1" />
                    Refresh
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 