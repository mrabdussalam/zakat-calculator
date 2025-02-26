'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AssetList, ASSETS } from '@/components/dashboard/AssetList'
import { Calculator } from '@/components/dashboard/Calculator'
import { Summary } from '@/components/dashboard/Summary/index'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useZakatStore } from '@/store/zakatStore'
import { cn } from '@/lib/utils'
import { Menu, X, CircleHelp, InfoIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SidebarToggle } from '@/components/ui/sidebar-toggle'
import { LockIcon } from '@/components/ui/icons/lock'
import { useCurrencyStore } from '@/lib/services/currency'
import { toast } from '@/components/ui/toast'
import { roundCurrency } from '@/lib/utils/currency'
import { useCurrencyContext } from '@/lib/context/CurrencyContext'

interface DashboardState {
  selectedAsset: string | null
  assetValues: Record<string, Record<string, number>>
  hawlMet: Record<string, boolean>
  nisabThreshold?: number
  currency: string
  setupCompleted: boolean
}

// Default state that will be the same on both server and client
const DEFAULT_STATE: DashboardState = {
  selectedAsset: 'cash',
  assetValues: {
    cash: {},
    'precious-metals': {},
    stocks: {},
    retirement: {},
    'real-estate': {},
    crypto: {},
    'debt-receivable': {}
  },
  hawlMet: {
    cash: true,
    'precious-metals': true,
    stocks: true,
    retirement: true,
    'real-estate': true,
    crypto: true,
    'debt-receivable': true
  },
  currency: 'USD',
  setupCompleted: true
}

// Add a simple version tracking mechanism alongside currency conversion
const LOCAL_STATE_VERSION = "1.1"; // Increment this when making changes to state structure

const MotionScrollArea = motion(ScrollArea)

// Fix 'any' types by using more specific interfaces
interface ConvertedStock {
  symbol: string;
  company: string;
  shares: number;
  purchasePrice: number;
  currentPrice: number;
  marketValue: number;
  currency: string;
  dateAdded: string;
  notes?: string;
}

