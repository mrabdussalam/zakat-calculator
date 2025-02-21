'use client'

import { useState, useEffect, useCallback } from 'react'
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
} from '@/components/ui/tooltip'
import { useZakatStore } from '@/store/zakatStore'
import { evaluateExpression } from '@/lib/utils'
import { NISAB } from '@/lib/assets/types'
import { CalculatorSummary } from '@/components/ui/calculator-summary'
import { FAQ } from '@/components/ui/faq'
import { ASSET_FAQS } from '@/config/faqs'
import { RadioGroup, RadioGroupCard } from '@/components/ui/form/radio-group'

interface PersonalJewelryFormProps {
  currency: string
}

const METAL_CATEGORIES = [
  {
    id: 'gold_regular',
    name: 'Regularly Worn Gold',
    description: 'Gold jewelry worn daily or very frequently',
    isZakatable: false
  },
  {
    id: 'gold_occasional',
    name: 'Occasionally Worn Gold',
    description: 'Gold jewelry worn only for special occasions',
    isZakatable: true
  },
  {
    id: 'gold_investment',
    name: 'Investment Gold',
    description: 'Gold bars, coins, or jewelry kept for investment',
    isZakatable: true
  },
  {
    id: 'silver_regular',
    name: 'Regularly Worn Silver',
    description: 'Silver jewelry worn daily or very frequently',
    isZakatable: false
  },
  {
    id: 'silver_occasional',
    name: 'Occasionally Worn Silver',
    description: 'Silver jewelry worn only for special occasions',
    isZakatable: true
  },
  {
    id: 'silver_investment',
    name: 'Investment Silver',
    description: 'Silver bars, coins, or jewelry kept for investment',
    isZakatable: true
  }
]

