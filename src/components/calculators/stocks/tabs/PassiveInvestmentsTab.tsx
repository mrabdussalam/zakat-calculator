/**
 * PassiveInvestmentsTab Component
 * 
 * A tab component for calculating Zakat on passive investments using either:
 * 1. Quick Method (30% rule) - For retail investors without access to detailed company financials
 * 2. Detailed CRI Method - For investors with access to company balance sheet data
 * 
 * The component supports multiple investment entries for the quick method and
 * detailed company financial inputs for the CRI method.
 */

'use client'

import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/label'
import { InfoIcon } from '@/components/ui/icons'
import { 
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip"
import { StockValues, calculatePassiveInvestments } from '@/lib/assets/stocks'
import { Investment } from '@/lib/assets/types'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { cn, evaluateExpression } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupCard } from '@/components/ui/form/radio-group'
import { FAQ } from '@/components/ui/faq'
import { ASSET_FAQS } from '@/config/faqs'
import { debounce } from 'lodash'
import { CheckIcon } from '@radix-ui/react-icons'
import { BrokerInfo } from '@/components/ui/broker-info'
import { InfoIcon as LucideInfoIcon } from 'lucide-react'

// Constants for validation
const MAX_SHARE_VALUE = 999999999999
const MAX_PRICE_VALUE = 999999999999
const DECIMAL_PRECISION = 8

// Validation types
interface ValidationError {
  field: string
  message: string
}

interface CompanyFinancials {
  cash: number
  receivables: number
  inventory: number
  totalShares: number
  yourShares: number
  displayProperties?: {
    currency: string
    sharePercentage: number
  }
}

interface BreakdownItem {
  id: string
  label: string
  value: number
  zakatableValue?: number
  percentage: number
  isExempt?: boolean
  displayProperties: {
    currency: string
    [key: string]: any
  }
}

interface PassiveCalculations {
  totalMarketValue: number
  zakatableValue: number
  method: 'quick' | 'detailed'
  breakdown: {
    marketValue: number
    liquidValue: number
    items: BreakdownItem[]
    companyFinancials?: {
      yourShares: number
      totalShares: number
      cash: number
      receivables: number
      inventory: number
    }
  }
  displayProperties: {
    currency: string
    method: string
    totalLabel: string
  }
}

interface PassiveInvestmentsTabProps {
  currency: string
  inputValues: StockValues
  onValueChange: (fieldId: keyof StockValues, event: React.ChangeEvent<HTMLInputElement>) => void
  onCalculate: (calculations: PassiveCalculations) => void
  updatePassiveInvestments: (state: PassiveInvestmentState) => void
  passiveInvestments?: PassiveInvestmentState
}

interface PassiveInvestmentState {
  version: '2.0'
  method: 'quick' | 'detailed'
  investments: Investment[]
  marketValue: number
  zakatableValue: number
  companyData?: CompanyFinancials
  hawlStatus: {
    isComplete: boolean
    startDate?: string
    endDate?: string
  }
  displayProperties: {
    currency: string
    method: string
    totalLabel: string
  }
}

