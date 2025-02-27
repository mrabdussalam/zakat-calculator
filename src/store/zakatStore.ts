import { create } from 'zustand'
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware'
import { ZakatState } from './types'
import { createCashSlice } from './modules/cash'
import { createMetalsSlice } from './modules/metals'
import { createStocksSlice } from './modules/stocks'
import { createNisabSlice } from './modules/nisab'
import { createRetirementSlice } from './modules/retirement'
import { createRealEstateSlice } from './modules/realEstate'
import { createCryptoSlice } from './modules/crypto'
import { DEFAULT_HAWL_STATUS } from './constants'

// Initial state
const initialState: Partial<ZakatState> = {
  currency: 'USD', // Default currency
  metalsValues: {
    gold_regular: 0,
    gold_occasional: 0,
    gold_investment: 0,
    silver_regular: 0,
    silver_occasional: 0,
    silver_investment: 0
  },
  cashValues: {
    cash_on_hand: 0,
    checking_account: 0,
    savings_account: 0,
    digital_wallets: 0,
    foreign_currency: 0,
    foreign_currency_entries: []
  },
  stockValues: {
    // Remove or comment out properties that don't exist in StockValues interface
    /* active_shares: 0,
    active_price_per_share: 0,
    passive_shares: 0,
    company_cash: 0,
    company_receivables: 0,
    company_inventory: 0,
    total_shares_issued: 0, */

    // Only include properties that are defined in StockValues
    activeStocks: [],
    market_value: 0,
    zakatable_value: 0,
    total_dividend_earnings: 0,
    fund_value: 0,
    is_passive_fund: false,
  },
  retirement: {
    traditional_401k: 0,
    traditional_ira: 0,
    roth_401k: 0,
    roth_ira: 0,
    pension: 0,
    other_retirement: 0
  },
  realEstateValues: {
    primary_residence_value: 0,
    rental_income: 0,
    rental_expenses: 0,
    property_for_sale_value: 0,
    property_for_sale_active: false,
    vacant_land_value: 0,
    vacant_land_sold: false,
    sale_price: 0
  },
  cryptoValues: {
    coins: [],
    total_value: 0,
    zakatable_value: 0
  },
  cashHawlMet: DEFAULT_HAWL_STATUS.cash,
  metalsHawlMet: DEFAULT_HAWL_STATUS.metals,
  stockHawlMet: DEFAULT_HAWL_STATUS.stocks,
  retirementHawlMet: DEFAULT_HAWL_STATUS.retirement,
  realEstateHawlMet: DEFAULT_HAWL_STATUS.real_estate,
  cryptoHawlMet: DEFAULT_HAWL_STATUS.crypto
}

// ENHANCEMENT: Create a proper hydration function that ensures data from localStorage is loaded correctly
const hydratePersistedData = (persistedState: any, initialState: Partial<ZakatState>) => {
  if (!persistedState) return initialState;

  // Log the hydration process
  console.log('Hydrating store with persisted data');

  // Deep merge the persisted state with initial state to ensure all fields exist
  return {
    ...initialState,
    ...persistedState,
    // Ensure these objects are properly hydrated with all their properties
    metalsValues: {
      ...initialState.metalsValues,
      ...persistedState.metalsValues
    },
    cashValues: {
      ...initialState.cashValues,
      ...persistedState.cashValues
    },
    stockValues: {
      ...initialState.stockValues,
      ...persistedState.stockValues
    },
    retirement: {
      ...initialState.retirement,
      ...persistedState.retirement
    },
    realEstateValues: {
      ...initialState.realEstateValues,
      ...persistedState.realEstateValues
    },
    cryptoValues: {
      ...initialState.cryptoValues,
      ...persistedState.cryptoValues
    },
    nisabData: persistedState.nisabData,
    metalPrices: persistedState.metalPrices
  };
};

