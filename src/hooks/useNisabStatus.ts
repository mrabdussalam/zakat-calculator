import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useZakatStore } from '@/store/zakatStore';
import { fetchMetalPrices } from '@/lib/api/metals';
import { NISAB } from '@/store/constants';
import { useCurrencyStore } from '@/lib/services/currency';
import { formatCurrency } from '@/lib/utils';
import { calculateNisabThresholds } from '@/lib/utils/nisabCalculations';
import { useStoreHydration } from '@/hooks/useStoreHydration';

// Environment detection for Replit
const IS_REPLIT =
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('replit') ||
    window.location.hostname.endsWith('.repl.co'));

// Add a Replit-specific timeout that's longer than local to account for slower network
const REPLIT_API_TIMEOUT = IS_REPLIT ? 15000 : 8000;

// Key for tracking initialization
const ALREADY_INITIALIZED_KEY = 'nisab_component_initialized';

export interface NisabValues {
  nisabValue: number;
  totalValue: number;
  goldThreshold: number;
  silverThreshold: number;
  isDirectGoldPrice: boolean;
  isDirectSilverPrice: boolean;
  usedFallback?: boolean;
}

export interface NisabStatusHookResult {
  // Basic state
  convertedValues: NisabValues;
  isFetching: boolean;
  isOfflineMode: boolean;
  errorMessage: string | null;
  lastFetchTime: number;
  retryCount: number;
  meetsNisab: boolean;
  componentKey: number;

  // Actions
  handleRefresh: () => void;
  handleManualCurrencyUpdate: (currency: string, isReplitEnv?: boolean) => Promise<void>;
  forceImmediateUpdate: (forceRefresh?: boolean) => Promise<void>;
  updateLocalNisabValues: (prices: ExtendedMetalPrices) => void;
  getNisabStatusMessage: () => string;
  getNisabMetalUsed: () => "gold" | "silver";
  calculateMoreNeeded: () => number;
  getUserFriendlyErrorMessage: () => string | null;
  setComponentKey: (key: number) => void;
  hasSuspiciouslyLowValues: (currency: string, goldThreshold?: number, silverThreshold?: number) => boolean;
}

// Define ExtendedMetalPrices interface locally since it's not exported from metals.ts
interface ExtendedMetalPrices {
  gold: number;
  silver: number;
  currency: string;
  lastUpdated: Date;
  isCache?: boolean;
  source?: string;
  goldUSD?: number;
  silverUSD?: number;
  exchangeRate?: number;
}

