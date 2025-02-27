import { useState, useEffect, useRef, useCallback } from 'react'
import { ForeignCurrencyEntry } from '@/store/types'
import { debounce } from '@/lib/utils'
import { evaluateExpression } from '@/lib/utils'

type UseForeignCurrencyProps = {
  currency: string
  storeEntries: ForeignCurrencyEntry[] | undefined
  storeTotal: number
  convertAmount: (amount: number, from: string, to: string) => number
  updateStore: (entries: ForeignCurrencyEntry[], total: number) => void
}

// Function to determine the best default foreign currency based on user's global currency
const getDefaultForeignCurrency = (baseCurrency: string): string => {
  // Ensure baseCurrency is a valid string
  if (!baseCurrency || typeof baseCurrency !== 'string') {
    console.warn('Invalid baseCurrency provided to getDefaultForeignCurrency:', baseCurrency);
    return 'USD'; // Default to USD for invalid input
  }
  
  // Map of region-appropriate default currencies
  const currencyDefaults: Record<string, string> = {
    // South Asian defaults
    'PKR': 'USD', // Pakistan -> USD
    'INR': 'USD', // India -> USD
    'BDT': 'USD', // Bangladesh -> USD
    'LKR': 'USD', // Sri Lanka -> USD
    'NPR': 'USD', // Nepal -> USD
    'MVR': 'USD', // Maldives -> USD
    
    // Middle Eastern defaults
    'AED': 'USD', // UAE -> USD
    'SAR': 'USD', // Saudi Arabia -> USD
    'QAR': 'USD', // Qatar -> USD
    'KWD': 'USD', // Kuwait -> USD
    'BHD': 'USD', // Bahrain -> USD
    'OMR': 'USD', // Oman -> USD
    'JOD': 'USD', // Jordan -> USD
    'EGP': 'USD', // Egypt -> USD
    
    // European defaults
    'EUR': 'USD', // Euro -> USD
    'GBP': 'USD', // UK -> USD
    'CHF': 'EUR', // Switzerland -> EUR
    
    // North American defaults
    'USD': 'EUR', // US -> EUR
    'CAD': 'USD', // Canada -> USD
    'MXN': 'USD', // Mexico -> USD
    
    // East Asian defaults
    'JPY': 'USD', // Japan -> USD
    'CNY': 'USD', // China -> USD
    'HKD': 'USD', // Hong Kong -> USD
    'KRW': 'USD', // South Korea -> USD
    'SGD': 'USD', // Singapore -> USD
    'MYR': 'USD', // Malaysia -> USD
    'IDR': 'USD'  // Indonesia -> USD
  };
  
  // Default to USD or EUR if no specific mapping found
  if (currencyDefaults[baseCurrency]) {
    return currencyDefaults[baseCurrency];
  }
  
  // Add null check before accessing toUpperCase to prevent TypeError
  if (!baseCurrency) {
    return 'USD'; // Default to USD if baseCurrency is undefined or null
  }
  
  // If user's currency is USD, default to EUR, otherwise default to USD
  return baseCurrency.toUpperCase() === 'USD' ? 'EUR' : 'USD';
};

