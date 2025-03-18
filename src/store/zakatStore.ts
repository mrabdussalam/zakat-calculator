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
import { createDistributionSlice } from './modules/distribution'
import { createDebtSlice } from './modules/debt'
import { DEFAULT_HAWL_STATUS } from './constants'
import { SUPPORTED_CURRENCIES } from '@/lib/utils/currency'

// Add this constant for currency management
const CURRENCY_STORAGE_KEY = 'zakat-currency';

// Add this helper function for currency validation
const validateCurrencyCode = (currencyCode: string): string => {
  // First check if it's a valid 3-letter code
  const isValidFormat = typeof currencyCode === 'string' &&
    /^[A-Z]{3}$/.test(currencyCode.toUpperCase());

  // Then check if it's in our supported currencies
  const isSupported = isValidFormat &&
    Object.keys(SUPPORTED_CURRENCIES).includes(currencyCode.toUpperCase());

  // Return the validated code or USD as fallback
  return isSupported ? currencyCode.toUpperCase() : 'USD';
};

// Add this helper function to get the initial currency
const getInitialCurrency = (): string => {
  try {
    // First check the 'selected-currency' key which is used by the UI components
    const selectedCurrency = localStorage.getItem('selected-currency');
    if (selectedCurrency) {
      const validatedCurrency = validateCurrencyCode(selectedCurrency);
      console.log(`Using selected currency from UI: ${selectedCurrency} → ${validatedCurrency}`);

      // Ensure it's also saved to our canonical storage key for consistency
      try {
        localStorage.setItem(CURRENCY_STORAGE_KEY, validatedCurrency);
      } catch (error) {
        console.error('Failed to synchronize currency in localStorage:', error);
      }

      return validatedCurrency;
    }

    // Then try our canonical storage key
    const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (savedCurrency) {
      const validatedCurrency = validateCurrencyCode(savedCurrency);
      console.log(`Using saved currency from store: ${savedCurrency} → ${validatedCurrency}`);
      return validatedCurrency;
    }

    // Fallback to USD
    console.log('No saved currency found, using default: USD');
    return 'USD';
  } catch (error) {
    console.error('Error getting initial currency:', error);
    return 'USD';
  }
};

