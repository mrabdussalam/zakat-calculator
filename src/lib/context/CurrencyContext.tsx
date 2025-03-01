'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useZakatStore } from '@/store/zakatStore';
import { useCurrencyStore } from '@/lib/services/currency';

// Helper function to clear calculator values from localStorage
function clearCalculatorValuesFromStorage() {
  try {
    // Get the current state from localStorage
    const storageKey = 'zakat-store';
    const storedData = localStorage.getItem(storageKey);

    if (!storedData) {
      console.log('No stored data found in localStorage');
      return;
    }

    // Parse the stored data
    const parsed = JSON.parse(storedData);
    const state = parsed.state;

    if (!state) {
      console.log('No state found in stored data');
      return;
    }

    console.log('Before reset - stored state keys:', Object.keys(state));

    // Reset calculator values while preserving other settings
    const updatedState = {
      ...state,
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
        active_shares: 0,
        active_price_per_share: 0,
        passive_shares: 0,
        company_cash: 0,
        company_receivables: 0,
        company_inventory: 0,
        total_shares_issued: 0,
        total_dividend_earnings: 0,
        dividend_per_share: 0,
        dividend_shares: 0,
        fund_value: 0,
        is_passive_fund: false,
        activeStocks: []
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
      }
    };

    // Save the updated state back to localStorage
    parsed.state = updatedState;
    localStorage.setItem(storageKey, JSON.stringify(parsed));

    // Also update any computed or cached values that might be stored separately
    try {
      // Clear any nisab cache values
      const nisabCacheKeys = Object.keys(localStorage).filter(key =>
        key.startsWith('nisab-') || key.includes('cache')
      );

      console.log('Clearing related cache keys:', nisabCacheKeys);

      // Remove any cache keys
      nisabCacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (cacheError) {
      console.error('Error clearing cache values:', cacheError);
    }

    console.log('Successfully cleared calculator values from localStorage');
    console.log('After reset - stored state keys:', Object.keys(updatedState));
  } catch (error) {
    console.error('Error clearing calculator values from localStorage:', error);
  }
}

interface CurrencyContextType {
  isConverting: boolean;
  setIsConverting: (value: boolean) => void;
  lastCurrencyReset: Date | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function useCurrencyContext() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrencyContext must be used within a CurrencyProvider');
  }
  return context;
}

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [isConverting, setIsConverting] = useState(false);
  // Track the last time we reset due to currency change
  const [lastCurrencyReset, setLastCurrencyReset] = useState<Date | null>(null);

  // Initialize currency rates on startup
  useEffect(() => {
    const initializeCurrencyRates = async () => {
      try {
        // Get the current currency from the store
        const zakatStore = useZakatStore.getState();
        const currencyStore = useCurrencyStore.getState();
        const currentCurrency = zakatStore.currency || 'USD';

        console.log('CurrencyProvider: Initializing currency rates for', currentCurrency);

        // Check if we already have rates
        const hasRates = Object.keys(currencyStore.rates || {}).length > 0;

        if (!hasRates) {
          // Fetch exchange rates for the current currency
          await currencyStore.fetchRates(currentCurrency);
          console.log('CurrencyProvider: Successfully fetched exchange rates');
        } else {
          console.log('CurrencyProvider: Exchange rates already available');
        }
      } catch (error) {
        console.error('CurrencyProvider: Failed to initialize currency rates:', error);
      }
    };

    // Initialize rates after a short delay to ensure store is hydrated
    const timer = setTimeout(() => {
      initializeCurrencyRates();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Check on startup if there might be inconsistent state
  useEffect(() => {
    try {
      // Check if URL has a currency change indicator
      const urlParams = new URLSearchParams(window.location.search);
      const hasResetParam = urlParams.has('t');

      if (hasResetParam) {
        console.log('Detected currency change from URL param, checking for stale values');

        // Get the current currency from the store
        const currentCurrency = useZakatStore.getState().currency;

        // Get the stored currency preference from localStorage
        const storedCurrency = localStorage.getItem('selected-currency');

        // Only reset if there's an actual currency mismatch
        if (storedCurrency && storedCurrency !== currentCurrency) {
          console.log(`Currency mismatch detected: Store has ${currentCurrency}, preference is ${storedCurrency}`);

          // Verify the store state is clean
          const { resetAllCalculators } = useZakatStore.getState();
          if (typeof resetAllCalculators === 'function') {
            // Clear localStorage values
            clearCalculatorValuesFromStorage();

            // Then reset the store
            resetAllCalculators();
            console.log('Successfully reset calculator values due to currency change');
          }
        } else {
          console.log('No currency mismatch detected, skipping reset on page refresh');
        }
      }
    } catch (error) {
      console.error('Error during startup verification:', error);
    }
  }, []);

  // Create a function to expose to consumers that need to track currency changes
  useEffect(() => {
    // This attaches a listener to global currency changes
    // We'll define a custom event that will be dispatched when currency changes
    const handleCurrencyChange = (event: CustomEvent) => {
      console.log('Currency changed event received', event.detail);

      // Save the newly selected currency for later use
      if (event.detail?.to) {
        try {
          localStorage.setItem('selected-currency', event.detail.to);
          console.log(`Saved selected currency preference: ${event.detail.to}`);
        } catch (error) {
          console.error('Failed to save currency preference:', error);
        }
      }

      // IMPORTANT: Don't reset on initial page load
      // Check if this is a triggered change vs. initial page load
      const isInitialLoad = !event.detail?.from || event.detail.isInitialLoad;

      if (isInitialLoad) {
        console.log('Skipping reset during initial page load');
        return;
      }

      // Set converting flag to prevent multiple fetches
      setIsConverting(true);

      try {
        // Get the resetAllCalculators function from the store
        const { resetAllCalculators } = useZakatStore.getState();

        // Check if the function exists before calling it
        if (typeof resetAllCalculators === 'function') {
          console.log('Calling resetAllCalculators from store');

          // Reset all calculators
          resetAllCalculators();

          // Update the last reset timestamp
          const now = new Date();
          setLastCurrencyReset(now);
          console.log(`Currency reset completed at ${now.toISOString()}`);
        } else {
          console.error('resetAllCalculators function not found in zakatStore');
        }

        // The CurrencySelector will handle the reload, but we'll set a timeout just in case
        // This allows for any asynchronous operations to complete before reload
        if (event.detail?.shouldForceReload) {
          console.log('Currency change event requested force reload');
        }
      } catch (error) {
        console.error('Error during calculator reset:', error);
      } finally {
        // Clear converting flag
        setTimeout(() => {
          setIsConverting(false);
          console.log('Currency conversion completed, cleared isConverting flag');
        }, 200);
      }
    };

    // Listen for currency change events
    window.addEventListener('currency-changed', handleCurrencyChange as EventListener);
    console.log('Currency change event listener registered');

    // Clean up the listener
    return () => {
      window.removeEventListener('currency-changed', handleCurrencyChange as EventListener);
      console.log('Currency change event listener removed');
    };
  }, []);

  const value = {
    isConverting,
    setIsConverting,
    lastCurrencyReset
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
} 