export function useForeignCurrency({
  currency,
  storeEntries,
  storeTotal,
  convertAmount,
  updateStore
}: UseForeignCurrencyProps) {
  // Validate the currency parameter
  const validCurrency = currency || 'USD'; // Default to USD if currency is undefined
  
  // Get the appropriate default foreign currency
  const defaultForeignCurrency = getDefaultForeignCurrency(validCurrency);
  
  // Local state for currency entries - initialize with a better default
  const [foreignCurrencies, setForeignCurrencies] = useState<ForeignCurrencyEntry[]>(() => {
    // Properly initialize from store values if they exist
    if (Array.isArray(storeEntries) && storeEntries.length > 0) {
      return storeEntries.map(entry => ({
        ...entry,
        rawInput: entry.rawInput || entry.amount.toString() // Ensure rawInput is set
      }));
    }
    // Otherwise use smart default
    return [{ amount: 0, currency: defaultForeignCurrency, rawInput: '' }];
  });
  
  // Use a more simplified approach to prevent update cycles
  const isSyncingRef = useRef(false)
  const wasResetRef = useRef(false)
  const hasEverUpdatedRef = useRef(false)
  const initializedRef = useRef(false)
  
  // Warning state for conversion issues
  const [conversionWarning, setConversionWarning] = useState<string | null>(null)
  
  // Fallback rates cache
  const [fallbackRates, setFallbackRates] = useState<Record<string, number>>({})

  // Calculate total in base currency with fallbacks
  const calculateTotalInBaseCurrency = useCallback((entries: ForeignCurrencyEntry[]) => {
    if (!Array.isArray(entries) || entries.length === 0) {
      return 0;
    }
    
    let hasWarning = false;
    const conversionErrors: string[] = [];
    
    const total = entries.reduce((total, entry) => {
      if (entry.currency === validCurrency) {
        // If the entry is already in the base currency, no conversion needed
        return total + (entry.amount || 0);
      }
      
      try {
        // Try to convert using real-time rates first
        const converted = convertAmount(entry.amount || 0, entry.currency, validCurrency);
        if (!isNaN(converted) && isFinite(converted)) {
          // Store successful conversion rate for fallback
          const rate = converted / (entry.amount || 1); // Avoid division by zero
          setFallbackRates(prev => ({
            ...prev,
            [`${entry.currency}_${validCurrency}`]: rate
          }));
          return total + converted;
        }
        
        // Fallback to static rates if real-time conversion failed
        const fallbackRateKey = `${entry.currency}_${validCurrency}`;
        if (fallbackRates[fallbackRateKey]) {
          const convertedAmount = entry.amount * fallbackRates[fallbackRateKey];
          hasWarning = true;
          console.warn(`Using cached fallback rate for ${entry.currency} to ${validCurrency}: ${fallbackRates[fallbackRateKey]}`);
          return total + convertedAmount;
        }
        
        // Try inverse rate
        const inverseRateKey = `${validCurrency}_${entry.currency}`;
        if (fallbackRates[inverseRateKey]) {
          const convertedAmount = entry.amount / fallbackRates[inverseRateKey];
          hasWarning = true;
          console.warn(`Using inverse fallback rate for ${entry.currency} to ${validCurrency}: ${1/fallbackRates[inverseRateKey]}`);
          return total + convertedAmount;
        }
        
        // Last resort fallback - use the unconverted amount
        hasWarning = true;
        conversionErrors.push(`${entry.currency} to ${validCurrency}`);
        console.warn(`No conversion available for ${entry.amount} ${entry.currency} to ${validCurrency} - using original amount`);
        return total + (entry.amount || 0);
      } catch (error) {
        console.error(`Error converting ${entry.currency} to ${validCurrency}:`, error);
        hasWarning = true;
        conversionErrors.push(`${entry.currency} to ${validCurrency}`);
        return total + (entry.amount || 0);
      }
    }, 0);
    
    // Set appropriate warning message
    if (hasWarning) {
      if (conversionErrors.length > 0) {
        setConversionWarning(
          `Unable to convert: ${conversionErrors.join(', ')}. Using approximate values.`
        );
      } else {
        setConversionWarning(
          "Some currencies couldn't be converted with current rates. Using cached rates instead."
        );
      }
    } else {
      setConversionWarning(null);
    }
    
    return total;
  }, [convertAmount, validCurrency, fallbackRates]);

  // Enhanced initialization effect to ensure we properly handle store entries when component mounts
  // or when storeEntries change
  useEffect(() => {
    // Skip if we're in a sync operation
    if (isSyncingRef.current) return;

    // Lock syncing
    isSyncingRef.current = true;
    
    try {
      // Special reset detection (empty store but we've had entries before)
      const isResetCondition = Array.isArray(storeEntries) && 
                               storeEntries.length === 0 && 
                               storeTotal === 0 &&
                               hasEverUpdatedRef.current;

      // Handle reset case
      if (isResetCondition) {
        console.log('RESET DETECTED! Clearing foreign currency entries');
        
        // Mark that we've seen a reset
        wasResetRef.current = true;
        
        // Set an empty default state with the appropriate default currency
        setForeignCurrencies([{ 
          amount: 0, 
          currency: defaultForeignCurrency, 
          rawInput: '' 
        }]);
        
        // Unlock after a delay
        setTimeout(() => {
          wasResetRef.current = false;
        }, 100);
        
        return;
      }

      // Handle case where we have store entries - this is the most important for the issue
      if (Array.isArray(storeEntries) && storeEntries.length > 0) {
        console.log('Loading foreign currency entries from store:', storeEntries);
        
        // Ensure entries have rawInput populated
        const validEntries = storeEntries.map(entry => ({
          ...entry,
          rawInput: entry.rawInput || entry.amount.toString()
        }));
        
        setForeignCurrencies(validEntries);
        hasEverUpdatedRef.current = true;
        initializedRef.current = true;
      }
      // Special handling for initial state - ensure we don't overwrite with default if we've already initialized
      else if (!initializedRef.current) {
        // Set initial default entry with the appropriate default currency
        console.log('Initializing default foreign currency entry with:', defaultForeignCurrency);
        setForeignCurrencies([{ 
          amount: 0, 
          currency: defaultForeignCurrency, 
          rawInput: '' 
        }]);
        initializedRef.current = true;
      }
    } finally {
      // Unlock sync
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 50);
    }
  }, [storeEntries, storeTotal, validCurrency, defaultForeignCurrency]);
  
  // Effect to update store when local currencies change
  useEffect(() => {
    // Skip during syncing or reset
    if (isSyncingRef.current || wasResetRef.current) {
      return;
    }
    
    // Skip default state
    const isEmptyState = foreignCurrencies.length === 1 && 
                         foreignCurrencies[0].amount === 0 && 
                         foreignCurrencies[0].rawInput === '';
    
    if (isEmptyState && (!storeEntries || storeEntries.length === 0)) {
      return;
    }
    
    // Mark syncing
    isSyncingRef.current = true;
    
    // Calculate total and update store
    const total = calculateTotalInBaseCurrency(foreignCurrencies);
    updateStore(foreignCurrencies, total);
    
    // Mark that we've had a meaningful update
    hasEverUpdatedRef.current = true;
    
    // Clear sync flag after delay
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 50);
    
  }, [foreignCurrencies, calculateTotalInBaseCurrency, updateStore, storeEntries]);

  // Handle changing an entry - simplified
  const handleForeignCurrencyChange = useCallback((index: number, field: 'amount' | 'currency', value: string) => {
    // Don't allow changes during sync or reset operations
    if (isSyncingRef.current || wasResetRef.current) return;
    
    if (field === 'amount') {
      // Validate input for math expressions
      if (!/^[\d+\-*/.() ]*$/.test(value) && value !== '') {
        return; // Ignore invalid characters
      }
    }

    setForeignCurrencies(prev => {
      const updated = [...prev];
      if (field === 'amount') {
        updated[index] = {
          ...updated[index],
          rawInput: value
        };

        // Handle empty input
        if (!value) {
          updated[index].amount = 0;
          return updated;
        }

        // Evaluate if expression is complete
        if (!/[+\-*/.]$/.test(value)) {
          try {
            const cleanInput = value.replace(/,/g, '');
            const numericValue = evaluateExpression(cleanInput);
            if (!isNaN(numericValue)) {
              updated[index].amount = numericValue;
            }
          } catch (error) {
            console.warn('Invalid calculation:', error);
          }
        }
      } else if (field === 'currency') {
        updated[index] = {
          ...updated[index],
          currency: value
        };
      }
      return updated;
    });
  }, []);

  // Add a new foreign currency entry with the appropriate default
  const addForeignCurrency = useCallback(() => {
    setForeignCurrencies(prev => {
      // Get a list of currencies already in use
      const usedCurrencies = prev.map(entry => entry.currency);
      
      // For the new entry, try to select a currency not already in use
      // First try USD/EUR as they're common
      let newCurrency = defaultForeignCurrency;
      
      // If the default is already used, try the alternate
      if (usedCurrencies.includes(newCurrency)) {
        newCurrency = newCurrency === 'USD' ? 'EUR' : 'USD';
      }
      
      // If both USD and EUR are used, try GBP
      if (usedCurrencies.includes(newCurrency)) {
        newCurrency = 'GBP';
      }
      
      // If even GBP is used, just use default
      return [...prev, { amount: 0, currency: newCurrency, rawInput: '' }];
    });
  }, [defaultForeignCurrency]);

  // Remove a foreign currency entry
  const removeForeignCurrency = useCallback((index: number) => {
    setForeignCurrencies(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    foreignCurrencies,
    conversionWarning,
    handleForeignCurrencyChange,
    removeForeignCurrency,
    addForeignCurrency
  };
} 