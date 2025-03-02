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
import { useStoreHydration } from '@/hooks/useStoreHydration'

// Gold purity options
const GOLD_PURITY_OPTIONS = [
  { value: '24K', label: '24K (99.9% pure)' },
  { value: '22K', label: '22K (91.7% pure)' },
  { value: '21K', label: '21K (87.5% pure)' },
  { value: '18K', label: '18K (75.0% pure)' }
];

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
  // Check if store is hydrated
  const isStoreHydrated = useStoreHydration()

  // Add state for selected gold purity
  const [selectedGoldPurity, setSelectedGoldPurity] = useState<'24K' | '22K' | '21K' | '18K'>('24K');

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
    extendedPrices,
    getGoldPriceForPurity
  } = useMetalsPrices({ currency });

  // Get store values needed for UI elements
  const {
    metalsValues,
    metalsHawlMet,
    setMetalsValue,
    setMetalsHawl,
    getMetalsTotal,
    getMetalsZakatable,
    getMetalsBreakdown
  } = useZakatStore();

  // Get currency conversion state
  const { isConverting } = useCurrencyContext();

  // Keep track of when the component mounts
  const [isComponentMounted, setIsComponentMounted] = useState(false);
  useEffect(() => {
    setIsComponentMounted(true);
    return () => setIsComponentMounted(false);
  }, []);

  // Add state for advanced mode
  const [useAdvancedMode, setUseAdvancedMode] = useState(false);

  // Add state for individual purity levels
  const [itemPurityLevels, setItemPurityLevels] = useState<Record<string, '24K' | '22K' | '21K' | '18K'>>({});

  // Always set hawl to true
  useEffect(() => {
    setMetalsHawl(true);
    onHawlUpdate(true);
  }, [setMetalsHawl, onHawlUpdate]);

  // Initialize with values from the store
  useEffect(() => {
    if (isStoreHydrated) {
      // Check if we have different purity values for gold items
      const regularPurity = metalsValues.gold_regular_purity;
      const occasionalPurity = metalsValues.gold_occasional_purity;
      const investmentPurity = metalsValues.gold_investment_purity;

      // Always use simple mode with the regular purity (or default to 24K)
      setSelectedGoldPurity(regularPurity || '24K');
      setUseAdvancedMode(false);

      // Initialize individual purity levels for internal state
      // (even though we're not showing advanced mode UI)
      const initialPurityLevels: Record<string, '24K' | '22K' | '21K' | '18K'> = {};
      if (regularPurity) initialPurityLevels['gold_regular'] = regularPurity;
      if (occasionalPurity) initialPurityLevels['gold_occasional'] = occasionalPurity;
      if (investmentPurity) initialPurityLevels['gold_investment'] = investmentPurity;

      setItemPurityLevels(initialPurityLevels);
    }
  }, [isStoreHydrated, metalsValues, setSelectedGoldPurity, setUseAdvancedMode, setItemPurityLevels]);

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

  // Add refs for the unit selector animation
  const unitRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 })

  // Update indicator position when unit changes
  useEffect(() => {
    const activeUnitElement = unitRefs.current[selectedUnit]
    if (activeUnitElement) {
      setIndicatorStyle({
        width: activeUnitElement.offsetWidth,
        left: activeUnitElement.offsetLeft
      })
    }
  }, [selectedUnit])

  // Custom unit change handler to update the indicator
  const handleUnitChangeWithAnimation = (unit: WeightUnit) => {
    handleUnitChange(unit)
  }

  // Function to get purity for a specific category
  const getPurityForCategory = (categoryId: string): '24K' | '22K' | '21K' | '18K' => {
    if (categoryId === 'gold_regular') {
      return itemPurityLevels.gold_regular || selectedGoldPurity;
    } else if (categoryId === 'gold_occasional') {
      return itemPurityLevels.gold_occasional || selectedGoldPurity;
    } else if (categoryId === 'gold_investment') {
      return itemPurityLevels.gold_investment || selectedGoldPurity;
    }
    return selectedGoldPurity;
  };

  // Function to handle changes in gold purity
  const handleGoldPurityChange = useCallback((purity: '24K' | '22K' | '21K' | '18K') => {
    setSelectedGoldPurity(purity);

    // Update store with the new purity for all gold categories if not in advanced mode
    if (!useAdvancedMode) {
      // Update all gold purities in the store
      setMetalsValue('gold_regular_purity', purity);
      setMetalsValue('gold_occasional_purity', purity);
      setMetalsValue('gold_investment_purity', purity);
    }
  }, [useAdvancedMode, setMetalsValue]);

  // Get the current gold price based on selected purity
  const getCurrentGoldPrice = useCallback(() => {
    if (!extendedPrices) {
      return metalPrices.gold;
    }

    const purityPrice = getGoldPriceForPurity(selectedGoldPurity);
    return purityPrice !== null ? purityPrice : metalPrices.gold;
  }, [extendedPrices, metalPrices.gold, selectedGoldPurity, getGoldPriceForPurity]);

  // Function to handle individual item purity change
  const handleItemPurityChange = useCallback((categoryId: string, purity: '24K' | '22K' | '21K' | '18K') => {
    setItemPurityLevels(prev => ({
      ...prev,
      [categoryId]: purity
    }));

    // Update the store with the new purity for this specific category
    if (categoryId === 'gold_regular') {
      setMetalsValue('gold_regular_purity', purity);
    } else if (categoryId === 'gold_occasional') {
      setMetalsValue('gold_occasional_purity', purity);
    } else if (categoryId === 'gold_investment') {
      setMetalsValue('gold_investment_purity', purity);
    }
  }, [setMetalsValue]);

  // Update the getDisplayPriceForCategory function to use category-specific purity
  const getDisplayPriceForCategory = useCallback((categoryId: string, value: string | number, unit: WeightUnit) => {
    // Convert to number if string
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;

    // Convert to grams for calculation
    const weightInGrams = toGrams(numValue, unit);

    // Find the category
    const category = METAL_CATEGORIES.find(cat => cat.id === categoryId);

    if (!category) return 0;

    // Use the appropriate price based on category ID
    let price = 0;
    if (categoryId.includes('gold')) {
      // Get the purity for this specific category
      const purity = getPurityForCategory(categoryId);

      // Get the gold price for this purity
      const purityPrice = getGoldPriceForPurity(purity);
      price = purityPrice !== null ? purityPrice : metalPrices.gold;
    } else if (categoryId.includes('silver')) {
      price = metalPrices.silver;
    } else {
      // Default to gold if we can't determine
      console.warn(`Could not determine metal type for category: ${categoryId}`);
      price = metalPrices.gold;
    }

    // Calculate the value
    return weightInGrams * price;
  }, [metalPrices, getGoldPriceForPurity, getPurityForCategory]);

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
              <div className="mt-8 mb-8">
                <div className="relative">
                  <div className="flex rounded-xl bg-gray-50 px-1 py-1.5 relative">
                    <motion.div
                      className="absolute z-0 top-0 bottom-0 bg-white border border-gray-900 rounded-lg"
                      initial={false}
                      animate={{
                        width: indicatorStyle.width,
                        left: indicatorStyle.left,
                      }}
                      transition={{
                        type: "tween",
                        duration: 0.1
                      }}
                    />
                    {Object.values(WEIGHT_UNITS).map((unit) => (
                      <button
                        key={unit.value}
                        type="button"
                        onClick={() => handleUnitChange(unit.value)}
                        className={cn(
                          "flex-1 flex items-center justify-center px-4 py-1.5 text-sm font-medium rounded-lg relative z-10",
                          selectedUnit === unit.value
                            ? "text-gray-900"
                            : "text-gray-600 hover:text-gray-900"
                        )}
                        ref={(el) => {
                          if (el) unitRefs.current[unit.value] = el
                          return undefined
                        }}
                      >
                        <span className="text-sm">{unit.label} <span className={`text-sm ${selectedUnit === unit.value ? "text-gray-500" : "text-gray-500"}`}>({unit.symbol})</span></span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gold Purity Selection */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="gold-purity" className="font-medium">Gold Purity</Label>
                </div>

                {/* Always show simple mode UI regardless of useAdvancedMode value */}
                <div className="grid grid-cols-4 gap-2">
                  {GOLD_PURITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleGoldPurityChange(option.value as '24K' | '22K' | '21K' | '18K')}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-lg border",
                        selectedGoldPurity === option.value
                          ? "border-gray-700 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <span className="text-sm font-medium">{option.value}</span>
                      <span className="text-xs text-gray-500">
                        {option.label.match(/\((.+)\)/)?.[1] || option.label.split(' ')[1]}
                      </span>
                    </button>
                  ))}
                </div>
                {extendedPrices && (
                  <div className="mt-2 text-xs text-gray-600">
                    Current {selectedGoldPurity} gold price: {formatCurrency(getCurrentGoldPrice())} per gram
                  </div>
                )}
              </div>

              <div className="space-y-8">
                {/* Show only personal jewelry fields first */}
                {METAL_CATEGORIES
                  .filter((cat: MetalCategory) => !cat.id.includes('investment'))
                  .map((category: MetalCategory) => (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor={category.id} className="font-medium">
                            {category.name}
                          </Label>
                        </div>
                        {!category.isZakatable && (
                          <span className="text-xs text-green-600 font-medium">
                            May be exempt
                          </span>
                        )}
                      </div>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={selectedUnit}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
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
                            "pl-12 pr-32 text-sm bg-white border-gray-200 transition-colors duration-300 ease-in-out",
                            lastUnitChange && inputValues[category.id] ? "bg-yellow-50" : ""
                          )}
                          value={inputValues[category.id] || ''}
                          onChange={(e) => handleValueChange(category.id, e)}
                          placeholder={`Enter weight in ${WEIGHT_UNITS[selectedUnit].label.toLowerCase()}`}
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
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      handleInvestmentToggle(true);
                    }}
                    className={`relative rounded-lg border ${showInvestment ? 'border-gray-900 bg-gray-50' : 'border-gray-100'} p-4 hover:border-gray-200 hover:bg-gray-50/50`}
                  >
                    <h4 className="text-sm font-medium text-gray-900">Yes, I do</h4>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleInvestmentToggle(false);
                    }}
                    className={`relative rounded-lg border ${!showInvestment ? 'border-gray-900 bg-gray-50' : 'border-gray-100'} p-4 hover:border-gray-200 hover:bg-gray-50/50`}
                  >
                    <h4 className="text-sm font-medium text-gray-900">No, just jewelry</h4>
                  </button>
                </div>
              </div>

              {showInvestment && (
                <motion.div
                  className="mt-6 space-y-6"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: 0.2
                  }}
                >
                  {/* Show only investment fields */}
                  {METAL_CATEGORIES
                    .filter((cat: MetalCategory) => cat.id.includes('investment'))
                    .map((category: MetalCategory) => (
                      <div key={category.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Label htmlFor={category.id} className="font-medium">
                              {category.name}
                            </Label>
                          </div>
                          {!category.isZakatable && (
                            <span className="text-xs text-green-600 font-medium">
                              May be exempt
                            </span>
                          )}
                        </div>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={selectedUnit}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
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
                              "pl-12 pr-32 text-sm bg-white border-gray-200 transition-colors duration-300 ease-in-out",
                              lastUnitChange && inputValues[category.id] ? "bg-yellow-50" : ""
                            )}
                            value={inputValues[category.id] || ''}
                            onChange={(e) => handleValueChange(category.id, e)}
                            placeholder={`Enter weight in ${WEIGHT_UNITS[selectedUnit].label.toLowerCase()}`}
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

                        {/* Show individual purity selector in advanced mode for gold items */}
                        {useAdvancedMode && category.id.includes('gold') && (
                          <div className="ml-1 mt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Purity:</span>
                              <div className="flex gap-1">
                                {GOLD_PURITY_OPTIONS.map((option) => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleItemPurityChange(category.id, option.value as '24K' | '22K' | '21K' | '18K')}
                                    className={cn(
                                      "text-xs px-2 py-1 rounded-md border transition-colors",
                                      getPurityForCategory(category.id) === option.value
                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                        : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                                    )}
                                  >
                                    {option.value}
                                    <span className="text-[10px] ml-0.5 text-gray-500">
                                      {option.label.match(/\((.+)\)/)?.[1] || ''}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Show purity info for gold items in simple mode */}
                        {!useAdvancedMode && category.id.includes('gold') && (
                          <div className="text-xs text-gray-500 ml-1">
                            Using {selectedGoldPurity} gold purity for calculation
                          </div>
                        )}
                      </div>
                    ))}
                </motion.div>
              )}
            </div>

            {/* Price Source Indicator - Compact Version */}
            <div className="mt-6 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {!metalPrices.isCache && (
                    <span className="relative flex h-[8px] w-[8px] mr-2">
                      <span className="relative inline-flex rounded-full h-full w-full bg-green-500 opacity-80 animate-pulse"></span>
                    </span>
                  )}
                  <div className="flex items-center">
                    <span className="text-xs text-gray-400">
                      Prices Last Updated: {new Date(metalPrices.lastUpdated).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Temporarily hidden calculator summary
            {getMetalsTotal() > 0 && (
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
                        tooltip: getMetalsZakatable() >= (NISAB.SILVER.GRAMS * metalPrices.silver) ? 
                          "Your holdings meet or exceed the Nisab threshold" : 
                          "Your holdings are below the Nisab threshold",
                        isExempt: false,
                        isZakatable: true
                      },
                      {
                        label: "Total Eligible Metals Value",
                        value: formatCurrency(getMetalsZakatable()),
                        tooltip: "This is the total value of your metals that are eligible for Zakat",
                        isExempt: false,
                        isZakatable: true
                      }
                    ]
                  }
                ]}
                hawlMet={metalsHawlMet}
                zakatAmount={getMetalsZakatable() * 0.025}
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