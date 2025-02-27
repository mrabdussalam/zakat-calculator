import { ForeignCurrencyEntry } from '@/store/types'

// Define types for the Cash Calculator component
export interface CashCalculatorProps {
  currency: string
  onCalculatorChange: (calculator: string) => void
  onUpdateValues: (values: Record<string, number>) => void
  onHawlUpdate: (hawlMet: boolean) => void
  onOpenSummary?: () => void
  initialValues?: Record<string, number>
  initialHawlMet?: boolean
}

export interface CashCategory {
  id: CashKey
  name: string
  description: string
  supportsCurrency?: boolean
}

export interface CashExpense {
  id: string
  name: string
  description: string
}

export type CashKey = 'cash_on_hand' | 'checking_account' | 'savings_account' | 'digital_wallets' | 'foreign_currency'

export type InputValues = Partial<Record<string, string>>
export type RawInputValues = Partial<Record<string, string>>

// Foreign Currency Input component props
export interface ForeignCurrencyInputProps {
  entries: ForeignCurrencyEntry[]
  isLoading: boolean
  error: string | null
  warning: string | null
  currency: string
  onRetry: () => void
  onAdd: () => void
  onRemove: (index: number) => void
  onChange: (index: number, field: 'currency' | 'amount', value: string) => void
  convertAmount: (amount: number, from: string, to: string) => number
}

// Cash Input Field component props
export interface CashInputFieldProps {
  id: string
  name: string
  currency: string
  value: string
  onChange: (id: string, event: React.ChangeEvent<HTMLInputElement>) => void
}

// Conversion Status component props
export interface ConversionStatusProps {
  isLoading: boolean
  error: string | null
  warning: string | null
  onRetry: () => void
}

// Event handler utilities props
export interface EventHandlerProps {
  onUpdateValues: (values: Record<string, number>) => void
  setInputValues: React.Dispatch<React.SetStateAction<InputValues>>
  cashHawlMet: boolean
  cashValues: any
  storeState: {
    getTotalCash: () => number
    getTotalZakatableCash: () => number
  }
  retryFetchRates: (retryCount?: number, maxRetries?: number) => void
  currency: string
}

// Input validation utilities props
export interface InputValidationProps {
  inputValue: string 
  categoryId: string 
  setCashValue: (key: any, value: number) => void
  setInputValues: React.Dispatch<React.SetStateAction<InputValues>>
  setRawInputValues: React.Dispatch<React.SetStateAction<RawInputValues>>
}

// Formatter functions
export interface FormatHelpers {
  formatNumber: (num: number) => string
  formatDisplayValue: (num: number) => string
  formatCurrency: (value: number) => string
  formatTruncatedCurrency: (value: number) => React.ReactNode
} 