// Add state validation with detailed error logging
const validatePassiveInvestmentState = (state: any): state is PassiveInvestmentState => {
  try {
    if (!state) {
      console.error('State is null or undefined')
      return false
    }
    
    // Check version
    if (state.version !== '2.0') {
      console.error('Invalid version:', state.version)
      return false
    }
    
    // Check required fields with type safety
    if (typeof state.method !== 'string' || !['quick', 'detailed'].includes(state.method)) {
      console.error('Invalid method:', state.method)
      return false
    }
    
    if (!Array.isArray(state.investments)) {
      console.error('Invalid investments array')
      return false
    }
    
    if (typeof state.marketValue !== 'number' || isNaN(state.marketValue)) {
      console.error('Invalid market value:', state.marketValue)
      return false
    }
    
    if (typeof state.zakatableValue !== 'number' || isNaN(state.zakatableValue)) {
      console.error('Invalid zakatable value:', state.zakatableValue)
      return false
    }
    
    // Check hawlStatus
    if (!state.hawlStatus || typeof state.hawlStatus !== 'object') {
      console.error('Invalid hawlStatus object')
      return false
    }
    
    if (typeof state.hawlStatus.isComplete !== 'boolean') {
      console.error('Invalid hawlStatus.isComplete:', state.hawlStatus.isComplete)
      return false
    }
    
    // Check displayProperties
    if (!state.displayProperties || typeof state.displayProperties !== 'object') {
      console.error('Invalid displayProperties object')
      return false
    }
    
    if (typeof state.displayProperties.currency !== 'string') {
      console.error('Invalid currency:', state.displayProperties.currency)
      return false
    }
    
    if (typeof state.displayProperties.method !== 'string') {
      console.error('Invalid method display:', state.displayProperties.method)
      return false
    }
    
    if (typeof state.displayProperties.totalLabel !== 'string') {
      console.error('Invalid totalLabel:', state.displayProperties.totalLabel)
      return false
    }
    
    // Validate investments array
    if (!state.investments.every((inv: any) => isValidInvestment(inv))) {
      console.error('Invalid investment in array')
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error validating passive investment state:', error)
    return false
  }
}

// Add default state creator with proper typing
const createDefaultState = (currency: string): PassiveInvestmentState => ({
  version: '2.0',
  method: 'quick',
  investments: [{
    id: Date.now().toString(),
    name: '',
    shares: 0,
    pricePerShare: 0,
    marketValue: 0
  }],
  marketValue: 0,
  zakatableValue: 0,
  hawlStatus: {
    isComplete: false,
    startDate: new Date().toISOString()
  },
  displayProperties: {
    currency,
    method: '30% Rule',
    totalLabel: 'Total Investments'
  }
})

const BROKER_INFO = {
  title: "Where to find your total investment value:",
  brokers: [
    {
      name: "Schwab",
      instructions: "Under 'Positions' tab → Sum of 'Market Value' column for stocks, ETFs, and mutual funds held over 1 year"
    },
    {
      name: "Fidelity",
      instructions: "In 'Positions' view → Total of 'Current Value' column for long-term holdings"
    },
    {
      name: "TD Ameritrade",
      instructions: "In 'Position Statement' → Add 'Market Value' for stocks and funds held as investments"
    },
    {
      name: "Vanguard",
      instructions: "Under 'Holdings' → Sum of 'Current Balance' for each investment position"
    },
    {
      name: "Robinhood",
      instructions: "In 'Investing' tab → Total value minus any stocks marked for active trading"
    }
  ],
  note: "Only include investments you've held or plan to hold long-term (1+ year). Exclude any positions you actively trade."
}

export function PassiveInvestmentsTab({
  currency,
  inputValues,
  onValueChange,
  onCalculate,
  updatePassiveInvestments,
  passiveInvestments
}: PassiveInvestmentsTabProps) {
  // Add state validation on initialization with error logging
  const validatedState = useMemo(() => {
    try {
      if (!passiveInvestments) {
        console.log('No passive investments state, using defaults')
        return createDefaultState(currency)
      }

      if (!validatePassiveInvestmentState(passiveInvestments)) {
        console.error('Invalid passive investment state detected, resetting to defaults')
        return createDefaultState(currency)
      }

      return passiveInvestments
    } catch (error) {
      console.error('Error in state validation:', error)
      return createDefaultState(currency)
    }
  }, [passiveInvestments, currency])

  const [method, setMethod] = useState<'quick' | 'detailed'>(validatedState?.method || 'quick')
  const [investments, setInvestments] = useState<Investment[]>(
    validatedState?.investments?.length ? validatedState.investments : [{
      id: Date.now().toString(),
      name: '',
      shares: 0,
      pricePerShare: 0,
      marketValue: 0
    }]
  )
  const [rawMarketValue, setRawMarketValue] = useState(() => {
    // Initialize with the first investment's market value from passiveInvestments
    if (validatedState?.investments?.[0]?.marketValue) {
      return validatedState.investments[0].marketValue.toString()
    }
    return ''
  })
  const [errors, setErrors] = useState<ValidationError[]>([])
  const previousValues = useRef({
    investments,
    inputValues,
    method
  })

  // Memoize total market value calculation
  const totalMarketValue = useMemo(() => 
    investments.reduce((sum, inv) => sum + (inv.marketValue || 0), 0),
    [investments]
  )

  // Format currency helper
  const formatCurrency = useCallback((value: number, currency: string) => 
    `${currency} ${value.toLocaleString()}`,
    [currency]
  )

  // Validate numeric input
  const validateNumericInput = useCallback((value: number, max: number) => {
    if (value < 0) return 'Value cannot be negative'
    if (value > max) return `Value cannot exceed ${max}`
    if (value.toString().split('.')[1]?.length > DECIMAL_PRECISION) 
      return `Maximum ${DECIMAL_PRECISION} decimal places allowed`
    return null
  }, [])

  // Calculate zakatable value based on method
  const calculateZakatableValue = useCallback(() => {
    if (method === 'quick') {
      return totalMarketValue * 0.3
    } else {
      const { company_cash, company_receivables, company_inventory, passive_shares, total_shares_issued } = inputValues
      if (!total_shares_issued) return 0
      
      const totalLiquidAssets = (company_cash || 0) + (company_receivables || 0) + (company_inventory || 0)
      const shareholderPercentage = (passive_shares || 0) / total_shares_issued
      return totalLiquidAssets * shareholderPercentage
    }
  }, [method, totalMarketValue, inputValues])

  // Debounced update function
  const debouncedUpdate = useMemo(
    () => debounce((newState: PassiveInvestmentState) => {
      updatePassiveInvestments(newState)
    }, 300),
    [updatePassiveInvestments]
  )

  // Add effect to sync rawMarketValue with store
  useEffect(() => {
    if (validatedState?.investments?.[0]?.marketValue) {
      setRawMarketValue(validatedState.investments[0].marketValue.toString())
    }
  }, [validatedState?.investments])

  // Add effect to handle store reset
  useEffect(() => {
    if (!validatedState?.investments?.length) {
      setRawMarketValue('')
      setInvestments([{
        id: Date.now().toString(),
        name: '',
        shares: 0,
        pricePerShare: 0,
        marketValue: 0
      }])
      setErrors([])
    }
  }, [validatedState])

  // Effect to update calculations when values change
  useEffect(() => {
    // Check if any relevant values have changed
    const valuesChanged = 
      JSON.stringify(investments) !== JSON.stringify(previousValues.current.investments) ||
      JSON.stringify(inputValues) !== JSON.stringify(previousValues.current.inputValues) ||
      method !== previousValues.current.method

    if (!valuesChanged) return

    // Update previous values
    previousValues.current = {
      investments,
      inputValues,
      method
    }

    const zakatableValue = calculateZakatableValue()
    const marketValue = method === 'quick' 
      ? totalMarketValue 
      : (inputValues.passive_shares || 0) * (inputValues.price_per_share || 0)
    
    const calculations: PassiveCalculations = {
      totalMarketValue: marketValue,
      zakatableValue,
      method,
      breakdown: {
        marketValue,
        liquidValue: zakatableValue,
        items: method === 'quick' ? 
          investments.map(inv => ({
            id: inv.id,
            label: inv.name || 'Unnamed Investment',
            value: inv.marketValue,
            zakatableValue: inv.marketValue * 0.3,
            percentage: totalMarketValue > 0 ? (inv.marketValue / totalMarketValue) * 100 : 0,
            isExempt: false,
            displayProperties: {
              shares: inv.shares,
              pricePerShare: inv.pricePerShare,
              currency
            }
          })) : 
          [{
            id: 'company-financials',
            label: 'Company Financial Assets',
            value: zakatableValue,
            zakatableValue,
            percentage: 100,
            isExempt: false,
            displayProperties: {
              currency,
              items: [
                {
                  id: 'cash',
                  label: 'Cash Holdings',
                  value: inputValues.company_cash || 0,
                  percentage: zakatableValue > 0 ? ((inputValues.company_cash || 0) / zakatableValue) * 100 : 0,
                  displayProperties: { currency }
                },
                {
                  id: 'receivables',
                  label: 'Receivables',
                  value: inputValues.company_receivables || 0,
                  percentage: zakatableValue > 0 ? ((inputValues.company_receivables || 0) / zakatableValue) * 100 : 0,
                  displayProperties: { currency }
                },
                {
                  id: 'inventory',
                  label: 'Inventory',
                  value: inputValues.company_inventory || 0,
                  percentage: zakatableValue > 0 ? ((inputValues.company_inventory || 0) / zakatableValue) * 100 : 0,
                  displayProperties: { currency }
                }
              ]
            }
          }]
      },
      displayProperties: {
        currency,
        method: method === 'quick' ? '30% Rule' : 'CRI Method',
        totalLabel: method === 'quick' ? 'Total Investments' : 'Total Company Assets'
      }
    }

    // Update store with complete state
    const newState: PassiveInvestmentState = {
      version: '2.0',
      method,
      investments: method === 'quick' ? investments : [],
      companyData: method === 'detailed' ? {
        cash: inputValues.company_cash || 0,
        receivables: inputValues.company_receivables || 0,
        inventory: inputValues.company_inventory || 0,
        totalShares: inputValues.total_shares_issued || 0,
        yourShares: inputValues.passive_shares || 0,
        displayProperties: {
          currency,
          sharePercentage: inputValues.total_shares_issued > 0 ? 
            (inputValues.passive_shares / inputValues.total_shares_issued) * 100 : 0
        }
      } : undefined,
      marketValue,
      zakatableValue,
      hawlStatus: validatedState?.hawlStatus || {
        isComplete: false,
        startDate: new Date().toISOString()
      },
      displayProperties: {
        currency,
        method: method === 'quick' ? '30% Rule' : 'CRI Method',
        totalLabel: method === 'quick' ? 'Total Investments' : 'Total Company Assets'
      }
    }

    // Validate state before updating
    if (validatePassiveInvestmentState(newState)) {
      debouncedUpdate(newState)
      onCalculate(calculations)
    } else {
      console.error('Invalid passive investment state generated')
    }
  }, [
    method,
    investments,
    inputValues,
    totalMarketValue,
    calculateZakatableValue,
    debouncedUpdate,
    onCalculate,
    formatCurrency,
    currency,
    validatedState
  ])

  // Enhanced method change handler
  function handleMethodChange(value: string) {
    const newMethod = value as 'quick' | 'detailed'
    setMethod(newMethod)
    setErrors([])
    
    if (newMethod === 'quick') {
      // Preserve existing investments or initialize with current market value
      const currentInvestments = investments.length ? investments : [{
        id: Date.now().toString(),
        name: 'Total Passive Investments',
        shares: 1,
        pricePerShare: Number(rawMarketValue) || 0,
        marketValue: Number(rawMarketValue) || 0
      }]
      setInvestments(currentInvestments)
    } else {
      // Preserve values when switching to detailed
      if (!inputValues.passive_shares) {
        const event = { target: { value: rawMarketValue || '0' } } as React.ChangeEvent<HTMLInputElement>
        onValueChange('passive_shares', event)
        onValueChange('company_cash', event)
        onValueChange('company_receivables', event)
        onValueChange('company_inventory', event)
        onValueChange('total_shares_issued', event)
      }
    }
  }

  // Enhanced investment update handler
  const updateInvestment = useCallback((id: string, field: keyof Investment, value: string) => {
    const numericValue = field === 'name' ? 0 : Number(value) || 0
    
    if (field !== 'name') {
      const error = validateNumericInput(
        numericValue,
        field === 'shares' ? MAX_SHARE_VALUE : MAX_PRICE_VALUE
      )
      
      if (error) {
        setErrors(prev => [...prev.filter(e => e.field !== `${field}-${id}`), 
          { field: `${field}-${id}`, message: error }])
        return
      } else {
        setErrors(prev => prev.filter(e => e.field !== `${field}-${id}`))
      }
    }
    
    setInvestments(prevInvestments => 
      prevInvestments.map(inv => {
        if (inv.id === id) {
          const updatedInv = { 
            ...inv, 
            [field]: field === 'name' ? value : numericValue 
          }
          if (field === 'shares' || field === 'pricePerShare') {
            updatedInv.marketValue = updatedInv.shares * updatedInv.pricePerShare
          }
          return updatedInv
        }
        return inv
      })
    )
  }, [validateNumericInput])

  const addInvestment = () => {
    const newInvestments = [
      ...investments,
      { id: Date.now().toString(), name: '', shares: 0, pricePerShare: 0, marketValue: 0 }
    ]
    setInvestments(newInvestments)
    updatePassiveInvestments({
      version: '2.0',
      method,
      investments: newInvestments,
      marketValue: validatedState?.marketValue || 0,
      zakatableValue: validatedState?.zakatableValue || 0,
      hawlStatus: validatedState?.hawlStatus || {
        isComplete: false,
        startDate: new Date().toISOString()
      },
      displayProperties: {
        currency,
        method: method === 'quick' ? '30% Rule' : 'CRI Method',
        totalLabel: method === 'quick' ? 'Total Investments' : 'Total Company Assets'
      }
    })
  }

  const removeInvestment = (id: string) => {
    if (investments.length > 1) {
      const newInvestments = investments.filter(inv => inv.id !== id)
      setInvestments(newInvestments)
      updatePassiveInvestments({
        version: '2.0',
        method,
        investments: newInvestments,
        marketValue: validatedState?.marketValue || 0,
        zakatableValue: validatedState?.zakatableValue || 0,
        hawlStatus: validatedState?.hawlStatus || {
          isComplete: false,
          startDate: new Date().toISOString()
        },
        displayProperties: {
          currency,
          method: method === 'quick' ? '30% Rule' : 'CRI Method',
          totalLabel: method === 'quick' ? 'Total Investments' : 'Total Company Assets'
        }
      })
    }
  }

  const [brokerInfoOpen, setBrokerInfoOpen] = useState(false)

  return (
    <div className="pt-6">
      <div className="space-y-8">
        <div>
          <FAQ
            title="Passive Investments"
            description="Passive investments are held for the long term. Zakat on these assets is calculated differently than on active investments."
            items={ASSET_FAQS.stocks.passive}
            defaultOpen={false}
            className="relative z-10"
          />
        </div>

        <div className="space-y-10">
          <section>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Select Calculation Method</Label>
                <RadioGroup
                  value={method}
                  onValueChange={handleMethodChange}
                  className="grid grid-cols-2 gap-4"
                >
                  <TooltipProvider>
                    {/* <Tooltip>
                      <TooltipTrigger asChild>
                        <div>*/}
                          <RadioGroupCard 
                            value="quick" 
                            title="Quick Estimate (30% Rule)"
                            description="Calculate using 30% of your investment's market value."
                            className="text-gray-900"
                          />
                        {/*</div>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="center" className="bg-gray-900 p-3 text-sm max-w-[400px]">
                        <p className="font-medium text-white mb-1">Quick Estimate Method</p>
                        <p className="text-gray-400">A simplified calculation that considers 30% of your investment's market value as zakatable, based on typical company asset compositions.</p>
                      </TooltipContent>
                    </Tooltip>*/}
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <RadioGroupCard 
                            value="cri" 
                            title="Detailed CRI Method"
                            description="Calculate using company balance sheets."
                            disabled
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="center" className="bg-gray-900 p-3 text-sm max-w-[400px]">
                        <p className="font-medium text-white">Coming soon</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </RadioGroup>
              </div>
            </div>
          </section>

          {method === 'quick' ? (
            <section>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="total_market_value" className="flex items-center gap-2">
                    Total Market Value
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setBrokerInfoOpen(true)}
                        className="h-8 w-8 text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                      >
                        <LucideInfoIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-1">{currency}</span>
                    </div>
                    <Input
                      id="total_market_value"
                      type="text"
                      inputMode="decimal"
                      pattern="[\d+\-*/.() ]*"
                      className="pl-12"
                      value={rawMarketValue}
                      onChange={(e) => {
                        const inputValue = e.target.value
                        setRawMarketValue(inputValue)
                        
                        try {
                          // Allow empty input
                          if (!inputValue) {
                            setErrors([])
                            setInvestments([{
                              id: 'total',
                              name: 'Total Passive Investments',
                              shares: 1,
                              pricePerShare: 0,
                              marketValue: 0
                            }])
                            return
                          }

                          // Only evaluate if the expression is complete (not ending with an operator)
                          if (!/[+\-*/.]$/.test(inputValue)) {
                            // Evaluate arithmetic expression
                            const value = evaluateExpression(inputValue)
                            
                            // Validate the numeric result
                            const error = validateNumericInput(value, MAX_PRICE_VALUE)
                            if (error) {
                              setErrors([{ field: 'total_market_value', message: error }])
                              return
                            }

                            setErrors([])
                            setInvestments([{
                              id: 'total',
                              name: 'Total Passive Investments',
                              shares: 1,
                              pricePerShare: value,
                              marketValue: value
                            }])
                          }
                        } catch (error) {
                          // Only show error if the expression is complete
                          if (!/[+\-*/.]$/.test(inputValue)) {
                            setErrors([{ 
                              field: 'total_market_value', 
                              message: 'Invalid arithmetic expression' 
                            }])
                          }
                        }
                      }}
                      placeholder="Enter total market value (e.g. 1000 + 2000)"
                    />
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    30% of your total investment value will be considered zakatable.
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-blue-600 hover:text-blue-700">Why 30%?</button>
                        </TooltipTrigger>
                        <TooltipContent side="right" align="start" className="bg-gray-900 p-3 text-sm max-w-[400px]">
                          <p className="text-gray-200">Research and traditional guidelines used in Islamic finance indicate that only about 25–30% of a long-term investment's market value is liquid—that is, readily convertible to cash. This 'liquid portion' represents what you can actually use if needed. To keep our calculations simple and in line with scholarly opinion, we use a 30% multiplier for passive investments.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="passive_shares">Number of Shares</Label>
                  <Input
                    id="passive_shares"
                    type="text"
                    inputMode="decimal"
                    pattern="[\d+\-*/.() ]*"
                    value={inputValues.passive_shares || ''}
                    onChange={(e) => onValueChange('passive_shares', e)}
                    placeholder="Enter number of shares"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="company_cash">Company Cash</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-1">{currency}</span>
                    </div>
                    <Input
                      id="company_cash"
                      type="text"
                      inputMode="decimal"
                      pattern="[\d+\-*/.() ]*"
                      className="pl-12"
                      value={inputValues.company_cash || ''}
                      onChange={(e) => onValueChange('company_cash', e)}
                      placeholder="Enter company's cash holdings"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="company_receivables">Company Receivables</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-1">{currency}</span>
                    </div>
                    <Input
                      id="company_receivables"
                      type="text"
                      inputMode="decimal"
                      pattern="[\d+\-*/.() ]*"
                      className="pl-12"
                      value={inputValues.company_receivables || ''}
                      onChange={(e) => onValueChange('company_receivables', e)}
                      placeholder="Enter company's receivables"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="company_inventory">Company Inventory</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-1">{currency}</span>
                    </div>
                    <Input
                      id="company_inventory"
                      type="text"
                      inputMode="decimal"
                      pattern="[\d+\-*/.() ]*"
                      className="pl-12"
                      value={inputValues.company_inventory || ''}
                      onChange={(e) => onValueChange('company_inventory', e)}
                      placeholder="Enter company's inventory value"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="total_shares_issued">Total Shares Issued</Label>
                  <Input
                    id="total_shares_issued"
                    type="text"
                    inputMode="decimal"
                    pattern="[\d+\-*/.() ]*"
                    value={inputValues.total_shares_issued || ''}
                    onChange={(e) => onValueChange('total_shares_issued', e)}
                    placeholder="Enter total shares issued by company"
                  />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Temporarily hidden calculator summary
      {totalMarketValue > 0 && (
        <CalculatorSummary
          title="Passive Investments Summary"
          sections={[
            {
              title: "Investment Breakdown",
              items: method === 'quick' ? 
                investments.map(inv => ({
                  label: inv.name || 'Unnamed Investment',
                  value: formatCurrency(inv.marketValue, currency),
                  tooltip: "30% of market value is zakatable",
                  isExempt: false,
                  isZakatable: true,
                  zakatable: inv.marketValue * 0.3
                })) : 
                [{
                  label: "Company Financial Assets",
                  value: formatCurrency(zakatableValue, currency),
                  tooltip: "Based on company's liquid assets",
                  isExempt: false,
                  isZakatable: true,
                  zakatable: zakatableValue
                }]
            },
            {
              title: "Totals",
              showBorder: true,
              items: [
                {
                  label: "Total Market Value",
                  value: formatCurrency(marketValue, currency),
                  tooltip: "Total value of all investments",
                  isExempt: false,
                  isZakatable: false
                },
                {
                  label: "Zakatable Amount",
                  value: formatCurrency(zakatableValue, currency),
                  tooltip: method === 'quick' ? 
                    "30% of total market value" : 
                    "Based on company's liquid assets",
                  isExempt: false,
                  isZakatable: true
                }
              ]
            }
          ]}
          hawlMet={validatedState?.hawlStatus?.isComplete}
          zakatAmount={zakatableValue * 0.025}
          footnote={{
            text: method === 'quick' ? 
              "Note: The 30% rule is a simplified method based on typical company asset compositions." :
              "Note: This calculation is based on the company's actual liquid assets.",
            tooltip: method === 'quick' ? 
              "This method assumes approximately 30% of a company's assets are zakatable." :
              "This uses the company's reported cash, receivables, and inventory values."
          }}
        />
      )}
      */}

      {/* Add error display */}
      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-medium text-red-800 mb-2">Please correct the following errors:</h4>
          <ul className="list-disc list-inside text-sm text-red-700">
            {errors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}

      <BrokerInfo
        open={brokerInfoOpen}
        onOpenChange={setBrokerInfoOpen}
        {...BROKER_INFO}
      />
    </div>
  )
}

// Type guard for runtime type checking
function isValidInvestment(investment: unknown): investment is Investment {
  if (!investment || typeof investment !== 'object') return false
  const inv = investment as Investment
  return (
    typeof inv.id === 'string' &&
    typeof inv.name === 'string' &&
    typeof inv.shares === 'number' &&
    typeof inv.pricePerShare === 'number' &&
    typeof inv.marketValue === 'number' &&
    inv.shares >= 0 &&
    inv.pricePerShare >= 0 &&
    inv.marketValue >= 0
  )
}

export type { PassiveCalculations } 