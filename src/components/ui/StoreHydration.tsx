'use client'

import { useEffect, useState } from 'react'
import { useZakatStore } from '@/store/zakatStore'

// Make sure not to trigger the event more than once
let hasDispatchedHydrationEvent = false;

// Add a flag to track initial page load vs subsequent user interactions
let isInitialPageLoad = true;

// Create a dedicated emergency backup object to preserve state during page refreshes
let emergencyStateBackup: any = null;

// Create a global emergency recovery mechanism
if (typeof window !== 'undefined') {
  // Add a page visibility change listener to detect tab switches and page refreshes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Page is being hidden (closing, refreshing, or switching tabs)
      try {
        console.log('🔄 Page visibility changed to hidden - creating state backup');
        const state = useZakatStore.getState();
        
        // Create a backup of essential state
        const backup = {
          timestamp: Date.now(),
          cashValues: state.cashValues,
          metalsValues: state.metalsValues,
          stockValues: state.stockValues,
          retirement: state.retirement,
          realEstateValues: state.realEstateValues,
          cryptoValues: state.cryptoValues,
          // Include Hawl status
          cashHawlMet: state.cashHawlMet,
          metalsHawlMet: state.metalsHawlMet,
          stockHawlMet: state.stockHawlMet,
          retirementHawlMet: state.retirementHawlMet,
          realEstateHawlMet: state.realEstateHawlMet,
          cryptoHawlMet: state.cryptoHawlMet,
        };
        
        // Store in sessionStorage (persists during refresh but not across tabs)
        sessionStorage.setItem('zakat-refresh-backup', JSON.stringify(backup));
        
        // Also set a flag in localStorage to detect if this is a refresh
        localStorage.setItem('zakat-last-hidden', Date.now().toString());
      } catch (err) {
        console.error('Error creating visibility change backup:', err);
      }
    } else if (document.visibilityState === 'visible') {
      // Page is becoming visible again (could be after a refresh)
      try {
        const lastHidden = localStorage.getItem('zakat-last-hidden');
        const timeSinceHidden = lastHidden ? Date.now() - parseInt(lastHidden) : Infinity;
        
        // If page was hidden recently (within last 3 seconds), this is likely a refresh
        if (timeSinceHidden < 3000) {
          console.log('🔄 Page refresh detected via visibility change');
          
          // Try to restore from our emergency backup
          const backup = sessionStorage.getItem('zakat-refresh-backup');
          if (backup) {
            try {
              const parsedBackup = JSON.parse(backup);
              
              // Make sure this is a recent backup
              const backupAge = Date.now() - parsedBackup.timestamp;
              if (backupAge < 10000) { // Less than 10 seconds old
                console.log('🔄 Found recent backup, scheduling restoration');
                
                // Schedule restoration after a small delay to allow store initialization
                setTimeout(() => {
                  try {
                    const currentState = useZakatStore.getState();
                    
                    // Only restore if current state appears to be empty or reset
                    if (!Object.values(currentState.metalsValues || {}).some(v => v > 0) &&
                        !Object.values(currentState.cashValues || {})
                          .filter(v => typeof v === 'number')
                          .some(v => v > 0)) {
                      
                      console.log('🚨 EMERGENCY RESTORATION TRIGGERED');
                      
                      // Apply backup directly to store
                      useZakatStore.setState({
                        cashValues: parsedBackup.cashValues,
                        metalsValues: parsedBackup.metalsValues,
                        stockValues: parsedBackup.stockValues,
                        retirement: parsedBackup.retirement,
                        realEstateValues: parsedBackup.realEstateValues,
                        cryptoValues: parsedBackup.cryptoValues,
                        // Restore Hawl status
                        cashHawlMet: parsedBackup.cashHawlMet,
                        metalsHawlMet: parsedBackup.metalsHawlMet,
                        stockHawlMet: parsedBackup.stockHawlMet,
                        retirementHawlMet: parsedBackup.retirementHawlMet,
                        realEstateHawlMet: parsedBackup.realEstateHawlMet,
                        cryptoHawlMet: parsedBackup.cryptoHawlMet,
                      });
                      
                      console.log('🔄 Emergency store restoration complete');
                    } else {
                      console.log('🔄 Current state has values, skipping emergency restoration');
                    }
                  } catch (restoreErr) {
                    console.error('Error during emergency restoration:', restoreErr);
                  }
                }, 500);
              }
            } catch (parseErr) {
              console.error('Error parsing backup data:', parseErr);
            }
          }
        }
      } catch (err) {
        console.error('Error handling visibility change to visible:', err);
      }
    }
  });
}

