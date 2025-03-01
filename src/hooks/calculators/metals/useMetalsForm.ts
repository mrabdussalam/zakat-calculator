/**
 * Precious Metals Form Hook - Manages form state and calculations for precious metals
 * - Handles unit conversions between grams, tolas, ounces
 * - Tracks quantities for each metal category (regular, occasional, investment)
 * - Calculates total and zakatable amounts based on current market prices
 * - Validates input values and processes unit changes
 * - Syncs with global state for consistent calculations
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { useZakatStore } from '@/store/zakatStore'
import { toGrams, fromGrams, WeightUnit } from '@/lib/utils/units'
import { MetalsValues } from '@/store/modules/metals.types'

// Define and export the MetalCategory interface
export interface MetalCategory {
    id: string;
    name: string;
    description: string;
    isZakatable: boolean;
}

// Define and export the METAL_CATEGORIES constant
export const METAL_CATEGORIES: MetalCategory[] = [
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
];

interface UseMetalsFormProps {
    onUpdateValues?: (values: Record<string, number>) => void
}

/**
 * Hook to manage form state for precious metals calculator
 */
export function useMetalsForm({ onUpdateValues }: UseMetalsFormProps = {}) {
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
        metalsPreferences = {
            weightUnit: 'gram' as WeightUnit
        },
        setMetalsWeightUnit
    } = useZakatStore()

    // Selected weight unit
    const [selectedUnit, setSelectedUnit] = useState<WeightUnit>(
        metalsPreferences.weightUnit || 'gram'
    )

    // Keep track of whether to show investment section
    // Initialize based on existing investment values, but allow toggling regardless of personal jewelry values
    const [showInvestment, setShowInvestment] = useState(() => {
        // Check for existing investment values during initialization
        return METAL_CATEGORIES
            .filter((cat: MetalCategory) => cat.id.includes('investment'))
            .some((cat: MetalCategory) => (metalsValues[cat.id as keyof typeof metalsValues] || 0) > 0)
    })

    // Input values state for controlled inputs (displayed in user's selected unit)
    const [inputValues, setInputValues] = useState<Record<string, string>>(() => {
        return METAL_CATEGORIES.reduce((acc: Record<string, string>, category: MetalCategory) => {
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

    // Track active input to prevent interference during editing
    const [activeInputId, setActiveInputId] = useState<string | null>(null)
    const inputTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Add a flag to track if the component is mounted
    const [isComponentMounted, setIsComponentMounted] = useState(false)

    // Add a state to track if the store has been hydrated
    const [storeHydrated, setStoreHydrated] = useState(false)

    // Modify the useEffect for updating input values
    useEffect(() => {
        // Skip this effect while user is actively typing
        if (activeInputId) {
            return
        }

        const newValues = { ...inputValues }
        let hasChanges = false

        METAL_CATEGORIES.forEach((category: MetalCategory) => {
            // Skip updating fields that are currently being edited by the user
            if (category.id === activeInputId) {
                return
            }

            const valueInGrams = metalsValues[category.id as keyof typeof metalsValues]
            if (valueInGrams > 0) {
                const convertedValue = fromGrams(valueInGrams, selectedUnit)

                // Better handling of numeric precision based on unit type
                let displayValue = ''
                if (selectedUnit === 'ounce') {
                    // For ounces, use more decimal places to avoid truncating important digits
                    displayValue = convertedValue.toFixed(6).replace(/\.?0+$/, '')
                } else if (selectedUnit === 'tola') {
                    // For tola, use appropriate precision
                    displayValue = convertedValue.toFixed(4).replace(/\.?0+$/, '')
                } else {
                    // For grams, standard precision
                    displayValue = convertedValue.toFixed(3).replace(/\.?0+$/, '')
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
    }, [metalsValues, inputValues, selectedUnit, activeInputId])

    // Add this useEffect to listen for store resets
    useEffect(() => {
        // Check if all store values are zero - indicates a reset occurred
        const isStoreReset = METAL_CATEGORIES.every((category: MetalCategory) => {
            const value = metalsValues[category.id as keyof typeof metalsValues]
            return value === 0 || value === undefined
        })

        if (isStoreReset) {
            console.log('Store reset detected in Metals hook - clearing input fields')

            // Clear all input values
            setInputValues(METAL_CATEGORIES.reduce((acc: Record<string, string>, category: MetalCategory) => {
                return {
                    ...acc,
                    [category.id]: ''
                }
            }, {} as Record<string, string>))

            // Do not reset the showInvestment state to allow users to toggle it regardless of other values

            // Clear any active input tracking
            setActiveInputId(null)
            if (inputTimeoutRef.current) {
                clearTimeout(inputTimeoutRef.current)
                inputTimeoutRef.current = null
            }
        }
    }, [metalsValues, showInvestment])

    // Update the useEffect for component mount tracking and add hydration listener
    useEffect(() => {
        setIsComponentMounted(true)

        // Add listener for store hydration completion
        const handleHydrationComplete = () => {
            console.log('MetalsForm hook: Store hydration complete event received')
            setStoreHydrated(true)

            // After hydration, safely initialize form values from store
            setTimeout(() => {
                const newInputValues = METAL_CATEGORIES.reduce((acc: Record<string, string>, category: MetalCategory) => {
                    const valueInGrams = metalsValues[category.id as keyof typeof metalsValues]
                    const convertedValue = fromGrams(valueInGrams, selectedUnit)
                    return {
                        ...acc,
                        [category.id]: valueInGrams > 0 ? convertedValue.toString() : ''
                    }
                }, {} as Record<string, string>)

                setInputValues(newInputValues)

                // Check if there are investment values to show investment section
                const hasInvestmentValues = METAL_CATEGORIES
                    .filter((cat: MetalCategory) => cat.id.includes('investment'))
                    .some((cat: MetalCategory) => (metalsValues[cat.id as keyof typeof metalsValues] || 0) > 0)

                if (hasInvestmentValues) {
                    setShowInvestment(true)
                }

                console.log('MetalsForm hook: Initialized form values after hydration', newInputValues)
            }, 50) // Small delay to ensure store is fully ready
        }

        // Listen for the custom hydration event
        window.addEventListener('store-hydration-complete', handleHydrationComplete)

        // Check if hydration already happened
        if (typeof window !== 'undefined' && 'hasDispatchedHydrationEvent' in window) {
            // @ts-ignore - This is set by StoreHydration component
            if (window.hasDispatchedHydrationEvent) {
                handleHydrationComplete()
            }
        }

        return () => {
            setIsComponentMounted(false)
            window.removeEventListener('store-hydration-complete', handleHydrationComplete)
        }
    }, [metalsValues, selectedUnit])

    // Update handleUnitChange to record when unit was changed
    const handleUnitChange = (value: WeightUnit) => {
        if (value !== selectedUnit) {
            // Clear active input when changing units to allow all fields to update
            setActiveInputId(null)

            if (inputTimeoutRef.current) {
                clearTimeout(inputTimeoutRef.current)
                inputTimeoutRef.current = null
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

            METAL_CATEGORIES.forEach((category: MetalCategory) => {
                const valueInGrams = metalsValues[category.id as keyof typeof metalsValues]
                if (valueInGrams > 0) {
                    // Convert from grams to the newly selected unit
                    const convertedValue = fromGrams(valueInGrams, value)

                    // Format with appropriate precision based on the unit
                    // Ounce values need more decimal places since they're smaller numbers
                    let formattedValue = convertedValue.toString()
                    if (value === 'ounce') {
                        // For ounces, use more decimal places to avoid truncating important digits
                        formattedValue = convertedValue.toFixed(6).replace(/\.?0+$/, '')
                    } else if (value === 'tola') {
                        // For tola, use appropriate precision
                        formattedValue = convertedValue.toFixed(4).replace(/\.?0+$/, '')
                    } else {
                        // For grams, standard precision
                        formattedValue = convertedValue.toFixed(3).replace(/\.?0+$/, '')
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
        const inputValue = event.target.value

        // Set this field as the active input to prevent interference from the useEffect
        setActiveInputId(categoryId)

        // Clear any previous timeout
        if (inputTimeoutRef.current) {
            clearTimeout(inputTimeoutRef.current)
        }

        // Set a timeout to clear the active input status after user stops typing
        inputTimeoutRef.current = setTimeout(() => {
            setActiveInputId(null)
        }, 1000) // Wait 1 second after last keystroke

        // Debug the incoming event value
        console.log(`Input event for ${categoryId}:`, { value: inputValue })

        // Handle empty value first - always allow clearing the input
        if (inputValue === '') {
            console.log(`Clearing input for ${categoryId}`)
            setInputValues(prev => ({ ...prev, [categoryId]: '' }))
            setMetalsValue(categoryId as keyof MetalsValues, 0)
            return
        }

        // Always update input state first to keep the UI responsive
        setInputValues(prev => ({ ...prev, [categoryId]: inputValue }))

        // Much more permissive validation - allow almost anything during typing
        // This effectively disables validation during typing to prevent input blocking
        const looseValidation = /^[0-9]*\.?[0-9]*$/
        if (!looseValidation.test(inputValue)) {
            console.log(`Input validation failed for ${categoryId}: ${inputValue}`)
            // We've already updated the display value, so just return without updating store
            return
        }

        // For partial inputs that are still being typed, don't try to process yet
        if (inputValue === '.' || inputValue === '0.') {
            console.log(`Partial input detected for ${categoryId}, awaiting more input`)
            return
        }

        try {
            // Only process complete numbers
            const numericValue = parseFloat(inputValue)

            // Only update store if we have a valid number
            if (!isNaN(numericValue) && isFinite(numericValue) && numericValue >= 0) {
                console.log(`Processing value: ${inputValue} (${numericValue}) in ${selectedUnit}`)

                // Convert from selected unit to grams for storage
                const valueInGrams = toGrams(numericValue, selectedUnit)

                // Round to avoid floating point issues
                const roundedValue = Math.round(valueInGrams * 1000) / 1000

                // Update the store with the processed value
                // Do this in a setTimeout to avoid blocking the input
                setTimeout(() => {
                    setMetalsValue(categoryId as keyof MetalsValues, roundedValue)

                    // Notify parent component if callback exists
                    if (onUpdateValues) {
                        const updatedValues = { ...metalsValues }
                        updatedValues[categoryId as keyof MetalsValues] = roundedValue
                        onUpdateValues(updatedValues)
                    }
                }, 0)
            }
        } catch (error) {
            console.error(`Error processing input:`, error)
        }
    }

    // Update showInvestment handler to reset investment values when switching to "No"
    const handleInvestmentToggle = (show: boolean) => {
        // Always allow toggling to "Yes" regardless of personal jewelry values
        setShowInvestment(show);

        // If switching to "No", reset all investment values
        if (!show) {
            // Reset store values
            setMetalsValue('gold_investment', 0);
            setMetalsValue('silver_investment', 0);

            // Reset input display values
            setInputValues(prev => ({
                ...prev,
                gold_investment: '',
                silver_investment: ''
            }));
        }
    }

    // Add cleanup for the timeout
    useEffect(() => {
        return () => {
            if (inputTimeoutRef.current) {
                clearTimeout(inputTimeoutRef.current)
            }
        }
    }, [])

    // Listen for global store reset events
    useEffect(() => {
        // Function to handle store reset events
        const handleStoreReset = (event?: Event) => {
            console.log('MetalsForm hook: Detected store reset, clearing local input state', event)

            // Clear any active input tracking
            setActiveInputId(null)
            if (inputTimeoutRef.current) {
                clearTimeout(inputTimeoutRef.current)
                inputTimeoutRef.current = null
            }

            // Reset all input fields
            const emptyInputs = METAL_CATEGORIES.reduce((acc: Record<string, string>, category: MetalCategory) => {
                return {
                    ...acc,
                    [category.id]: ''
                }
            }, {} as Record<string, string>)
            setInputValues(emptyInputs)

            // Do not reset investment section to allow users to toggle it regardless of other values
        }

        // Listen for custom reset events from the store
        if (typeof window !== 'undefined') {
            window.addEventListener('zakat-store-reset', handleStoreReset)

            return () => {
                window.removeEventListener('zakat-store-reset', handleStoreReset)
            }
        }

        return undefined
    }, [])

    return {
        // State
        inputValues,
        selectedUnit,
        lastUnitChange,
        showInvestment,
        activeInputId,
        isComponentMounted,
        storeHydrated,

        // Actions
        handleUnitChange,
        handleValueChange,
        handleInvestmentToggle,
        setActiveInputId,
    }
} 