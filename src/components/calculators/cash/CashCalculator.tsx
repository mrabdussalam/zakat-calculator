'use client'

import { useCallback, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { InfoIcon } from '@/components/ui/icons'
import { 
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip"
import { useZakatStore } from '@/store/zakatStore'
import { evaluateExpression } from '@/lib/utils'
import { CalculatorSummary } from '@/components/ui/calculator-summary'
import { FAQ } from '@/components/ui/faq'
import { ASSET_FAQS } from '@/config/faqs'
import { useCurrencyStore } from '@/lib/services/currency'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DeleteIcon } from '@/components/ui/icons/icon-delete'
import { PlusIcon } from 'lucide-react'
import { CURRENCY_NAMES } from '@/lib/services/currency'
import { CurrencySelector } from '@/components/CurrencySelector'
import { CashValues, ForeignCurrencyEntry } from '@/store/types'

interface CashCalculatorProps {
  currency: string
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

export function CashCalculator({ currency }: CashCalculatorProps) {
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

  // Initialize with entries from store or default
  const [foreignCurrencies, setForeignCurrencies] = useState<ForeignCurrencyEntry[]>(() => {
    if (Array.isArray(cashValues.foreign_currency_entries) && cashValues.foreign_currency_entries.length > 0) {
      return cashValues.foreign_currency_entries
    }
    if (typeof cashValues.foreign_currency === 'number' && cashValues.foreign_currency > 0) {
      return [{
        amount: cashValues.foreign_currency,
        currency: currency
      }]
    }
    return [{ amount: 0, currency: 'EUR' }]
  })
  
  const { rates, fetchRates, convertAmount, isLoading } = useCurrencyStore()

  // Set initial hawl status only once on mount
  useEffect(() => {
    if (!cashHawlMet) {
      setCashHawlMet(true)
    }
  }, [cashHawlMet, setCashHawlMet])

  // Fetch rates when currency changes
  useEffect(() => {
    fetchRates(currency)
  }, [currency, fetchRates])

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

  // Add state for search
  const [searchOpen, setSearchOpen] = useState(false)

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

  // Sync with store when foreign currency entries change
  useEffect(() => {
    if (Array.isArray(cashValues.foreign_currency_entries) && cashValues.foreign_currency_entries.length > 0) {
      setForeignCurrencies(prev => {
        // Only update if entries are different
        const areEntriesDifferent = cashValues.foreign_currency_entries.length !== prev.length ||
          cashValues.foreign_currency_entries.some((entry, i) => 
            entry.amount !== prev[i]?.amount || entry.currency !== prev[i]?.currency
          )
        
        if (areEntriesDifferent) {
          return cashValues.foreign_currency_entries
        }
        return prev
      })
    }
  }, [cashValues.foreign_currency_entries])

  // Update store with both total and entries
  const updateForeignCurrencyStore = useCallback((entries: ForeignCurrencyEntry[]) => {
    const totalInBaseCurrency = entries.reduce((sum, entry) => {
      if (entry.currency === currency) {
        return sum + entry.amount
      }
      return sum + (convertAmount?.(entry.amount, entry.currency, currency) || 0)
    }, 0)
    
    // Only update if values are different
    if (Math.abs(totalInBaseCurrency - (cashValues.foreign_currency || 0)) > 0.01 ||
        !Array.isArray(cashValues.foreign_currency_entries) ||
        entries.length !== cashValues.foreign_currency_entries.length ||
        entries.some((entry, i) => 
          entry.amount !== cashValues.foreign_currency_entries[i]?.amount ||
          entry.currency !== cashValues.foreign_currency_entries[i]?.currency
        )) {
      // Use requestAnimationFrame to defer state updates
      requestAnimationFrame(() => {
        setCashValue('foreign_currency', totalInBaseCurrency)
        setCashValue('foreign_currency_entries', entries)
      })
    }
  }, [cashValues, currency, convertAmount, setCashValue])

  // Update the handleForeignCurrencyChange to use the new store update function
  const handleForeignCurrencyChange = (index: number, field: 'amount' | 'currency', value: string) => {
    if (field === 'amount') {
      // Allow numbers, decimal points, basic math operators, and spaces
      if (!/^[\d+\-*/.() ]*$/.test(value) && value !== '') {
        return // Ignore invalid characters
      }
    }

    setForeignCurrencies(prev => {
      const updated = [...prev]
      if (field === 'amount') {
        try {
          // Allow empty input
          if (!value) {
            updated[index].amount = 0
            updateForeignCurrencyStore(updated)
            return updated
          }

          // Store the raw input value
          updated[index] = {
            ...updated[index],
            rawInput: value
          }

          // Only evaluate if the expression is complete (not ending with an operator)
          if (!/[+\-*/.]$/.test(value)) {
            // Remove any commas before evaluating
            const cleanInput = value.replace(/,/g, '')
            const numericValue = evaluateExpression(cleanInput)
            if (!isNaN(numericValue)) {
              updated[index].amount = numericValue
              updateForeignCurrencyStore(updated)
            }
          }
        } catch (error) {
          console.warn('Invalid calculation:', error)
        }
      } else {
        updated[index].currency = value
        updateForeignCurrencyStore(updated)
      }
      return updated
    })
  }

  // Update removeForeignCurrency to use the new store update function
  const removeForeignCurrency = (index: number) => {
    setForeignCurrencies(prev => {
      const updated = prev.filter((_, i) => i !== index)
      
      if (updated.length === 0) {
        const defaultEntries = [{ amount: 0, currency: 'EUR' }]
        updateForeignCurrencyStore(defaultEntries)
        return defaultEntries
      }
      
      updateForeignCurrencyStore(updated)
      return updated
    })
  }

  // Update addForeignCurrency to use the new store update function
  const addForeignCurrency = () => {
    setForeignCurrencies(prev => {
      const updated = [...prev, { amount: 0, currency: 'EUR' }]
      updateForeignCurrencyStore(updated)
      return updated
    })
  }

  return (
    <TooltipProvider delayDuration={50}>
      <div className="space-y-8">
        {/* Main Content */}
        <div className="space-y-10">
          {/* Cash Categories */}
          <section>
            <FAQ
              title="Cash Holdings"
              description="Enter all your cash and cash-equivalent holdings. Include any money that's easily accessible."
              items={ASSET_FAQS.cash}
              defaultOpen={false}
            />
            <div className="mt-6 space-y-6">
              {CASH_CATEGORIES.map((category) => (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor={category.id}>
                      {category.name}
                    </Label>
                  </div>
                  {category.id === 'foreign_currency' ?
                    <div className="space-y-4">
                      {foreignCurrencies.map((entry, index) => (
                        <div key={index} className="flex gap-2 items-start group">
                          <div className="flex-grow flex gap-2">
                            <CurrencySelector
                              value={entry.currency}
                              onValueChange={(value) => handleForeignCurrencyChange(index, 'currency', value)}
                            />
                            <Input
                              type="text"
                              inputMode="decimal"
                              pattern="[\d+\-*/.() ]*"
                              className="bg-white"
                              value={entry.rawInput || entry.amount.toString()}
                              onChange={(e) => handleForeignCurrencyChange(index, 'amount', e.target.value)}
                              placeholder="Enter amount or calculation"
                            />
                          </div>
                          {foreignCurrencies.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeForeignCurrency(index)}
                              className="h-10 w-10 shrink-0 transition-colors hover:bg-destructive/10"
                            >
                              <DeleteIcon 
                                size={18} 
                                className="text-muted-foreground transition-colors group-hover:text-destructive hover:text-destructive" 
                              />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addForeignCurrency}
                        className="mt-2"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Currency
                      </Button>
                      {isLoading && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <svg
                            className="animate-spin h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Updating exchange rates...
                        </p>
                      )}
                    </div>
                  :
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-1">{currency}</span>
                      </div>
                      <Input
                        id={category.id}
                        type="text"
                        inputMode="decimal"
                        pattern="[\d+\-*/.() ]*"
                        className="pl-12 text-sm bg-white"
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

          {/* Hawl section commented out since we're assuming it's always met
          <section className="pt-8 border-t border-gray-100">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-gray-900">Minimum Holding Period (Hawl)</h3>
              <p className="text-sm text-gray-600">
                Has this amount of wealth been in your possession for one complete lunar year?
              </p>
            </div>
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={cashHawlMet ? 'default' : 'outline'}
                  onClick={() => handleHawlChange(true)}
                >
                  Yes
                </Button>
                <Button
                  variant={!cashHawlMet ? 'default' : 'outline'}
                  onClick={() => handleHawlChange(false)}
                >
                  No
                </Button>
              </div>
            </div>
          </section>
          */}

          {/* Summary Section - Only show if there are values */}
          {getTotalCash() > 0 && (
            <CalculatorSummary
              title="Cash Holdings Summary"
              sections={[
                {
                  title: "Cash Holdings",
                  items: [
                    ...CASH_CATEGORIES.map(category => ({
                      label: category.name,
                      value: formatDisplayValue(
                        category.id === 'foreign_currency' 
                          ? (cashValues.foreign_currency || 0)
                          : (cashValues[category.id as keyof typeof cashValues] as number) || 0
                      )
                    })),
                    {
                      label: "Total Cash",
                      value: formatDisplayValue(getTotalCash())
                    }
                  ]
                },
                {
                  title: "Zakat Calculation",
                  showBorder: true,
                  items: [
                    {
                      label: "Total Cash",
                      value: formatDisplayValue(getTotalCash()),
                      tooltip: "This is the total amount of your cash and cash equivalents that is eligible for Zakat calculation."
                    }
                  ]
                }
              ]}
              hawlMet={cashHawlMet}
              zakatAmount={getTotalZakatableCash() * 0.025}
              footnote={{
                text: "Note: According to Islamic guidelines, Zakat is calculated on the total cash holdings without deducting expenses.",
                tooltip: "While you may have expenses and debts, Zakat is calculated on your total cash holdings. This is because Zakat is due on the wealth itself, regardless of future spending plans or obligations."
              }}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  )
} 