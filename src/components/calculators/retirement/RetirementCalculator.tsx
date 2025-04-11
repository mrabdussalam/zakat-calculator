'use client'

import { useState, useEffect, useCallback } from 'react'
import { useZakatStore } from '@/store/zakatStore'
import { RetirementValues } from '@/store/types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/form/input'
import { Switch } from '@/components/ui/form/switch'
import { RadioGroup, RadioGroupCard } from '@/components/ui/form/radio-group'
import { FAQ } from '@/components/ui/faq'
import { ASSET_FAQS } from '@/config/faqs'
import { cn } from '@/lib/utils'
import { InfoIcon } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip"
import { CalculatorSummary } from '@/components/ui/calculator-summary'
import { retirement } from '@/lib/assets/retirement'
import { AssetValidation } from '@/lib/validation/assetValidation'
import { toast } from '@/components/ui/toast'
import { CalculatorNav } from '@/components/ui/calculator-nav'
import { ExtendedWindow } from '@/types'

interface AccountDetails {
  balance: number
  taxRate: number
  penaltyRate: number
  isWithdrawn: boolean
  withdrawnAmount: number
}

interface RetirementCalculatorProps {
  currency: string
  onUpdateValues: (values: Record<string, number>) => void
  onHawlUpdate: (hawlMet: boolean) => void
  onCalculatorChange: (calculator: string) => void
  onOpenSummary?: () => void
  initialValues?: Record<string, number>
  initialHawlMet?: boolean
}