// Create a global mechanism to force calculator updates on currency change
if (typeof window !== 'undefined') {
  // Listen for currency change events and ensure all calculators update
  window.addEventListener('currency-changed', (event: any) => {
    try {
      // Delay to ensure the currency update has been processed
      setTimeout(() => {
        console.log('🌍 Detected currency change, forcing calculator updates');
        
        const state = useZakatStore.getState();
        
        // 1. Force a recalculation of nisab status first
        if (typeof state.getNisabStatus === 'function') {
          state.getNisabStatus();
          console.log('Nisab status recalculated for new currency');
        }
        
        // 2. Create a synthetic update to ensure UI components react
        // We do this by directly dispatching an event that calculator components should listen for
        window.dispatchEvent(new CustomEvent('zakat-calculators-refresh', {
          detail: {
            currency: state.currency,
            timestamp: Date.now(),
            source: 'currency-change'
          }
        }));
        
        // 3. Schedule a delayed follow-up update to ensure all values have propagated
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('zakat-calculators-refresh', {
            detail: {
              currency: state.currency,
              timestamp: Date.now(),
              source: 'delayed-update'
            }
          }));
        }, 500);
      }, 100);
    } catch (error) {
      console.error('Error processing currency change event:', error);
    }
  });
  
  // Also listen for page visibility changes to refresh calculators when user returns to tab
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // User has returned to the tab - refresh calculators
      console.log('Tab visibility changed to visible, refreshing calculators');
      
      setTimeout(() => {
        const state = useZakatStore.getState();
        
        // Dispatch refresh event
        window.dispatchEvent(new CustomEvent('zakat-calculators-refresh', {
          detail: {
            currency: state.currency,
            timestamp: Date.now(),
            source: 'visibility-change'
          }
        }));
      }, 200);
    }
  });
}

