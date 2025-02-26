'use client'

import { useCallback, useState, useEffect } from 'react'
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
import { CashValues, ForeignCurrencyEntry } from '@/store/types'
import { CalculatorNav } from '@/components/ui/calculator-nav'
import { useForeignCurrency } from '@/hooks/useForeignCurrency'

interface CashCalculatorProps {
  currency: string
  onCalculatorChange: (calculator: string) => void
  onUpdateValues: (values: Record<string, number>) => void
  onHawlUpdate: (hawlMet: boolean) => void
  onOpenSummary?: () => void
  initialValues?: Record<string, number>
  initialHawlMet?: boolean
}

type InputValues = Record<keyof Omit<CashValues, 'foreign_currency_entries'>, string>
type RawInputValues = Record<string, string>

type CashKey = keyof Omit<CashValues, 'foreign_currency_entries'>

const CASH_KEYS: CashKey[] = [
  'cash_on_hand',
  'checking_account',
  'savings_account',
  'digital_wallets',
  'foreign_currency'
]

const CASH_CATEGORIES = [
  {
    id: 'cash_on_hand' as const,
    name: 'Cash on Hand',
    description: 'Physical cash in your possession'
  },
  {
    id: 'checking_account' as const,
    name: 'Checking Account',
    description: 'Balance in your checking account(s)'
  },
  {
    id: 'savings_account' as const,
    name: 'Savings Account',
    description: 'Balance in your savings account(s)'
  },
  {
    id: 'digital_wallets' as const,
    name: 'Digital Wallets (PayPal, Venmo, Apple Pay, etc.)',
    description: 'Balance in digital payment services and mobile wallets'
  },
  {
    id: 'foreign_currency' as const,
    name: 'Foreign Currency',
    description: 'Any foreign currency holdings (converted to your local currency)',
    supportsCurrency: true
  }
]

const EXPENSES = [
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
        [key]: typeof cashValues[key as keyof CashValues] === 'number' && 
               (cashValues[key as keyof CashValues] as number) > 0 
          ? (cashValues[key as keyof CashValues] as number).toString()
          : ''
      }
    }, {} as InputValues)
  )
  
  const { rates, fetchRates, convertAmount, isLoading, error } = useCurrencyStore()
  
  // Add the retry mechanism for fetching rates
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

  // Sync with store values
  useEffect(() => {
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
  }, [cashValues, inputValues])

  const handleValueChange = (categoryId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value
    
    // Allow numbers, decimal points, basic math operators, and spaces
    if (!/^[\d+\-*/.() ]*$/.test(inputValue) && inputValue !== '') {
      return // Ignore invalid characters
    }
    
    // Always update raw input value to show what user is typing
    setRawInputValues(prev => ({
      ...prev,
      [categoryId]: inputValue
    }))

    try {
      // Allow empty input
      if (!inputValue) {
        setCashValue(categoryId as keyof typeof cashValues, 0)
        setInputValues(prev => ({
          ...prev,
          [categoryId]: ''
        }))
        return
      }

      // Only evaluate if the expression is complete (not ending with an operator)
      if (!/[+\-*/.]$/.test(inputValue)) {
        // Remove any commas from the input before evaluating
        const cleanInput = inputValue.replace(/,/g, '')
        
        // Convert to numeric value (handles calculations)
        const numericValue = evaluateExpression(cleanInput)
        
        // Only update store if we have a valid number
        if (!isNaN(numericValue)) {
          setCashValue(categoryId as keyof typeof cashValues, numericValue)
          setInputValues(prev => ({
            ...prev,
            [categoryId]: numericValue.toString()
          }))
        }
      }
    } catch (error) {
      // Invalid calculation - don't update store
      console.warn('Invalid calculation:', error)
    }
  }

  const handleHawlChange = (value: boolean) => {
    setCashHawlMet(value)
  }

  // Format helpers
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

  // Format currency helper
  const formatCurrency = (value: number): string => {
    if (value === 0) return '-'
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

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
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor={category.id}>
                      {category.name}
                    </Label>
                  </div>
                  {category.id === 'foreign_currency' ?
                    <div className="space-y-3 w-full">
                      {/* Show error status only when needed */}
                      {error && (
                        <ConversionStatus
                          isLoading={isLoading}
                          error={error}
                          warning={null}
                          onRetry={() => retryFetchRates(0)}
                        />
                      )}
                      
                      {foreignCurrencies.map((entry: ForeignCurrencyEntry, index: number) => (
                        <div key={index} className="w-full">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                            <div className="w-full sm:w-[240px]">
                              <CurrencySelector
                                value={entry.currency}
                                onValueChange={(value) => handleForeignCurrencyChange(index, 'currency', value)}
                              />
                            </div>
                            <div className="relative flex-1 min-w-0">
                              <Input
                                type="text"
                                inputMode="decimal"
                                pattern="[\d+\-*/.() ]*"
                                className="bg-white w-full"
                                value={entry.rawInput || ''}
                                onChange={(e) => {
                                  handleForeignCurrencyChange(index, 'amount', e.target.value);
                                }}
                                placeholder="Enter amount"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeForeignCurrency(index)}
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
                        onClick={addForeignCurrency}
                        className="mt-2 rounded-full"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Currency
                      </Button>
                    </div>
                  :
                    <div className="relative w-full">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <span className="text-sm font-medium text-gray-900">{currency}</span>
                      </div>
                      <Input
                        id={category.id}
                        type="text"
                        inputMode="decimal"
                        pattern="[\d+\-*/.() ]*"
                        className="pl-12 text-sm bg-white w-full"
                        value={rawInputValues[category.id] || inputValues[category.id] || ''}
                        onChange={(e) => handleValueChange(category.id, e)}
                        placeholder={category.id === 'cash_on_hand' ? "Enter amount or calculation (e.g. 1500+1500)" : "Enter amount or calculation"}
                      />
                    </div>
                  }
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