// Initial state
const initialState: Partial<ZakatState> = {
  currency: getInitialCurrency(), // Use the helper function
  metalsValues: {
    gold_regular: 0,
    gold_regular_purity: '24K',
    gold_occasional: 0,
    gold_occasional_purity: '24K',
    gold_investment: 0,
    gold_investment_purity: '24K',
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
  debtValues: {
    receivables: 0,
    short_term_liabilities: 0,
    long_term_liabilities_annual: 0,
    receivables_entries: [],
    liabilities_entries: []
  },
  cashHawlMet: DEFAULT_HAWL_STATUS.cash,
  metalsHawlMet: DEFAULT_HAWL_STATUS.metals,
  stockHawlMet: DEFAULT_HAWL_STATUS.stocks,
  retirementHawlMet: DEFAULT_HAWL_STATUS.retirement,
  realEstateHawlMet: DEFAULT_HAWL_STATUS.real_estate,
  cryptoHawlMet: DEFAULT_HAWL_STATUS.crypto,
  debtHawlMet: DEFAULT_HAWL_STATUS.debt
}

// Enhanced hydration function with better error handling and validation
export const hydratePersistedData = (persistedState: any, initialState: any): any => {
  // Safety check for null or undefined persisted state
  if (!persistedState) {
    console.log('No persisted state found, using initial state');
    return initialState;
  }

  try {
    // Create a deep copy of the initial state to avoid mutations
    const baseState = JSON.parse(JSON.stringify(initialState));

    // Log hydration for debugging
    console.log('Hydrating persisted state', {
      hasPersistedState: !!persistedState,
      persistedStateKeys: persistedState ? Object.keys(persistedState) : []
    });

    // Validate persisted state structure before merging
    if (typeof persistedState !== 'object' || persistedState === null) {
      console.error('Invalid persisted state format, using initial state');
      return baseState;
    }

    // Create the merged state with type safety
    const mergedState: any = { ...baseState };

    // Process each top-level key in the initial state
    Object.keys(baseState).forEach(key => {
      // Skip special keys that shouldn't be hydrated from persistence
      if (['version', 'lastUpdated'].includes(key)) {
        return;
      }

      // If the key exists in persisted state, merge it
      if (persistedState[key] !== undefined) {
        // Handle different data types appropriately
        if (typeof baseState[key] === 'object' && baseState[key] !== null &&
          typeof persistedState[key] === 'object' && persistedState[key] !== null) {

          // For objects, do a shallow merge to preserve structure
          mergedState[key] = {
            ...baseState[key],
            ...persistedState[key]
          };

          // Special handling for nested objects that need validation
          if (key === 'metals' || key === 'cash' || key === 'stocks' || key === 'realEstate') {
            // Ensure all required properties exist
            Object.keys(baseState[key]).forEach(subKey => {
              if (mergedState[key][subKey] === undefined) {
                console.warn(`Missing required property ${subKey} in ${key}, restoring from initial state`);
                mergedState[key][subKey] = baseState[key][subKey];
              }
            });
          }
        } else if (Array.isArray(baseState[key]) && Array.isArray(persistedState[key])) {
          // For arrays, use the persisted array but validate items
          mergedState[key] = persistedState[key].map((item: any) => {
            // If array contains objects, ensure they have required properties
            if (typeof item === 'object' && item !== null) {
              const templateItem = baseState[key][0] || {};
              return { ...templateItem, ...item };
            }
            return item;
          });
        } else {
          // For primitive values, use persisted value with type checking
          const expectedType = typeof baseState[key];
          if (typeof persistedState[key] === expectedType) {
            mergedState[key] = persistedState[key];
          } else {
            console.warn(`Type mismatch for ${key}, expected ${expectedType} but got ${typeof persistedState[key]}`);
            mergedState[key] = baseState[key];
          }
        }
      }
    });

    // Add any new keys from the initial state that don't exist in persisted state
    Object.keys(baseState).forEach(key => {
      if (mergedState[key] === undefined) {
        mergedState[key] = baseState[key];
      }
    });

    // Ensure version is always the latest
    mergedState.version = baseState.version;
    mergedState.lastUpdated = new Date().toISOString();

    return mergedState;
  } catch (error) {
    console.error('Error hydrating persisted state:', error);
    return initialState;
  }
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
      const distributionSlice = createDistributionSlice(set, get, store)
      const debtSlice = createDebtSlice(set, get, store)

      return {
        ...initialState,
        ...cashSlice,
        ...metalsSlice,
        ...stocksSlice,
        ...retirementSlice,
        ...realEstateSlice,
        ...cryptoSlice,
        ...nisabSlice,
        ...distributionSlice,
        ...debtSlice,

        // Reset all slices
        reset: () => {
          console.log('Performing full reset of zakat store state')

          // First, get the current state to preserve any settings we want to keep
          const currentState = get();

          // Extract values we want to preserve (if any)
          const { currency } = currentState;

          // Set the state to initial values
          set({
            ...initialState,
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
                // Do not preserve nisab data or metal prices
                nisabData: undefined
              };

              // Preserve store structure but reset state
              localStorage.setItem(storeKey, JSON.stringify({
                ...parsed,
                state: emptyState
              }));

              console.log('Successfully reset localStorage state with structure preserved')
            }
          } catch (error) {
            console.error('Error updating localStorage during reset:', error instanceof Error ? error.message : String(error))
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
              console.error('Failed to dispatch reset event:', eventError instanceof Error ? eventError.message : String(eventError));
            }
          }
        },

        // Set currency and update related data
        setCurrency: (newCurrency) => {
          const validatedCurrency = validateCurrencyCode(newCurrency);
          console.log(`Setting currency: ${newCurrency} → ${validatedCurrency} (validated)`);

          const currentState = get();
          const currentCurrency = currentState.currency;

          // Skip if the currency is the same
          if (validatedCurrency === currentCurrency) {
            console.log('Currency already set to', validatedCurrency);
            return;
          }

          // Update the currency in the store
          set({ currency: validatedCurrency });

          // Ensure the currency is set in localStorage (single source of truth)
          try {
            localStorage.setItem(CURRENCY_STORAGE_KEY, validatedCurrency);
            console.log(`Currency saved to localStorage: ${validatedCurrency}`);
          } catch (error) {
            console.error('Failed to store currency in localStorage:', error);
          }

          // Update metal prices for the new currency
          try {
            // Check if we need to update metal prices (if they exist)
            if (currentState.metalPrices) {
              console.log('Updating metal prices for new currency:', validatedCurrency);
              get().updateMetalPricesForNewCurrency(validatedCurrency);
            }

            // Force immediate nisab update
            console.log('Forcing immediate nisab update for new currency:', validatedCurrency);

            // Invalidate cached nisab data to force recalculation
            set(state => ({
              ...state,
              nisabData: undefined
            }));

            // Then immediately request new nisab data
            if (typeof currentState.forceRefreshNisabForCurrency === 'function') {
              // Use setTimeout to ensure this happens after the state update
              setTimeout(() => {
                console.log('Triggering nisab refresh for new currency:', validatedCurrency);
                get().forceRefreshNisabForCurrency(validatedCurrency)
                  .then(() => {
                    console.log('Nisab data refreshed successfully for:', validatedCurrency);

                    // Force a recalculation of all calculator totals to update UI
                    if (typeof get().getNisabStatus === 'function') {
                      get().getNisabStatus();
                    }

                    // Dispatch a currency-changed event for other parts of the app
                    const event = new CustomEvent('currency-changed', {
                      detail: {
                        from: currentCurrency,
                        to: validatedCurrency,
                        timestamp: Date.now()
                      }
                    });
                    window.dispatchEvent(event);
                  })
                  .catch(error => {
                    console.error('Failed to refresh nisab data:', error);
                  });
              }, 0);
            }
          } catch (error) {
            console.error('Error updating currency-related data:', error);
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

            // IMPORTANT: Immediately update nisab data with the new metal prices
            // This ensures nisab threshold updates instantly with the metal prices
            const updatedPrices = {
              gold: currentPrices.gold,
              silver: currentPrices.silver,
              currency: newCurrency,
              lastUpdated: new Date(),
              isCache: true
            };

            // First try to use the direct update method for immediate updates
            if (typeof get().updateNisabWithPrices === 'function') {
              console.log('Immediately updating nisab with new metal prices (direct method)');
              const success = get().updateNisabWithPrices(updatedPrices);
              console.log('Direct nisab update result:', success ? 'success' : 'failed');

              // If direct update failed, fall back to the refresh method
              if (!success && typeof get().forceRefreshNisabForCurrency === 'function') {
                console.log('Falling back to refresh method for nisab update');
                get().forceRefreshNisabForCurrency(newCurrency)
                  .catch(error => console.error('Error in fallback nisab refresh:', error));
              }
            }
            // If direct update not available, use the refresh method
            else if (typeof get().forceRefreshNisabForCurrency === 'function') {
              console.log('Immediately updating nisab data with new currency (refresh method):', newCurrency);
              get().forceRefreshNisabForCurrency(newCurrency)
                .then(success => {
                  console.log('Immediate nisab update result:', success ? 'success' : 'failed');
                })
                .catch(error => {
                  console.error('Error during immediate nisab update:', error);
                });
            }

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
              fetch(`/api/prices/metals?currency=${newCurrency}&refresh=true`, {
                cache: 'no-store',
                headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
              })
                .then(response => {
                  if (!response.ok) {
                    throw new Error(`API returned status ${response.status}`);
                  }

                  // Check content type to ensure we're getting JSON
                  const contentType = response.headers.get('content-type');
                  if (!contentType || !contentType.includes('application/json')) {
                    throw new Error(`Expected JSON but got ${contentType || 'unknown content type'}`);
                  }

                  return response.json();
                })
                .then(data => {
                  // Validate the data structure
                  if (!data || typeof data !== 'object' || data.error) {
                    throw new Error(data.error || 'Invalid data structure received from API');
                  }

                  if (typeof data.gold !== 'number' || typeof data.silver !== 'number') {
                    throw new Error('Invalid metal prices received from API');
                  }

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
                  console.error('Failed to fetch fresh metal prices:', error instanceof Error ? error.message : String(error));

                  // Use fallback values if API fails
                  const fallbackGoldPrices = {
                    USD: 2400,
                    GBP: 1900,
                    EUR: 2200,
                    PKR: 670000,
                    INR: 200000,
                    SAR: 9000
                  };

                  const fallbackSilverPrices = {
                    USD: 30,
                    GBP: 24,
                    EUR: 27,
                    PKR: 8400,
                    INR: 2500,
                    SAR: 112
                  };

                  // Check if we have fallback values for this currency
                  if (newCurrency in fallbackGoldPrices && newCurrency in fallbackSilverPrices) {
                    console.log(`Using fallback metal prices for ${newCurrency}`);

                    // Update with fallback values - convert from per oz to per gram
                    get().setMetalPrices({
                      gold: fallbackGoldPrices[newCurrency as keyof typeof fallbackGoldPrices] / 31.1034768,
                      silver: fallbackSilverPrices[newCurrency as keyof typeof fallbackSilverPrices] / 31.1034768,
                      currency: newCurrency,
                      lastUpdated: new Date(),
                      isCache: true,
                      source: 'Fallback Values'
                    });

                    // Dispatch event for fallback values
                    const fallbackEvent = new CustomEvent('metals-updated', {
                      detail: {
                        currency: newCurrency,
                        immediate: false,
                        fallback: true
                      }
                    });
                    window.dispatchEvent(fallbackEvent);
                  }
                  // We already updated with the converted values, so the UI is still correct
                });
            } catch (fetchError) {
              console.error('Failed to initiate fetch for fresh metal prices:', fetchError instanceof Error ? fetchError.message : String(fetchError));
              // We already updated with the converted values, so the UI is still correct
            }
          } catch (error) {
            console.error('Error updating metal prices for currency change:', error instanceof Error ? error.message : String(error));
          }
        },

        // Reset with currency change - completely resets state but preserves the currency
        resetWithCurrencyChange: (newCurrency) => {
          console.log('Performing full reset with currency change');

          try {
            const validatedCurrency = validateCurrencyCode(newCurrency);
            console.log(`Currency for reset: ${newCurrency} → ${validatedCurrency} (validated)`);

            const prevState = get();

            // First, save the current currency to compare later
            const prevCurrency = prevState.currency;

            // Perform the reset
            get().reset();

            // Then set the new currency
            set({ currency: validatedCurrency });

            // Update localStorage with the new currency (single source of truth)
            try {
              localStorage.setItem(CURRENCY_STORAGE_KEY, validatedCurrency);
              console.log(`Currency saved to localStorage after reset: ${validatedCurrency}`);
            } catch (error) {
              console.error('Failed to store currency in localStorage after reset:', error);
            }

            // Update metal prices immediately and in the background
            get().updateMetalPricesForNewCurrency(validatedCurrency);

            // Dispatch a currency-changed event for other parts of the app
            const event = new CustomEvent('currency-changed', {
              detail: {
                from: prevCurrency,
                to: validatedCurrency,
                isReset: true,
                timestamp: Date.now()
              }
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
              gold_regular_purity: '24K',
              gold_occasional: 0,
              gold_occasional_purity: '24K',
              gold_investment: 0,
              gold_investment_purity: '24K',
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
            },
            // Reset debt values
            debtValues: {
              receivables: 0,
              short_term_liabilities: 0,
              long_term_liabilities_annual: 0,
              receivables_entries: [],
              liabilities_entries: []
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

          // Get debt impact (can be positive or negative)
          const debtNetImpact = state.getNetDebtImpact ? state.getNetDebtImpact() : 0
          const totalLiabilities = state.getTotalLiabilities ? state.getTotalLiabilities() : 0
          const totalReceivables = state.getTotalReceivables ? state.getTotalReceivables() : 0

          // Calculate total asset value (including receivables and subtracting liabilities)
          const totalValue =
            state.getTotalCash() +
            state.getMetalsTotal() +
            state.getTotalStocks() +
            state.getRetirementTotal() +
            state.getRealEstateTotal() +
            state.getTotalCrypto() +
            totalReceivables -
            totalLiabilities

          // Get all the individual breakdowns first
          const cashBreakdown = state.getCashBreakdown()
          const metalsBreakdown = state.getMetalsBreakdown()
          const stocksBreakdown = state.getStocksBreakdown()
          const retirementBreakdown = state.getRetirementBreakdown()
          const realEstateBreakdown = state.getRealEstateBreakdown()
          const cryptoBreakdown = state.getCryptoBreakdown()
          const debtBreakdown = state.getDebtBreakdown()

          // Calculate zakatable amount by summing individual zakatable amounts
          // Note: debtBreakdown.zakatable already handles the hawl check and only includes
          // receivables if netImpact is positive
          let calculatedZakatableValue = totalValue > 0 ? (
            cashBreakdown.zakatable +
            metalsBreakdown.zakatable +
            stocksBreakdown.zakatable +
            retirementBreakdown.zakatable +
            realEstateBreakdown.zakatable +
            cryptoBreakdown.zakatable +
            debtBreakdown.zakatable
          ) : 0

          // Ensure zakatable amount is never greater than total assets
          // This handles cases where liabilities reduce total assets below the sum of zakatable amounts
          const zakatableValue = Math.min(calculatedZakatableValue, Math.max(0, totalValue))

          // Calculate zakat due
          const zakatDue = zakatableValue * 0.025

          return {
            cash: cashBreakdown,
            metals: metalsBreakdown,
            stocks: stocksBreakdown,
            retirement: retirementBreakdown,
            realEstate: realEstateBreakdown,
            crypto: cryptoBreakdown,
            debt: debtBreakdown,
            combined: {
              totalValue,
              zakatableValue,
              zakatDue,
              meetsNisab: state.getNisabStatus()
            }
          }
        },

        // Manual persist function to force saving to localStorage
        forcePersist: () => {
          try {
            // Get the current state
            const state = get();

            // Log the current state - commented out but preserved
            /*
            console.log('Manually persisting state to localStorage', {
              hasCashValues: !!state.cashValues,
              cashOnHand: state.cashValues?.cash_on_hand,
              timestamp: new Date().toISOString()
            });
            */

            // Force the persist middleware to save the current state
            if (typeof window !== 'undefined' && window.localStorage) {
              // Get the partialize function to extract the state to persist
              const partialState = {
                metalsValues: state.metalsValues,
                cashValues: state.cashValues,
                stockValues: state.stockValues,
                retirement: state.retirement,
                realEstateValues: state.realEstateValues,
                cryptoValues: state.cryptoValues,
                cashHawlMet: state.cashHawlMet,
                metalsHawlMet: state.metalsHawlMet,
                stockHawlMet: state.stockHawlMet,
                retirementHawlMet: state.retirementHawlMet,
                realEstateHawlMet: state.realEstateHawlMet,
                cryptoHawlMet: state.cryptoHawlMet,
                metalPrices: state.metalPrices,
                // Add distribution state to manual persistence
                allocations: state.allocations,
                distributionMode: state.distributionMode,
                // Exclude nisab data from manual persistence
                currency: state.currency,
                debtValues: state.debtValues
              };

              // Manually save to localStorage
              const storageValue = JSON.stringify({
                state: partialState,
                version: 0,
                timestamp: Date.now()
              });

              localStorage.setItem('zakat-store', storageValue);

              // Debug logging - commented out but preserved
              /*
              console.log('Manually persisted state to localStorage', {
                size: storageValue.length,
                timestamp: new Date().toISOString()
              });

              // Verify the save
              const savedData = localStorage.getItem('zakat-store');
              if (savedData) {
                const parsed = JSON.parse(savedData);
                console.log('Verified manual persist:', {
                  cashOnHand: parsed.state?.cashValues?.cash_on_hand,
                  timestamp: new Date(parsed.timestamp).toISOString()
                });
              }
              */
            }
          } catch (error) {
            console.error('Error in manual persist:', error instanceof Error ? error.message : String(error));
          }
        }
      }
    },
    {
      name: 'zakat-store',
      version: 1,
      // Improved storage configuration for Next.js with SSR
      storage: typeof window !== 'undefined'
        ? createJSONStorage(() => ({
          getItem: (name) => {
            try {
              const data = localStorage.getItem(name);
              if (!data) {
                console.log(`No data found in localStorage for "${name}"`);
                return null;
              }

              console.log(`Retrieved store "${name}" from localStorage (${data.length} bytes)`);
              return data;
            } catch (error) {
              console.error(`Error getting item "${name}" from localStorage:`, error instanceof Error ? error.message : String(error));
              return null;
            }
          },
          setItem: (name, value) => {
            try {
              // Log the value being saved for debugging
              console.log(`Saving to localStorage: ${name}`, {
                valueLength: value.length,
                preview: value.substring(0, 100) + '...',
                timestamp: new Date().toISOString()
              });

              localStorage.setItem(name, value);
              console.log(`Successfully saved "${name}" to localStorage (${value.length} bytes)`);
            } catch (error) {
              console.error(`Error setting item "${name}" in localStorage:`, error instanceof Error ? error.message : String(error));
            }
          },
          removeItem: (name) => {
            try {
              localStorage.removeItem(name);
              console.log(`Successfully removed "${name}" from localStorage`);
            } catch (error) {
              console.error(`Error removing item "${name}" from localStorage:`, error instanceof Error ? error.message : String(error));
            }
          }
        }))
        : undefined,
      // Exclude nisab data from persistence
      partialize: (state) => {
        const { nisabData, ...rest } = state;
        return rest;
      }
    }
  )
)