export function useNisabStatus(
  nisabStatus: {
    meetsNisab: boolean;
    totalValue: number;
    nisabValue: number;
    thresholds: {
      gold: number;
      silver: number;
    };
    currency?: string;
  },
  currency: string
): NisabStatusHookResult {
  // Add hydration status check
  const isStoreHydrated = useStoreHydration();

  const {
    metalPrices,
    fetchNisabData,
    isFetchingNisab,
    fetchError,
    setMetalPrices,
    forceRefreshNisabForCurrency
  } = useZakatStore();

  const [isFetching, setIsFetching] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [componentKey, setComponentKey] = useState(Date.now());
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize with values from props
  const [convertedValues, setConvertedValues] = useState<NisabValues>({
    nisabValue: nisabStatus.nisabValue,
    totalValue: nisabStatus.totalValue,
    goldThreshold: nisabStatus.thresholds.gold,
    silverThreshold: nisabStatus.thresholds.silver,
    isDirectGoldPrice: true,
    isDirectSilverPrice: true,
    usedFallback: false
  });

  const hasInitializedRef = useRef(false);
  const currencyRefreshTimeRef = useRef<number>(0);
  const lastReceivedCurrencyRef = useRef<string>(currency);
  const currencyStore = useCurrencyStore();

  // Use the new utility function to calculate nisab values dynamically
  // This is the key change that addresses the currency display issue
  const calculateDynamicNisabValues = useCallback((prices: ExtendedMetalPrices, targetCurrency: string) => {
    // Proper validation - check for valid numbers, not truthy values (0 is falsy but valid)
    if (!prices ||
        typeof prices.gold !== 'number' || !isFinite(prices.gold) || prices.gold <= 0 ||
        typeof prices.silver !== 'number' || !isFinite(prices.silver) || prices.silver <= 0) {
      console.warn('Cannot calculate nisab values: invalid metal prices', prices);
      return null;
    }

    console.log('🔄 useNisabStatus: Calculating dynamic nisab values', {
      gold: prices.gold,
      silver: prices.silver,
      pricesCurrency: prices.currency,
      targetCurrency,
      timestamp: new Date().toISOString()
    });

    // Use the pure utility function to calculate nisab thresholds
    const thresholds = calculateNisabThresholds(prices, targetCurrency);

    // Log if we used fallback values
    if (thresholds.usedFallback) {
      console.warn('useNisabStatus: Used fallback values for nisab calculation', {
        currency: targetCurrency,
        goldThreshold: thresholds.goldThreshold,
        silverThreshold: thresholds.silverThreshold,
        nisabValue: thresholds.nisabValue
      });
    }

    return {
      nisabValue: thresholds.nisabValue,
      totalValue: convertedValues.totalValue, // Keep the existing total value
      goldThreshold: thresholds.goldThreshold,
      silverThreshold: thresholds.silverThreshold,
      isDirectGoldPrice: thresholds.isDirectGoldPrice,
      isDirectSilverPrice: thresholds.isDirectSilverPrice,
      usedFallback: thresholds.usedFallback
    };
  }, [convertedValues.totalValue]);

  // Recalculate eligibility with converted values
  const meetsNisab = convertedValues.totalValue >= convertedValues.nisabValue;

  // Determine error message (use local or global error)
  const errorMessage = localError || fetchError || null;

  // Update the updateLocalNisabValues function to use the new calculation method
  const updateLocalNisabValues = useCallback((prices: ExtendedMetalPrices) => {
    // Proper validation - check for valid numbers, not truthy values (0 is falsy but valid)
    if (!prices ||
        typeof prices.gold !== 'number' || !isFinite(prices.gold) || prices.gold <= 0 ||
        typeof prices.silver !== 'number' || !isFinite(prices.silver) || prices.silver <= 0) {
      console.warn('Cannot update nisab values: invalid metal prices', prices);
      return;
    }

    console.log('🔄 useNisabStatus: Updating nisab values with current prices (UI UPDATE)', {
      gold: prices.gold,
      silver: prices.silver,
      pricesCurrency: prices.currency,
      currentCurrency: currency,
      timestamp: new Date().toISOString()
    });

    // Calculate nisab values dynamically using the current currency
    const newValues = calculateDynamicNisabValues(prices, currency);

    if (newValues) {
      // Update the converted values with the new calculations
      setConvertedValues(prev => ({
        ...prev,
        nisabValue: newValues.nisabValue,
        goldThreshold: newValues.goldThreshold,
        silverThreshold: newValues.silverThreshold,
        isDirectGoldPrice: newValues.isDirectGoldPrice,
        isDirectSilverPrice: newValues.isDirectSilverPrice,
        usedFallback: newValues.usedFallback
      }));
    }
  }, [calculateDynamicNisabValues, currency]);

  // Fix the retryWithBackoff function to match the fetchNisabData return type
  const retryWithBackoff = async <T>(
    fetchFn: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> => {
    let currentRetry = 0;
    const localError: string | null = null;

    while (currentRetry <= maxRetries) {
      try {
        return await fetchFn();
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        // Check if this is our last retry
        if (currentRetry === maxRetries) {
          setLocalError(errorMessage || "Failed to fetch nisab data");
          setRetryCount(currentRetry + 1);
          break;
        }

        // Wait before retrying - exponential backoff
        const delay = Math.pow(2, currentRetry) * 1000;
        console.log(`Waiting ${delay}ms before retry ${currentRetry + 1}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        currentRetry++;
      }
    }

    throw new Error(localError || "Failed after multiple retries");
  };

  // Fix the handleManualRefresh function to use retryWithBackoff correctly
  const handleManualRefresh = async (): Promise<boolean> => {
    try {
      setIsFetching(true);
      setLocalError(null);
      setRetryCount(0);

      // Use the retryWithBackoff function to handle retries
      // Call fetchNisabData without arguments since it uses the current currency from state
      await retryWithBackoff(() => fetchNisabData());

      console.log("Manually refreshed nisab data successfully");
      setLastFetchTime(Date.now());
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Manual refresh failed after multiple retries:", errorMessage);
      setLocalError("Failed to refresh nisab data. Please try again later.");
      setIsFetching(false);
      return false;
    }
  };

  // Modify the handleManualCurrencyUpdate function to ensure it always completes
  const handleManualCurrencyUpdate = async (newCurrency: string, isReplitEnv = IS_REPLIT) => {
    console.log(`useNisabStatus: Manual currency update to ${newCurrency}${isReplitEnv ? ' (in Replit)' : ''}`);
    setIsFetching(true);
    setLocalError(null);

    // Define currencies that need special handling
    const currenciesNeedingSpecialHandling = ['AED', 'INR', 'PKR', 'SAR'];

    // Check if this currency needs special handling
    const needsSpecialHandling = currenciesNeedingSpecialHandling.includes(newCurrency.toUpperCase());

    // Add a safety timeout to prevent infinite processing
    const safetyTimeout = setTimeout(() => {
      console.warn(`useNisabStatus: Safety timeout triggered for ${newCurrency} update`);
      setIsFetching(false);
    }, 10000); // 10 second safety timeout

    try {
      // For currencies that need special handling, try to use the refreshNisabCalculations utility if available
      if (needsSpecialHandling) {
        console.log(`useNisabStatus: Special handling for ${newCurrency} currency`);

        // Try to import the utility function
        try {
          const { refreshNisabCalculations } = await import('@/lib/utils/nisabCalculations');

          // If we have current metal prices, use them as a base
          if (metalPrices && metalPrices.gold > 0 && metalPrices.silver > 0) {
            console.log(`useNisabStatus: Using refreshNisabCalculations for ${newCurrency} with current prices`);

            const result = await refreshNisabCalculations(
              {
                gold: metalPrices.gold,
                silver: metalPrices.silver,
                currency: metalPrices.currency
              },
              newCurrency
            );

            if (result && result.refreshed) {
              console.log(`useNisabStatus: Successfully refreshed ${newCurrency} calculations`, result);

              // Create an extended metal prices object with the refreshed values
              const extendedPrices = {
                gold: result.goldThreshold / NISAB.GOLD.GRAMS,
                silver: result.silverThreshold / NISAB.SILVER.GRAMS,
                currency: newCurrency,
                lastUpdated: new Date(),
                isCache: false,
                source: `${newCurrency.toLowerCase()}-special-refresh`
              };

              // Update local values
              updateLocalNisabValues(extendedPrices);

              // Update store
              if (setMetalPrices) {
                setMetalPrices(extendedPrices);
              }

              // Force UI update
              setComponentKey(Date.now());

              // Clear timeout and reset fetching state
              clearTimeout(safetyTimeout);
              setIsFetching(false);

              return;
            }
          }
        } catch (specialHandlingError) {
          console.warn(`useNisabStatus: Failed to use special handling for ${newCurrency}:`, specialHandlingError);
          // Continue with standard approach
        }
      }

      // First attempt to get metal prices from the API with refresh option
      const response = await fetchMetalPrices(newCurrency, {
        refresh: true,
        timeout: isReplitEnv ? REPLIT_API_TIMEOUT : 5000,  // Use shorter timeout for currency changes
        forceFailover: isReplitEnv // Force failover for Replit to avoid API calls
      });

      console.log('useNisabStatus: Manual fetch complete:', response);

      if (response && response.gold && response.silver) {
        // Force an immediate UI update
        setComponentKey(Date.now());

        // Create an extended metal prices object with all the properties we need
        const extendedPrices: ExtendedMetalPrices = {
          gold: response.gold,
          silver: response.silver,
          currency: newCurrency,
          lastUpdated: new Date(),
          isCache: response.isCache || false,
          source: response.source || 'manual-update'
        };

        // Add USD prices if available for better conversion
        if (response.currency !== 'USD' && 'goldUSD' in response) {
          extendedPrices.goldUSD = response.goldUSD as number;
          if ('silverUSD' in response) {
            extendedPrices.silverUSD = response.silverUSD as number;
          }
        }

        // Add exchange rate if available
        if ('exchangeRate' in response) {
          extendedPrices.exchangeRate = response.exchangeRate as number;
        }

        // We successfully got prices, update the UI immediately using dynamic calculation
        updateLocalNisabValues(extendedPrices);

        // Also update the store with these new values
        if (setMetalPrices) {
          console.log('useNisabStatus: Updating store with new metal prices');
          // Convert ExtendedMetalPrices to the expected MetalPrices format
          setMetalPrices({
            gold: extendedPrices.gold,
            silver: extendedPrices.silver,
            currency: extendedPrices.currency,
            lastUpdated: extendedPrices.lastUpdated,
            isCache: extendedPrices.isCache || false,
            source: extendedPrices.source || 'manual-update'
          });

          // Dispatch an event to tell other components we have new prices
          const event = new CustomEvent('metals-updated', {
            detail: {
              currency: newCurrency,
              fresh: true,
              source: 'manual-update'
            }
          });
          window.dispatchEvent(event);
        }

        // CRITICAL FIX: Use a try/catch block and don't wait for the promise to complete
        // This prevents blocking the UI thread and avoids potential infinite recursion
        try {
          // Use forceRefreshNisabForCurrency if available (preferred for currency changes)
          if (forceRefreshNisabForCurrency) {
            console.log(`useNisabStatus: Using forceRefreshNisabForCurrency for ${newCurrency}`);
            // Don't await this call to prevent blocking
            forceRefreshNisabForCurrency(newCurrency)
              .catch(err => {
                console.error('useNisabStatus: Error in forced nisab refresh after manual update:', err instanceof Error ? err.message : String(err));
                if (isReplitEnv) {
                  setIsOfflineMode(true);
                }
              });
          }
        } catch (refreshError) {
          console.error('useNisabStatus: Error triggering nisab refresh:', refreshError instanceof Error ? refreshError.message : String(refreshError));
        }
      }
    } catch (error) {
      console.error('useNisabStatus: Error in manual currency update:', error instanceof Error ? error.message : String(error));
      setLocalError('Failed to update prices for the new currency.');

      // For Replit environment, set offline mode on error
      if (isReplitEnv) {
        console.log('useNisabStatus: Setting offline mode due to error in Replit environment');
        setIsOfflineMode(true);
      }
    } finally {
      // Clear the safety timeout
      clearTimeout(safetyTimeout);

      // Always reset fetching state after a short delay
      setTimeout(() => {
        setIsFetching(false);
      }, 1000);
    }
  };

  // Enhance the forceImmediateUpdate function to handle currency changes better
  const forceImmediateUpdate = async (forceRefresh = false) => {
    console.log('useNisabStatus: Forcing immediate update with fallback data', { forceRefresh, currency });

    // Add a safety timeout to prevent infinite processing
    const safetyTimeout = setTimeout(() => {
      console.warn(`useNisabStatus: Safety timeout triggered for immediate update`);
      setIsFetching(false);
    }, 10000); // 10 second safety timeout

    // Mark as initialized in session storage to help with page reloads
    try {
      sessionStorage.setItem(ALREADY_INITIALIZED_KEY, 'true');
    } catch {
      // Ignore storage errors
    }

    try {
      // Always use fallback data for immediate display to prevent API issues
      const response = await fetchMetalPrices(currency, {
        forceFailover: true,
        timeout: 3000 // Short timeout for fallback data
      });

      console.log('useNisabStatus: Using fallback data for immediate display', response);

      // ALWAYS update local component state immediately using dynamic calculation
      updateLocalNisabValues(response);

      // Also update the store
      if (setMetalPrices) {
        setMetalPrices({
          gold: response.gold,
          silver: response.silver,
          currency: response.currency,
          lastUpdated: response.lastUpdated,
          isCache: response.isCache || false,
          source: response.source || 'immediate-fallback'
        });
      }

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('metals-updated', {
        detail: {
          currency: currency,
          fresh: true,
          source: 'immediate-fallback'
        }
      }));

      // Force a UI update
      setComponentKey(Date.now());

      // For Replit, also try to fetch fresh data after a delay if requested
      if (forceRefresh && !IS_REPLIT) {
        // Use setTimeout to avoid blocking the UI thread
        setTimeout(() => {
          console.log('useNisabStatus: Attempting to fetch fresh data after initial fallback display');
          // Don't await this call to prevent blocking
          handleManualCurrencyUpdate(currency, false)
            .catch(err => {
              console.error('useNisabStatus: Error fetching fresh data after fallback:', err instanceof Error ? err.message : String(err));
            });
        }, 1000); // Use a longer delay to ensure UI is responsive first
      }
    } catch (error: unknown) {
      console.error('useNisabStatus: Error in immediate update:', error instanceof Error ? error.message : String(error));

      // Even if there's an error, ensure we have some values displayed
      if (IS_REPLIT) {
        setIsOfflineMode(true);
        setLocalError("Could not connect to the nisab calculation service");
      }
    } finally {
      // Clear the safety timeout
      clearTimeout(safetyTimeout);

      // Always mark as fetched after a short timeout
      setTimeout(() => {
        if (isFetching) {
          setIsFetching(false);
        }
      }, 1000);
    }
  };

  // Calculate how much more is needed to reach Nisab with proper validation
  const calculateMoreNeeded = () => {
    // Return 0 if already meets Nisab
    if (meetsNisab) return 0;

    // Handle the case where total value is zero or very small
    // This prevents showing the full Nisab value as "needed more" when user has no assets
    const amountNeeded = Math.max(
      0,
      convertedValues.nisabValue - convertedValues.totalValue,
    );

    if (convertedValues.totalValue <= 0) {
      // Log that user has no assets, which is why they're under Nisab
      console.log(
        "User has no assets, showing full Nisab threshold as needed amount",
      );
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

  // Get a user-friendly error message
  const getUserFriendlyErrorMessage = () => {
    if (!errorMessage) return null;

    if (errorMessage.includes("404") || errorMessage.includes("not found")) {
      return "The nisab calculation service is temporarily unavailable.";
    } else if (errorMessage.includes("Failed to fetch")) {
      return "Could not connect to the nisab calculation service.";
    } else {
      return "There was an issue getting the latest nisab data.";
    }
  };

  // Add helper to detect suspiciously low values 
  // This can be used in the UI component to show a warning
  const hasSuspiciouslyLowValues = (currency: string, goldThreshold?: number, silverThreshold?: number): boolean => {
    if (!goldThreshold || !silverThreshold) return false;

    // Different currencies have different expected value ranges
    if (currency === 'PKR') {
      return goldThreshold < 100000 || silverThreshold < 10000;
    }

    // Add checks for INR currency
    if (currency === 'INR') {
      return goldThreshold < 100000 || silverThreshold < 10000;
    }

    // Add checks for other currencies if needed
    return false;
  };

  // Effect for initialization - now depends on isStoreHydrated
  useEffect(() => {
    // Only run initialization when store is hydrated and we haven't initialized yet
    if (!isStoreHydrated || hasInitialized) return;

    // Run only once when component mounts and store is hydrated
    console.log('useNisabStatus: Store hydrated - initializing with current prices');

    // First, make sure we're showing something immediately using the props we received
    setConvertedValues({
      nisabValue: nisabStatus.nisabValue,
      totalValue: nisabStatus.totalValue,
      goldThreshold: nisabStatus.thresholds.gold,
      silverThreshold: nisabStatus.thresholds.silver,
      isDirectGoldPrice: true,
      isDirectSilverPrice: true,
      usedFallback: false
    });

    // Set initialized to true
    hasInitializedRef.current = true;
    setHasInitialized(true);

    // Force an immediate refresh of metal prices and nisab data when component first loads
    const initializeNisabData = async () => {
      try {
        // Special handling for Replit environment
        if (IS_REPLIT) {
          console.log('useNisabStatus: Replit environment detected, forcing immediate update');

          // Check if we've already initialized in this session
          let alreadyInitialized = false;
          try {
            alreadyInitialized = sessionStorage.getItem(ALREADY_INITIALIZED_KEY) === 'true';
          } catch {
            // Ignore storage errors
          }

          // If not yet initialized in this session, force a complete refresh
          if (!alreadyInitialized) {
            console.log('useNisabStatus: First load in session, forcing complete refresh');
            forceImmediateUpdate(true); // Pass true to force a refresh after fallback
            return;
          }

          // If already initialized, still update but don't need to be as aggressive
          forceImmediateUpdate(false);
          return;
        }

        // For non-Replit environments, continue with normal initialization
        const currentState = useZakatStore.getState();
        const currentPrices = currentState.metalPrices;

        // Update local values if we have valid prices with matching currency
        if (currentPrices && currentPrices.gold && currentPrices.silver) {
          console.log('useNisabStatus: Using existing prices for initial load');
          // Use dynamic calculation instead of stored values
          updateLocalNisabValues(currentPrices);
        } else {
          // Otherwise fetch new prices for the current currency
          console.log('useNisabStatus: Fetching fresh prices for initial load');
          await handleManualCurrencyUpdate(currency);
        }

        // Always fetch fresh nisab data after a short delay
        setTimeout(() => {
          if (!currentState.isFetchingNisab) {
            console.log('useNisabStatus: Triggering fresh nisab data fetch on initial load');
            fetchNisabData().catch(error => {
              console.error('useNisabStatus: Error fetching nisab data on initial load:', error instanceof Error ? error.message : String(error));
            });
          }
        }, 300);
      } catch (error: unknown) {
        console.error('useNisabStatus: Error during initial load:', error instanceof Error ? error.message : String(error));

        // On error, still try to display something
        if (IS_REPLIT) {
          setIsOfflineMode(true);
          setLocalError("Could not connect to the nisab calculation service");
          forceImmediateUpdate(false);
        }
      }
    };

    // Execute the initialization
    initializeNisabData();

    // Emit an event to notify other components that we're initializing
    const event = new CustomEvent('nisab-initializing', {
      detail: { currency }
    });
    window.dispatchEvent(event);
  }, [isStoreHydrated, hasInitialized, currency, nisabStatus]); // Add isStoreHydrated as a dependency

  // Effect to detect offline mode from error message
  useEffect(() => {
    if (
      fetchError &&
      fetchError.includes("Could not connect to the nisab calculation service")
    ) {
      setIsOfflineMode(true);
    } else {
      setIsOfflineMode(false);
    }
  }, [fetchError]);

  // Effect for currency changes
  useEffect(() => {
    // Always check if currency has changed from the last one we processed
    const currencyChanged = currency !== lastReceivedCurrencyRef.current;

    // Add a debounce mechanism to prevent rapid currency changes
    const now = Date.now();
    const timeSinceLastChange = now - currencyRefreshTimeRef.current;
    const isDebounced = timeSinceLastChange < 2000; // 2 second debounce

    if (currencyChanged && !isDebounced) {
      console.log(`useNisabStatus: Currency changed from ${lastReceivedCurrencyRef.current} to ${currency} - FORCING IMMEDIATE UPDATE`);

      // Update the reference immediately to prevent duplicate processing
      lastReceivedCurrencyRef.current = currency;

      // Force an immediate component rerender with a new key
      setComponentKey(Date.now());

      // Set immediate fetching state for UI feedback
      setIsFetching(true);

      // Clear any errors and reset retry count
      setLocalError(null);
      setRetryCount(0);

      // If we have current metal prices, recalculate nisab values with the new currency
      if (metalPrices && metalPrices.gold && metalPrices.silver) {
        console.log('useNisabStatus: Recalculating nisab values with new currency using existing metal prices');
        updateLocalNisabValues(metalPrices);
      }

      // Always use the safer forceImmediateUpdate approach with fallback data first
      // This ensures the UI remains responsive
      forceImmediateUpdate(false);

      // Record the time of this currency change for future reference
      currencyRefreshTimeRef.current = now;
    } else if (currencyChanged && isDebounced) {
      console.log(`useNisabStatus: Currency change to ${currency} debounced (last change ${timeSinceLastChange}ms ago)`);
      // Still update the reference to prevent future processing
      lastReceivedCurrencyRef.current = currency;
    }
  }, [currency, metalPrices, updateLocalNisabValues, forceImmediateUpdate]); // Add forceImmediateUpdate to dependencies

  // Effect to track metalPrices changes and update UI
  useEffect(() => {
    if (metalPrices && !isFetching) {
      console.log('useNisabStatus: Metal prices updated, refreshing calculations', {
        gold: metalPrices.gold,
        silver: metalPrices.silver,
        lastUpdated: metalPrices.lastUpdated,
        currency: metalPrices.currency,
        displayCurrency: currency
      });

      // Always recalculate nisab values dynamically with the current currency
      // This ensures we're always showing values in the user's selected currency
      updateLocalNisabValues(metalPrices);

      // Force a refresh of the nisab threshold in the store
      // This ensures the nisab threshold is always in sync with the metal prices
      const currentState = useZakatStore.getState();
      if (typeof currentState.updateNisabWithPrices === 'function') {
        console.log('useNisabStatus: Forcing nisab update with current metal prices');
        currentState.updateNisabWithPrices(metalPrices);
      } else if (typeof currentState.forceRefreshNisabForCurrency === 'function' && metalPrices.currency) {
        console.log('useNisabStatus: Forcing nisab refresh with current currency:', metalPrices.currency);
        currentState.forceRefreshNisabForCurrency(metalPrices.currency)
          .then(success => {
            console.log('useNisabStatus: Nisab refresh result:', success ? 'success' : 'failed');
          })
          .catch(error => {
            console.error('useNisabStatus: Error refreshing nisab data:', error);
          });
      }
    }
  }, [metalPrices, currency, isFetching, updateLocalNisabValues]);

  // Effect to update totalValue when it changes in props
  useEffect(() => {
    // If totalValue has changed in props, update the local state
    if (nisabStatus.totalValue !== convertedValues.totalValue) {
      console.log('useNisabStatus: Total value updated from props', {
        old: convertedValues.totalValue,
        new: nisabStatus.totalValue
      });

      setConvertedValues(prev => ({
        ...prev,
        totalValue: nisabStatus.totalValue
      }));
    }
  }, [nisabStatus.totalValue, convertedValues.totalValue]);

  return {
    convertedValues,
    isFetching,
    isOfflineMode,
    errorMessage,
    lastFetchTime,
    retryCount,
    meetsNisab,
    componentKey,

    handleRefresh: handleManualRefresh,
    handleManualCurrencyUpdate,
    forceImmediateUpdate,
    updateLocalNisabValues,
    getNisabStatusMessage,
    getNisabMetalUsed,
    calculateMoreNeeded,
    getUserFriendlyErrorMessage,
    setComponentKey,
    hasSuspiciouslyLowValues
  };
} 