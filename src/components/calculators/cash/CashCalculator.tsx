'use client'

import { useCallback, useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/label'
import { 
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip"
import { useZakatStore } from '@/store/zakatStore'
import { evaluateExpression } from '@/lib/utils'
import { FAQ } from '@/components/ui/faq'
import { ASSET_FAQS } from '@/config/faqs'
import { useCurrencyStore } from '@/lib/services/currency'
import { DeleteIcon } from '@/components/ui/icons/icon-delete'
import { PlusIcon } from 'lucide-react'
import { CurrencySelector } from '@/components/CurrencySelector'
import { ForeignCurrencyEntry } from '@/store/types'
import { CalculatorNav } from '@/components/ui/calculator-nav'
import { useForeignCurrency } from '@/hooks/useForeignCurrency'
import { CashValues as StoreCashValues } from '@/store/types'
import { 
  CashCalculatorProps,
  ForeignCurrencyInputProps,
  CashInputFieldProps,
  CashCategory,
  CashExpense,
  CashKey,
  InputValues,
  RawInputValues,
  EventHandlerProps,
  FormatHelpers
} from './types'

const CASH_KEYS: CashKey[] = [
  'cash_on_hand',
  'checking_account',
  'savings_account',
  'digital_wallets',
  'foreign_currency'
]

const CASH_CATEGORIES: CashCategory[] = [
  {
    id: 'cash_on_hand',
    name: 'Cash on Hand',
    description: 'Physical cash in your possession'
  },
  {
    id: 'checking_account',
    name: 'Checking Account',
    description: 'Balance in your checking account(s)'
  },
  {
    id: 'savings_account',
    name: 'Savings Account',
    description: 'Balance in your savings account(s)'
  },
  {
    id: 'digital_wallets',
    name: 'Digital Wallets (PayPal, Venmo, Apple Pay, etc.)',
    description: 'Balance in digital payment services and mobile wallets'
  },
  {
    id: 'foreign_currency',
    name: 'Foreign Currency',
    description: 'Any foreign currency holdings (converted to your local currency)',
    supportsCurrency: true
  }
]

const EXPENSES: CashExpense[] = [
  { 
    id: 'credit_card', 
    name: 'Credit Card Bills',
    description: 'Outstanding credit card balances'
  },
  { 
    id: 'utility_bills', 
    name: 'Utility Bills',
    description: 'Pending utility payments'
  },
  { 
    id: 'short_term_loans', 
    name: 'Short Term Loans',
    description: 'Loans due within the year'
  },
  { 
    id: 'unpaid_zakat', 
    name: 'Unpaid Zakat',
    description: 'Previous unpaid Zakat obligations'
  }
]

// Add a ConversionStatus component for better user feedback
const ConversionStatus = ({ 
  isLoading,
  error,
  warning,
  onRetry
}: {
  isLoading: boolean;
  error: string | null;
  warning: string | null;
  onRetry: () => void;
}) => {
  // Only show errors that require user action
  if (error) {
    return (
      <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md flex justify-between items-center mt-2">
        <div>
          <span className="font-medium">Error:</span> {error}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry} 
          className="ml-2 text-xs h-7"
        >
          Retry
        </Button>
      </div>
    );
  }
  
  // Don't show loading or general warning states to keep UI clean
  return null;
};

// Extract formatter utilities to reusable functions
const createFormatHelpers = (currency: string): FormatHelpers => {
  const formatNumber = (num: number): string => {
    if (num === 0) return '-'
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num)
  }

  const formatDisplayValue = (num: number): string => {
    if (num === 0) return '-'
    return `${currency} ${formatNumber(num)}`
  }

  const formatCurrency = (value: number): string => {
    if (value === 0) return '-'
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatTruncatedCurrency = (value: number): React.ReactNode => {
    if (value === 0) return '-'
    
    const formattedValue = formatCurrency(value)
    
    return (
      <span className="text-sm text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] inline-block">
        ≈ {formattedValue}
      </span>
    )
  }

  return {
    formatNumber,
    formatDisplayValue,
    formatCurrency,
    formatTruncatedCurrency
  }
}

// Extract event handler creation to a separate function
const createEventHandlers = (props: EventHandlerProps) => {
  const {
    onUpdateValues,
    setInputValues,
    cashHawlMet,
    cashValues,
    storeState,
    retryFetchRates,
    currency
  } = props;
  
  const handleCurrencyChange = () => {
    console.log('CashCalculator: Currency changed or refresh requested');
    
    // Retry fetching rates in case they're stale
    retryFetchRates(0);
    
    // Force recalculation of totals
    setTimeout(() => {
      const totalCash = storeState.getTotalCash();
      const totalZakatable = storeState.getTotalZakatableCash();
      
      // Notify parent component of the update
      onUpdateValues({
        total: totalCash,
        zakatable: totalZakatable
      });
      
      console.log('CashCalculator: Values refreshed after currency change', {
        totalCash,
        totalZakatable
      });
    }, 100);
  };
  
  const handleDisplayOnlyRefresh = (event: Event) => {
    // Type check and cast the event
    if (!(event instanceof CustomEvent)) return;
    
    const detail = event.detail || {};
    const isPageRefresh = detail.isPageRefresh === true;
    
    if (isPageRefresh) {
      console.log('CashCalculator: Received display-only refresh, preserving values');
      
      // Force a re-render and recalculation without changing values
      setTimeout(() => {
        // Use existing input values from component state
        const parsedValues = Object.entries(cashValues).reduce((acc, [key, value]) => {
          if (key !== 'foreign_currency_entries' && typeof value === 'number') {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, number>);
        
        // Calculate the total from the parsed values
        const totalCash = storeState.getTotalCash();
        const totalZakatable = cashHawlMet ? totalCash : 0;
        
        // Update display without resetting values
        onUpdateValues({
          total: totalCash,
          zakatable: totalZakatable
        });
      }, 100);
    }
  };

  return {
    handleCurrencyChange,
    handleDisplayOnlyRefresh
  };
};

// Extract input validation logic to a separate function
const validateAndProcessInput = (
  inputValue: string, 
  categoryId: string, 
  setCashValue: (key: keyof StoreCashValues, value: number) => void, 
  setInputValues: React.Dispatch<React.SetStateAction<InputValues>>,
  setRawInputValues: React.Dispatch<React.SetStateAction<RawInputValues>>
) => {
  // Always update raw input value to show what user is typing
  setRawInputValues((prev: RawInputValues) => ({
    ...prev,
    [categoryId]: inputValue
  }));

  try {
    // Allow empty input
    if (!inputValue) {
      setCashValue(categoryId as keyof StoreCashValues, 0);
      setInputValues((prev: InputValues) => ({
        ...prev,
        [categoryId]: ''
      }));
      return;
    }

    // Only evaluate if the expression is complete (not ending with an operator)
    if (!/[+\-*/.]$/.test(inputValue)) {
      // Remove any commas from the input before evaluating
      const cleanInput = inputValue.replace(/,/g, '');
      
      // Convert to numeric value (handles calculations)
      const numericValue = evaluateExpression(cleanInput);
      
      // Only update store if we have a valid number
      if (!isNaN(numericValue)) {
        setCashValue(categoryId as keyof StoreCashValues, numericValue);
        setInputValues((prev: InputValues) => ({
          ...prev,
          [categoryId]: numericValue.toString()
        }));
      }
    }
  } catch (error) {
    // Invalid calculation - don't update store
    console.warn('Invalid calculation:', error);
  }
};

// Create a separate component for the foreign currency section
const ForeignCurrencyInput: React.FC<ForeignCurrencyInputProps> = ({
  entries,
  isLoading,
  error,
  warning,
  currency,
  onRetry,
  onAdd,
  onRemove,
  onChange,
  convertAmount
}) => {
  // Memoize the formatter
  const formatTruncatedCurrency = useCallback((value: number): React.ReactNode => {
    if (value === 0) return '-'
    
    const formattedValue = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
    
    return (
      <span className="text-sm text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] inline-block">
        ≈ {formattedValue}
      </span>
    )
  }, [currency])
  
  return (
    <div className="space-y-3 w-full">
      {/* Show error status only when needed */}
      {error && (
        <ConversionStatus
          isLoading={isLoading}
          error={error}
          warning={warning}
          onRetry={onRetry}
        />
      )}
      
      {entries.map((entry: ForeignCurrencyEntry, index: number) => (
        <div key={index} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
            <div className="w-full sm:w-[240px]">
              <CurrencySelector
                value={entry.currency}
                onValueChange={(value) => onChange(index, 'currency', value)}
              />
            </div>
            <div className="relative flex-1 min-w-0">
              <Input
                type="text"
                inputMode="decimal"
                pattern="[\d+\-*/.() ]*"
                className="bg-white w-full pr-32"
                value={entry.rawInput || ''}
                onChange={(e) => {
                  onChange(index, 'amount', e.target.value);
                }}
                placeholder="Enter amount"
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                {entry.amount > 0 && entry.currency !== currency && (
                  formatTruncatedCurrency(convertAmount(entry.amount, entry.currency, currency))
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(index)}
              className="text-gray-500 hover:text-red-500 hover:bg-red-50 group transition-colors w-full sm:w-auto shrink-0"
            >
              <DeleteIcon className="h-4 w-4 group-hover:text-red-500 transition-colors" />
              <span className="ml-2 sm:hidden">Remove</span>
            </Button>
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="mt-2 rounded-full"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Add Currency
      </Button>
    </div>
  )
}

// Create a separate component for regular cash input fields
const CashInputField: React.FC<CashInputFieldProps> = ({ 
  id, 
  name, 
  currency, 
  value, 
  onChange 
}) => {
  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id}>{name}</Label>
      </div>
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <span className="text-sm font-medium text-gray-900">{currency}</span>
        </div>
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          pattern="[\d+\-*/.() ]*"
          className="pl-12 text-sm bg-white w-full"
          value={value}
          onChange={(e) => onChange(id, e)}
          placeholder={id === 'cash_on_hand' ? "Enter amount or calculation (e.g. 1500+1500)" : "Enter amount or calculation"}
        />
      </div>
    </div>
  )
}

export function CashCalculator({ 
  currency, 
  onCalculatorChange,
  onUpdateValues,
  onHawlUpdate,
  onOpenSummary,
  initialValues = {},
  initialHawlMet = true 
}: CashCalculatorProps) {
  const {
    cashValues,
    setCashValue,
    cashHawlMet,
    setCashHawlMet,
    getTotalCash,
    getTotalZakatableCash
  } = useZakatStore()

  // Track both display values and raw input values
  const [rawInputValues, setRawInputValues] = useState<RawInputValues>({})
  const [inputValues, setInputValues] = useState<InputValues>(() => 
    Object.keys(cashValues).reduce((acc, key) => {
      if (key === 'foreign_currency_entries') return acc
      return {
        ...acc,
        [key]: typeof cashValues[key as keyof StoreCashValues] === 'number' && 
               (cashValues[key as keyof StoreCashValues] as number) > 0 
          ? (cashValues[key as keyof StoreCashValues] as number).toString()
          : ''
      }
    }, {} as InputValues)
  )
  
  // Add a state to track if store has been hydrated
  const [storeHydrated, setStoreHydrated] = useState(false)
  
  const { rates, fetchRates, convertAmount, isLoading, error } = useCurrencyStore()
  
  // Memoize the store state to avoid unnecessary re-renders
  const storeState = useMemo(() => ({
    getTotalCash,
    getTotalZakatableCash
  }), [getTotalCash, getTotalZakatableCash])
  
  // Memoize formatter helpers
  const formatters = useMemo(() => createFormatHelpers(currency), [currency])
  const { formatNumber, formatDisplayValue, formatCurrency, formatTruncatedCurrency } = formatters
  
  // Add the retry mechanism for fetching rates - MOVED BEFORE THE USEEFFECT THAT REFERENCES IT
  const retryFetchRates = useCallback((retryCount = 0, maxRetries = 3) => {
    if (retryCount >= maxRetries) {
      console.warn(`Failed to fetch exchange rates after ${maxRetries} attempts`);
      return;
    }
    
    fetchRates(currency)
      .catch(() => {
        // Exponential backoff for retries
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying rate fetch in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        setTimeout(() => retryFetchRates(retryCount + 1, maxRetries), delay);
      });
  }, [currency, fetchRates]);
  
  // Memoize event handlers to prevent recreation on each render
  const eventHandlers = useMemo(() => createEventHandlers({
    onUpdateValues,
    setInputValues,
    cashHawlMet,
    cashValues,
    storeState,
    retryFetchRates,
    currency
  }), [onUpdateValues, setInputValues, cashHawlMet, cashValues, storeState, retryFetchRates, currency])
  
  const { handleCurrencyChange, handleDisplayOnlyRefresh } = eventHandlers
  
  // Add a listener for the store hydration event
  useEffect(() => {
    const handleHydrationComplete = (event?: Event) => {
      console.log('CashCalculator: Store hydration complete event received', event);
      
      // Mark the store as hydrated
      setStoreHydrated(true);
      
      // Check if this is part of initial page load
      const customEvent = event as CustomEvent;
      const isInitialLoad = customEvent?.detail?.isInitialPageLoad;
      
      console.log('CashCalculator: Hydration during initial page load:', isInitialLoad);
      
      // Only update the UI with values during initial hydration
      // This prevents inadvertent resets during page load
      if (isInitialLoad) {
        // We're still in the initial page load, so we should:
        // 1. Initialize form values from the store
        // 2. Do not trigger any validation or updates yet
        console.log('CashCalculator: initializing form values from store during initial hydration');
        
        // Handle foreign currency entries sync during initial load
        if (cashValues.foreign_currency_entries && 
            cashValues.foreign_currency_entries.length > 0) {
          // Directly set foreign currency entries from store
          setCashValue('foreign_currency_entries', cashValues.foreign_currency_entries);
        }
        
        // Set input values from store
        setInputValues((prev) => {
          const updatedInputs: InputValues = { ...prev };
          
          // Update each form field with store value
          Object.keys(cashValues).forEach((key) => {
            if (key !== 'foreign_currency_entries') {
              const value = cashValues[key as keyof StoreCashValues];
              if (typeof value === 'number' && !isNaN(value)) {
                updatedInputs[key as CashKey] = value.toString();
              }
            }
          });
          
          return updatedInputs;
        });
      }
    }
    
    // Listen for the custom hydration event
    window.addEventListener('store-hydration-complete', handleHydrationComplete)
    
    // Check if hydration already happened
    if (typeof window !== 'undefined') {
      // Safe way to check for custom property without TypeScript errors
      const win = window as any;
      if (win.hasDispatchedHydrationEvent) {
        handleHydrationComplete()
      }
    }
    
    return () => {
      window.removeEventListener('store-hydration-complete', handleHydrationComplete)
    }
  }, [cashValues, setCashValue, onUpdateValues, retryFetchRates])
  
  // Optimize currency change event listeners
  useEffect(() => {
    // Create a stable reference to the event handlers
    const currencyChangeHandler = handleCurrencyChange;
    const displayRefreshHandler = handleDisplayOnlyRefresh;
    
    // Listen for events
    window.addEventListener('currency-changed', currencyChangeHandler);
    window.addEventListener('zakat-calculators-refresh', currencyChangeHandler);
    window.addEventListener('calculator-values-refresh', currencyChangeHandler);
    window.addEventListener('currency-display-refresh', displayRefreshHandler);
    
    return () => {
      window.removeEventListener('currency-changed', currencyChangeHandler);
      window.removeEventListener('zakat-calculators-refresh', currencyChangeHandler);
      window.removeEventListener('calculator-values-refresh', currencyChangeHandler);
      window.removeEventListener('currency-display-refresh', displayRefreshHandler);
    };
  }, [handleCurrencyChange, handleDisplayOnlyRefresh]);
  
  // Fetch rates when currency changes with retry mechanism
  useEffect(() => {
    retryFetchRates();
  }, [currency, retryFetchRates]);
  
  // Log whenever foreign currency entries change in the store
  useEffect(() => {
    console.log('CashCalculator: Foreign currency entries in store:', cashValues.foreign_currency_entries);
  }, [cashValues.foreign_currency_entries]);
  
  // Use the custom hook to manage foreign currency with improved options
  const updateForeignCurrencyStore = useCallback((entries: ForeignCurrencyEntry[], total: number) => {
    console.log('CashCalculator: Updating foreign currency in store:', entries, total);
    setCashValue('foreign_currency_entries', entries);
    setCashValue('foreign_currency', total);
  }, [setCashValue]);
  
  const {
    foreignCurrencies,
    conversionWarning,
    handleForeignCurrencyChange,
    removeForeignCurrency,
    addForeignCurrency
  } = useForeignCurrency({
    currency,
    storeEntries: cashValues.foreign_currency_entries,
    storeTotal: cashValues.foreign_currency,
    convertAmount,
    updateStore: updateForeignCurrencyStore
  });
  
  // Set initial hawl status only once on mount
  useEffect(() => {
    if (!cashHawlMet) {
      setCashHawlMet(true)
    }
  }, [cashHawlMet, setCashHawlMet])

  // Sync with store values - only after hydration is complete
  useEffect(() => {
    // Only run this effect after hydration to prevent wiping out values during initialization
    if (!storeHydrated) return
    
    const newInputValues = CASH_KEYS.reduce((acc, key) => ({
      ...acc,
      [key]: typeof cashValues[key] === 'number' && 
             (cashValues[key] as number) > 0 
        ? (cashValues[key] as number).toString()
        : ''
    }), {} as InputValues)
    
    // Only update if values are different
    const hasChanges = CASH_KEYS.some(
      key => newInputValues[key] !== inputValues[key]
    )
    
    if (hasChanges) {
      setInputValues(newInputValues)
    }
  }, [cashValues, inputValues, storeHydrated])

  // Add a listener to detect store resets
  useEffect(() => {
    // Only process resets after hydration is complete to prevent false resets
    if (!storeHydrated) return;
    
    const handleReset = (event?: Event) => {
      console.log('CashCalculator: Store reset event detected');
      
      // Check if this is still during initial page load
      if (typeof window !== 'undefined') {
        // Safe way to check for custom property without TypeScript errors
        const win = window as any;
        if (win.isInitialPageLoad) {
          console.log('CashCalculator: Ignoring reset during initial page load');
          return;
        }
      }
      
      // This is a user-initiated reset, so clear all local state
      console.log('CashCalculator: Clearing local state due to user-initiated reset');
      
      // Clear inputs
      setInputValues({} as InputValues);
      setRawInputValues({} as RawInputValues);
      
      // Clear foreign currency entries
      setCashValue('foreign_currency_entries', []);
    };
    
    // Listen for the store-reset event
    window.addEventListener('store-reset', handleReset);
    
    // Cleanup
    return () => {
      window.removeEventListener('store-reset', handleReset);
    };
  }, [storeHydrated, setInputValues, setRawInputValues, setCashValue]);

  // Optimize the value change handler with useCallback
  const handleValueChange = useCallback((categoryId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    
    // Allow numbers, decimal points, basic math operators, and spaces
    if (!/^[\d+\-*/.() ]*$/.test(inputValue) && inputValue !== '') {
      return; // Ignore invalid characters
    }
    
    validateAndProcessInput(
      inputValue, 
      categoryId, 
      setCashValue, 
      setInputValues,
      setRawInputValues
    );
  }, [setCashValue, setInputValues, setRawInputValues]);

  const handleHawlChange = useCallback((value: boolean) => {
    setCashHawlMet(value);
  }, [setCashHawlMet]);

  return (
    <TooltipProvider>
      <div className="space-y-8 w-full">
        {/* Main Content */}
        <div className="space-y-10 w-full">
          {/* Cash Categories */}
          <section className="w-full">
            <FAQ
              title="Cash Holdings"
              description="Enter all your cash and cash-equivalent holdings. Include any money that's easily accessible."
              items={ASSET_FAQS.cash}
              defaultOpen={false}
            />
            <div className="mt-6 space-y-6 w-full">
              {CASH_CATEGORIES.map((category) => (
                <div key={category.id} className="space-y-2 w-full">
                  {category.id === 'foreign_currency' ? (
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor={category.id}>
                        {category.name}
                      </Label>
                    </div>
                  ) : null}
                  
                  {category.id === 'foreign_currency' ? (
                    <ForeignCurrencyInput
                      entries={foreignCurrencies}
                      isLoading={isLoading}
                      error={error}
                      warning={conversionWarning}
                      currency={currency}
                      onRetry={() => retryFetchRates(0)}
                      onAdd={addForeignCurrency}
                      onRemove={removeForeignCurrency}
                      onChange={handleForeignCurrencyChange}
                      convertAmount={convertAmount}
                    />
                  ) : (
                    <CashInputField
                      id={category.id}
                      name={category.name}
                      currency={currency}
                      value={rawInputValues[category.id] || inputValues[category.id] || ''}
                      onChange={handleValueChange}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Navigation */}
        <CalculatorNav 
          currentCalculator="cash" 
          onCalculatorChange={onCalculatorChange}
          onOpenSummary={onOpenSummary}
        />
      </div>
    </TooltipProvider>
  )
} 