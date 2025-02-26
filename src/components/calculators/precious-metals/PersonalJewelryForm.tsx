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

interface PersonalJewelryFormProps {
  currency: string
  onUpdateValues: (values: Record<string, number>) => void
  onHawlUpdate: (hawlMet: boolean) => void
  onCalculatorChange: (calculator: string) => void
  onOpenSummary?: () => void
  initialValues?: Record<string, number>
  initialHawlMet?: boolean
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

export function PersonalJewelryForm({ 
  currency,
  onUpdateValues,
  onHawlUpdate,
  onCalculatorChange,
  onOpenSummary,
  initialValues = {},
  initialHawlMet = true
}: PersonalJewelryFormProps) {
  const {
    metalsValues = {
      gold_regular: 0,
      gold_occasional: 0,
      gold_investment: 0,
      silver_regular: 0,
      silver_occasional: 0,
      silver_investment: 0
    },
    setMetalsValue,
    metalsHawlMet,
    setMetalsHawl,
    getTotalMetals,
    getTotalZakatableMetals,
    metalPrices = {
      gold: 65.52,  // Default gold price per gram
      silver: 0.85, // Default silver price per gram
      lastUpdated: new Date(),
      isCache: true
    },
    setMetalPrices,
    metalsPreferences = {
      weightUnit: 'gram' as WeightUnit
    },
    setMetalsWeightUnit
  } = useZakatStore()

  // Get currency conversion state
  const { isConverting } = useCurrencyContext()

  // Selected weight unit
  const [selectedUnit, setSelectedUnit] = useState<WeightUnit>(
    metalsPreferences.weightUnit || 'gram'
  )

  // Keep track of whether to show investment section
  const [showInvestment, setShowInvestment] = useState(() => {
    // Check for existing investment values during initialization
    return METAL_CATEGORIES
      .filter(cat => cat.id.includes('investment'))
      .some(cat => (metalsValues[cat.id as keyof typeof metalsValues] || 0) > 0)
  })

  // Input values state for controlled inputs (displayed in user's selected unit)
  const [inputValues, setInputValues] = useState<Record<string, string>>(() => {
    return METAL_CATEGORIES.reduce((acc, category) => {
      const valueInGrams = metalsValues[category.id as keyof typeof metalsValues]
      const convertedValue = fromGrams(valueInGrams, selectedUnit)
      return {
        ...acc,
        [category.id]: valueInGrams > 0 ? convertedValue.toString() : ''
      }
    }, {} as Record<string, string>)
  })

  // Add a lastUnitChange state to track when unit was last changed
  const [lastUnitChange, setLastUnitChange] = useState<number | null>(null)

  // Add this after the lastUnitChange state
  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  const inputTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modify the useEffect for updating input values
  useEffect(() => {
    // Skip this effect while user is actively typing
    if (activeInputId) {
      return;
    }
    
    const newValues = { ...inputValues }
    let hasChanges = false

    METAL_CATEGORIES.forEach(category => {
      // Skip updating fields that are currently being edited by the user
      if (category.id === activeInputId) {
        return;
      }
      
      const valueInGrams = metalsValues[category.id as keyof typeof metalsValues]
      if (valueInGrams > 0) {
        const convertedValue = fromGrams(valueInGrams, selectedUnit)
        
        // Better handling of numeric precision based on unit type
        let displayValue = '';
        if (selectedUnit === 'ounce') {
          // For ounces, use more decimal places to avoid truncating important digits
          displayValue = convertedValue.toFixed(6).replace(/\.?0+$/, '');
        } else if (selectedUnit === 'tola') {
          // For tola, use appropriate precision
          displayValue = convertedValue.toFixed(4).replace(/\.?0+$/, '');
        } else {
          // For grams, standard precision
          displayValue = convertedValue.toFixed(3).replace(/\.?0+$/, '');
        }
        
        if (inputValues[category.id] !== displayValue) {
          newValues[category.id] = displayValue
          hasChanges = true
        }
      } else if (inputValues[category.id] !== '') {
        // Handle zero values properly
        newValues[category.id] = ''
        hasChanges = true
      }
    })

    if (hasChanges) {
      setInputValues(newValues)
    }
  }, [metalsValues, selectedUnit, activeInputId, inputValues])

  // Add a ref to track previous currency to prevent redundant fetches
  const prevCurrencyRef = useRef<string>(currency);
  
  // Add loading state
  const [isPricesLoading, setIsPricesLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isComponentMounted, setIsComponentMounted] = useState(false)
  // Add a flag to prevent additional fetches during the current render cycle
  const isFetchingRef = useRef<boolean>(false);

  // Update the useEffect for component mount tracking
  useEffect(() => {
    setIsComponentMounted(true)
    return () => setIsComponentMounted(false)
  }, [])

  // Create a centralized, robust price update function to ensure consistent currency handling
  const updateMetalPrices = useCallback((prices: any, sourceCurrency: string, targetCurrency: string) => {
    console.log('Updating metal prices with consistent approach:', {
      prices,
      sourceCurrency,
      targetCurrency
    });
    
    // If currencies don't match, convert the prices
    if (sourceCurrency !== targetCurrency) {
      try {
        // Get the currency conversion service
        const currencyStore = useCurrencyStore.getState();
        
        // Convert the prices
        const convertedGoldPrice = currencyStore.convertAmount(
          prices.gold || 65.52,
          sourceCurrency,
          targetCurrency
        );
        
        const convertedSilverPrice = currencyStore.convertAmount(
          prices.silver || 0.85,
          sourceCurrency,
          targetCurrency
        );
        
        // Set the prices in the store with the target currency
        setMetalPrices({
          gold: convertedGoldPrice,
          silver: convertedSilverPrice,
          lastUpdated: new Date(prices.lastUpdated || new Date()),
          isCache: prices.isCache || false,
          currency: targetCurrency // Always use the target currency
        });
        
        console.log('Converted prices:', {
          originalGold: prices.gold,
          originalSilver: prices.silver,
          convertedGold: convertedGoldPrice,
          convertedSilver: convertedSilverPrice,
          originalCurrency: sourceCurrency,
          targetCurrency
        });
      } catch (error) {
        console.error('Failed to convert prices:', error);
        // Fall back to using original prices but with correct currency
        setMetalPrices({
          gold: prices.gold || 65.52,
          silver: prices.silver || 0.85,
          lastUpdated: new Date(prices.lastUpdated || new Date()),
          isCache: true,
          currency: targetCurrency // Always use the right currency even if conversion failed
        });
      }
    } else {
      // No conversion needed, just set the prices
      setMetalPrices({
        gold: prices.gold || 65.52,
        silver: prices.silver || 0.85,
        lastUpdated: new Date(prices.lastUpdated || new Date()),
        isCache: prices.isCache || false,
        currency: targetCurrency // Always use the explicitly provided currency
      });
    }
    
    // Verify the update
    setTimeout(() => {
      const currentStore = useZakatStore.getState();
      console.log('Verification after price update:', {
        gold: currentStore.metalPrices.gold,
        silver: currentStore.metalPrices.silver,
        currency: currentStore.metalPrices.currency,
        expectedCurrency: targetCurrency
      });
    }, 0);
  }, [setMetalPrices]);
  
  // Update the fetchPrices function to use the centralized update function
  const fetchPrices = async () => {
    // Check if currency changed
    const currencyChanged = prevCurrencyRef.current !== currency;
    
    // Set fetching flag to prevent multiple concurrent fetches
    isFetchingRef.current = true;
    
    // Only show loading if this is first load or currency changed
    const shouldShowLoading = !lastUpdated || currencyChanged;
    
    if (shouldShowLoading) {
      setIsPricesLoading(true);
    }

    try {
      console.log(`Fetching metal prices for currency: ${currency}`);
      const response = await fetch(`/api/prices/metals?currency=${currency}`);
      
      if (!response.ok) {
        console.warn(`Using fallback prices. API returned: ${response.status}`);
        updateMetalPrices({
          gold: 65.52,
          silver: 0.85,
          lastUpdated: new Date(),
          isCache: true
        }, 'USD', currency);
        return;
      }

      const data = await response.json();
      
      // Log the API response for debugging
      console.log(`Received metal prices:`, {
        gold: data.gold,
        silver: data.silver,
        currency: data.currency || 'USD',
        isCache: data.isCache,
        source: data.source
      });
      
      // Always use the updateMetalPrices function for consistent handling
      updateMetalPrices(data, data.currency || 'USD', currency);
      
      setLastUpdated(new Date());
      
      // Update the currency ref after successful fetch
      prevCurrencyRef.current = currency;
    } catch (error) {
      console.error('Error fetching metal prices:', error);
      // Even on error, make sure we update with correct currency
      updateMetalPrices({
        gold: 65.52,
        silver: 0.85,
        lastUpdated: new Date(),
        isCache: true
      }, 'USD', currency);
    } finally {
      if (shouldShowLoading) {
        setIsPricesLoading(false);
      }
      // Reset fetching flag
      isFetchingRef.current = false;
    }
  };
  
  // Update the useEffect for price fetching
  useEffect(() => {
    // Skip if already fetching in this render cycle
    if (isFetchingRef.current) {
      return;
    }
    
    // Debug log for currency change
    console.log('Price fetch useEffect triggered:', {
      currency,
      prevCurrency: prevCurrencyRef.current,
      lastUpdated,
      isConverting
    });
    
    // Skip fetch if global currency conversion is in progress
    if (isConverting) {
      console.log('Skipping metals price fetch - global currency conversion in progress');
      return;
    }
    
    // Skip redundant fetches if currency hasn't changed
    const currencyChanged = prevCurrencyRef.current !== currency;
    if (!currencyChanged && lastUpdated) {
      const timeSinceUpdate = new Date().getTime() - lastUpdated.getTime();
      // Only re-fetch after 5 minutes unless currency changed
      if (timeSinceUpdate < 5 * 60 * 1000) {
        console.log('Skipping metals price fetch - using cached prices');
        
        // Even if skipping fetch, ensure currency is correct
        if (metalPrices.currency !== currency) {
          console.log('Correcting cached metal prices currency:', {
            from: metalPrices.currency,
            to: currency
          });
          updateMetalPrices(metalPrices, metalPrices.currency || 'USD', currency);
        }
        return;
      }
    }
    
    fetchPrices();
    
    // Only set up polling if component is mounted (not during SSR)
    let interval: NodeJS.Timeout | null = null;
    if (typeof window !== 'undefined' && !currencyChanged) {
      // Sync polling interval with API cache duration (5 minutes)
      interval = setInterval(fetchPrices, 5 * 60 * 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currency, isConverting, lastUpdated, updateMetalPrices]);

  // Always set hawl to true
  useEffect(() => {
    setMetalsHawl(true)
  }, [setMetalsHawl])

  // Update handleUnitChange to record when unit was changed
  const handleUnitChange = (value: WeightUnit) => {
    if (value !== selectedUnit) {
      // Clear active input when changing units to allow all fields to update
      setActiveInputId(null);
      
      if (inputTimeoutRef.current) {
        clearTimeout(inputTimeoutRef.current);
        inputTimeoutRef.current = null;
      }
      
      // Only track unit change for input field animations if we have values
      const hasValues = Object.values(metalsValues).some(val => Number(val) > 0)
      if (hasValues) {
        // Record time of unit change for input highlight
        setLastUnitChange(Date.now())
        // Clear highlight after 1.5 seconds
        setTimeout(() => setLastUnitChange(null), 1500)
      }
      
      // Set unit in state and store
      setSelectedUnit(value)
      setMetalsWeightUnit(value)
      
      // Convert all existing input values to the new unit immediately
      const convertedInputValues = { ...inputValues }
      
      METAL_CATEGORIES.forEach(category => {
        const valueInGrams = metalsValues[category.id as keyof typeof metalsValues]
        if (valueInGrams > 0) {
          // Convert from grams to the newly selected unit
          const convertedValue = fromGrams(valueInGrams, value)
          
          // Format with appropriate precision based on the unit
          // Ounce values need more decimal places since they're smaller numbers
          let formattedValue = convertedValue.toString();
          if (value === 'ounce') {
            // For ounces, use more decimal places to avoid truncating important digits
            formattedValue = convertedValue.toFixed(6).replace(/\.?0+$/, '');
          } else if (value === 'tola') {
            // For tola, use appropriate precision
            formattedValue = convertedValue.toFixed(4).replace(/\.?0+$/, '');
          } else {
            // For grams, standard precision
            formattedValue = convertedValue.toFixed(3).replace(/\.?0+$/, '');
          }
          
          convertedInputValues[category.id] = formattedValue
        } else {
          // Ensure empty values are properly cleared
          convertedInputValues[category.id] = ''
        }
      })
      
      // Update the input values with properly converted values
      setInputValues(convertedInputValues)
    }
  }

  // Update the handleValueChange function to track active input
  const handleValueChange = (categoryId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    
    // Set this field as the active input to prevent interference from the useEffect
    setActiveInputId(categoryId);
    
    // Clear any previous timeout
    if (inputTimeoutRef.current) {
      clearTimeout(inputTimeoutRef.current);
    }
    
    // Set a timeout to clear the active input status after user stops typing
    inputTimeoutRef.current = setTimeout(() => {
      setActiveInputId(null);
    }, 1000); // Wait 1 second after last keystroke
    
    // Debug the incoming event value
    console.log(`Input event for ${categoryId}:`, { value: inputValue });
    
    // Handle empty value first - always allow clearing the input
    if (inputValue === '') {
      console.log(`Clearing input for ${categoryId}`);
      setInputValues(prev => ({...prev, [categoryId]: ''}));
      setMetalsValue(categoryId as keyof typeof metalsValues, 0);
      return;
    }
    
    // Always update input state first to keep the UI responsive
    setInputValues(prev => ({...prev, [categoryId]: inputValue}));
    
    // Much more permissive validation - allow almost anything during typing
    // This effectively disables validation during typing to prevent input blocking
    const looseValidation = /^[0-9]*\.?[0-9]*$/;
    if (!looseValidation.test(inputValue)) {
      console.log(`Input validation failed for ${categoryId}: ${inputValue}`);
      // We've already updated the display value, so just return without updating store
      return;
    }
    
    // For partial inputs that are still being typed, don't try to process yet
    if (inputValue === '.' || inputValue === '0.') {
      console.log(`Partial input detected for ${categoryId}, awaiting more input`);
      return;
    }
    
    try {
      // Only process complete numbers
      const numericValue = parseFloat(inputValue);
      
      // Only update store if we have a valid number
      if (!isNaN(numericValue) && isFinite(numericValue) && numericValue >= 0) {      
        console.log(`Processing value: ${inputValue} (${numericValue}) in ${selectedUnit}`);
        
        // Convert from selected unit to grams for storage
        const valueInGrams = toGrams(numericValue, selectedUnit);
        
        // Round to avoid floating point issues
        const roundedValue = Math.round(valueInGrams * 1000) / 1000;
        
        // Update the store with the processed value
        // Do this in a setTimeout to avoid blocking the input
        setTimeout(() => {
          setMetalsValue(categoryId as keyof typeof metalsValues, roundedValue);
        }, 0);
      }
    } catch (error) {
      console.error(`Error processing input:`, error);
    }
  };

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

  // Helper function to get the displayed price for the input field
  // This ensures we show the price that matches the displayed weight in the selected unit
  const getDisplayPriceForCategory = (categoryId: string) => {
    // Get the raw value from the input field (in selected unit)
    const inputValue = inputValues[categoryId] || '0';
    const inputNumericValue = parseFloat(inputValue);
    
    if (isNaN(inputNumericValue) || inputNumericValue === 0) {
      return 0;
    }
    
    // Get the price per gram
    const pricePerGram = categoryId.includes('gold') ? metalPrices.gold : metalPrices.silver;
    
    // Convert input value to grams first
    const valueInGrams = toGrams(inputNumericValue, selectedUnit);
    
    // Calculate total price (value in grams × price per gram)
    const value = valueInGrams * pricePerGram;
    
    console.log(`Display price calculation for ${categoryId}:`, {
      inputValue,
      inputNumericValue,
      selectedUnit,
      pricePerGram,
      valueInGrams,
      calculatedValue: value
    });
    
    return value;
  };

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

  // Get the Nisab value in the user's selected unit
  const getNisabInUnit = () => {
    const nisabInGrams = NISAB.SILVER.GRAMS // 595g
    const nisabInSelectedUnit = fromGrams(nisabInGrams, selectedUnit)
    return nisabInSelectedUnit.toFixed(2)
  }

  // Add effect to reset cache when currency changes
  useEffect(() => {
    // Only reset if we have a previous currency and it's different
    if (prevCurrencyRef.current && prevCurrencyRef.current !== currency) {
      console.log(`Currency changed from ${prevCurrencyRef.current} to ${currency}, performing hard reset`);
      
      // STEP 1: Clear any active input tracking to prevent interference
      setActiveInputId(null);
      if (inputTimeoutRef.current) {
        clearTimeout(inputTimeoutRef.current);
        inputTimeoutRef.current = null;
      }
      
      // STEP 2: Clear all metal values in the store
      METAL_CATEGORIES.forEach(category => {
        setMetalsValue(category.id as keyof typeof metalsValues, 0);
      });
      
      // STEP 3: Reset all input fields
      const emptyInputs = METAL_CATEGORIES.reduce((acc, category) => {
        return {
          ...acc,
          [category.id]: ''
        };
      }, {} as Record<string, string>);
      setInputValues(emptyInputs);
      
      // STEP 4: Reset investment section if it's shown
      if (showInvestment) {
        setShowInvestment(false);
      }
      
      // STEP 5: Reset cache and last updated timestamp
      setLastUpdated(null);
      
      // STEP 6: Force an immediate fetch with the new currency
      const fetchNewPrices = async () => {
        console.log(`Forcing immediate fetch for new currency after reset: ${currency}`);
        setIsPricesLoading(true);
        
        try {
          const response = await fetch(`/api/prices/metals?currency=${currency}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Post-reset currency update - received prices:`, data);
            
            // Use the centralized function for consistent handling
            updateMetalPrices(data, data.currency || 'USD', currency);
          }
        } catch (error) {
          console.error('Error in post-reset price fetch:', error);
          // Even on error, make sure we update the currency
          updateMetalPrices({
            gold: 65.52,
            silver: 0.85,
            lastUpdated: new Date(),
            isCache: true
          }, 'USD', currency);
        } finally {
          setIsPricesLoading(false);
        }
      };
      
      // Only fetch if we're not in the middle of a global conversion
      if (!isConverting) {
        fetchNewPrices();
      }
    }
  }, [currency, isConverting, updateMetalPrices, showInvestment, setMetalsValue]);

  // Replace the value calculation in each category with a correct function that always uses the current currency
  const calculateMetalValue = useCallback((categoryId: string) => {
    const weight = metalsValues[categoryId as keyof typeof metalsValues] || 0;
    const price = categoryId.includes('gold') ? metalPrices.gold : metalPrices.silver;
    const value = weight * price;
    
    // Log exactly what we're calculating
    console.log(`Metal value calculation for ${categoryId}:`, {
      weight,
      price,
      value,
      displayCurrency: currency,
      metalPricesCurrency: metalPrices.currency
    });
    
    return value;
  }, [metalsValues, metalPrices, currency]);

  // Add a check for currency consistency on each render
  useEffect(() => {
    // If the metal prices currency doesn't match the component currency prop
    // and we're not in the middle of a currency conversion, force an update
    if (metalPrices.currency !== currency && !isConverting && isComponentMounted) {
      console.warn('Currency mismatch detected in PersonalJewelryForm:', {
        metalPricesCurrency: metalPrices.currency,
        componentCurrency: currency
      });
      
      // Force an immediate update of the prices to the correct currency
      if (!isFetchingRef.current) {
        console.log('Triggering emergency currency fix');
        // Force a cache reset to trigger a new fetch
        setLastUpdated(null);
      }
    }
  }, [currency, metalPrices.currency, isConverting, isComponentMounted]);
  
  // Centralize the calculation of values for better consistency
  const getValueForCategory = useCallback((categoryId: string) => {
    const weightInGrams = metalsValues[categoryId as keyof typeof metalsValues] || 0;
    
    // Get price per gram (this is always per gram regardless of display unit)
    const pricePerGram = categoryId.includes('gold') ? metalPrices.gold : metalPrices.silver;
    
    // Calculate the value based on weight in grams multiplied by price per gram
    const value = weightInGrams * pricePerGram;
    
    // Debug logging only if a value exists
    if (weightInGrams > 0) {
      console.log(`Category ${categoryId} value calculation:`, {
        weightInGrams,
        pricePerGram,
        value,
        selectedUnit,
        currency: metalPrices.currency || currency
      });
    }
    
    // Check for currency mismatch
    if (metalPrices.currency && metalPrices.currency !== currency) {
      console.warn(`Currency mismatch in getValueForCategory (${categoryId}):`, {
        metalPricesCurrency: metalPrices.currency,
        displayCurrency: currency
      });
      
      // If not already converting and we have a mismatch, try to convert the value
      if (!isConverting) {
        try {
          const currencyStore = useCurrencyStore.getState();
          const convertedValue = currencyStore.convertAmount(
            value,
            metalPrices.currency,
            currency
          );
          
          console.log(`Converted value for ${categoryId}:`, {
            originalValue: value,
            convertedValue,
            fromCurrency: metalPrices.currency,
            toCurrency: currency
          });
          
          return convertedValue;
        } catch (error) {
          console.error('Failed to convert value in getValueForCategory:', error);
        }
      }
    }
    
    return value;
  }, [metalsValues, metalPrices, currency, isConverting, selectedUnit]);

  // Add diagnostic logging to help debug currency issues
  console.log('PersonalJewelryForm initialized with currency:', currency);
  
  // Create a diagnostic reference to track currency changes
  const currencyChangeCount = useRef(0);
  
  // Track currency changes
  useEffect(() => {
    currencyChangeCount.current += 1;
    console.log(`Currency changed to ${currency} (change #${currencyChangeCount.current})`);
    
    // On the first render, make sure we're using the correct initial currency
    if (currencyChangeCount.current === 1 && metalPrices.currency !== currency) {
      console.log('Initial currency mismatch detected - ensuring correct currency on first render');
      setMetalPrices({
        ...metalPrices,
        currency: currency 
      });
    }
  }, [currency, metalPrices]);

  // Add cleanup for the timeout
  useEffect(() => {
    return () => {
      if (inputTimeoutRef.current) {
        clearTimeout(inputTimeoutRef.current);
      }
    };
  }, []);

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
                                  const value = getDisplayPriceForCategory(category.id);
                                  return formatCurrency(value);
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
                                    const value = getDisplayPriceForCategory(category.id);
                                    return formatCurrency(value);
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