export default function DashboardPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const prevCurrency = useRef<string>(DEFAULT_STATE.currency)
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [isConvertingCurrency, setIsConvertingCurrency] = useState(false)
  const { setIsConverting } = useCurrencyContext()
  
  // Add a new reference to track currency conversion history
  const prevConversionRef = useRef<{ from: string; to: string; timestamp: number } | null>(null);
  
  // Add window size detection
  useEffect(() => {
    const handleResize = () => {
      // Auto collapse on screens smaller than 1440px
      if (window.innerWidth < 1440) {
        setIsCollapsed(true)
      } else {
        setIsCollapsed(false)
      }
    }

    // Initial check
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Check if we're coming from the loading transition
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const transitionTime = params.get('t')
    
    if (transitionTime) {
      // If we have a transition timestamp, wait a bit before starting animations
      setTimeout(() => {
        setShouldAnimate(true)
      }, 100) // Small delay to ensure smooth transition
    } else {
      // If direct navigation, animate immediately
      setShouldAnimate(true)
    }
  }, [])

  // Custom titles for calculators
  const CALCULATOR_TITLES = {
    stocks: 'Stocks & Investments'
  }

  // Initialize with default state and load from localStorage if available
  const [state, setState] = useState<DashboardState>(() => {
    // Try to load saved state
    if (typeof window !== 'undefined') {
      // Check if we have Zustand store data first (this is the source of truth)
      const zakatStoreData = localStorage.getItem('zakat-store')
      
      // First, try to get currency selection from user preference
      let selectedCurrency = DEFAULT_STATE.currency;
      let selectedAsset = DEFAULT_STATE.selectedAsset;
      
      try {
        // Check for user currency preference first (highest priority)
        const userCurrencyPreference = localStorage.getItem('selected-currency');
        if (userCurrencyPreference) {
          selectedCurrency = userCurrencyPreference;
          console.log('Using user currency preference:', selectedCurrency);
        } else {
          // Fall back to homepage setting if available
          const homePageState = localStorage.getItem('zakatState');
          if (homePageState) {
            const parsedHomeState = JSON.parse(homePageState);
            if (parsedHomeState && parsedHomeState.currency) {
              selectedCurrency = parsedHomeState.currency;
              console.log('Found homepage currency selection:', selectedCurrency);
              
              if (parsedHomeState.selectedAsset) {
                selectedAsset = parsedHomeState.selectedAsset;
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed to load homepage currency selection:', e);
      }
      
      // Set prevCurrency to the selected currency to prevent unwanted conversions
      prevCurrency.current = selectedCurrency;
      
      // Continue with normal state initialization
      // Check if we have Zustand store data
      if (zakatStoreData) {
        try {
          const parsedZakatStore = JSON.parse(zakatStoreData)
          if (parsedZakatStore && parsedZakatStore.state) {
            // Get the Zustand store instance
            const zakatStore = useZakatStore.getState();
            
            // CRITICAL: If we have a user currency preference, ensure it's set in Zustand
            if (selectedCurrency) {
              console.log('Updating Zustand with user currency preference:', selectedCurrency);
              
              // Update Zustand store with user currency preference
              if (typeof zakatStore.setCurrency === 'function') {
                zakatStore.setCurrency(selectedCurrency);
              }
              
              // Also update metalPrices if they exist
              if (zakatStore.metalPrices) {
                zakatStore.setMetalPrices({
                  ...zakatStore.metalPrices,
                  currency: selectedCurrency
                });
              }
              
              // Set prevCurrency ref to match the user currency preference
              prevCurrency.current = selectedCurrency;
              
              // Return state with user currency preference
              return {
                ...DEFAULT_STATE,
                currency: selectedCurrency,
                selectedAsset,
                setupCompleted: true
              } as DashboardState;
            }
            
            // If no homepage currency, try to get currency from Zustand or dashboard state
            let savedCurrency = 'USD';
            
            // Try to get currency from Zustand
            if (zakatStore.metalPrices && zakatStore.metalPrices.currency) {
              savedCurrency = zakatStore.metalPrices.currency;
              console.log('Using Zustand currency as source of truth:', savedCurrency);
            } else {
              // Fallback to dashboard state
              const dashboardState = localStorage.getItem('zakatState');
              if (dashboardState) {
                try {
                  const parsedDashboard = JSON.parse(dashboardState);
                  if (parsedDashboard && parsedDashboard.currency) {
                    savedCurrency = parsedDashboard.currency;
                    console.log('Using dashboard currency:', savedCurrency);
                  }
                  if (parsedDashboard && parsedDashboard.selectedAsset) {
                    selectedAsset = parsedDashboard.selectedAsset;
                  }
                } catch (e) {
                  console.error('Error parsing dashboard state:', e);
                }
              }
            }
            
            // Set prevCurrency ref to match the current currency to prevent unwanted conversions
            prevCurrency.current = savedCurrency;
            
            // Return a minimal state that won't override Zustand data
            return {
              ...DEFAULT_STATE,
              currency: savedCurrency,
              selectedAsset,
              setupCompleted: true
            } as DashboardState;
          }
          
          // If no homepage currency and no Zustand data, check for complete zakatState
          const saved = localStorage.getItem('zakatState');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              // Check if this is a complete state object
              if (parsed && typeof parsed === 'object') {
                if (parsed.assetValues && parsed.hawlMet) {
                  // This is a complete state object
                  // Set prevCurrency ref to match state currency
                  prevCurrency.current = parsed.currency || DEFAULT_STATE.currency;
                  
                  return {
                    ...parsed,
                    setupCompleted: true
                  } as DashboardState;
                }
              }
            } catch (e) {
              console.error('Failed to parse saved state:', e);
            }
          }
          
          // If no saved state, initialize with default values
          localStorage.setItem('zakatState', JSON.stringify({
            ...DEFAULT_STATE,
            setupCompleted: true
          }));
          
          // Also save version
          localStorage.setItem('zakat-state-version', LOCAL_STATE_VERSION);
        } catch (e) {
          console.error('Failed to parse Zustand store:', e);
        }
      }
      
      // Fallback to the old zakatState if no Zustand data
      // At this point, we already checked for homepage currency at the beginning
      // If we have a homepage currency, create a new state with it
      if (selectedCurrency !== DEFAULT_STATE.currency) {
        console.log('Using homepage currency for new state:', selectedCurrency);
        
        // Set prevCurrency ref to match the homepage currency
        prevCurrency.current = selectedCurrency;
        
        // Initialize Zustand with the homepage currency
        try {
          const zakatStore = useZakatStore.getState();
          if (typeof zakatStore.setCurrency === 'function') {
            zakatStore.setCurrency(selectedCurrency);
          }
          if (zakatStore.metalPrices) {
            zakatStore.setMetalPrices({
              ...zakatStore.metalPrices,
              currency: selectedCurrency
            });
          }
        } catch (e) {
          console.error('Failed to update Zustand store with homepage currency:', e);
        }
        
        return {
          ...DEFAULT_STATE,
          currency: selectedCurrency,
          selectedAsset,
          setupCompleted: true
        } as DashboardState;
      }
      
      // If no homepage currency and no Zustand data, check for complete zakatState
      const saved = localStorage.getItem('zakatState');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Check if this is a complete state object
          if (parsed && typeof parsed === 'object') {
            if (parsed.assetValues && parsed.hawlMet) {
              // This is a complete state object
              // Set prevCurrency ref to match state currency
              prevCurrency.current = parsed.currency || DEFAULT_STATE.currency;
              
              return {
                ...parsed,
                setupCompleted: true
              } as DashboardState;
            }
          }
        } catch (e) {
          console.error('Failed to parse saved state:', e);
        }
      }
      
      // If no saved state, initialize with default values
      localStorage.setItem('zakatState', JSON.stringify({
        ...DEFAULT_STATE,
        setupCompleted: true
      }));
      
      // Also save version
      localStorage.setItem('zakat-state-version', LOCAL_STATE_VERSION);
    }
    
    // If we got here and didn't return anything yet, return the default state
    return DEFAULT_STATE;
  });
  
  // Save state changes to localStorage
  useEffect(() => {
    if (isHydrated) {
      // Only save UI state (currency, selected asset) but not the actual data
      // to avoid conflicts with Zustand persistence
      localStorage.setItem('zakatState', JSON.stringify({
        currency: state.currency,
        selectedAsset: state.selectedAsset,
        setupCompleted: true
      }))
    }
  }, [state.currency, state.selectedAsset, isHydrated])

  // Function to synchronize the currency between Zustand and Dashboard
  const synchronizeCurrency = useCallback(() => {
    try {
      const zakatStore = useZakatStore.getState();
      const dashboardState = localStorage.getItem('zakatState');
      
      if (dashboardState) {
        const parsedDashboard = JSON.parse(dashboardState);
        if (parsedDashboard && parsedDashboard.currency) {
          // If dashboard has a currency (likely from homepage selection), update Zustand
          if (zakatStore.metalPrices && zakatStore.metalPrices.currency !== parsedDashboard.currency) {
            console.log('Synchronizing Zustand currency with dashboard currency:', parsedDashboard.currency);
            
            // Update Zustand currency
            if (typeof zakatStore.setCurrency === 'function') {
              zakatStore.setCurrency(parsedDashboard.currency);
            }
            
            // Update metal prices currency too
            if (zakatStore.metalPrices) {
              zakatStore.setMetalPrices({
                ...zakatStore.metalPrices,
                currency: parsedDashboard.currency
              });
            }
            
            // Update dashboard state with the homepage currency
            setState(prev => ({
              ...prev,
              currency: parsedDashboard.currency
            }));
            
            // Update prevCurrency to prevent unnecessary conversions
            prevCurrency.current = parsedDashboard.currency;
          }
        }
      }
    } catch (e) {
      console.error('Error synchronizing currency:', e);
    }
  }, []);

  // Only set hydration state after first render
  useEffect(() => {
    setIsHydrated(true);
    
    // CRITICAL: Immediately force currency sync after hydration
    // This is necessary when navigating from the homepage with a selected currency
    setTimeout(() => {
      try {
        const dashboardState = localStorage.getItem('zakatState');
        if (dashboardState) {
          const parsedState = JSON.parse(dashboardState);
          if (parsedState && parsedState.currency) {
            // Get selected currency from localStorage (likely set on homepage)
            const selectedCurrency = parsedState.currency;
            
            // Get current Zustand store
            const zakatStore = useZakatStore.getState();
            if (zakatStore && zakatStore.metalPrices) {
              console.log('Initial currency check - Dashboard:', selectedCurrency, 'Zustand:', zakatStore.metalPrices.currency);
              
              // If currencies don't match, force update Zustand
              if (zakatStore.metalPrices.currency !== selectedCurrency) {
                console.log('Forcing currency sync from homepage selection:', selectedCurrency);
                
                // Update Zustand currency directly
                if (typeof zakatStore.setCurrency === 'function') {
                  zakatStore.setCurrency(selectedCurrency);
                }
                
                // Update metal prices currency
                zakatStore.setMetalPrices({
                  ...zakatStore.metalPrices,
                  currency: selectedCurrency
                });
                
                // Force trigger the currency conversion
                prevCurrency.current = selectedCurrency === 'USD' ? 'EUR' : 'USD'; // Use a different currency to force conversion
                
                // Update state to trigger conversion
                setState(prev => ({
                  ...prev,
                  currency: selectedCurrency
                }));
                
                // Show toast notification
                toast({
                  title: "Currency Updated",
                  description: `Using ${selectedCurrency} as your currency`,
                  variant: "default"
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error during initial currency sync:', error);
      }
    }, 100);
  }, []);

  // Synchronize currency from homepage to Zustand store
  useEffect(() => {
    if (!isHydrated) return;
    
    try {
      // Get the Zustand store
      const zakatStore = useZakatStore.getState();
      
      // Get dashboard state from localStorage (may contain homepage currency selection)
      const dashboardState = localStorage.getItem('zakatState');
      if (!dashboardState) return;
      
      const parsedDashboard = JSON.parse(dashboardState);
      if (!parsedDashboard || !parsedDashboard.currency) return;
      
      // Get the selected currency from localStorage
      const homepageCurrency = parsedDashboard.currency;
      
      // Check if Zustand store has a different currency
      if (zakatStore.metalPrices && zakatStore.metalPrices.currency !== homepageCurrency) {
        console.log('Updating Zustand currency from homepage selection:', homepageCurrency);
        
        // Update Zustand's currency
        if (typeof zakatStore.setCurrency === 'function') {
          zakatStore.setCurrency(homepageCurrency);
        }
        
        // Update metal prices currency
        if (zakatStore.metalPrices) {
          zakatStore.setMetalPrices({
            ...zakatStore.metalPrices,
            currency: homepageCurrency
          });
        }
        
        // Update dashboard state
        setState(prevState => ({
          ...prevState,
          currency: homepageCurrency
        }));
        
        // Update prevCurrency to prevent unnecessary conversions
        prevCurrency.current = homepageCurrency;
        
        console.log('Successfully synchronized currencies between homepage and dashboard');
      }
    } catch (error) {
      console.error('Error synchronizing currency from homepage:', error);
    }
  }, [isHydrated]);

  // Add an effect to handle the homepage currency synchronization
  useEffect(() => {
    if (!isHydrated) return;
    
    try {
      const zakatStore = useZakatStore.getState();
      if (!zakatStore) return;
      
      // Get selected currency from dashboard state (which may have been set on homepage)
      if (state.currency) {
        // If dashboard has a currency and it differs from Zustand's, update Zustand
        if (zakatStore.metalPrices && zakatStore.metalPrices.currency !== state.currency) {
          console.log('Dashboard: Updating Zustand currency with dashboard currency:', state.currency);
          
          // Update Zustand's currency
          if (typeof zakatStore.setCurrency === 'function') {
            zakatStore.setCurrency(state.currency);
          }
          
          // Update metal prices currency
          if (zakatStore.metalPrices) {
            zakatStore.setMetalPrices({
              ...zakatStore.metalPrices,
              currency: state.currency
            });
          }
          
          // Set prevCurrency to prevent unwanted conversions
          prevCurrency.current = state.currency;
        }
      }
    } catch (e) {
      console.error('Error synchronizing currency:', e);
    }
  }, [isHydrated, state.currency]);

  const handleAssetSelect = (assetId: string) => {
    setState(prev => ({
      ...prev,
      selectedAsset: assetId
    }))
  }

  const handleUpdateValues = (newValues: Record<string, number>) => {
    if (!isHydrated || !state.selectedAsset) return // Don't update state before hydration or if no asset selected

    setState(prev => {
      // Create a fresh copy of asset values
      const updatedAssetValues = {
        ...prev.assetValues,
        [state.selectedAsset!]: {} as Record<string, number> // Clear previous values for this asset type with proper typing
      }
      
      // Only add non-zero values
      Object.entries(newValues).forEach(([key, value]) => {
        if (typeof value === 'number' && value !== 0 && state.selectedAsset) {
          updatedAssetValues[state.selectedAsset][key] = value
        }
      })

      return {
        ...prev,
        assetValues: updatedAssetValues
      }
    })
  }

  const handleHawlUpdate = (hawlMet: boolean) => {
    if (!isHydrated) return // Don't update state before hydration

    setState(prev => ({
      ...prev,
      hawlMet: {
        ...prev.hawlMet,
        [prev.selectedAsset!]: hawlMet
      }
    }))
  }

  const handleNisabUpdate = (amount: number) => {
    if (!isHydrated) return // Don't update state before hydration

    setState(prev => ({
      ...prev,
      nisabThreshold: amount
    }))
  }

  // Process asset values for summary
  const processedValues = Object.entries(state.assetValues).reduce((acc, [assetType, values]) => {
    // Skip empty asset types
    if (Object.keys(values).length === 0) return acc

    // Calculate total for this asset type (only from direct values)
    const assetTotal = Object.entries(values).reduce((sum, [key, value]) => {
      // Skip derived/total values to prevent double counting
      if (key.includes('total') || key.includes('zakatable')) return sum
      return sum + (typeof value === 'number' ? value : 0)
    }, 0)
    
    // Add the base total
    acc[`${assetType}_total`] = assetTotal

    // Add individual values with proper prefixing
    Object.entries(values).forEach(([key, value]) => {
      if (typeof value === 'number') {
        // Prevent duplicate prefixing
        const cleanKey = key.startsWith(assetType) ? key : `${assetType}_${key}`
        acc[cleanKey] = value
      }
    })

    return acc
  }, {} as Record<string, number>)

  // Calculate total assets by asset type (only counting base values)
  const assetTotals = Object.entries(state.assetValues).reduce((acc, [assetType, values]) => {
    acc[assetType] = Object.entries(values).reduce((sum, [key, value]) => {
      // Skip derived/total values to prevent double counting
      if (key.includes('total') || key.includes('zakatable')) return sum
      return sum + (typeof value === 'number' ? value : 0)
    }, 0)
    return acc
  }, {} as Record<string, number>)

  // Calculate zakatable totals by asset type
  const zakatableTotals = Object.entries(state.assetValues).reduce((acc, [assetType, values]) => {
    // For precious metals, use the zakatable field if present
    if (assetType === 'precious-metals' && values.zakatable) {
      acc[assetType] = values.zakatable
    } else {
      // For other assets, use the total if hawl is met
      acc[assetType] = state.hawlMet[assetType] ? (assetTotals[assetType] || 0) : 0
    }
    return acc
  }, {} as Record<string, number>)

  // Calculate total assets and zakatable amount
  const totalAssets = Object.values(assetTotals).reduce((sum, value) => 
    sum + (typeof value === 'number' ? value : 0), 0)
  
  const totalZakatable = Object.values(zakatableTotals).reduce((sum, value) => 
    sum + (typeof value === 'number' ? value : 0), 0)

  // Check if any asset type with non-zero zakatable amount meets hawl
  const anyHawlMet = Object.entries(state.hawlMet).some(([assetType, hawlMet]) => {
    const zakatableAmount = zakatableTotals[assetType] || 0
    return hawlMet && zakatableAmount > 0
  })

  // Update nisab threshold when currency changes
  useEffect(() => {
    // Only fetch if currency has actually changed and we're hydrated
    if (prevCurrency.current !== state.currency && isHydrated) {
      // Set converting state
      setIsConvertingCurrency(true);
      // Also update the global context
      setIsConverting(true);
      
      // Important: Save the previous currency for conversion reference
      const fromCurrency = prevCurrency.current;

      const convertCurrency = async () => {
        try {
          // 1. Fetch currency exchange rates - ALWAYS do this to ensure we have the latest rates
          const currencyStore = useCurrencyStore.getState();
          await currencyStore.fetchRates(state.currency);

          // 2. Create a function to convert values that's idempotent 
          // (can be called multiple times without changing result)
          const convertValue = (value: number, originalCurrency = fromCurrency) => {
            if (!value || typeof value !== 'number' || !isFinite(value)) return 0;
            
            // CRITICAL: Always convert directly from original currency to target currency
            // This makes the operation idempotent - running it multiple times produces same result
            return roundCurrency(currencyStore.convertAmount(
              value, 
              originalCurrency,
              state.currency
            ));
          };

          // 3. Get the Zakat store to update its values
          const zakatStore = useZakatStore.getState();
          
          // 4. CRITICAL: Set the store's currency FIRST to prevent subsequent conversions
          if (typeof zakatStore.setCurrency === 'function') {
            zakatStore.setCurrency(state.currency);
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
                        currency: state.currency // Update the currency too
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
              // Keep the existing individual updates if no batch update method exists
              const cashValues = { ...zakatStore.cashValues };
              // Convert direct numeric values
              Object.keys(cashValues).forEach(key => {
                if (key !== 'foreign_currency_entries' && typeof cashValues[key] === 'number') {
                  cashValues[key] = convertValue(cashValues[key], fromCurrency);
                }
              });
              
              // Handle foreign currency entries array specifically
              if (Array.isArray(cashValues.foreign_currency_entries)) {
                cashValues.foreign_currency_entries = cashValues.foreign_currency_entries.map((entry: { currency: string; amount: number }) => {
                  if (entry.currency === fromCurrency) {
                    // If the entry is in the old currency, convert it
                    return {
                      ...entry,
                      amount: convertValue(entry.amount, fromCurrency),
                      currency: state.currency // Update the currency too
                    };
                  }
                  // If entry is already in a different currency, keep it as is
                  return entry;
                });
              }
              
              // Update each cash value individually using the store's setter
              Object.entries(cashValues).forEach(([key, value]) => {
                if (key !== 'foreign_currency_entries' && typeof value === 'number') {
                  zakatStore.setCashValue(key, value);
                }
              });
              
              // Update foreign currency entries if present
              if (Array.isArray(cashValues.foreign_currency_entries)) {
                zakatStore.setCashValue('foreign_currency_entries', cashValues.foreign_currency_entries);
                
                // Also update the total foreign currency value
                const totalForeignCurrency = cashValues.foreign_currency_entries.reduce((sum: number, entry: { currency: string; amount: number }) => {
                  if (entry.currency === state.currency) {
                    return sum + entry.amount;
                  }
                  return sum + (currencyStore.convertAmount(entry.amount, entry.currency, state.currency) || 0);
                }, 0);
                
                zakatStore.setCashValue('foreign_currency', totalForeignCurrency);
              }
            }
          }
          
          // 6. Convert metal values
          // Note: We DO NOT convert metal weights as they're physical measurements
          // We only need to update the metal prices for the new currency
          if (zakatStore.metalPrices) {
            try {
              console.log('Dashboard - Before fetching metal prices:', {
                currentCurrency: state.currency,
                oldCurrency: fromCurrency,
                oldPrices: zakatStore.metalPrices
              });
              
              // Instead of converting the prices, fetch new prices in the target currency
              const response = await fetch(`/api/prices/metals?currency=${state.currency}`);
              
              if (response.ok) {
                const data = await response.json();
                
                console.log('Dashboard - Received metal prices from API:', {
                  data,
                  targetCurrency: state.currency
                });
                
                // Check if API returned a different currency than requested
                const apiReturnedDifferentCurrency = data.currency !== state.currency;
                if (apiReturnedDifferentCurrency) {
                  console.warn(`Dashboard: API returned prices in ${data.currency} instead of requested ${state.currency} - performing manual conversion`);
                  
                  // Convert the prices using our currency conversion functions
                  const convertedGoldPrice = convertValue(data.gold || 65.52, data.currency);
                  const convertedSilverPrice = convertValue(data.silver || 0.85, data.currency);
                  
                  console.log('Dashboard - Converted metal prices:', {
                    originalGold: data.gold,
                    originalSilver: data.silver,
                    originalCurrency: data.currency || 'USD',
                    convertedGold: convertedGoldPrice,
                    convertedSilverPrice: convertedSilverPrice,
                    targetCurrency: state.currency
                  });
                  
                  // CRITICAL: Always use the Dashboard's currency, with converted prices
                  const updatedPrices = {
                    gold: convertedGoldPrice,
                    silver: convertedSilverPrice,
                    lastUpdated: new Date(data.lastUpdated || new Date()),
                    isCache: data.isCache || false,
                    currency: state.currency // Force currency to match the dashboard
                  };
                  
                  // Update metal prices with the converted values
                  zakatStore.setMetalPrices(updatedPrices);
                  
                  console.log('Dashboard - Updated metal prices with converted values:', updatedPrices);
                } else {
                  // API returned prices in requested currency, use as is
                  // CRITICAL: Always use the Dashboard's currency
                  const updatedPrices = {
                    gold: data.gold || zakatStore.metalPrices.gold,
                    silver: data.silver || zakatStore.metalPrices.silver,
                    lastUpdated: new Date(data.lastUpdated || new Date()),
                    isCache: data.isCache || false,
                    currency: state.currency // Force currency to match the dashboard
                  };
                  
                  // Update metal prices with the fetched data in the new currency
                  zakatStore.setMetalPrices(updatedPrices);
                  
                  console.log('Dashboard - Updated metal prices in store:', updatedPrices);
                }
                
                // After updating prices, force recalculation of derived values
                if (typeof zakatStore.getTotalMetals === 'function') {
                  // This will trigger recalculation in the store
                  zakatStore.getTotalMetals();
                }
                
                if (typeof zakatStore.getTotalZakatableMetals === 'function') {
                  // This will trigger recalculation of zakatable values
                  zakatStore.getTotalZakatableMetals();
                }
              } else {
                // If fetch fails, fall back to conversion
                const newMetalPrices = {
                  ...zakatStore.metalPrices,
                  gold: convertValue(zakatStore.metalPrices.gold, fromCurrency),
                  silver: convertValue(zakatStore.metalPrices.silver, fromCurrency),
                  lastUpdated: new Date(),
                  isCache: true,
                  currency: state.currency // Explicitly set currency
                };
                
                zakatStore.setMetalPrices(newMetalPrices);
                console.log('Dashboard - Used fallback conversion for metal prices:', newMetalPrices);
              }
            } catch (error) {
              console.error('Error fetching metal prices:', error);
              // Fall back to conversion if fetch fails
              const newMetalPrices = {
                ...zakatStore.metalPrices,
                gold: convertValue(zakatStore.metalPrices.gold, fromCurrency),
                silver: convertValue(zakatStore.metalPrices.silver, fromCurrency),
                lastUpdated: new Date(),
                isCache: true,
                currency: state.currency
              };
              
              zakatStore.setMetalPrices(newMetalPrices);
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
                await zakatStore.updateStockPrices(state.currency, fromCurrency)
                console.log(`Dashboard - Successfully updated stock prices to ${state.currency}`)
                
                // Show success toast for stocks
                toast({
                  title: "Stock Prices Updated",
                  description: `Stock prices updated to ${state.currency}`,
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
                    const convertedPrice = convertValue(stock.currentPrice, stock.currency || fromCurrency)
                    const marketValue = stock.shares * convertedPrice
                    return {
                      ...stock,
                      currentPrice: convertedPrice,
                      marketValue,
                      zakatDue: marketValue * 0.025, // 2.5% zakat rate
                      currency: state.currency
                    }
                  }
                  return stock
                })
                
                // Update stocks with converted values using the Zustand store's set method
                zakatStore.set((state: any) => ({
                  stockValues: {
                    ...state.stockValues,
                    activeStocks: updatedStocks
                  }
                }));
                
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
              zakatStore.updateCryptoPrices(state.currency, fromCurrency);
            } else {
              // Fallback to the previous approach only if no dedicated method exists
              const updatedCoins = zakatStore.cryptoValues.coins.map((coin: { symbol: string; quantity: number; currentPrice: number; marketValue: number; zakatDue: number }) => ({
                ...coin,
                currentPrice: convertValue(coin.currentPrice, fromCurrency),
                marketValue: convertValue(coin.marketValue, fromCurrency),
                zakatDue: convertValue(coin.zakatDue, fromCurrency)
              }));
              
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
                  zakatStore.setRealEstateValue(key, convertValue(value, fromCurrency));
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
                  zakatStore.setRetirementValue(key, convertValue(value, fromCurrency));
                }
              });
            }
          }

          // After all conversions, trigger global recalculations and updates
          try {
            // 1. Update UI state for total and zakatable amounts
            setState(prev => {
              // Create fresh totals for each asset type
              const updatedAssetTotals = { ...assetTotals };
              const updatedZakatableTotals = { ...zakatableTotals };
              
              // Recalculate totals from store
              if (typeof zakatStore.getTotalCash === 'function') {
                const cashTotal = zakatStore.getTotalCash();
                updatedAssetTotals.cash = cashTotal;
                updatedZakatableTotals.cash = zakatStore.cashHawlMet ? cashTotal : 0;
              }
              
              if (typeof zakatStore.getTotalMetals === 'function') {
                const metalsResult = zakatStore.getTotalMetals();
                updatedAssetTotals['precious-metals'] = metalsResult;
                updatedZakatableTotals['precious-metals'] = zakatStore.getTotalZakatableMetals();
              }
              
              if (typeof zakatStore.getTotalStocks === 'function') {
                const stocksTotal = zakatStore.getTotalStocks();
                updatedAssetTotals.stocks = stocksTotal;
                updatedZakatableTotals.stocks = zakatStore.getTotalZakatableStocks();
              }
              
              if (typeof zakatStore.getRealEstateTotal === 'function') {
                const realEstateTotal = zakatStore.getRealEstateTotal();
                updatedAssetTotals['real-estate'] = realEstateTotal;
                updatedZakatableTotals['real-estate'] = zakatStore.getRealEstateZakatable();
              }
              
              if (typeof zakatStore.getRetirementTotal === 'function') {
                const retirementTotal = zakatStore.getRetirementTotal();
                updatedAssetTotals.retirement = retirementTotal;
                updatedZakatableTotals.retirement = zakatStore.getRetirementZakatable();
              }
              
              if (typeof zakatStore.getTotalCrypto === 'function') {
                const cryptoTotal = zakatStore.getTotalCrypto();
                updatedAssetTotals.crypto = cryptoTotal;
                updatedZakatableTotals.crypto = zakatStore.getTotalZakatableCrypto();
              }
              
              return {
                ...prev,
                assetTotals: updatedAssetTotals,
                zakatableTotals: updatedZakatableTotals,
                currency: state.currency // Ensure currency is set correctly
              };
            });
          } catch (error) {
            console.error('Error recalculating asset totals after currency conversion:', error);
          }

          // 10. Update currency in the Zakat store
          if (typeof zakatStore.setCurrency === 'function') {
            zakatStore.setCurrency(state.currency);
          }
          
          // 11. Update local dashboard state
          setState(prev => ({
            ...prev,
            currency: state.currency // Ensure currency is set correctly
          }));

          // 12. Also fetch new nisab threshold
          const response = await fetch(`/api/nisab?currency=${state.currency}`);
          if (!response.ok) throw new Error('Failed to fetch nisab');
          const data = await response.json();
          console.log('Fetched nisab data:', data);
          
          setState(prev => ({
            ...prev,
            nisabThreshold: data.nisabThreshold
          }));
          
          // Also update nisab in the Zakat store if needed
          if (zakatStore.fetchNisabData && typeof zakatStore.fetchNisabData === 'function') {
            console.log(`Dashboard: Refreshing nisab data in store for currency ${state.currency}`);
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
                    targetCurrency: state.currency
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
            to: state.currency,
            timestamp: Date.now()
          };
          
          prevConversionRef.current = newConversionRecord;
          localStorage.setItem('currency-conversion-record', JSON.stringify(newConversionRecord));
          
          // Show success message
          toast({
            title: "Currency converted",
            description: `Values have been converted from ${fromCurrency} to ${state.currency}`,
          });
        } catch (error) {
          console.error('Error converting currency:', error);
          toast({
            title: "Currency conversion failed",
            description: "There was an error converting your values. Values remain unchanged.",
            variant: "destructive"
          });
        } finally {
          setIsConvertingCurrency(false);
          // Also update the global context
          setIsConverting(false);
          // Ensure prevCurrency is updated even if there was an error
          prevCurrency.current = state.currency;
        }
      };

      convertCurrency();
    }
  }, [state.currency, toast, setIsConverting, isHydrated]);

  // Add debug and emergency mechanism to fix any currency inconsistencies
  useEffect(() => {
    // Only run on client and after hydration
    if (!isHydrated) return;
    
    // Get the current state from the Zakat store
    const zakatStore = useZakatStore.getState();
    
    // Check if metalPrices exists and has a currency
    if (zakatStore.metalPrices && zakatStore.metalPrices.currency) {
      // If the currency doesn't match the dashboard currency
      if (zakatStore.metalPrices.currency !== state.currency) {
        console.warn('Currency inconsistency detected in Dashboard:', {
          dashboardCurrency: state.currency,
          metalPricesCurrency: zakatStore.metalPrices.currency
        });
        
        // If we're not in the middle of a conversion
        if (!isConvertingCurrency) {
          console.log('Attempting emergency currency fix in Dashboard');
          
          // Fix by updating metalPrices with the correct currency
          // (This should also trigger the currency conversion useEffect)
          setState(prev => ({
            ...prev,
            currency: prev.currency // Trigger the effect by "changing" the currency
          }));
        }
      }
    }
  }, [isHydrated, state.currency, isConvertingCurrency]);

  const isEligible = anyHawlMet && totalZakatable >= (state.nisabThreshold || 0)

  // Reset all state - also clear conversion record and version
  const handleReset = useCallback(() => {
    // Get the user's currency preference before resetting
    const userCurrencyPreference = localStorage.getItem('selected-currency') || 'USD'
    
    // Reset local state while preserving currency preference
    setState({
      ...DEFAULT_STATE,
      currency: userCurrencyPreference,
    })
    
    // Clear specific localStorage items but keep the currency preference
    localStorage.removeItem('currency-conversion-record')
    localStorage.removeItem('zakatState')
    localStorage.removeItem('zakat-store')
    
    // Reset state version to trigger a fresh start next time
    localStorage.setItem('zakat-state-version', LOCAL_STATE_VERSION)
    
    // Reset refs
    prevConversionRef.current = null
    prevCurrency.current = userCurrencyPreference
    
    // Reset Zustand store
    const { reset } = useZakatStore.getState()
    reset()
    
    // Show confirmation toast
    toast({
      title: "Zakat calculator reset. All your data has been cleared.",
      variant: "success"
    })
  }, [])

  // Animation variants
  const containerVariants = {
    hidden: { 
      opacity: 0
    },
    visible: { 
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.15,
        duration: 0.2
      }
    }
  }

  const columnVariants = {
    hidden: { 
      opacity: 0,
      x: -20
    },
    visible: { 
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3
      }
    }
  }

  // Remove variants from inner elements to prevent double animation
  const innerVariants = {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
  }

  // Don't render until hydration is complete
  if (!isHydrated) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-white"
      />
    )
  }

  return (
    <TooltipProvider>
      {isConvertingCurrency && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-sm text-gray-600">Converting values to {state.currency}...</p>
          </div>
        </div>
      )}
      
      <motion.div 
        className="h-screen w-screen overflow-hidden bg-white relative"
        initial="hidden"
        animate={shouldAnimate ? "visible" : "hidden"}
        variants={containerVariants}
      >
        {/* Mobile Top Bar */}
        <motion.div 
          variants={innerVariants}
          className="lg:hidden fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-100"
        >
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="rounded-full md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                >
                  Reset
                </Button>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button
                    onClick={() => setIsMobileSummaryOpen(true)}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                  >
                    Summary
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              className="md:hidden fixed inset-0 z-50 bg-black/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <motion.div 
                className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-lg flex flex-col"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="font-medium text-gray-900">Assets</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-full"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close menu</span>
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-4">
                    {ASSETS.map(asset => (
                      <Button
                        key={asset.id}
                        variant={state.selectedAsset === asset.id ? 'default' : 'ghost'}
                        onClick={() => {
                          handleAssetSelect(asset.id)
                          setIsMobileMenuOpen(false)
                        }}
                        className="w-full justify-start text-left mb-2"
                      >
                        {asset.name}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Summary Overlay */}
        <AnimatePresence>
          {isMobileSummaryOpen && (
            <motion.div 
              className="lg:hidden fixed inset-0 z-50 bg-white"
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="h-full flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Summary</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMobileSummaryOpen(false)}
                      className="rounded-full"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close summary</span>
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      <Summary currency={state.currency} />
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Layout */}
        <div className="w-full h-full grid lg:grid-cols-[auto_minmax(500px,1fr)_minmax(400px,1.5fr)] md:grid-cols-[auto_1fr] grid-cols-[100%] transition-all duration-200">
          {/* Left Column - Asset Selection */}
          <motion.div 
            variants={innerVariants}
            className={cn(
              "min-h-0 md:block hidden relative transition-all duration-200 bg-gray-50/80",
              isCollapsed ? "w-[68px]" : "w-[280px]"
            )}
          >
            {/* Collapse Toggle Button */}
            <SidebarToggle
              isCollapsed={isCollapsed}
              onToggle={() => setIsCollapsed(!isCollapsed)}
            />

            <div className="h-full flex flex-col">
              <motion.div 
                variants={innerVariants}
                className="p-6 flex-none"
              >
                <h2 className={cn(
                  "text-2xl font-nb-international text-gray-900 transition-opacity font-medium tracking-tight",
                  isCollapsed ? "opacity-0" : "opacity-100"
                )}>
                  Assets
                </h2>
              </motion.div>
              <div className="flex-1 min-h-0">
                <MotionScrollArea 
                  variants={innerVariants}
                  className="h-full"
                >
                  <div className={cn(
                    "pb-8",
                    isCollapsed ? "px-3" : "px-6",
                    "space-y-2"
                  )}>
                    <AssetList
                      selectedAsset={state.selectedAsset}
                      onAssetSelect={handleAssetSelect}
                      isCollapsed={isCollapsed}
                    />
                  </div>
                </MotionScrollArea>
              </div>
            </div>
          </motion.div>

          {/* Middle Column - Smart Calculator */}
          <motion.div 
            variants={innerVariants}
            className={cn(
              "min-h-0 border-l border-gray-100 lg:pt-0 pt-16 w-full transition-all duration-200",
              isCollapsed ? "lg:pl-6" : "lg:pl-0"
            )}
          >
            <div className="h-full flex flex-col">
              <motion.div 
                variants={innerVariants}
                className="p-4 sm:p-6 flex-none"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-nb-international text-gray-900 font-medium tracking-tight">
                    {state.selectedAsset 
                      ? CALCULATOR_TITLES[state.selectedAsset as keyof typeof CALCULATOR_TITLES] || 
                        ASSETS.find(a => a.id === state.selectedAsset)?.name 
                      : "Select an asset to begin"}
                  </h2>
                </div>
              </motion.div>
              <div className="flex-1 min-h-0">
                <MotionScrollArea 
                  variants={innerVariants}
                  className="h-full"
                >
                  <div className="px-4 sm:px-6 pb-8">
                    <div className="max-w-[800px] overflow-hidden rounded-lg mx-auto">
                      <div className="p-0.5">
                        <Calculator
                          selectedAsset={state.selectedAsset}
                          currency={state.currency}
                          onUpdateValues={handleUpdateValues}
                          onHawlUpdate={handleHawlUpdate}
                          onAssetSelect={handleAssetSelect}
                          onOpenSummary={() => setIsMobileSummaryOpen(true)}
                          initialValues={state.selectedAsset ? state.assetValues[state.selectedAsset] : {}}
                          initialHawlMet={state.selectedAsset ? state.hawlMet[state.selectedAsset] : true}
                        />
                      </div>
                    </div>
                  </div>
                </MotionScrollArea>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Dashboard/Summary */}
          <motion.div 
            variants={innerVariants}
            className="min-h-0 border-l border-gray-100 lg:block hidden"
          >
            <div className="h-full flex flex-col">
              <motion.div 
                variants={innerVariants}
                className="p-6 flex-none"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-nb-international text-gray-900 font-medium tracking-tight">Summary</h2>
                  <Button
                    onClick={handleReset}
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                  >
                    Reset
                  </Button>
                </div>
              </motion.div>
              <div className="flex-1 min-h-0">
                <MotionScrollArea 
                  variants={innerVariants}
                  className="h-full"
                >
                  <div className="px-6 pb-8">
                    <div className="rounded-3xl border border-gray-100 bg-white p-6">
                      <Summary
                        currency={state.currency}
                      />
                    </div>
                    <div className="mt-4 pl-6 text-left text-gray-300">
                      <p className="![font-size:12px] flex items-center gap-1.5">
                        <LockIcon className="h-3.5 w-3.5" /> 
                        All calculations are performed locally in your browser — no financial data leaves your device
                      </p>
                    </div>
                  </div>
                </MotionScrollArea>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </TooltipProvider>
  )
} 