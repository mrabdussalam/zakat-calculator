import { useState, useRef, useEffect, useCallback } from 'react'
import { useZakatStore } from '@/store/zakatStore'
import { useCurrencyContext } from '@/lib/context/CurrencyContext'
import { useCurrencyStore } from '@/lib/services/currency'
import { MetalPrices } from '@/store/modules/metals.types'
import { toGrams, WeightUnit } from '@/lib/utils/units'

interface UseMetalsPricesProps {
    currency: string;
}

/**
 * Metals Prices Hook - Manages metal price data and conversions
 * - Fetches current market prices for gold and silver
 * - Handles currency conversions for international prices
 * - Provides cached price data with refresh mechanism
 * - Calculates Nisab thresholds based on current prices
 * - Offers fallback mechanisms for API failures
 */
export function useMetalsPrices({ currency }: UseMetalsPricesProps) {
    const {
        metalPrices = {
            gold: 93.98,  // Updated default gold price per gram to match fallback
            silver: 1.02, // Updated default silver price per gram to match fallback
            lastUpdated: new Date(),
            isCache: true,
            currency: currency
        },
        setMetalPrices,
        updateNisabWithPrices
    } = useZakatStore()

    // Get currency conversion state
    const { isConverting } = useCurrencyContext()

    // Add a ref to track previous currency to prevent redundant fetches
    const prevCurrencyRef = useRef<string>(currency)

    // Add loading state
    const [isPricesLoading, setIsPricesLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [isComponentMounted, setIsComponentMounted] = useState(false)

    // Add a flag to prevent additional fetches during the current render cycle
    const isFetchingRef = useRef<boolean>(false)

    // Create a centralized, robust price update function to ensure consistent currency handling
    const updateMetalPrices = useCallback((prices: MetalPrices | { gold: number; silver: number; lastUpdated: Date; isCache: boolean; currency?: string }, sourceCurrency: string, targetCurrency: string) => {
        console.log('Updating metal prices with consistent approach:', {
            prices,
            sourceCurrency,
            targetCurrency
        })

        // If currencies don't match, convert the prices
        if (sourceCurrency !== targetCurrency) {
            try {
                // Get the currency conversion service
                const currencyStore = useCurrencyStore.getState()

                // Convert the prices
                const convertedGoldPrice = currencyStore.convertAmount(
                    prices.gold || 65.52,
                    sourceCurrency,
                    targetCurrency
                )

                const convertedSilverPrice = currencyStore.convertAmount(
                    prices.silver || 0.85,
                    sourceCurrency,
                    targetCurrency
                )

                // Set the prices in the store with the target currency
                setMetalPrices({
                    gold: convertedGoldPrice,
                    silver: convertedSilverPrice,
                    lastUpdated: new Date(prices.lastUpdated || new Date()),
                    isCache: prices.isCache || false,
                    currency: targetCurrency // Always use the target currency
                })

                console.log('Converted prices:', {
                    originalGold: prices.gold,
                    originalSilver: prices.silver,
                    convertedGold: convertedGoldPrice,
                    convertedSilver: convertedSilverPrice,
                    originalCurrency: sourceCurrency,
                    targetCurrency
                })
            } catch (error) {
                console.error('Failed to convert prices:', error)
                // Fall back to using original prices but with correct currency
                setMetalPrices({
                    gold: prices.gold || 65.52,
                    silver: prices.silver || 0.85,
                    lastUpdated: new Date(prices.lastUpdated || new Date()),
                    isCache: true,
                    currency: targetCurrency // Always use the right currency even if conversion failed
                })
            }
        } else {
            // No conversion needed, just set the prices
            setMetalPrices({
                gold: prices.gold || 65.52,
                silver: prices.silver || 0.85,
                lastUpdated: new Date(prices.lastUpdated || new Date()),
                isCache: prices.isCache || false,
                currency: targetCurrency // Always use the explicitly provided currency
            })
        }

        // Verify the update
        setTimeout(() => {
            const currentStore = useZakatStore.getState()
            console.log('Verification after price update:', {
                gold: currentStore.metalPrices.gold,
                silver: currentStore.metalPrices.silver,
                currency: currentStore.metalPrices.currency,
                expectedCurrency: targetCurrency
            })
        }, 0)
    }, [setMetalPrices])

    // Update the fetchPrices function to use the centralized update function
    const fetchPrices = async () => {
        // Check if currency changed
        const currencyChanged = prevCurrencyRef.current !== currency

        // Set fetching flag to prevent multiple concurrent fetches
        isFetchingRef.current = true

        // Only show loading if this is first load or currency changed
        const shouldShowLoading = !lastUpdated || currencyChanged

        if (shouldShowLoading) {
            setIsPricesLoading(true)
        }

        try {
            console.log(`Fetching metal prices for currency: ${currency}`)
            const response = await fetch(`/api/prices/metals?currency=${currency}`)

            if (!response.ok) {
                console.warn(`Using fallback prices. API returned: ${response.status}`)
                updateMetalPrices({
                    gold: 93.98,
                    silver: 1.02,
                    lastUpdated: new Date(),
                    isCache: true,
                    currency: 'USD'
                }, 'USD', currency)
                return
            }

            const data = await response.json()

            // Log the API response for debugging
            console.log(`Received metal prices:`, {
                gold: data.gold,
                silver: data.silver,
                currency: data.currency || 'USD',
                isCache: data.isCache,
                source: data.source
            })

            // Always use the updateMetalPrices function for consistent handling
            updateMetalPrices(data, data.currency || 'USD', currency)

            setLastUpdated(new Date())

            // Force a refresh of nisab calculations by explicitly calling the nisab update function
            // This ensures the nisab thresholds update immediately without waiting for a tab switch
            try {
                if (updateNisabWithPrices) {
                    console.log('Triggering immediate nisab update with new prices')

                    // Ensure we have a valid lastUpdated from the API response
                    const lastUpdated = data.lastUpdated instanceof Date ?
                        data.lastUpdated :
                        (typeof data.lastUpdated === 'string' ?
                            new Date(data.lastUpdated) :
                            new Date())

                    updateNisabWithPrices({
                        gold: data.gold,
                        silver: data.silver,
                        currency: data.currency || currency,
                        lastUpdated: lastUpdated,
                        isCache: data.isCache || false
                    })
                }
            } catch (error) {
                console.error('Failed to update nisab calculations:', error)
            }

            // Update the currency ref after successful fetch
            prevCurrencyRef.current = currency
        } catch (error) {
            console.error('Error fetching metal prices:', error)
            // Even on error, make sure we update with correct currency
            updateMetalPrices({
                gold: 93.98,
                silver: 1.02,
                lastUpdated: new Date(),
                isCache: true,
                currency: 'USD'
            }, 'USD', currency)
        } finally {
            if (shouldShowLoading) {
                setIsPricesLoading(false)
            }
            // Reset fetching flag
            isFetchingRef.current = false
        }
    }

    // Update the useEffect for price fetching
    useEffect(() => {
        // Skip if already fetching in this render cycle
        if (isFetchingRef.current) {
            return
        }

        // Debug log for currency change
        console.log('Price fetch useEffect triggered:', {
            currency,
            prevCurrency: prevCurrencyRef.current,
            lastUpdated,
            isConverting
        })

        // Skip fetch if global currency conversion is in progress
        if (isConverting) {
            console.log('Skipping metals price fetch - global currency conversion in progress')
            return
        }

        // Skip redundant fetches if currency hasn't changed
        const currencyChanged = prevCurrencyRef.current !== currency
        if (!currencyChanged && lastUpdated) {
            const timeSinceUpdate = new Date().getTime() - lastUpdated.getTime()
            // Only re-fetch after 5 minutes unless currency changed
            if (timeSinceUpdate < 5 * 60 * 1000) {
                console.log('Skipping metals price fetch - using cached prices')

                // Even if skipping fetch, ensure currency is correct
                if (metalPrices.currency !== currency) {
                    console.log('Correcting cached metal prices currency:', {
                        from: metalPrices.currency,
                        to: currency
                    })
                    updateMetalPrices(metalPrices, metalPrices.currency || 'USD', currency)
                }
                return
            }
        }

        fetchPrices()

        // Only set up polling if component is mounted (not during SSR)
        let interval: NodeJS.Timeout | null = null
        if (typeof window !== 'undefined' && !currencyChanged) {
            // Sync polling interval with API cache duration (5 minutes)
            interval = setInterval(fetchPrices, 5 * 60 * 1000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [currency, isConverting, lastUpdated, updateMetalPrices, metalPrices])

    // Add effect to reset cache when currency changes
    useEffect(() => {
        // Only reset if we have a previous currency and it's different
        if (prevCurrencyRef.current && prevCurrencyRef.current !== currency) {
            console.log(`Currency changed from ${prevCurrencyRef.current} to ${currency}, resetting price cache`)

            // Reset cache and last updated timestamp
            setLastUpdated(null)
        }

        // Update reference for next comparison
        prevCurrencyRef.current = currency
    }, [currency])

    // Component mount tracking
    useEffect(() => {
        setIsComponentMounted(true)

        return () => {
            setIsComponentMounted(false)
        }
    }, [])

    // Add a check for currency consistency on each render
    useEffect(() => {
        // If the metal prices currency doesn't match the component currency prop
        // and we're not in the middle of a currency conversion, force an update
        if (metalPrices.currency !== currency && !isConverting && isComponentMounted) {
            console.warn('Currency mismatch detected in useMetalsPrices:', {
                metalPricesCurrency: metalPrices.currency,
                componentCurrency: currency
            })

            // Force an immediate update of the prices to the correct currency
            if (!isFetchingRef.current) {
                console.log('Triggering emergency currency fix')
                // Force a cache reset to trigger a new fetch
                setLastUpdated(null)
            }
        }
    }, [currency, metalPrices.currency, isConverting, isComponentMounted])

    // Format helpers
    const formatCurrency = useCallback((value: number) => {
        // Enhanced debug logging
        console.log('formatCurrency call:', {
            value,
            currency,
            metalPricesCurrency: metalPrices.currency,
            metalPricesGold: metalPrices.gold,
            metalPricesSilver: metalPrices.silver
        })

        // Check for currency mismatch and warn
        if (metalPrices.currency && metalPrices.currency !== currency) {
            console.warn('Currency mismatch in formatCurrency!', {
                componentCurrency: currency,
                priceCurrency: metalPrices.currency,
                value
            })

            // If we're in the middle of a currency change, the value might be calculated
            // with metalPrices in the wrong currency. Try to adjust if possible.
            if (!isConverting && typeof useCurrencyStore !== 'undefined') {
                try {
                    const currencyStore = useCurrencyStore.getState()
                    // Convert from the metal prices currency to the component currency
                    const convertedValue = currencyStore.convertAmount(
                        value,
                        metalPrices.currency,
                        currency
                    )
                    console.log(`Converting value from ${metalPrices.currency} to ${currency}:`, {
                        original: value,
                        converted: convertedValue
                    })
                    value = convertedValue
                } catch (error) {
                    console.error('Failed to convert value to correct currency:', error)
                }
            }
        }

        // IMPORTANT: Always use the component's currency prop directly
        // This ensures consistency across all displays
        if (!currency || typeof currency !== 'string') {
            console.error('Invalid currency in formatCurrency:', currency)
            // Fall back to USD if we somehow don't have a valid currency
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: 'USD'
            }).format(value)
        }

        try {
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: currency // Always use the component's currency prop
            }).format(value)
        } catch (error) {
            console.error('Error formatting currency:', error)
            // Fall back to basic formatting if Intl fails
            return `${currency} ${value.toFixed(2)}`
        }
    }, [currency, metalPrices, isConverting])

    // Helper function to get the displayed price for the input field
    // This ensures we show the price that matches the displayed weight in the selected unit
    const getDisplayPriceForCategory = useCallback((categoryId: string, inputValue?: string, selectedUnit?: WeightUnit) => {
        const { metalsValues, metalPrices: storePrices } = useZakatStore.getState();

        // If inputValue is provided, use it, otherwise use the value from the store
        if (inputValue) {
            const inputNumericValue = parseFloat(inputValue);

            if (isNaN(inputNumericValue) || inputNumericValue === 0) {
                return 0;
            }

            // Get the price per gram
            const pricePerGram = categoryId.includes('gold') ? metalPrices.gold : metalPrices.silver;

            // Convert input value to grams first (if selectedUnit is provided)
            const valueInGrams = selectedUnit ? toGrams(inputNumericValue, selectedUnit) : inputNumericValue;

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
        } else {
            // Use the value from the store
            const weightInGrams = metalsValues[categoryId as keyof typeof metalsValues] || 0;
            const pricePerGram = categoryId.includes('gold') ? metalPrices.gold : metalPrices.silver;
            return weightInGrams * pricePerGram;
        }
    }, [metalPrices]);

    return {
        // State
        metalPrices,
        isPricesLoading,
        lastUpdated,

        // Actions
        fetchPrices,
        updateMetalPrices,

        // Formatters
        formatCurrency,
        getDisplayPriceForCategory
    }
} 