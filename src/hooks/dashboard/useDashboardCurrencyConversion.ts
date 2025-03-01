import { useState, useEffect, useRef } from 'react'
import { useZakatStore } from '@/store/zakatStore'
import { useCurrencyStore } from '@/lib/services/currency'
import { useCurrencyContext } from '@/lib/context/CurrencyContext'
import { toast } from '@/components/ui/toast'
import { roundCurrency } from '@/lib/utils/currency'
import { CashValues } from '@/store/modules/cash'
import { RealEstateValues } from '@/store/modules/realEstate'
import { RetirementValues, ActiveStock } from '@/store/types'

interface UseDashboardCurrencyConversionProps {
  currency: string
  isHydrated: boolean
  onNisabUpdated?: (nisabThreshold: number) => void
}

export function useDashboardCurrencyConversion({
  currency,
  isHydrated,
  onNisabUpdated
}: UseDashboardCurrencyConversionProps) {
  const [isConverting, setIsConverting] = useState(false)
  const prevCurrency = useRef<string>(currency)
  const prevConversionRef = useRef<{ from: string; to: string; timestamp: number } | null>(null)
  const { setIsConverting: setGlobalIsConverting } = useCurrencyContext()

  // Currency conversion effect
  useEffect(() => {
    // Only fetch if currency has actually changed and we're hydrated
    if (prevCurrency.current !== currency && isHydrated) {
      // Set converting state
      setIsConverting(true)
      // Also update the global context
      setGlobalIsConverting(true)

      // Important: Save the previous currency for conversion reference
      const fromCurrency = prevCurrency.current;

      const convertCurrency = async () => {
        try {
          // 1. Fetch currency exchange rates - ALWAYS do this to ensure we have the latest rates
          const currencyStore = useCurrencyStore.getState();
          await currencyStore.fetchRates(currency);

          // 2. Create a function to convert values that's idempotent 
          // (can be called multiple times without changing result)
          const convertValue = (value: number, originalCurrency = fromCurrency) => {
            if (!value || typeof value !== 'number' || !isFinite(value)) return 0;

            // CRITICAL: Always convert directly from original currency to target currency
            // This makes the operation idempotent - running it multiple times produces same result
            return roundCurrency(currencyStore.convertAmount(
              value,
              originalCurrency,
              currency
            ));
          };

          // 3. Get the Zakat store to update its values
          const zakatStore = useZakatStore.getState();

          // 4. CRITICAL: Set the store's currency FIRST to prevent subsequent conversions
          if (typeof zakatStore.setCurrency === 'function') {
            zakatStore.setCurrency(currency);
          }

          // 5. Convert cash values
          if (zakatStore.cashValues) {
            if (typeof zakatStore.updateCashValues === 'function') {
              // If there's a dedicated method to update all cash values at once, use it
              // CRITICAL: Always use the fromCurrency as the source currency for conversion
              const convertedCashValues = Object.entries(zakatStore.cashValues).reduce((acc, [key, value]) => {
                if (key !== 'foreign_currency_entries' && typeof value === 'number') {
                  acc[key] = convertValue(value, fromCurrency);
                } else if (key === 'foreign_currency_entries' && Array.isArray(value)) {
                  // Handle foreign currency entries
                  acc[key] = value.map((entry: { currency: string; amount: number }) => {
                    if (entry.currency === fromCurrency) {
                      return {
                        ...entry,
                        amount: convertValue(entry.amount, fromCurrency),
                        currency: currency // Update the currency too
                      };
                    }
                    return entry;
                  });
                } else {
                  acc[key] = value;
                }
                return acc;
              }, {} as Record<string, any>);

              zakatStore.updateCashValues(convertedCashValues);
            } else {
              // Process individual cash values if no bulk update method
              const numericFields: Record<string, number> = {};

              // First process all numeric fields
              Object.entries(zakatStore.cashValues).forEach(([key, value]) => {
                if (key !== 'foreign_currency_entries' && typeof value === 'number') {
                  numericFields[key] = convertValue(value, fromCurrency);
                }
              });

              // Update numeric fields
              Object.entries(numericFields).forEach(([key, value]) => {
                zakatStore.setCashValue(key as keyof CashValues, value);
              });

              // Process foreign currency entries separately
              if (Array.isArray(zakatStore.cashValues.foreign_currency_entries)) {
                const updatedEntries = zakatStore.cashValues.foreign_currency_entries.map(
                  (entry: { currency: string; amount: number }) => {
                    if (entry.currency === fromCurrency) {
                      return {
                        ...entry,
                        amount: convertValue(entry.amount, fromCurrency),
                        currency: currency
                      };
                    }
                    return entry;
                  }
                );

                // Update entries in store
                zakatStore.setCashValue('foreign_currency_entries', updatedEntries);

                // Update total foreign currency value
                const totalForeignCurrency = updatedEntries.reduce((sum: number, entry) => {
                  if (entry.currency === currency) {
                    return sum + entry.amount;
                  }
                  return sum + (currencyStore.convertAmount(entry.amount, entry.currency, currency) || 0);
                }, 0);

                zakatStore.setCashValue('foreign_currency', totalForeignCurrency);
              }
            }
          }

          // 7. Update stock prices
          // This should be AFTER the currency is updated to prevent circular conversions
          if (Array.isArray(zakatStore.stockValues?.activeStocks) && zakatStore.stockValues.activeStocks.length > 0) {
            console.log('Dashboard - Updating stock prices for currency change')
            try {
              // Call the updateStockPrices function with both target and source currency
              if (typeof zakatStore.updateStockPrices === 'function') {
                // IMPORTANT: Pass both the target currency and source currency
                console.log(`Dashboard - Calling updateStockPrices with target=${currency}, source=${fromCurrency}`);
                await zakatStore.updateStockPrices(currency, fromCurrency)
                console.log(`Dashboard - Successfully updated stock prices to ${currency}`)

                // Show success toast for stocks
                toast({
                  title: "Stock Prices Updated",
                  description: `Stock prices updated to ${currency}`,
                  variant: "default"
                })
              } else {
                console.warn('Dashboard - updateStockPrices function not available')
              }
            } catch (error) {
              console.error('Dashboard - Failed to update stock prices:', error)

              // Show warning toast
              toast({
                title: "Stock Price Update Failed",
                description: "Could not fetch current stock prices. Will use converted values instead.",
                variant: "destructive"
              })

              // Fall back to manual conversion for active stocks if API call fails
              if (Array.isArray(zakatStore.stockValues?.activeStocks)) {
                type StockType = {
                  symbol: string
                  shares: number
                  currentPrice: number
                  marketValue: number
                  zakatDue: number
                  currency?: string
                }

                const updatedStocks = zakatStore.stockValues.activeStocks.map((stock: StockType) => {
                  if (typeof stock.currentPrice === 'number') {
                    // Get the source currency - either from the stock or use the dashboard's previous currency
                    const sourceCurrency = stock.currency || fromCurrency || 'USD';

                    // If the stock already has the target currency, no need to convert
                    if (sourceCurrency === currency) {
                      return stock;
                    }

                    // Use the currency store to convert the price
                    const convertedPrice = convertValue(stock.currentPrice, sourceCurrency)
                    const marketValue = stock.shares * convertedPrice

                    // Log the conversion for debugging
                    console.log(`Converting stock ${stock.symbol} from ${sourceCurrency} to ${currency}: ${stock.currentPrice} → ${convertedPrice}`);

                    return {
                      ...stock,
                      currentPrice: convertedPrice,
                      marketValue,
                      zakatDue: marketValue * 0.025, // 2.5% zakat rate
                      currency: currency,
                      sourceCurrency: sourceCurrency // Track the original currency
                    }
                  }
                  return stock
                })

                // Custom approach to update the stocks in the store
                // First check if we can use a custom update function
                if (typeof (zakatStore as any).updateActiveStocks === 'function') {
                  (zakatStore as any).updateActiveStocks(updatedStocks);
                } else {
                  // Use internal Zustand setter (unsafe but works)
                  const internalSet = (zakatStore as any).setState;
                  if (typeof internalSet === 'function') {
                    internalSet((state: any) => ({
                      stockValues: {
                        ...state.stockValues,
                        activeStocks: updatedStocks
                      }
                    }));
                  } else {
                    console.warn('Unable to update active stocks - no appropriate method available');
                  }
                }

                console.log('Dashboard - Applied fallback conversion for stocks')
              }
            }
          }

          // 8. Convert crypto values
          if (zakatStore.cryptoValues && Array.isArray(zakatStore.cryptoValues.coins)) {
            // For crypto, we should check if there's a dedicated update method like stocks
            if (typeof zakatStore.updateCryptoPrices === 'function') {
              // Use the dedicated method to update prices without duplication
              // Pass both currencies for proper conversion
              console.log(`Dashboard - Using dedicated updateCryptoPrices method to convert from ${fromCurrency} to ${currency}`);

              // IMPORTANT: Make sure we're passing both currencies correctly
              try {
                zakatStore.updateCryptoPrices(currency, fromCurrency);
                console.log(`Dashboard - Successfully converted crypto prices from ${fromCurrency} to ${currency}`);

                // Show success toast for crypto
                toast({
                  title: "Crypto Prices Updated",
                  description: `Crypto prices updated to ${currency}`,
                  variant: "default"
                });
              } catch (error) {
                console.error('Dashboard - Error updating crypto prices:', error);
                toast({
                  title: "Crypto Price Update Failed",
                  description: "Could not update crypto prices. Using fallback conversion.",
                  variant: "destructive"
                });
              }
            } else {
              // Fallback to the previous approach only if no dedicated method exists
              console.log(`Dashboard - Using fallback method to convert crypto from ${fromCurrency} to ${currency}`);
              const updatedCoins = zakatStore.cryptoValues.coins.map((coin: {
                symbol: string;
                quantity: number;
                currentPrice: number;
                marketValue: number;
                zakatDue: number;
                currency?: string;
              }) => {
                // Get the source currency - either from the coin or use the dashboard's previous currency
                const sourceCurrency = coin.currency || fromCurrency || 'USD';

                // If the coin already has the target currency, no need to convert
                if (sourceCurrency === currency) {
                  return coin;
                }

                // Convert the values using the currency store
                const convertedPrice = convertValue(coin.currentPrice, sourceCurrency);
                const convertedMarketValue = convertValue(coin.marketValue, sourceCurrency);
                const convertedZakatDue = convertValue(coin.zakatDue, sourceCurrency);

                // Log the conversion for debugging
                console.log(`Converting crypto ${coin.symbol} from ${sourceCurrency} to ${currency}: ${coin.currentPrice} → ${convertedPrice}`);

                return {
                  ...coin,
                  currentPrice: convertedPrice,
                  marketValue: convertedMarketValue,
                  zakatDue: convertedZakatDue,
                  currency: currency,
                  sourceCurrency: sourceCurrency // Track the original currency
                };
              });

              // Remove all current coins
              updatedCoins.forEach((coin: { symbol: string; quantity: number }) => {
                if (typeof zakatStore.removeCoin === 'function') {
                  zakatStore.removeCoin(coin.symbol);
                }
              });

              // Add back each coin with updated prices
              // This is not optimal but ensures the store is properly updated
              updatedCoins.forEach((coin: { symbol: string; quantity: number }) => {
                if (typeof zakatStore.addCoin === 'function') {
                  zakatStore.addCoin(coin.symbol, coin.quantity);
                }
              });
            }
          }

          // 9. Convert real estate values - use a single update method if available
          if (zakatStore.realEstateValues) {
            if (typeof zakatStore.updateRealEstateValues === 'function') {
              // Use a single update method if available
              const convertedValues = Object.entries(zakatStore.realEstateValues).reduce((acc, [key, value]) => {
                if (typeof value === 'number') {
                  acc[key] = convertValue(value, fromCurrency);
                } else {
                  acc[key] = value;
                }
                return acc;
              }, {} as Record<string, any>);

              zakatStore.updateRealEstateValues(convertedValues);
            } else {
              // Otherwise, update properties individually, which is safer than bulk updates
              Object.entries(zakatStore.realEstateValues).forEach(([key, value]) => {
                if (typeof value === 'number' && typeof zakatStore.setRealEstateValue === 'function') {
                  zakatStore.setRealEstateValue(key as keyof RealEstateValues, convertValue(value, fromCurrency));
                }
              });
            }
          }

          // 10. Convert retirement values - use a single update method if available
          if (zakatStore.retirement) {
            if (typeof zakatStore.updateRetirementValues === 'function') {
              // Use a single update method if available
              const convertedValues = Object.entries(zakatStore.retirement).reduce((acc, [key, value]) => {
                if (typeof value === 'number') {
                  acc[key] = convertValue(value, fromCurrency);
                } else {
                  acc[key] = value;
                }
                return acc;
              }, {} as Record<string, any>);

              zakatStore.updateRetirementValues(convertedValues);
            } else {
              // Otherwise, update properties individually, which is safer than bulk updates
              Object.entries(zakatStore.retirement).forEach(([key, value]) => {
                if (typeof value === 'number' && typeof zakatStore.setRetirementValue === 'function') {
                  zakatStore.setRetirementValue(key as keyof RetirementValues, convertValue(value, fromCurrency));
                }
              });
            }
          }

          // 9. Explicitly update nisab values to ensure they're correctly converted
          console.log('Dashboard - Triggering nisab refresh for new currency');
          try {
            // Use forceRefreshNisabForCurrency if available (preferred for currency changes)
            if (typeof zakatStore.forceRefreshNisabForCurrency === 'function') {
              const refreshSuccess = await zakatStore.forceRefreshNisabForCurrency(currency);
              console.log(`Dashboard - Nisab refresh ${refreshSuccess ? 'successful' : 'failed'}`);

              // If we have an onNisabUpdated callback, call it with the new threshold
              if (refreshSuccess && onNisabUpdated && typeof onNisabUpdated === 'function') {
                const nisabStatus = zakatStore.getNisabStatus();
                onNisabUpdated(nisabStatus.nisabValue);
              }
            } else {
              // Fallback to standard fetch if specific currency refresh not available
              await zakatStore.fetchNisabData();
              console.log('Dashboard - Standard nisab refresh completed');
            }
          } catch (error) {
            console.error('Dashboard - Error updating nisab values:', error);
            // Don't show a toast for this error as it's not critical
          }

          // After all conversions, trigger global recalculations and updates
          try {
            // Update UI state for total and zakatable amounts
            // Note: Let dashboard component handle this part
          } catch (error) {
            console.error('Error recalculating asset totals after currency conversion:', error);
          }

          // Update currency in the Zakat store
          if (typeof zakatStore.setCurrency === 'function') {
            zakatStore.setCurrency(currency);
          }

          // Also fetch new nisab threshold
          const response = await fetch(`/api/nisab?currency=${currency}`);
          if (!response.ok) throw new Error('Failed to fetch nisab');
          const data = await response.json();
          console.log('Fetched nisab data:', data);

          // Call the callback if provided
          if (onNisabUpdated && typeof onNisabUpdated === 'function') {
            onNisabUpdated(data.nisabThreshold);
          }

          // Also update nisab in the Zakat store if needed
          if (zakatStore.fetchNisabData && typeof zakatStore.fetchNisabData === 'function') {
            console.log(`Dashboard: Refreshing nisab data in store for currency ${currency}`);
            try {
              // IMPORTANT: Check if we're already fetching to avoid duplicate calls
              if (!zakatStore.isFetchingNisab) {
                // Force a refresh of the nisab data in the store
                await zakatStore.fetchNisabData();

                // After refreshing, force a recalculation of the nisab status
                if (typeof zakatStore.getNisabStatus === 'function') {
                  const updatedNisabStatus = zakatStore.getNisabStatus();
                  console.log('Dashboard: Updated nisab status after currency change:', {
                    meetsNisab: updatedNisabStatus.meetsNisab,
                    thresholds: updatedNisabStatus.thresholds,
                    currency: updatedNisabStatus.currency,
                    targetCurrency: currency
                  });
                }
              } else {
                console.log('Dashboard: Skipping duplicate nisab fetch - already in progress');
              }
            } catch (error) {
              console.error('Dashboard: Failed to refresh nisab data in store:', error);
            }
          }

          // After all conversions, save the conversion record to prevent duplicate conversions
          const newConversionRecord = {
            from: fromCurrency,
            to: currency,
            timestamp: Date.now()
          };

          prevConversionRef.current = newConversionRecord;
          localStorage.setItem('currency-conversion-record', JSON.stringify(newConversionRecord));

          // Show success message
          toast({
            title: "Currency converted",
            description: `Values have been converted from ${fromCurrency} to ${currency}`,
          });
        } catch (error) {
          console.error('Error converting currency:', error);
          toast({
            title: "Currency conversion failed",
            description: "There was an error converting your values. Values remain unchanged.",
            variant: "destructive"
          });
        } finally {
          setIsConverting(false);
          // Also update the global context
          setGlobalIsConverting(false);
          // Ensure prevCurrency is updated even if there was an error
          prevCurrency.current = currency;
        }
      };

      convertCurrency();
    }
  }, [currency, isHydrated, setGlobalIsConverting, onNisabUpdated]);

  // Add debug and emergency mechanism to fix any currency inconsistencies
  useEffect(() => {
    // Only run on client and after hydration
    if (!isHydrated) return;

    // Get the current state from the Zakat store
    const zakatStore = useZakatStore.getState();

    // Check if metalPrices exists and has a currency
    if (zakatStore.metalPrices && zakatStore.metalPrices.currency) {
      // If the currency doesn't match the dashboard currency
      if (zakatStore.metalPrices.currency !== currency) {
        console.warn('Currency inconsistency detected in Dashboard:', {
          dashboardCurrency: currency,
          metalPricesCurrency: zakatStore.metalPrices.currency
        });

        // If we're not in the middle of a conversion
        if (!isConverting) {
          console.log('Attempting emergency currency fix in Dashboard');
        }
      }
    }
  }, [isHydrated, currency, isConverting]);

  // Return what's needed from this hook
  return {
    isConverting,
    setIsConverting,
    prevCurrency: prevCurrency.current
  };
}