export function RetirementCalculator({
  currency,
  onUpdateValues,
  onHawlUpdate,
  onCalculatorChange,
  onOpenSummary,
  initialValues = {},
  initialHawlMet = true
}: RetirementCalculatorProps) {
  const {
    retirement: retirementValues,
    setRetirementValue,
    retirementHawlMet,
    setRetirementHawlMet,
    getRetirementBreakdown
  } = useZakatStore()

  // Add a state to track if store has been hydrated
  const [storeHydrated, setStoreHydrated] = useState(false)

  // Get the retirement breakdown
  const retirementBreakdown = getRetirementBreakdown()

  // Validate breakdown before using
  const validatedBreakdown = useCallback(() => {
    const validationResult = AssetValidation.validateBreakdown(retirementBreakdown)
    if (!validationResult.isValid) {
      console.error('Retirement breakdown validation failed:', validationResult.errors)
      toast({
        title: "Calculation Error",
        description: "There was an error calculating your retirement breakdown. Please check your inputs.",
        variant: "destructive"
      })
      return null
    }

    // Show any warnings
    if (validationResult.warnings.length > 0) {
      validationResult.warnings.forEach(warning => {
        toast({
          title: "Warning",
          description: warning,
          variant: "warning"
        })
      })
    }

    return retirementBreakdown
  }, [retirementBreakdown])

  // Use the validated breakdown
  const breakdown = validatedBreakdown()
  const zakatDue = breakdown?.zakatDue || 0

  // State for fund accessibility
  const [accessibility, setAccessibility] = useState<'accessible' | 'restricted'>('restricted')

  // State for account details
  const [accountDetails, setAccountDetails] = useState<AccountDetails>({
    balance: 0,
    taxRate: 20, // Default tax rate of 20%
    penaltyRate: 10, // Default penalty rate of 10%
    isWithdrawn: false,
    withdrawnAmount: 0
  })

  // Add a listener for the store hydration event
  useEffect(() => {
    const handleHydrationComplete = () => {
      console.log('RetirementCalculator: Store hydration complete event received')
      setStoreHydrated(true)

      // After hydration, safely initialize form values from store with a small delay
      setTimeout(() => {
        console.log('RetirementCalculator: Initializing values from store after hydration');

        // Set hawl status first
        setRetirementHawlMet(retirementHawlMet);
        onHawlUpdate(retirementHawlMet);

        // Check for accessible funds
        if (retirementValues.traditional_401k > 0) {
          setAccessibility('accessible')
          setAccountDetails(prev => ({
            ...prev,
            balance: retirementValues.traditional_401k,
            taxRate: 20,
            penaltyRate: 10,
            isWithdrawn: false,
            withdrawnAmount: 0
          }))
        }
        // Check for locked funds
        else if (retirementValues.pension > 0) {
          setAccessibility('restricted')
          setAccountDetails(prev => ({
            ...prev,
            balance: retirementValues.pension,
            isWithdrawn: false,
            withdrawnAmount: 0
          }))
        }
        // Check for withdrawn funds
        else if (retirementValues.other_retirement > 0) {
          setAccessibility('restricted')
          setAccountDetails(prev => ({
            ...prev,
            balance: 0,
            isWithdrawn: true,
            withdrawnAmount: retirementValues.other_retirement
          }))
        }

        // Notify parent component of current values
        if (onUpdateValues) {
          onUpdateValues({
            traditional_401k: retirementValues.traditional_401k || 0,
            traditional_ira: retirementValues.traditional_ira || 0,
            roth_401k: retirementValues.roth_401k || 0,
            roth_ira: retirementValues.roth_ira || 0,
            pension: retirementValues.pension || 0,
            other_retirement: retirementValues.other_retirement || 0
          });
        }

        console.log('RetirementCalculator: Values initialized from store after hydration');
      }, 50); // Small delay to ensure store is fully ready
    }

    // Listen for the custom hydration event
    window.addEventListener('store-hydration-complete', handleHydrationComplete)

    // Check if hydration already happened
    if (typeof window !== 'undefined') {
      // Safe way to check for custom property without TypeScript errors
      const win = window as ExtendedWindow;
      if (win.hasDispatchedHydrationEvent) {
        handleHydrationComplete();
      }
    }

    return () => {
      window.removeEventListener('store-hydration-complete', handleHydrationComplete)
    }
  }, [retirementValues, retirementHawlMet, setRetirementHawlMet, onHawlUpdate, onUpdateValues])

  // Set hawl met to true since retirement is always considered to have met hawl
  useEffect(() => {
    setRetirementHawlMet(true)
  }, [setRetirementHawlMet])

  // Sync initial values from store - only run after hydration is complete
  useEffect(() => {
    // Only run this effect after hydration to prevent wiping out values during initialization
    if (!storeHydrated) return;

    // Check for accessible funds
    if (retirementValues.traditional_401k > 0) {
      setAccessibility('accessible')
      setAccountDetails(prev => ({
        ...prev,
        balance: retirementValues.traditional_401k,
        taxRate: 20,
        penaltyRate: 10,
        isWithdrawn: false,
        withdrawnAmount: 0
      }))
    }
    // Check for locked funds
    else if (retirementValues.pension > 0) {
      setAccessibility('restricted')
      setAccountDetails(prev => ({
        ...prev,
        balance: retirementValues.pension,
        isWithdrawn: false,
        withdrawnAmount: 0
      }))
    }
    // Check for withdrawn funds
    else if (retirementValues.other_retirement > 0) {
      setAccessibility('restricted')
      setAccountDetails(prev => ({
        ...prev,
        balance: 0,
        isWithdrawn: true,
        withdrawnAmount: retirementValues.other_retirement
      }))
    }
  }, [retirementValues, storeHydrated]) // Update when store values change and after hydration

  // Add a listener to detect store resets
  useEffect(() => {
    // Only process resets after hydration is complete to prevent false resets
    if (!storeHydrated) return;

    const handleReset = () => {
      console.log('RetirementCalculator: Store reset event detected');

      // Check if this is still during initial page load
      if (typeof window !== 'undefined') {
        // Safe way to check for custom property without TypeScript errors
        const win = window as any;
        if (win.isInitialPageLoad) {
          console.log('RetirementCalculator: Ignoring reset during initial page load');
          return;
        }
      }

      // This is a user-initiated reset, so clear all local state
      console.log('RetirementCalculator: Clearing local state due to user-initiated reset');

      // Reset to default values
      setAccessibility('restricted');
      setAccountDetails({
        balance: 0,
        taxRate: 20,
        penaltyRate: 10,
        isWithdrawn: false,
        withdrawnAmount: 0
      });

      // Ensure the total is updated after reset
      setTimeout(() => {
        onUpdateValues({
          traditional_401k: 0,
          traditional_ira: 0,
          roth_401k: 0,
          roth_ira: 0,
          pension: 0,
          other_retirement: 0
        });
      }, 100);
    };

    // Listen for both possible reset event names
    window.addEventListener('store-reset', handleReset);
    window.addEventListener('zakat-store-reset', handleReset);

    // Cleanup
    return () => {
      window.removeEventListener('store-reset', handleReset);
      window.removeEventListener('zakat-store-reset', handleReset);
    };
  }, [storeHydrated, onUpdateValues]);

  // Handle accessibility change
  const handleAccessibilityChange = (value: string) => {
    const newAccessibility = value as 'accessible' | 'restricted'
    const currentBalance = accountDetails.balance

    setAccessibility(newAccessibility)

    if (newAccessibility === 'accessible') {
      // For accessible funds, store gross amount in traditional_401k
      // The net calculation will be handled by the retirement asset type
      setRetirementValue('traditional_401k', currentBalance)
      setRetirementValue('traditional_ira', 0)
      setRetirementValue('roth_401k', 0)
      setRetirementValue('roth_ira', 0)
      setRetirementValue('pension', 0)
      setRetirementValue('other_retirement', 0)
    } else {
      // For locked funds, store in pension
      setRetirementValue('traditional_401k', 0)
      setRetirementValue('traditional_ira', 0)
      setRetirementValue('roth_401k', 0)
      setRetirementValue('roth_ira', 0)
      setRetirementValue('pension', currentBalance)
      setRetirementValue('other_retirement', 0)
    }
  }

  // Handle account details update
  const handleDetailsChange = (field: keyof AccountDetails, value: number) => {
    setAccountDetails(prev => ({
      ...prev,
      [field]: value
    }))

    if (accessibility === 'accessible') {
      const balance = field === 'balance' ? value : accountDetails.balance

      // For accessible funds, store gross amount in traditional_401k
      setRetirementValue('traditional_401k', balance)
      setRetirementValue('traditional_ira', 0)
      setRetirementValue('roth_401k', 0)
      setRetirementValue('roth_ira', 0)
      setRetirementValue('pension', 0)
      setRetirementValue('other_retirement', 0)
    } else if (field === 'balance') {
      // For locked funds, store in pension
      setRetirementValue('traditional_401k', 0)
      setRetirementValue('traditional_ira', 0)
      setRetirementValue('roth_401k', 0)
      setRetirementValue('roth_ira', 0)
      setRetirementValue('pension', value)
      setRetirementValue('other_retirement', 0)
    } else if (field === 'withdrawnAmount') {
      // For withdrawn amounts, store in other_retirement
      setRetirementValue('traditional_401k', 0)
      setRetirementValue('traditional_ira', 0)
      setRetirementValue('roth_401k', 0)
      setRetirementValue('roth_ira', 0)
      setRetirementValue('pension', accountDetails.balance)
      setRetirementValue('other_retirement', value)
    }
  }

  // Toggle withdrawn funds option
  const handleWithdrawnToggle = (checked: boolean) => {
    setAccountDetails(prev => ({
      ...prev,
      isWithdrawn: checked,
      withdrawnAmount: checked ? prev.withdrawnAmount : 0
    }))

    if (!checked) {
      // Clear all values when toggling off withdrawn
      setRetirementValue('traditional_401k', 0)
      setRetirementValue('traditional_ira', 0)
      setRetirementValue('roth_401k', 0)
      setRetirementValue('roth_ira', 0)
      setRetirementValue('pension', accountDetails.balance)
      setRetirementValue('other_retirement', 0)
    } else if (accountDetails.withdrawnAmount > 0) {
      // If there's already a withdrawn amount, update the store
      setRetirementValue('traditional_401k', 0)
      setRetirementValue('traditional_ira', 0)
      setRetirementValue('roth_401k', 0)
      setRetirementValue('roth_ira', 0)
      setRetirementValue('pension', accountDetails.balance)
      setRetirementValue('other_retirement', accountDetails.withdrawnAmount)
    }
  }

  // Calculate net amount for accessible funds
  const calculateNetAmount = (balance: number, taxRate: number, penaltyRate: number) => {
    if (balance <= 0) return 0
    const taxAmount = (taxRate / 100) * balance
    const penaltyAmount = (penaltyRate / 100) * balance
    return balance - taxAmount - penaltyAmount
  }

  // Format currency helper
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency
    }).format(value)

  // Calculate results for display
  const netAmount = accessibility === 'accessible'
    ? calculateNetAmount(accountDetails.balance, accountDetails.taxRate, accountDetails.penaltyRate)
    : accountDetails.isWithdrawn
      ? accountDetails.withdrawnAmount
      : 0

  // Prepare summary sections based on accessibility
  const summaryItems = accessibility === 'accessible' ? [
    {
      title: "Account Details",
      items: [
        {
          label: "Current Balance",
          value: formatCurrency(accountDetails.balance),
          tooltip: "Total value of accessible retirement funds",
          isExempt: false,
          isZakatable: false
        },
        {
          label: "Tax Rate",
          value: `${accountDetails.taxRate}%`,
          tooltip: "Estimated tax rate on withdrawal",
          isExempt: false,
          isZakatable: false
        },
        {
          label: "Early Withdrawal Penalty",
          value: `${accountDetails.penaltyRate}%`,
          tooltip: "Additional penalty for early withdrawal",
          isExempt: false,
          isZakatable: false
        }
      ]
    },
    {
      title: "Calculation",
      items: [
        {
          label: "Gross Amount",
          value: formatCurrency(accountDetails.balance),
          tooltip: "Total retirement account balance",
          isExempt: false,
          isZakatable: false
        },
        {
          label: "Tax Amount",
          value: formatCurrency((accountDetails.taxRate / 100) * accountDetails.balance),
          tooltip: "Estimated taxes on withdrawal",
          isExempt: true,
          isZakatable: false
        },
        {
          label: "Penalty Amount",
          value: formatCurrency((accountDetails.penaltyRate / 100) * accountDetails.balance),
          tooltip: "Early withdrawal penalty",
          isExempt: true,
          isZakatable: false
        },
        {
          label: "Net Amount (After Tax & Penalties)",
          value: formatCurrency(netAmount),
          tooltip: "Amount available after deducting taxes and penalties",
          isExempt: false,
          isZakatable: true
        }
      ],
      showBorder: true
    }
  ] : accountDetails.isWithdrawn ? [
    {
      title: "Withdrawn Funds",
      items: [
        {
          label: "Withdrawn Amount",
          value: formatCurrency(accountDetails.withdrawnAmount),
          tooltip: "Amount already withdrawn from retirement account",
          isExempt: false,
          isZakatable: true
        }
      ]
    }
  ] : [
    {
      title: "Account Details",
      items: [
        {
          label: "Current Balance",
          value: formatCurrency(accountDetails.balance),
          tooltip: "Total value of retirement funds (for record keeping only)",
          isExempt: true,
          isZakatable: false
        }
      ]
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <FAQ
          title="Retirement Accounts"
          description="Determine if your retirement funds are accessible and calculate Zakat accordingly."
          items={ASSET_FAQS.retirement}
          defaultOpen={false}
        />
      </div>

      <div className="space-y-10">
        {/* Fund Accessibility Selection */}
        <section>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label>Are These Funds Accessible?</Label>
              </div>
            </div>
            <RadioGroup
              value={accessibility}
              onValueChange={(value) => handleAccessibilityChange(value)}
              className="grid grid-cols-2 gap-4"
            >
              <RadioGroupCard
                value="accessible"
                title="Accessible Funds"
                description="Can be withdrawn now (e.g., vested 401k if over 59½)"
              />
              <RadioGroupCard
                value="restricted"
                title="Restricted Funds"
                description="Cannot withdraw without penalties"
              />
            </RadioGroup>
          </div>
        </section>

        {accessibility === 'accessible' ? (
          // Inputs for accessible funds
          <section>
            <div className="space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="balance">Total Retirement Account Balance</Label>
                <p className="text-sm text-gray-600">
                  Enter the total value of your retirement savings (401k, IRA, pension funds). You can find this in your retirement account summary or brokerage statement.
                </p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center">
                    <span className="text-sm font-medium text-gray-900">{currency}</span>
                  </div>
                  <Input
                    id="balance"
                    type="number"
                    min="0"
                    step="any"
                    value={accountDetails.balance || ''}
                    onChange={(e) => handleDetailsChange('balance', parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 50,000"
                    className="pl-12 text-sm bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="taxRate">Estimated Tax Rate</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Percentage of your account balance that would be deducted for taxes if withdrawn early
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={accountDetails.taxRate || ''}
                    onChange={(e) => handleDetailsChange('taxRate', parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 20"
                    className="pr-8 text-sm bg-white"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <span className="text-sm font-medium text-gray-600">%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="penaltyRate">Early Withdrawal Penalty</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Percentage penalty applied for withdrawing before retirement age
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Input
                    id="penaltyRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={accountDetails.penaltyRate || ''}
                    onChange={(e) => handleDetailsChange('penaltyRate', parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 10"
                    className="pr-8 text-sm bg-white"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <span className="text-sm font-medium text-gray-600">%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          // Information for locked funds
          <section>
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Your retirement funds are restricted until retirement. There are two scholarly views on Zakat for such funds:
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                    <div className="mb-2">
                      <p className="text-[10px] font-medium text-gray-900 uppercase tracking-widest">View 1</p>
                      <h4 className="text-sm font-medium text-gray-900">Annual Payment</h4>
                    </div>
                    <p className="text-sm text-gray-600">Pay Zakat yearly on the estimated amount you would receive after penalties and taxes (2.5% of net withdrawable amount).</p>
                  </div>

                  <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                    <div className="mb-2">
                      <p className="text-[10px] font-medium text-gray-900 uppercase tracking-widest">View 2</p>
                      <h4 className="text-sm font-medium text-gray-900">Defer Payment</h4>
                    </div>
                    <p className="text-sm text-gray-600">Delay Zakat until funds are accessible. Then pay on total balance and consider previous years.</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500">See FAQ above for detailed guidance from the Fiqh Council of North America.</p>
              </div>

              {/* Account Balance Input for Record Keeping */}
              <div className="space-y-2">
                <Label htmlFor="recordBalance">Account Balance</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-1">{currency}</span>
                  </div>
                  <Input
                    id="recordBalance"
                    type="number"
                    min="0"
                    step="any"
                    value={accountDetails.balance || ''}
                    onChange={(e) => handleDetailsChange('balance', parseFloat(e.target.value) || 0)}
                    placeholder="Enter account balance (for record only)"
                    className="pl-12 text-sm bg-white"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  This value is for record-keeping only and will not be included in Zakat calculations
                </p>
              </div>

              {/* Option for withdrawn funds using Switch - Commented out for future use
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="hasWithdrawn" className="text-sm text-gray-700">
                    I have withdrawn funds from my retirement account
                  </Label>
                  <Switch
                    id="hasWithdrawn"
                    checked={accountDetails.isWithdrawn}
                    onCheckedChange={handleWithdrawnToggle}
                  />
                </div>

                {accountDetails.isWithdrawn && (
                  <div className="space-y-1.5">
                    <Label htmlFor="withdrawnAmount">Withdrawn Amount (After Taxes & Penalties)</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center">
                        <span className="text-sm font-medium text-gray-900">{currency}</span>
                      </div>
                      <Input
                        id="withdrawnAmount"
                        type="number"
                        min="0"
                        step="any"
                        value={accountDetails.withdrawnAmount}
                        onChange={(e) => handleDetailsChange('withdrawnAmount', parseFloat(e.target.value) || 0)}
                        placeholder="Enter withdrawn amount"
                        className="pl-12 text-sm bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
              */}

              {/* Informational message about deferring Zakat - Commented out for future use
              <div className="p-4 rounded-lg border border-orange-100 bg-orange-50/50">
                <p className="text-sm text-gray-600">
                  The recommended approach is to defer Zakat on locked retirement accounts until you can access the funds. 
                  Paying Zakat on inaccessible funds may not be beneficial and can place an unnecessary burden.
                </p>
              </div>
              */}
            </div>
          </section>
        )}

        {(accessibility === 'accessible' || accountDetails.isWithdrawn || accountDetails.balance > 0) && breakdown && (
          <section>
            <CalculatorSummary
              title="Retirement Account Summary"
              description="Review your retirement account details and calculated Zakat."
              sections={summaryItems}
              hawlMet={true}
              zakatAmount={zakatDue}
              currency={currency}
              footnote={accessibility === 'accessible' ? {
                text: "Zakat is calculated on the net amount after taxes and penalties.",
                tooltip: "This ensures you only pay Zakat on the amount you can actually access."
              } : accountDetails.isWithdrawn ? {
                text: "Zakat is due on withdrawn amounts in the year they are received.",
                tooltip: "Future withdrawals will be subject to Zakat when they occur."
              } : {
                text: "Zakat is deferred on locked retirement funds until they become accessible.",
                tooltip: "The balance is recorded for asset tracking but is not included in Zakat calculations."
              }}
            />
          </section>
        )}
      </div>

      {/* Navigation */}
      <CalculatorNav
        currentCalculator="retirement"
        onCalculatorChange={onCalculatorChange}
        onOpenSummary={onOpenSummary}
      />
    </div>
  )
} 