// Create the store
export const useZakatStore = create<ZakatState>()(
  persist(
    (set, get, store) => {
      // Create slices
      const cashSlice = createCashSlice(set, get, store)
      const metalsSlice = createMetalsSlice(set, get, store)
      const stocksSlice = createStocksSlice(set, get, store)
      const retirementSlice = createRetirementSlice(set, get, store)
      const realEstateSlice = createRealEstateSlice(set, get, store)
      const cryptoSlice = createCryptoSlice(set, get, store)
      const nisabSlice = createNisabSlice(set, get, store)

      return {
        ...initialState,
        ...cashSlice,
        ...metalsSlice,
        ...stocksSlice,
        ...retirementSlice,
        ...realEstateSlice,
        ...cryptoSlice,
        ...nisabSlice,

        // Reset all slices
        reset: () => {
          console.log('Performing full reset of zakat store state')

          // First, get the current state to preserve any settings we want to keep
          const currentState = get();

          // Extract values we want to preserve (if any)
          const { metalPrices, currency } = currentState;

          // Set the state to initial values
          set({
            ...initialState,
            // Preserve metal prices (if any) to avoid currency issues
            metalPrices: metalPrices,
            // Preserve currency if available
            currency: currency || initialState.currency
          });

          // Then, call individual reset functions with small delays to ensure they're processed
          setTimeout(() => cashSlice.resetCashValues?.(), 10)
          setTimeout(() => metalsSlice.resetMetalsValues?.(), 20)
          setTimeout(() => stocksSlice.resetStockValues?.(), 30)
          setTimeout(() => retirementSlice.resetRetirement?.(), 40)
          setTimeout(() => realEstateSlice.resetRealEstateValues?.(), 50)
          setTimeout(() => cryptoSlice.resetCryptoValues?.(), 60)

          // Update localStorage properly without removing the structure
          try {
            // Get the store's key
            const storeKey = 'zakat-store'

            // Load existing store to preserve version/structure
            const existing = localStorage.getItem(storeKey)

            if (existing) {
              const parsed = JSON.parse(existing)

              // Create an empty state with the proper structure - use initialState directly
              const emptyState = {
                metalsValues: initialState.metalsValues,
                cashValues: initialState.cashValues,
                stockValues: initialState.stockValues,
                retirement: initialState.retirement,
                realEstateValues: initialState.realEstateValues,
                // These other properties will be included or omitted based on whether they're in initialState
                ...('cryptoValues' in initialState ? { cryptoValues: initialState.cryptoValues } : {}),
                cashHawlMet: initialState.cashHawlMet,
                metalsHawlMet: initialState.metalsHawlMet,
                stockHawlMet: initialState.stockHawlMet,
                retirementHawlMet: initialState.retirementHawlMet,
                realEstateHawlMet: initialState.realEstateHawlMet,
                ...('cryptoHawlMet' in initialState ? { cryptoHawlMet: initialState.cryptoHawlMet } : {}),
                // Preserve metal prices for currency consistency
                metalPrices: metalPrices
              };

              // Preserve store structure but reset state
              localStorage.setItem(storeKey, JSON.stringify({
                ...parsed,
                state: emptyState
              }));

              console.log('Successfully reset localStorage state with structure preserved')
            }
          } catch (error) {
            console.error('Error updating localStorage during reset:', error)
          }

          // Always dispatch the custom event, even if localStorage update fails
          if (typeof window !== 'undefined') {
            try {
              const resetEvent = new CustomEvent('zakat-store-reset', {
                detail: { timestamp: new Date().getTime() }
              });
              window.dispatchEvent(resetEvent);
              console.log('Dispatched zakat-store-reset event');
            } catch (eventError) {
              console.error('Failed to dispatch reset event:', eventError);
            }
          }
        },

        // Set currency and update related data
        setCurrency: (newCurrency) => {
          console.log('Setting currency to:', newCurrency);

          const currentState = get();
          const currentCurrency = currentState.currency;

          // Skip if the currency is the same
          if (newCurrency === currentCurrency) {
            console.log('Currency already set to', newCurrency);
            return;
          }

          // Update the currency in the store
          set({ currency: newCurrency });

          // Update metal prices for the new currency
          try {
            // Check if we need to update metal prices (if they exist)
            if (currentState.metalPrices) {
              console.log('Updating metal prices for new currency:', newCurrency);
              get().updateMetalPricesForNewCurrency(newCurrency);
            }

            // ENHANCEMENT: Force immediate nisab update instead of waiting
            console.log('Forcing immediate nisab update for new currency:', newCurrency);

            // First, attempt to invalidate any cached nisab data to force recalculation
            set(state => ({
              ...state,
              // Setting to undefined forces a fresh calculation
              nisabData: undefined
            }));

            // Then immediately request new nisab data
            if (typeof currentState.forceRefreshNisabForCurrency === 'function') {
              // Use setTimeout to ensure this happens after the state update
              setTimeout(() => {
                console.log('Triggering nisab refresh for new currency:', newCurrency);
                get().forceRefreshNisabForCurrency(newCurrency)
                  .then(() => {
                    console.log('Nisab data refreshed successfully for:', newCurrency);

                    // Force a recalculation of all calculator totals to update UI
                    // This ensures all components re-render with new currency values
                    if (typeof get().getNisabStatus === 'function') {
                      get().getNisabStatus();
                    }

                    // ENHANCEMENT: Force UI refresh for all calculators
                    // Create a synthetic state update to trigger component re-renders
                    const currentState = get();
                    // Temporarily modify and restore a property to force state update
                    // without adding new properties
                    const originalCurrency = currentState.currency;

                    // First update with temporary value
                    set({ currency: `${originalCurrency}_refresh` });

                    // Then immediately restore to trigger subscribers
                    setTimeout(() => {
                      set({ currency: originalCurrency });
                    }, 0);
                  })
                  .catch(err => console.error('Error during immediate nisab refresh:', err));
              }, 0);
            }

            // Dispatch currency change event
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('currency-changed', {
                detail: {
                  oldCurrency: currentCurrency,
                  newCurrency: newCurrency,
                  timestamp: Date.now(),
                  immediate: true  // Flag indicating this should trigger immediate UI updates
                }
              }));

              // ENHANCEMENT: Dispatch a specific event for calculators to force refresh
              window.dispatchEvent(new CustomEvent('calculator-values-refresh', {
                detail: {
                  currency: newCurrency,
                  timestamp: Date.now()
                }
              }));
            }
          } catch (error) {
            console.error('Error handling currency change:', error);
          }
        },

        // Helper function to update metal prices for a new currency
        updateMetalPricesForNewCurrency: (newCurrency) => {
          try {
            // First, get the current state
            const prevState = get();

            // Log current metal prices
            console.log('Current metal prices:', prevState.metalPrices);

            // Create a specific handler for metal prices
            // First, use our existing price data but update the currency
            // This provides an immediate UI update with the current prices
            // converted to the new currency
            const currentPrices = prevState.metalPrices;

            console.log('Setting temporary metal prices for immediate UI update:', {
              gold: currentPrices.gold,
              silver: currentPrices.silver,
              currency: newCurrency
            });

            // Call setMetalPrices directly with existing values but new currency
            get().setMetalPrices({
              gold: currentPrices.gold,
              silver: currentPrices.silver,
              currency: newCurrency,
              lastUpdated: new Date(),
              isCache: true // Mark as cache so we know to refresh
            });

            // Dispatch metals-updated event after the immediate update
            const immediateEvent = new CustomEvent('metals-updated', {
              detail: {
                currency: newCurrency,
                immediate: true
              }
            });
            window.dispatchEvent(immediateEvent);

            // Now fetch the latest prices in the new currency
            console.log('Fetching fresh metal prices for new currency:', newCurrency);

            // Try to fetch new prices with the currency
            try {
              // Implement API call to fetch fresh metal prices with the new currency
              // For example:
              fetch(`/api/prices/metals?currency=${newCurrency}&refresh=true`)
                .then(response => response.json())
                .then(data => {
                  // Update the store with fresh metal prices
                  get().setMetalPrices({
                    gold: data.gold,
                    silver: data.silver,
                    currency: newCurrency,
                    lastUpdated: new Date(data.lastUpdated || Date.now()),
                    isCache: false,
                    source: data.source
                  });

                  // Dispatch another event after we've updated with fresh data
                  const freshEvent = new CustomEvent('metals-updated', {
                    detail: {
                      currency: newCurrency,
                      immediate: false
                    }
                  });
                  window.dispatchEvent(freshEvent);

                  console.log('Updated metal prices with fresh data:', data);
                })
                .catch(error => {
                  console.error('Failed to fetch fresh metal prices:', error);
                  // We already updated with the converted values, so the UI is still correct
                });
            } catch (fetchError) {
              console.error('Failed to initiate fetch for fresh metal prices:', fetchError);
              // We already updated with the converted values, so the UI is still correct
            }
          } catch (error) {
            console.error('Error updating metal prices for currency change:', error);
          }
        },

        // Reset with currency change - completely resets state but preserves the currency
        resetWithCurrencyChange: (newCurrency) => {
          console.log('Resetting application state with new currency:', newCurrency);

          try {
            // First, preserve the currency but reset everything else
            const prevState = get();

            // Create a specific handler for metal prices
            const updateMetalPricesForCurrency = async () => {
              try {
                // Use our existing implementation
                get().updateMetalPricesForNewCurrency(newCurrency);
                return true;
              } catch (error) {
                console.error('Error updating metal prices for currency change:', error);
                return false;
              }
            };

            // Now we need to handle resetting the state
            // We want to keep the metalPrices and reset everything else

            // First, gather what we want to keep
            const metalPrices = prevState.metalPrices;

            // Also keep any nisab data if possible
            const nisabData = prevState.nisabData;

            // Now reset
            set((state) => ({
              ...initialState,
              currency: newCurrency,
              metalPrices: {
                ...metalPrices,
                currency: newCurrency
              },
              // Don't clear the nisab data if currency matches
              nisabData: nisabData?.currency === newCurrency ? nisabData : undefined
            }));

            // Make sure the Hawl status is reset too
            set({
              cashHawlMet: DEFAULT_HAWL_STATUS.cash,
              metalsHawlMet: DEFAULT_HAWL_STATUS.metals,
              stockHawlMet: DEFAULT_HAWL_STATUS.stocks,
              retirementHawlMet: DEFAULT_HAWL_STATUS.retirement,
              realEstateHawlMet: DEFAULT_HAWL_STATUS.real_estate,
              cryptoHawlMet: DEFAULT_HAWL_STATUS.crypto
            });

            // Also reset the slices
            cashSlice.resetCashValues?.();
            metalsSlice.resetMetalsValues?.();
            stocksSlice.resetStockValues?.();
            retirementSlice.resetRetirement?.();
            realEstateSlice.resetRealEstateValues?.();
            cryptoSlice.resetCryptoValues?.();

            // Set the new currency in localStorage
            try {
              localStorage.setItem('zakat-currency', newCurrency);
            } catch (error) {
              console.error('Failed to store currency in localStorage:', error);
            }

            // Update metal prices immediately and in the background
            updateMetalPricesForCurrency();

            // Dispatch a currency-changed event for other parts of the app
            const event = new CustomEvent('currency-changed', {
              detail: { from: prevState.metalPrices.currency, to: newCurrency }
            });
            window.dispatchEvent(event);

            return true;
          } catch (error) {
            console.error('Failed to reset with currency change:', error);
            return false;
          }
        },

        // Reset all calculators when currency changes
        // This is a specialized version of reset that focuses on clearing data
        // without resetting other user preferences
        resetAllCalculators: () => {
          // Check if this is during initial page load
          const isInitialPageLoad = typeof window !== 'undefined' &&
            // @ts-ignore - custom property added to window
            window.isInitialPageLoad === true;

          // Check if this is a page refresh rather than an explicit user action
          const isPageRefresh = typeof window !== 'undefined' &&
            !isInitialPageLoad && // Not initial load
            !document.hasFocus(); // Not focused - likely a refresh

          console.log('Resetting all calculators. Initial page load?', isInitialPageLoad, 'Page refresh?', isPageRefresh);

          // If this is a page refresh, don't reset calculator values to preserve user data
          if (isPageRefresh) {
            console.log('Page refresh detected - preserving calculator values');

            // Get current state to preserve values
            const currentState = get();

            // Dispatch event to refresh currency display without resetting values
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('currency-display-refresh', {
                detail: {
                  currency: currentState.currency,
                  timestamp: Date.now(),
                  isPageRefresh: true // Flag to indicate this is a page refresh
                }
              }));
            }

            return; // Exit without resetting values
          }

          // Reset all calculator values in the store
          set((state) => ({
            // Reset metals values
            metalsValues: {
              gold_regular: 0,
              gold_occasional: 0,
              gold_investment: 0,
              silver_regular: 0,
              silver_occasional: 0,
              silver_investment: 0
            },
            // Reset cash values
            cashValues: {
              cash_on_hand: 0,
              checking_account: 0,
              savings_account: 0,
              digital_wallets: 0,
              foreign_currency: 0,
              foreign_currency_entries: []
            },
            // Reset stock values
            stockValues: {
              ...state.stockValues,
              activeStocks: [],
              market_value: 0,
              zakatable_value: 0,
              total_dividend_earnings: 0,
              fund_value: 0,
              is_passive_fund: false,
            },
            // Reset real estate values
            realEstateValues: {
              primary_residence_value: 0,
              rental_income: 0,
              rental_expenses: 0,
              property_for_sale_value: 0,
              property_for_sale_active: false,
              vacant_land_value: 0,
              vacant_land_sold: false,
              sale_price: 0
            },
            // Reset crypto values
            cryptoValues: {
              coins: [],
              total_value: 0,
              zakatable_value: 0
            },
            // Reset retirement values
            retirement: {
              traditional_401k: 0,
              traditional_ira: 0,
              roth_401k: 0,
              roth_ira: 0,
              pension: 0,
              other_retirement: 0
            }
          }));

          // If this is not an initial page load, dispatch the reset event
          if (!isInitialPageLoad) {
            if (typeof window !== 'undefined') {
              console.log('Dispatching store-reset event for component state clearing');
              window.dispatchEvent(new CustomEvent('store-reset', {
                detail: {
                  timestamp: Date.now(),
                  isInitialPageLoad: false,
                  source: 'resetAllCalculators'
                }
              }));
            }
          }
        },

        // Get complete breakdown
        getBreakdown: () => {
          const state = get()
          const totalValue =
            state.getTotalCash() +
            state.getTotalMetals().total +
            state.getTotalStocks() +
            state.getRetirementTotal() +
            state.getRealEstateTotal() +
            state.getTotalCrypto()

          const zakatableValue =
            state.getTotalZakatableCash() +
            state.getTotalZakatableMetals().total +
            state.getTotalZakatableStocks() +
            state.getRetirementZakatable() +
            state.getRealEstateZakatable() +
            state.getTotalZakatableCrypto()

          return {
            cash: state.getCashBreakdown(),
            metals: state.getMetalsBreakdown(),
            stocks: state.getStocksBreakdown(),
            retirement: state.getRetirementBreakdown(),
            realEstate: state.getRealEstateBreakdown(),
            crypto: state.getCryptoBreakdown(),
            combined: {
              totalValue,
              zakatableValue,
              zakatDue: zakatableValue * 0.025,
              meetsNisab: state.getNisabStatus()
            }
          }
        }
      }
    },
    {
      name: 'zakat-store',
      version: 1,
      // Add safe storage for Next.js with SSR
      storage: typeof window !== 'undefined'
        ? createJSONStorage(() => ({
          getItem: (name) => {
            try {
              const data = localStorage.getItem(name);
              if (!data) return null;

              // Try to parse the data
              const parsed = JSON.parse(data);

              // If we need to validate the data, do it here
              console.log(`Retrieved store "${name}" from localStorage`);
              return data;
            } catch (error) {
              console.error(`Error getting item "${name}" from localStorage:`, error);
              return null;
            }
          },
          setItem: (name, value) => {
            try {
              localStorage.setItem(name, value);
              console.log(`Saved store "${name}" to localStorage`);
            } catch (error) {
              console.error(`Error setting item "${name}" in localStorage:`, error);
            }
          },
          removeItem: (name) => {
            try {
              localStorage.removeItem(name);
            } catch (error) {
              console.error(`Error removing item "${name}" from localStorage:`, error);
            }
          }
        }))
        : {
          getItem: () => Promise.resolve(null),
          setItem: () => Promise.resolve(),
          removeItem: () => Promise.resolve()
        },
      partialize: (state) => {
        // Only persist these values to localStorage
        const {
          metalsValues,
          cashValues,
          stockValues,
          retirement,
          realEstateValues,
          cryptoValues,
          cashHawlMet,
          metalsHawlMet,
          stockHawlMet,
          retirementHawlMet,
          realEstateHawlMet,
          cryptoHawlMet,
          metalPrices,
          nisabData
        } = state as ZakatState;

        return {
          metalsValues,
          cashValues,
          stockValues,
          retirement,
          realEstateValues,
          cryptoValues,
          cashHawlMet,
          metalsHawlMet,
          stockHawlMet,
          retirementHawlMet,
          realEstateHawlMet,
          cryptoHawlMet,
          metalPrices,
          nisabData
        };
      },
      // ENHANCEMENT: Properly handle hydration with our custom function
      onRehydrateStorage: () => {
        console.log('Starting store rehydration');

        return (state, error) => {
          if (error) {
            console.error('Failed to rehydrate store:', error);
            // Dispatch an error event
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('store-hydration-error', {
                detail: { error, timestamp: Date.now() }
              }));
            }
          } else if (state) {
            console.log('Successfully rehydrated store with state keys:', Object.keys(state || {}));

            // DEBUG: Add verbose logging of hydrated values to diagnose persistence issues
            console.log('HYDRATED STATE VALUES:', {
              metalsValues: state.metalsValues ? 'Present' : 'Missing',
              cashValues: state.cashValues ? 'Present' : 'Missing',
              stockValues: state.stockValues ? 'Present' : 'Missing',
              retirement: state.retirement ? 'Present' : 'Missing',
              realEstateValues: state.realEstateValues ? 'Present' : 'Missing',
              cryptoValues: state.cryptoValues ? 'Present' : 'Missing',
              nisabData: state.nisabData ? 'Present' : 'Missing',
              metalPrices: state.metalPrices ? 'Present' : 'Missing'
            });

            // For page refresh detection to ensure proper rehydration
            if (typeof window !== 'undefined') {
              const lastRefreshTime = localStorage.getItem('last-refresh-time');
              const isPageRefresh = lastRefreshTime && (Date.now() - parseInt(lastRefreshTime)) < 5000;

              if (isPageRefresh) {
                console.log('Page refresh detected during rehydration - ensuring all values are preserved');

                // Re-apply the full state to ensure all values are preserved after refresh
                setTimeout(() => {
                  try {
                    // Get fresh state after initial hydration
                    const currentState = useZakatStore.getState();

                    // If we want to force a complete rehydration, we can update the store here
                    useZakatStore.setState({
                      ...currentState,
                      ...state
                    });

                    console.log('Successfully enforced full state preservation after refresh');
                  } catch (err) {
                    console.error('Error ensuring state preservation after refresh:', err);
                  }
                }, 100);
              }
            }

            // Force a refresh of nisab data if needed but not immediately
            if (state.nisabData && state.metalPrices) {
              console.log('Refreshing nisab data after rehydration');

              // Schedule this after a slight delay to avoid blocking the UI
              setTimeout(() => {
                try {
                  // Get fresh state after hydration
                  const currentState = useZakatStore.getState();

                  // Ensure metalPrices and nisabData have the same currency
                  if (currentState.metalPrices?.currency !== currentState.nisabData?.currency) {
                    if (typeof currentState.forceRefreshNisabForCurrency === 'function') {
                      currentState.forceRefreshNisabForCurrency(currentState.metalPrices.currency)
                        .catch(err => console.error('Error refreshing nisab after hydration:', err));
                    }
                  }
                } catch (err) {
                  console.error('Error in post-hydration nisab refresh:', err);
                }
              }, 1000);
            }

            // Dispatch successful hydration event
            if (typeof window !== 'undefined') {
              // Set a flag that other components can check
              // @ts-ignore - This is a custom property we're adding to window
              window.hasDispatchedHydrationEvent = true;

              // Dispatch the event with a small delay to ensure React components are mounted
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('store-hydration-complete', {
                  detail: { timestamp: Date.now() }
                }));
                console.log('Zustand store: Hydration complete event dispatched');
              }, 100);
            }
          } else {
            console.warn('Zustand store: Rehydration completed but no state was recovered');
            // Still dispatch the event so components can initialize with default values
            if (typeof window !== 'undefined') {
              // @ts-ignore - This is a custom property we're adding to window
              window.hasDispatchedHydrationEvent = true;

              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('store-hydration-complete', {
                  detail: { empty: true, timestamp: Date.now() }
                }));
                console.log('Zustand store: Empty hydration complete event dispatched');
              }, 100);
            }
          }
        };
      }
    }
  )
)