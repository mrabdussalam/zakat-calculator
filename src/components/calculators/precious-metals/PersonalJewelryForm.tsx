'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useZakatStore } from '@/store/zakatStore'
import { evaluateExpression } from '@/lib/utils'
import { NISAB } from '@/lib/assets/types'
import { CalculatorSummary } from '@/components/ui/calculator-summary'
import { FAQ } from '@/components/ui/faq'
import { ASSET_FAQS } from '@/config/faqs'
import { RadioGroup, RadioGroupCard } from '@/components/ui/form/radio-group'
import { metalsValidation } from '@/lib/validation/calculators/metalsValidation'
import { CalculatorNav } from '@/components/ui/calculator-nav'
import { cn } from '@/lib/utils'
import { WEIGHT_UNITS, WeightUnit, toGrams, fromGrams, formatWeight } from '@/lib/utils/units'
import { motion, AnimatePresence } from 'framer-motion'
import { useCurrencyContext } from '@/lib/context/CurrencyContext'
import { useCurrencyStore } from '@/lib/services/currency'
import { roundCurrency } from '@/lib/utils/currency'
import { MetalPrices } from '@/store/modules/metals.types'
// Remove the import from config
// import { METAL_CATEGORIES } from '@/config/metals'

// Import our new hooks and METAL_CATEGORIES from the hooks package
import { useMetalsForm, useMetalsPrices, METAL_CATEGORIES, MetalCategory } from '@/hooks/calculators/metals'

interface PersonalJewelryFormProps {
  currency: string
  onUpdateValues: (values: Record<string, number>) => void
  onHawlUpdate: (hawlMet: boolean) => void
  onCalculatorChange: (calculator: string) => void
  onOpenSummary?: () => void
  initialValues?: Record<string, number>
  initialHawlMet?: boolean
}