export function PersonalJewelryForm({ currency }: PersonalJewelryFormProps) {
  const {
    metalsValues,
    setMetalsValue,
    metalsHawlMet,
    setMetalsHawl,
    getTotalMetals,
    getTotalZakatableMetals,
    metalPrices,
    setMetalPrices
  } = useZakatStore()

  // Keep track of whether to show investment section
  const [showInvestment, setShowInvestment] = useState(false)

  // Input values state for controlled inputs
  const [inputValues, setInputValues] = useState<Record<string, string>>(() => 
    Object.keys(metalsValues).reduce((acc, key) => ({
      ...acc,
      [key]: metalsValues[key as keyof typeof metalsValues] > 0 
        ? metalsValues[key as keyof typeof metalsValues].toString()
        : ''
    }), {})
  )

  // Add effect to sync with store values
  useEffect(() => {
    setInputValues(
      Object.keys(metalsValues).reduce((acc, key) => ({
        ...acc,
        [key]: metalsValues[key as keyof typeof metalsValues] > 0 
          ? metalsValues[key as keyof typeof metalsValues].toString()
          : ''
      }), {})
    )
  }, [metalsValues])

  // Add effect to show investment section if there are investment values
  useEffect(() => {
    const hasInvestmentValues = Object.entries(metalsValues)
      .some(([key, value]) => key.includes('investment') && (value as number) > 0)
    if (hasInvestmentValues) {
      setShowInvestment(true)
    }
  }, [metalsValues])

  // Add loading state
  const [isPricesLoading, setIsPricesLoading] = useState(true)

  // Update the useEffect
  useEffect(() => {
    const fetchPrices = async () => {
      setIsPricesLoading(true)
      try {
        const response = await fetch(`/api/prices/metals?currency=${currency}`)
        
        if (!response.ok) {
          console.warn(`Using fallback prices. API returned: ${response.status}`)
          // Use fallback values
          setMetalPrices({
            gold: 65.52,
            silver: 0.85,
            lastUpdated: new Date(),
            isCache: true
          })
          return
        }

        const data = await response.json()
        
        setMetalPrices({
          gold: data.gold || 65.52,
          silver: data.silver || 0.85,
          lastUpdated: new Date(data.lastUpdated || new Date()),
          isCache: data.isCache || false
        })
      } catch (error) {
        console.error('Error fetching metal prices:', error)
        // Set fallback values if fetch fails
        setMetalPrices({
          gold: 65.52,
          silver: 0.85,
          lastUpdated: new Date(),
          isCache: true
        })
      } finally {
        setIsPricesLoading(false)
      }
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [currency, setMetalPrices])

  // Always set hawl to true
  useEffect(() => {
    setMetalsHawl(true)
  }, [setMetalsHawl])

  const handleValueChange = (categoryId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value
    
    // Only allow numbers, decimal points, and basic math operators
    if (!/^[\d+\-*/.() ]*$/.test(inputValue) && inputValue !== '') {
      return // Ignore invalid characters
    }
    
    // Update display value
    setInputValues(prev => ({
      ...prev,
      [categoryId]: inputValue
    }))

    try {
      // Convert to numeric value (handles calculations)
      const numericValue = evaluateExpression(inputValue)
      
      // Only update store if we have a valid number
      if (!isNaN(numericValue)) {
        setMetalsValue(categoryId as keyof typeof metalsValues, numericValue)
      }
    } catch (error) {
      // Invalid calculation - don't update store
      console.warn('Invalid calculation:', error)
    }
  }

  const handleHawlChange = (value: boolean) => {
    setMetalsHawl(value)
  }

  // Format helpers
  const formatNumber = (num: number): string => {
    if (num === 0) return '-'
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Update summary section to show monetary values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency
    }).format(value)
  }

  // Update showInvestment handler to reset investment values when switching to "No"
  const handleInvestmentToggle = (show: boolean) => {
    setShowInvestment(show)
    
    // If switching to "No", reset all investment values
    if (!show) {
      // Reset store values
      setMetalsValue('gold_investment', 0)
      setMetalsValue('silver_investment', 0)
      
      // Reset input display values
      setInputValues(prev => ({
        ...prev,
        gold_investment: '',
        silver_investment: ''
      }))
    }
  }

  return (
    <TooltipProvider delayDuration={50}>
      <div className="space-y-8">
        {/* Main Content */}
        <div className="space-y-10">
          {/* Personal Jewelry Section */}
          <div>
            <FAQ
              title="Personal Jewelry"
              description="Enter the weight of your personal jewelry in grams. Include all gold and silver items worn for personal use."
              items={ASSET_FAQS.metals}
              defaultOpen={false}
            />
            <div className="mt-6 space-y-6">
              {/* Show only personal jewelry fields first */}
              {METAL_CATEGORIES
                .filter(cat => !cat.id.includes('investment'))
                .map((category) => (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor={category.id}>
                          {category.name}
                        </Label>
                      </div>
                      {!category.isZakatable && (
                        <span className="text-xs text-green-600 font-medium">
                          May be exempt
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-1">g</span>
                      </div>
                      <Input
                        id={category.id}
                        type="text"
                        inputMode="decimal"
                        pattern="[\d+\-*/.() ]*"
                        className="pl-10 text-sm bg-white"
                        value={inputValues[category.id] || ''}
                        onChange={(e) => handleValueChange(category.id, e)}
                        placeholder="Enter weight in grams"
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          ≈ {formatCurrency(
                            (metalsValues[category.id as keyof typeof metalsValues] || 0) * 
                            (category.id.includes('gold') ? metalPrices.gold : metalPrices.silver)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Investment Metals Section */}
          <div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-gray-900">Investment Metals</h3>
              <p className="text-sm text-gray-600">
                Do you also have any gold or silver held for investment? This includes gold/silver bars, coins, ETFs, or any precious metals held for value.
              </p>
            </div>
            <div className="mt-6">
              <RadioGroup
                value={showInvestment ? "yes" : "no"}
                onValueChange={(value) => handleInvestmentToggle(value === "yes")}
              >
                <div className="grid grid-cols-2 gap-4">
                  <RadioGroupCard
                    value="yes"
                    title="Yes, I do"
                  />
                  <RadioGroupCard
                    value="no"
                    title="No, just jewelry"
                  />
                </div>
              </RadioGroup>
            </div>

            {showInvestment && (
              <div className="mt-6 space-y-6">
                {/* Show only investment fields */}
                {METAL_CATEGORIES
                  .filter(cat => cat.id.includes('investment'))
                  .map((category) => (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor={category.id}>
                            {category.name}
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors">
                                <InfoIcon className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {category.description}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {!category.isZakatable && (
                          <span className="text-xs text-green-600 font-medium">
                            May be exempt
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center">
                          <span className="text-sm font-medium text-gray-900 mr-1">g</span>
                        </div>
                        <Input
                          id={category.id}
                          type="text"
                          inputMode="decimal"
                          pattern="[\d+\-*/.() ]*"
                          className="pl-10 text-sm bg-white"
                          value={inputValues[category.id] || ''}
                          onChange={(e) => handleValueChange(category.id, e)}
                          placeholder="Enter weight in grams"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            ≈ {formatCurrency(
                              (metalsValues[category.id as keyof typeof metalsValues] || 0) * 
                              (category.id.includes('gold') ? metalPrices.gold : metalPrices.silver)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Summary Section - Only show if there are values */}
          {getTotalMetals().total > 0 && (
            <CalculatorSummary
              title="Precious Metals Summary"
              sections={[
                {
                  title: "Metal Holdings",
                  items: METAL_CATEGORIES.map(category => {
                    const weight = metalsValues[category.id as keyof typeof metalsValues] || 0
                    const isGold = category.id.includes('gold')
                    const price = isGold ? metalPrices.gold : metalPrices.silver
                    const value = weight * price

                    return {
                      label: category.name,
                      value: formatCurrency(value),
                      subValue: weight > 0 ? `${weight.toFixed(2)}g` : '-g',
                      tooltip: !category.isZakatable ? "This item may be exempt from Zakat" : undefined
                    }
                  })
                },
                {
                  title: "Zakat Calculation",
                  showBorder: true,
                  items: [
                    {
                      label: "Nisab Threshold (595g silver)",
                      value: formatCurrency(NISAB.SILVER.GRAMS * metalPrices.silver),
                      tooltip: getTotalZakatableMetals().total >= (NISAB.SILVER.GRAMS * metalPrices.silver) ? 
                        "Your holdings meet or exceed the Nisab threshold" : 
                        "Your holdings are below the Nisab threshold"
                    },
                    {
                      label: "Total Eligible Metals Value",
                      value: formatCurrency(getTotalZakatableMetals().total),
                      tooltip: "This is the total value of your metals that are eligible for Zakat"
                    }
                  ]
                }
              ]}
              hawlMet={metalsHawlMet}
              zakatAmount={getTotalZakatableMetals().total * 0.025}
              footnote={{
                text: "Note: According to many scholars, jewelry that is worn regularly for personal use may be exempt from Zakat.",
                tooltip: "Regular use means the jewelry is worn frequently for legitimate purposes, not just for storage of wealth."
              }}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  )
} 