export function StoreHydration() {
  const [isHydrated, setIsHydrated] = useState(false)
  
  useEffect(() => {
    // Make sure we only run this in the browser
    if (typeof window === 'undefined') return
    
    // EMERGENCY BACKUP MECHANISM
    // 1. Set up beforeunload listener to save a backup of calculator state
    const handleBeforeUnload = () => {
      try {
        console.log('🚨 Page unloading - creating emergency backup');
        const currentState = useZakatStore.getState();
        const calculatorState = {
          metalsValues: currentState.metalsValues,
          cashValues: currentState.cashValues,
          stockValues: currentState.stockValues,
          retirement: currentState.retirement,
          realEstateValues: currentState.realEstateValues,
          cryptoValues: currentState.cryptoValues,
          cashHawlMet: currentState.cashHawlMet,
          metalsHawlMet: currentState.metalsHawlMet,
          stockHawlMet: currentState.stockHawlMet,
          retirementHawlMet: currentState.retirementHawlMet,
          realEstateHawlMet: currentState.realEstateHawlMet,
          cryptoHawlMet: currentState.cryptoHawlMet,
        };
        
        // Save to both sessionStorage (for this tab) and localStorage (for cross-tab persistence)
        sessionStorage.setItem('zakat-emergency-backup', JSON.stringify(calculatorState));
        localStorage.setItem('zakat-emergency-backup-timestamp', Date.now().toString());
        
        // Also save individual calculator values directly as a secondary backup
        Object.entries(currentState.metalsValues || {}).forEach(([key, value]) => {
          if (value) sessionStorage.setItem(`zakat-backup-metals-${key}`, value.toString());
        });
        
        Object.entries(currentState.cashValues || {}).forEach(([key, value]) => {
          if (value && key !== 'foreign_currency_entries') 
            sessionStorage.setItem(`zakat-backup-cash-${key}`, value.toString());
        });
        
        console.log('Emergency backup created', calculatorState);
      } catch (error) {
        console.error('Error creating emergency backup:', error);
      }
    };
    
    // Listen for page unload to create backup
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // 2. Check for emergency backup on page load and restore if needed
    const checkForEmergencyBackup = () => {
      try {
        // Check if this is a page refresh/reload (we have a recent backup timestamp)
        const backupTimestamp = localStorage.getItem('zakat-emergency-backup-timestamp');
        const isRecentBackup = backupTimestamp && (Date.now() - parseInt(backupTimestamp)) < 10000; // Within 10 seconds
        
        if (isRecentBackup) {
          console.log('🚨 Recent emergency backup found - attempting restore');
          
          // Try to get backup from sessionStorage
          const backupData = sessionStorage.getItem('zakat-emergency-backup');
          if (backupData) {
            try {
              const parsedBackup = JSON.parse(backupData);
              console.log('Parsed emergency backup:', parsedBackup);
              
              // Delay the restore to ensure the store has initialized
              setTimeout(() => {
                // Get current state
                const currentState = useZakatStore.getState();
                
                // Check if the current state has empty calculator values (indicating loss of state)
                const isEmpty = (
                  // Check if metals values exist and are all zero/empty
                  (!Object.values(currentState.metalsValues || {}).some(value => value > 0)) &&
                  // Check if cash values exist and are all zero/empty (excluding arrays)
                  (!Object.entries(currentState.cashValues || {}).some(([key, value]) => 
                    key !== 'foreign_currency_entries' && typeof value === 'number' && value > 0)) &&
                  // Check if stock values exist and are all zero/empty
                  (!Object.entries(currentState.stockValues || {}).some(([key, value]) => 
                    typeof value === 'number' && value > 0))
                );
                
                if (isEmpty) {
                  console.log('🚨 DETECTED EMPTY STATE AFTER REFRESH - RESTORING FROM BACKUP');
                  
                  // Apply the emergency backup directly
                  useZakatStore.setState(parsedBackup);
                  
                  // Additional safety: wait again and verify the restore happened
                  setTimeout(() => {
                    const stateAfterRestore = useZakatStore.getState();
                    console.log('State after emergency restore:', {
                      metalsValues: stateAfterRestore.metalsValues,
                      cashValues: stateAfterRestore.cashValues,
                      stockValues: stateAfterRestore.stockValues
                    });
                    
                    // If data is still missing, try individual setters
                    if (!stateAfterRestore.metalsValues?.gold_regular && 
                        parsedBackup.metalsValues?.gold_regular) {
                      console.log('Using individual setters as final fallback');
                      
                      // Metals
                      if (typeof stateAfterRestore.setMetalsValue === 'function') {
                        Object.entries(parsedBackup.metalsValues).forEach(([key, value]) => {
                          if (value) {
                            console.log(`Setting metals value ${key} to ${value}`);
                            // @ts-ignore
                            stateAfterRestore.setMetalsValue(key, value);
                          }
                        });
                      }
                      
                      // Cash
                      if (typeof stateAfterRestore.setCashValue === 'function') {
                        Object.entries(parsedBackup.cashValues).forEach(([key, value]) => {
                          if (value && key !== 'foreign_currency_entries') {
                            console.log(`Setting cash value ${key} to ${value}`);
                            // @ts-ignore
                            stateAfterRestore.setCashValue(key, value);
                          }
                        });
                      }
                    }
                  }, 500);
                } else {
                  console.log('Current state is not empty, no need for emergency restore');
                }
              }, 200);
            } catch (parseErr) {
              console.error('Error parsing emergency backup:', parseErr);
            }
          } else {
            console.log('No emergency backup data found in sessionStorage');
            
            // Try individual backups as fallback
            const backupGold = sessionStorage.getItem('zakat-backup-metals-gold_regular');
            const backupCash = sessionStorage.getItem('zakat-backup-cash-cash_on_hand');
            
            if (backupGold || backupCash) {
              console.log('Found individual field backups, attempting restore');
              
              setTimeout(() => {
                const currentState = useZakatStore.getState();
                
                // Check if current values are empty
                if (!currentState.metalsValues?.gold_regular && backupGold && 
                    typeof currentState.setMetalsValue === 'function') {
                  // @ts-ignore
                  currentState.setMetalsValue('gold_regular', parseFloat(backupGold));
                }
                
                if (!currentState.cashValues?.cash_on_hand && backupCash && 
                    typeof currentState.setCashValue === 'function') {
                  // @ts-ignore
                  currentState.setCashValue('cash_on_hand', parseFloat(backupCash));
                }
              }, 500);
            }
          }
        }
      } catch (error) {
        console.error('Error checking for emergency backup:', error);
      }
    };
    
    // Run the emergency backup check immediately
    checkForEmergencyBackup();
    
    // Set the isInitialPageLoad flag on window so other components can check it
    if (typeof window !== 'undefined') {
      // @ts-ignore - This is a custom property we're adding to window
      window.isInitialPageLoad = true;
      
      // After a timeout, we're no longer in the initial page load
      setTimeout(() => {
        isInitialPageLoad = false;
        // @ts-ignore - This is a custom property we're adding to window
        window.isInitialPageLoad = false;
        console.log('Initial page load period ended');
      }, 3000); // 3 seconds should cover hydration and initial rendering
    }
    
    // First attempt: Check if the store instance has a persist API
    try {
      // @ts-ignore - We're checking for the existence of the property
      const persistAPI = useZakatStore.persist
      
      if (persistAPI) {
        try {
          // For Zustand v4/v5 with persist API
          let unsubFinishHydration: (() => void) | null = null
          
          // @ts-ignore - Different versions have different APIs
          if (typeof persistAPI.onFinishHydration === 'function') {
            // @ts-ignore
            unsubFinishHydration = persistAPI.onFinishHydration(() => {
              console.log('Zustand store hydration complete')
              setIsHydrated(true)
              
              // ENHANCEMENT: Validate hydration by checking important values
              validateAndFixHydration()
              
              // Dispatch a custom event to notify components that hydration is complete
              if (!hasDispatchedHydrationEvent) {
                hasDispatchedHydrationEvent = true;
                console.log('Dispatching store-hydration-complete event');
                window.dispatchEvent(new CustomEvent('store-hydration-complete', {
                  detail: { 
                    timestamp: Date.now(),
                    isInitialPageLoad: isInitialPageLoad
                  }
                }));
              }
            })
          }
          
          // Force rehydration to be safe
          // @ts-ignore
          if (typeof persistAPI.rehydrate === 'function') {
            // @ts-ignore
            persistAPI.rehydrate()
          }
          
          // Second attempt: Handle if the store is already hydrated
          // @ts-ignore
          if (typeof persistAPI.hasHydrated === 'function' && persistAPI.hasHydrated()) {
            console.log('Store already hydrated')
            setIsHydrated(true)
            
            // ENHANCEMENT: Validate hydration by checking important values
            validateAndFixHydration()
            
            // Dispatch a custom event to notify components that hydration is complete
            if (!hasDispatchedHydrationEvent) {
              hasDispatchedHydrationEvent = true;
              console.log('Dispatching store-hydration-complete event (already hydrated)');
              window.dispatchEvent(new CustomEvent('store-hydration-complete', {
                detail: { 
                  timestamp: Date.now(),
                  isInitialPageLoad: isInitialPageLoad
                }
              }));
            }
          }
          
          return () => {
            if (unsubFinishHydration && typeof unsubFinishHydration === 'function') {
              unsubFinishHydration()
            }
            
            // Remove event listener on cleanup
            window.removeEventListener('beforeunload', handleBeforeUnload);
          }
        } catch (err) {
          console.error('Error during store hydration via persist API:', err)
        }
      }
    } catch (err) {
      console.error('Error accessing persist API:', err)
    }
    
    // Third attempt: Try to manually hydrate from localStorage
    try {
      const storedData = localStorage.getItem('zakat-store')
      
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData)
          if (parsed && parsed.state) {
            // Only log that we found data - don't try to manually apply it
            // as that might conflict with Zustand's own hydration
            console.log('Found stored data in localStorage:', 
              Object.keys(parsed.state).length, 'state keys')
            
            // If we found localStorage data but the store doesn't have a persist API,
            // we need to manually trigger a re-render to ensure the component updates
            // once the store is hydrated through other means
            if (!isHydrated) {
              const checkInterval = setInterval(() => {
                const currentState = useZakatStore.getState()
                // Check if the store has been hydrated by comparing a key we know should exist
                if (currentState && 
                   (currentState.metalsValues?.gold_regular !== undefined || 
                    currentState.cashValues?.cash_on_hand !== undefined)) {
                  clearInterval(checkInterval)
                  setIsHydrated(true)
                  
                  // ENHANCEMENT: Validate hydration by checking important values
                  validateAndFixHydration()
                  
                  // Dispatch a custom event to notify components that hydration is complete
                  if (!hasDispatchedHydrationEvent) {
                    hasDispatchedHydrationEvent = true;
                    console.log('Dispatching store-hydration-complete event (manual check)');
                    window.dispatchEvent(new CustomEvent('store-hydration-complete', {
                      detail: { 
                        timestamp: Date.now(),
                        isInitialPageLoad: isInitialPageLoad
                      }
                    }));
                  }
                }
              }, 100)
              
              // Clear interval after 3 seconds as a safety measure
              setTimeout(() => clearInterval(checkInterval), 3000)
            }
          }
        } catch (parseErr) {
          console.error('Error parsing stored data:', parseErr)
        }
      } else {
        console.log('No data in localStorage for store')
      }
    } catch (lsErr) {
      console.error('Error accessing localStorage:', lsErr)
    }
    
    // Final fallback: Just mark as hydrated after a timeout
    const timeout = setTimeout(() => {
      if (!isHydrated) {
        console.log('Fallback hydration timeout complete')
        setIsHydrated(true)
        
        // ENHANCEMENT: Validate hydration by checking important values
        validateAndFixHydration()
        
        // Dispatch a custom event to notify components that hydration is complete
        if (!hasDispatchedHydrationEvent) {
          hasDispatchedHydrationEvent = true;
          console.log('Dispatching store-hydration-complete event (fallback)');
          window.dispatchEvent(new CustomEvent('store-hydration-complete', {
            detail: { 
              timestamp: Date.now(),
              isInitialPageLoad: isInitialPageLoad
            }
          }));
        }
      }
    }, 2000)
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [isHydrated])

  // ENHANCEMENT: Added new function to validate and fix hydration issues
  const validateAndFixHydration = () => {
    try {
      // First, get the current store state
      const currentState = useZakatStore.getState()
      
      // Read the stored data from localStorage
      const storedData = localStorage.getItem('zakat-store')
      if (!storedData) return
      
      const parsed = JSON.parse(storedData)
      if (!parsed || !parsed.state) return
      
      const storedState = parsed.state
      
      // Add debugging - record state before any fixes
      console.log('🔍 DEBUG: HYDRATION STATE COMPARISON:')
      console.log('📥 FROM LOCALSTORAGE:', {
        metalsValues: storedState.metalsValues,
        cashValues: storedState.cashValues,
        stockValues: storedState.stockValues,
        retirement: storedState.retirement,
        realEstateValues: storedState.realEstateValues,
        cryptoValues: storedState.cryptoValues,
      })
      console.log('📤 CURRENT STATE:', {
        metalsValues: currentState.metalsValues,
        cashValues: currentState.cashValues,
        stockValues: currentState.stockValues,
        retirement: currentState.retirement,
        realEstateValues: currentState.realEstateValues,
        cryptoValues: currentState.cryptoValues,
      })
      
      // Check for critical discrepancies between stored and current state
      let needsUpdate = false
      const updates: Record<string, any> = {}
      
      // Check if browser was refreshed - this logic helps prevent resets on refresh
      const lastRefreshTime = localStorage.getItem('last-refresh-time');
      const currentTime = Date.now().toString();
      const isPageRefresh = lastRefreshTime && (Date.now() - parseInt(lastRefreshTime)) < 5000;
      
      // Add more detailed debugging for refresh detection
      console.log('🔄 REFRESH DETECTION:', {
        lastRefreshTime: lastRefreshTime ? new Date(parseInt(lastRefreshTime)).toISOString() : 'none',
        currentTime: new Date(parseInt(currentTime)).toISOString(),
        timeDifference: lastRefreshTime ? `${Date.now() - parseInt(lastRefreshTime)}ms` : 'N/A',
        isPageRefresh
      });
      
      // Store current time as last refresh time
      localStorage.setItem('last-refresh-time', currentTime);
      
      console.log('Hydration check - isPageRefresh:', isPageRefresh);
      
      // If this is a browser refresh, be more aggressive about preserving values
      if (isPageRefresh) {
        console.log('Browser refresh detected - ensuring calculator values are preserved');
        
        // When a refresh is detected, always restore from localStorage to prevent disappearing values
        needsUpdate = true; // Force an update regardless of comparison
        
        // For each asset type, restore values from localStorage
        ['metalsValues', 'cashValues', 'stockValues', 'retirement', 'realEstateValues', 'cryptoValues'].forEach(assetType => {
          if (storedState[assetType] && Object.keys(storedState[assetType]).length > 0) {
            console.log(`Restoring ${assetType} values from localStorage`);
            updates[assetType] = storedState[assetType];
          }
        });
        
        // Also restore hawl status
        ['cashHawlMet', 'metalsHawlMet', 'stockHawlMet', 'retirementHawlMet', 'realEstateHawlMet', 'cryptoHawlMet'].forEach(hawlKey => {
          if (storedState[hawlKey] !== undefined) {
            console.log(`Restoring ${hawlKey} status from localStorage`);
            updates[hawlKey] = storedState[hawlKey];
          }
        });
        
        // CRITICAL FIX: Force nisab recalculation on page refresh
        // This ensures nisab values update properly on browser refresh
        console.log('Scheduling nisab recalculation after browser refresh');
        setTimeout(() => {
          try {
            const storeState = useZakatStore.getState();
            
            // Ensure we're working with the correct currency first
            const currentCurrency = storeState.currency || 'USD';
            console.log(`Current currency for nisab recalculation: ${currentCurrency}`);
            
            // First, check if we have valid metal prices
            if (storeState.metalPrices && storeState.metalPrices.gold && storeState.metalPrices.silver) {
              console.log('Found valid metal prices, checking currency match...');
              
              // Check if metal prices currency matches the current currency
              if (storeState.metalPrices.currency === currentCurrency) {
                console.log('Metal prices currency matches current currency, updating nisab directly');
                
                // Use the updateNisabWithPrices function to recalculate nisab with current prices
                if (typeof storeState.updateNisabWithPrices === 'function') {
                  storeState.updateNisabWithPrices(storeState.metalPrices);
                  console.log('Successfully updated nisab with current metal prices on refresh');
                }
              } else {
                console.log(`Metal prices currency (${storeState.metalPrices.currency}) doesn't match current currency (${currentCurrency}), forcing refresh`);
                
                // Currency mismatch - force a refresh with current currency
                if (typeof storeState.forceRefreshNisabForCurrency === 'function') {
                  try {
                    const refreshPromise = storeState.forceRefreshNisabForCurrency(currentCurrency);
                    
                    // Add timeout to ensure we don't hang on this promise
                    const timeoutPromise = new Promise((_, reject) => {
                      setTimeout(() => reject(new Error('Nisab refresh timeout')), 10000);
                    });
                    
                    // Race the refresh against a timeout
                    Promise.race([refreshPromise, timeoutPromise])
                      .then((success) => {
                        console.log(`Successfully refreshed nisab for currency ${currentCurrency} on page refresh`);
                      })
                      .catch(err => {
                        console.error('Failed to refresh nisab on page refresh:', err);
                        
                        // If refresh failed, try to use an offline fallback
                        console.log('Using offline fallback for nisab calculation after refresh failure');
                        
                        // Simple fallback mechanism - calculate nisab values directly
                        console.warn('Using simple fallback calculation for nisab');
                        
                        // Try to get gold and silver prices from the store
                        const goldPricePerGram = storeState.metalPrices?.gold || 65; // Default fallback
                        const silverPricePerGram = storeState.metalPrices?.silver || 0.85; // Default fallback
                        
                        // Calculate nisab based on gold and silver weights
                        const fallbackNisabGold = 85 * goldPricePerGram; // 85g of gold
                        const fallbackNisabSilver = 595 * silverPricePerGram; // 595g of silver
                        const fallbackNisab = Math.min(fallbackNisabGold, fallbackNisabSilver);
                        
                        console.log(`Calculated fallback nisab values:`, {
                          gold: fallbackNisabGold,
                          silver: fallbackNisabSilver,
                          nisab: fallbackNisab,
                          currency: currentCurrency
                        });
                        
                        // Update the store with this fallback data if possible
                        if (typeof storeState.updateNisabWithPrices === 'function' && 
                            storeState.metalPrices) {
                          // Create a metadata object that's compatible with updateNisabWithPrices
                          const fallbackMetalPrices = {
                            gold: goldPricePerGram,
                            silver: silverPricePerGram,
                            currency: currentCurrency,
                            lastUpdated: new Date(),
                            isCache: true,
                            isOfflineFallback: true
                          };
                          
                          storeState.updateNisabWithPrices(fallbackMetalPrices);
                          console.log('Successfully updated nisab with fallback data after refresh failure');
                        }
                      });
                  } catch (err) {
                    console.error('Error initiating nisab refresh:', err);
                  }
                }
              }
            } else {
              console.log('No valid metal prices found, forcing nisab data fetch');
              // As a fallback, try to fetch nisab data directly
              if (typeof storeState.fetchNisabData === 'function') {
                storeState.fetchNisabData()
                  .then(() => console.log('Successfully fetched fresh nisab data on page refresh'))
                  .catch(err => console.error('Failed to fetch nisab data on page refresh:', err));
              }
            }
            
            // Always recalculate nisab status after a short delay, regardless of metal prices
            setTimeout(() => {
              const updatedState = useZakatStore.getState();
              if (typeof updatedState.getNisabStatus === 'function') {
                const status = updatedState.getNisabStatus();
                console.log('Recalculated nisab status after refresh:', status);
                
                // Dispatch an event to notify components of the nisab update
                window.dispatchEvent(new CustomEvent('nisab-updated', {
                  detail: { 
                    refreshed: true,
                    timestamp: Date.now(),
                    currency: updatedState.currency
                  }
                }));
              }
            }, 500);
          } catch (error) {
            console.error('Error during post-refresh nisab recalculation:', error);
          }
        }, 300);
      } else {
        // Regular comparison logic for non-refresh scenarios
        // For each asset type, check if we need to restore values
        ['metalsValues', 'cashValues', 'stockValues', 'retirement', 'realEstateValues', 'cryptoValues'].forEach(assetType => {
          if (storedState[assetType] && Object.keys(storedState[assetType]).length > 0) {
            // Check if values differ or are missing
            const hasProperty = assetType in currentState;
            if (!hasProperty || 
                JSON.stringify(currentState[assetType as keyof typeof currentState]) !== 
                JSON.stringify(storedState[assetType])) {
              console.log(`Restoring ${assetType} values from localStorage`);
              needsUpdate = true;
              updates[assetType] = storedState[assetType];
            }
          }
        });
        
        // Also restore hawl status
        ['cashHawlMet', 'metalsHawlMet', 'stockHawlMet', 'retirementHawlMet', 'realEstateHawlMet', 'cryptoHawlMet'].forEach(hawlKey => {
          if (storedState[hawlKey] !== undefined) {
            const hasProperty = hawlKey in currentState;
            if (hasProperty && currentState[hawlKey as keyof typeof currentState] !== storedState[hawlKey]) {
              console.log(`Restoring ${hawlKey} status from localStorage`);
              needsUpdate = true;
              updates[hawlKey] = storedState[hawlKey];
            }
          }
        });
      }
      
      // If we found issues, fix them by manually updating the store
      if (needsUpdate) {
        console.log('Fixing hydration issues with manual updates:', updates)
        
        // Apply the updates to the store
        useZakatStore.setState(updates)
        
        // Additional handling for specific values using their setters
        if (updates.metalsValues && typeof currentState.setMetalsValue === 'function') {
          Object.entries(updates.metalsValues).forEach(([key, value]) => {
            // @ts-ignore - Type is hard to correctly narrow here
            currentState.setMetalsValue(key, value)
          })
        }
        
        // If cash values were updated, apply them using the setter
        if (updates.cashValues && typeof currentState.setCashValue === 'function') {
          Object.entries(updates.cashValues).forEach(([key, value]) => {
            // @ts-ignore - Type is hard to correctly narrow here
            currentState.setCashValue(key, value)
          })
        }
        
        // If nisab data was updated, ensure we update the nisab status
        if (updates.nisabData && typeof currentState.getNisabStatus === 'function') {
          // Force a nisab status update
          currentState.getNisabStatus()
        }
        
        console.log('Hydration fixes applied')
      }
    } catch (error) {
      console.error('Error validating or fixing hydration:', error)
    }
  }

  // We don't render anything - this is just for hydration
  return null
} 