export function PersonalJewelryForm({
  currency,
  onUpdateValues,
  onHawlUpdate,
  onCalculatorChange,
  onOpenSummary,
  initialValues = {},
  initialHawlMet = true
}: PersonalJewelryFormProps) {
  // Use our custom hooks
  const {
    inputValues,
    selectedUnit,
    showInvestment,
    lastUnitChange,
    activeInputId,
    handleValueChange,
    handleUnitChange,
    handleInvestmentToggle
  } = useMetalsForm({ onUpdateValues });

  const {
    metalPrices,
    isPricesLoading,
    lastUpdated,
    fetchPrices,
    updateMetalPrices,
    getDisplayPriceForCategory
  } = useMetalsPrices({ currency });

  // Get store values needed for UI elements
  const {
    metalsValues,
    metalsHawlMet,
    setMetalsHawl,
    getTotalMetals,
    getTotalZakatableMetals
  } = useZakatStore();

  // Get currency conversion state
  const { isConverting } = useCurrencyContext();

  // Keep track of when the component mounts
  const [isComponentMounted, setIsComponentMounted] = useState(false);
  useEffect(() => {
    setIsComponentMounted(true);
    return () => setIsComponentMounted(false);
  }, []);

  // Always set hawl to true
  useEffect(() => {
    setMetalsHawl(true);
    onHawlUpdate(true);
  }, [setMetalsHawl, onHawlUpdate]);

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
    // Enhanced debug logging
    console.log('formatCurrency call:', {
      value,
      currency,
      metalPricesCurrency: metalPrices.currency,
      metalPricesGold: metalPrices.gold,
      metalPricesSilver: metalPrices.silver
    });

    // Check for currency mismatch and warn
    if (metalPrices.currency && metalPrices.currency !== currency) {
      console.warn('Currency mismatch in formatCurrency!', {
        componentCurrency: currency,
        priceCurrency: metalPrices.currency,
        value
      });

      // If we're in the middle of a currency change, the value might be calculated
      // with metalPrices in the wrong currency. Try to adjust if possible.
      if (!isConverting && typeof useCurrencyStore !== 'undefined') {
        try {
          const currencyStore = useCurrencyStore.getState();
          // Convert from the metal prices currency to the component currency
          const convertedValue = currencyStore.convertAmount(
            value,
            metalPrices.currency,
            currency
          );
          console.log(`Converting value from ${metalPrices.currency} to ${currency}:`, {
            original: value,
            converted: convertedValue
          });
          value = convertedValue;
        } catch (error) {
          console.error('Failed to convert value to correct currency:', error);
        }
      }
    }

    // IMPORTANT: Always use the component's currency prop directly
    // This ensures consistency across all displays
    if (!currency || typeof currency !== 'string') {
      console.error('Invalid currency in formatCurrency:', currency);
      // Fall back to USD if we somehow don't have a valid currency
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    }

    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency // Always use the component's currency prop
      }).format(value);
    } catch (error) {
      console.error('Error formatting currency:', error);
      // Fall back to basic formatting if Intl fails
      return `${currency} ${value.toFixed(2)}`;
    }
  }

  // Get the Nisab value in the user's selected unit
  const getNisabInUnit = () => {
    const nisabInGrams = NISAB.SILVER.GRAMS // 595g
    const nisabInSelectedUnit = fromGrams(nisabInGrams, selectedUnit)
    return nisabInSelectedUnit.toFixed(2)
  }

  // Add diagnostic logging to help debug currency issues
  console.log('PersonalJewelryForm initialized with currency:', currency);

  // Create a diagnostic reference to track currency changes
  const currencyChangeCount = useRef(0);

  // Track currency changes
  useEffect(() => {
    currencyChangeCount.current += 1;
    console.log(`Currency changed to ${currency} (change #${currencyChangeCount.current})`);
  }, [currency]);

  return (
    <div className="space-y-6">
      {/* Form content */}
      <TooltipProvider delayDuration={50}>
        <div className="space-y-8">
          {/* Main Content */}
          <div className="space-y-10">
            {/* Personal Jewelry Section */}
            <div>
              <FAQ
                title="Personal Jewelry"
                description={`Enter the weight of your personal jewelry in ${WEIGHT_UNITS[selectedUnit].label.toLowerCase()}. Include all gold and silver items worn for personal use.`}
                items={ASSET_FAQS.metals}
                defaultOpen={false}
              />

              {/* Weight Unit Selection - More Compact UI */}
              <div className="mt-5 mb-6">
                <div className="flex rounded-xl shadow-sm bg-gray-50 p-1.5">
                  {Object.values(WEIGHT_UNITS).map((unit) => (
                    <button
                      key={unit.value}
                      type="button"
                      onClick={() => handleUnitChange(unit.value)}
                      className={cn(
                        "flex-1 flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200",
                        selectedUnit === unit.value
                          ? "bg-white border border-gray-600 text-gray-900"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      )}
                    >
                      <span className="text-sm">{unit.label} <span className={`text-sm ${selectedUnit === unit.value ? "text-gray-500" : "text-gray-500"}`}>({unit.symbol})</span></span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {/* Show only personal jewelry fields first */}
                {METAL_CATEGORIES
                  .filter((cat: MetalCategory) => !cat.id.includes('investment'))
                  .map((category: MetalCategory) => (
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
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={selectedUnit}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              transition={{ duration: 0.15 }}
                              className="flex h-6 min-w-6 items-center justify-center rounded-md bg-gray-100 px-1.5 text-sm font-medium text-gray-800"
                            >
                              {WEIGHT_UNITS[selectedUnit].symbol}
                            </motion.span>
                          </AnimatePresence>
                        </div>
                        <Input
                          id={category.id}
                          type="text"
                          inputMode="decimal"
                          step="0.001"
                          min="0"
                          className={cn(
                            "pl-12 pr-32 text-sm bg-white focus-within:ring-1 focus-within:ring-blue-500",
                            lastUnitChange && inputValues[category.id] ? "bg-blue-50 transition-colors duration-1000" : ""
                          )}
                          value={inputValues[category.id] || ''}
                          onChange={(e) => handleValueChange(category.id, e)}
                          placeholder={`Enter weight in ${WEIGHT_UNITS[selectedUnit].symbol}`}
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          {isPricesLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                              <span className="text-sm text-gray-500">Fetching price...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end">
                              <span className="text-sm text-gray-500 whitespace-nowrap">
                                {(() => {
                                  // Use the display price function for correct unit conversion
                                  const value = getDisplayPriceForCategory(category.id, inputValues[category.id], selectedUnit);
                                  return `≈ ${formatCurrency(value)}`;
                                })()}
                              </span>
                            </div>
                          )}
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
                    .filter((cat: MetalCategory) => cat.id.includes('investment'))
                    .map((category: MetalCategory) => (
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
                          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={selectedUnit}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.15 }}
                                className="flex h-6 min-w-6 items-center justify-center rounded-md bg-gray-100 px-1.5 text-sm font-medium text-gray-800"
                              >
                                {WEIGHT_UNITS[selectedUnit].symbol}
                              </motion.span>
                            </AnimatePresence>
                          </div>
                          <Input
                            id={category.id}
                            type="text"
                            inputMode="decimal"
                            step="0.001"
                            min="0"
                            className={cn(
                              "pl-12 pr-32 text-sm bg-white focus-within:ring-1 focus-within:ring-blue-500",
                              lastUnitChange && inputValues[category.id] ? "bg-blue-50 transition-colors duration-1000" : ""
                            )}
                            value={inputValues[category.id] || ''}
                            onChange={(e) => handleValueChange(category.id, e)}
                            placeholder={`Enter weight in ${WEIGHT_UNITS[selectedUnit].symbol}`}
                          />
                          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                            {isPricesLoading ? (
                              <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                                <span className="text-sm text-gray-500">Fetching price...</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end">
                                <span className="text-sm text-gray-500 whitespace-nowrap">
                                  {(() => {
                                    // Use the display price function for correct unit conversion
                                    const value = getDisplayPriceForCategory(category.id, inputValues[category.id], selectedUnit);
                                    return `≈ ${formatCurrency(value)}`;
                                  })()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Price Source Indicator - Compact Version */}
            <div className="mt-6 text-xs">
              <div className="flex items-center">
                {!metalPrices.isCache && (
                  <span className="relative flex h-[8px] w-[8px] mr-2">
                    <span className="relative inline-flex rounded-full h-full w-full bg-green-500 opacity-80 animate-pulse"></span>
                  </span>
                )}
                <div className="flex items-center">
                  <span className="text-[11px] text-gray-400">
                    Prices Last Updated: {new Date(metalPrices.lastUpdated).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Temporarily hidden calculator summary
            {getTotalMetals().total > 0 && (
              <CalculatorSummary
                title="Precious Metals Summary"
                sections={[
                  {
                    title: "Metal Holdings",
                    items: METAL_CATEGORIES.map(category => {
                      const weightInGrams = metalsValues[category.id as keyof typeof metalsValues] || 0
                      const weightInSelectedUnit = fromGrams(weightInGrams, selectedUnit)
                      const isGold = category.id.includes('gold')
                      const price = isGold ? metalPrices.gold : metalPrices.silver
                      const value = weightInGrams * price

                      return {
                        label: category.name,
                        value: formatCurrency(value),
                        subValue: weightInGrams > 0 ? formatWeight(weightInSelectedUnit, selectedUnit) : `-${WEIGHT_UNITS[selectedUnit].symbol}`,
                        tooltip: !category.isZakatable ? "This item may be exempt from Zakat" : undefined,
                        isExempt: !category.isZakatable,
                        isZakatable: category.isZakatable
                      }
                    })
                  },
                  {
                    title: "Zakat Calculation",
                    showBorder: true,
                    items: [
                      {
                        label: `Nisab Threshold (${getNisabInUnit()} ${WEIGHT_UNITS[selectedUnit].label.toLowerCase()} silver)`,
                        value: formatCurrency(NISAB.SILVER.GRAMS * metalPrices.silver),
                        tooltip: getTotalZakatableMetals().total >= (NISAB.SILVER.GRAMS * metalPrices.silver) ? 
                          "Your holdings meet or exceed the Nisab threshold" : 
                          "Your holdings are below the Nisab threshold",
                        isExempt: false,
                        isZakatable: true
                      },
                      {
                        label: "Total Eligible Metals Value",
                        value: formatCurrency(getTotalZakatableMetals().total),
                        tooltip: "This is the total value of your metals that are eligible for Zakat",
                        isExempt: false,
                        isZakatable: true
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
            */}
          </div>
        </div>
      </TooltipProvider>

      {/* Navigation */}
      <CalculatorNav
        currentCalculator="precious-metals"
        onCalculatorChange={onCalculatorChange}
        onOpenSummary={onOpenSummary}
      />
    </div>
  )
} 