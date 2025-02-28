'use client'

/**
 * Utility functions for debugging hydration and state issues
 */

/**
 * Logs the current state of the store with a prefix for identification
 * @param store The Zustand store to log
 * @param prefix A prefix to identify the log
 */
export function logStoreState(store: any, source: string = 'unknown') {
    try {
        const state = store.getState()
        console.log(`[${source}] Store state:`, {
            keys: Object.keys(state),
            cashValues: state.cashValues,
            metalsValues: state.metalsValues,
            stockValues: state.stockValues,
            realEstateValues: state.realEstateValues,
            cryptoValues: state.cryptoValues,
            retirement: state.retirement,
            currency: state.currency,
            timestamp: new Date().toISOString()
        })
        return state
    } catch (error: any) {
        console.error(`[${source}] Error logging store state:`, error)
        return null
    }
}

/**
 * Logs information about the hydration status
 * @param componentName The name of the component logging the information
 */
export function logHydrationStatus(source: string = 'unknown') {
    try {
        if (typeof window === 'undefined') {
            console.log(`[${source}] Running on server - no hydration status available`)
            return null
        }

        const win = window as any
        const status = {
            zakatStoreHydrationComplete: !!win.zakatStoreHydrationComplete,
            hasDispatchedHydrationEvent: !!win.hasDispatchedHydrationEvent,
            timestamp: new Date().toISOString()
        }

        console.log(`[${source}] Hydration status:`, status)
        return status
    } catch (error: any) {
        console.error(`[${source}] Error logging hydration status:`, error)
        return null
    }
}

/**
 * Directly checks localStorage for the zakat-store data
 * This bypasses Zustand's API to see what's actually stored
 */
export function checkLocalStorage() {
    try {
        if (typeof window === 'undefined') {
            console.log('Running on server - localStorage not available')
            return null
        }

        const storeData = localStorage.getItem('zakat-store')
        if (storeData) {
            const parsed = JSON.parse(storeData)
            console.log('LocalStorage content:', parsed)

            // Log details about the stored state
            if (parsed.state) {
                console.log('LocalStorage state details:', {
                    cashValues: parsed.state.cashValues ? 'Present' : 'Missing',
                    metalsValues: parsed.state.metalsValues ? 'Present' : 'Missing',
                    stockValues: parsed.state.stockValues ? 'Present' : 'Missing',
                    realEstateValues: parsed.state.realEstateValues ? 'Present' : 'Missing',
                    cryptoValues: parsed.state.cryptoValues ? 'Present' : 'Missing',
                    retirement: parsed.state.retirement ? 'Present' : 'Missing',
                    currency: parsed.state.currency || 'Not set'
                })
            }

            return parsed
        } else {
            console.warn('zakat-store not found in localStorage')
            return null
        }
    } catch (error: any) {
        console.error('Error reading from localStorage:', error)
        return null
    }
}

/**
 * Tests writing to localStorage directly
 * This helps diagnose if there are issues with localStorage access
 */
export function testLocalStorage() {
    try {
        if (typeof window === 'undefined') {
            console.log('Running on server - localStorage not available')
            return false
        }

        // Write a test value
        const testObj = { test: 'value', timestamp: Date.now() }
        localStorage.setItem('zakat-test-item', JSON.stringify(testObj))

        // Read it back
        const readBack = localStorage.getItem('zakat-test-item')
        const success = readBack !== null

        console.log('Direct localStorage test:', success ? 'SUCCESS' : 'FAILED')

        // Clean up
        localStorage.removeItem('zakat-test-item')

        return success
    } catch (error: any) {
        console.error('Error during localStorage test:', error)
        return false
    }
}

/**
 * Tests the partialize function by comparing what's in the store vs what's in localStorage
 * @param store The Zustand store to test
 */
export function testPartialize(store: any) {
    try {
        if (typeof window === 'undefined') {
            console.log('Running on server - cannot test partialize')
            return null
        }

        // Get current store state
        const currentState = store.getState()
        console.log('Current store state:', currentState)

        // Get persisted state from localStorage
        const storeData = localStorage.getItem('zakat-store')
        if (!storeData) {
            console.warn('No persisted state found in localStorage')
            return {
                success: false,
                error: 'No persisted state found',
                summary: {
                    totalKeys: 0,
                    keysInCurrentState: Object.keys(currentState).length,
                    keysInPersistedState: 0,
                    missingKeys: 0,
                    missingValuesKeys: 0,
                    mismatchedValues: 0
                }
            }
        }

        // Parse persisted state
        const parsed = JSON.parse(storeData)
        const persistedState = parsed.state || {}

        // Compare states
        const currentStateKeys = Object.keys(currentState)
        const persistedStateKeys = Object.keys(persistedState)

        // Check which keys should be persisted according to partialize
        const partializedState = store.persist.getOptions().partialize(currentState)
        const partializedKeys = Object.keys(partializedState)

        console.log('Partialized keys:', partializedKeys)

        // Check for missing keys
        const missingKeys = partializedKeys.filter(key => !persistedStateKeys.includes(key))

        // Check for missing values (keys exist but values are null/undefined)
        const missingValuesKeys = partializedKeys.filter(key =>
            persistedStateKeys.includes(key) &&
            (persistedState[key] === null || persistedState[key] === undefined)
        )

        // Check for mismatched values (simple check - just comparing if objects exist)
        const mismatchedValues = partializedKeys.filter(key =>
            persistedStateKeys.includes(key) &&
            !!currentState[key] !== !!persistedState[key]
        )

        const result = {
            success: missingKeys.length === 0 && missingValuesKeys.length === 0,
            currentState: partializedState,
            persistedState,
            missingKeys,
            missingValuesKeys,
            mismatchedValues,
            summary: {
                totalKeys: partializedKeys.length,
                keysInCurrentState: currentStateKeys.length,
                keysInPersistedState: persistedStateKeys.length,
                missingKeys: missingKeys.length,
                missingValuesKeys: missingValuesKeys.length,
                mismatchedValues: mismatchedValues.length
            }
        }

        console.log('Partialize test result:', result)
        return result
    } catch (error: any) {
        console.error('Error during partialize test:', error)
        return {
            success: false,
            error: error.message,
            summary: {
                totalKeys: 0,
                keysInCurrentState: 0,
                keysInPersistedState: 0,
                missingKeys: 0,
                missingValuesKeys: 0,
                mismatchedValues: 0
            }
        }
    }
}

/**
 * Tests the store's set function by setting a test value and checking if it persists
 * @param store The Zustand store to test
 */
export function testStoreSet(store: any) {
    try {
        if (typeof window === 'undefined') {
            console.log('Running on server - cannot test store set')
            return null
        }

        // Generate a unique test value
        const testValue = Date.now()

        console.log(`Setting test value in store: ${testValue}`)

        // Update the store directly
        store.setState((state: any) => ({
            ...state,
            cashValues: {
                ...state.cashValues,
                cash_on_hand: testValue
            }
        }))

        // Wait a bit for the middleware to persist the change
        setTimeout(() => {
            // Check if the value was persisted
            const storeData = localStorage.getItem('zakat-store')
            if (storeData) {
                const parsed = JSON.parse(storeData)
                const persistedValue = parsed.state?.cashValues?.cash_on_hand

                console.log(`Persisted value in localStorage: ${persistedValue}`)
                console.log(`Test ${persistedValue === testValue ? 'PASSED' : 'FAILED'}`)

                return persistedValue === testValue
            } else {
                console.warn('No persisted state found after update')
                return false
            }
        }, 500)

        return testValue
    } catch (error: any) {
        console.error('Error during store set test:', error)
        return null
    }
}

// Debug utility for the application
// This file provides structured logging with different log levels and sampling

// Configuration for debug logging
export const DEBUG_CONFIG = {
    // Enable/disable all logging
    enabled: process.env.NODE_ENV !== 'production',

    // Log levels
    levels: {
        error: true,      // Always log errors
        warn: true,       // Always log warnings
        info: true,       // General information
        debug: false,     // Detailed debug info (disabled by default)
        trace: false      // Very verbose tracing (disabled by default)
    },

    // Sampling rates (0-1) to reduce log volume
    sampling: {
        error: 1,         // Log all errors
        warn: 1,          // Log all warnings
        info: 0.5,        // Log 50% of info messages
        debug: 0.1,       // Log 10% of debug messages
        trace: 0.01       // Log 1% of trace messages
    },

    // Categories to enable/disable
    categories: {
        currency: true,
        metals: true,
        nisab: true,
        store: true,
        api: true,
        ui: false,        // Disable UI logs by default
        calculation: true,
        hydration: true
    },

    // Maximum log frequency (in ms) to prevent log flooding
    throttle: {
        default: 1000,    // Default throttle of 1 second
        currency: 5000,   // Currency logs throttled to once per 5 seconds
        metals: 2000,     // Metals logs throttled to once per 2 seconds
        calculation: 2000 // Calculation logs throttled to once per 2 seconds
    }
};

// Timestamp cache to implement throttling
const lastLogTime: Record<string, number> = {};

// Check if a log should be sampled based on level
const shouldSample = (level: keyof typeof DEBUG_CONFIG.sampling): boolean => {
    const rate = DEBUG_CONFIG.sampling[level];
    return Math.random() <= rate;
};

// Check if a log should be throttled based on category
const isThrottled = (category: string): boolean => {
    const now = Date.now();
    const throttleTime = DEBUG_CONFIG.throttle[category as keyof typeof DEBUG_CONFIG.throttle] ||
        DEBUG_CONFIG.throttle.default;

    const lastTime = lastLogTime[category] || 0;
    if (now - lastTime < throttleTime) {
        return true;
    }

    // Update last log time
    lastLogTime[category] = now;
    return false;
};

// Main debug logger function
export const debug = {
    error: (message: string, data?: any, category = 'general') => {
        if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.levels.error) return;

        // Errors are always logged (no sampling)
        console.error(`[ERROR][${category}] ${message}`, data || '');
    },

    warn: (message: string, data?: any, category = 'general') => {
        if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.levels.warn) return;

        // Check category filter
        if (category in DEBUG_CONFIG.categories &&
            !DEBUG_CONFIG.categories[category as keyof typeof DEBUG_CONFIG.categories]) {
            return;
        }

        // Warnings use sampling
        if (!shouldSample('warn')) return;

        console.warn(`[WARN][${category}] ${message}`, data || '');
    },

    info: (message: string, data?: any, category = 'general') => {
        if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.levels.info) return;

        // Check category filter
        if (category in DEBUG_CONFIG.categories &&
            !DEBUG_CONFIG.categories[category as keyof typeof DEBUG_CONFIG.categories]) {
            return;
        }

        // Check throttling
        if (isThrottled(category)) return;

        // Info uses sampling
        if (!shouldSample('info')) return;

        console.log(`[INFO][${category}] ${message}`, data || '');
    },

    debug: (message: string, data?: any, category = 'general') => {
        if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.levels.debug) return;

        // Check category filter
        if (category in DEBUG_CONFIG.categories &&
            !DEBUG_CONFIG.categories[category as keyof typeof DEBUG_CONFIG.categories]) {
            return;
        }

        // Check throttling
        if (isThrottled(category)) return;

        // Debug uses sampling
        if (!shouldSample('debug')) return;

        console.log(`[DEBUG][${category}] ${message}`, data || '');
    },

    trace: (message: string, data?: any, category = 'general') => {
        if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.levels.trace) return;

        // Check category filter
        if (category in DEBUG_CONFIG.categories &&
            !DEBUG_CONFIG.categories[category as keyof typeof DEBUG_CONFIG.categories]) {
            return;
        }

        // Check throttling
        if (isThrottled(category)) return;

        // Trace uses sampling
        if (!shouldSample('trace')) return;

        console.log(`[TRACE][${category}] ${message}`, data || '');
    },

    // Special method for critical errors that should always be logged
    critical: (message: string, error?: any) => {
        if (!DEBUG_CONFIG.enabled) return;

        // Format error stack if available
        const errorDetails = error instanceof Error
            ? `\n${error.name}: ${error.message}\n${error.stack || 'No stack trace'}`
            : error || '';

        console.error(`[CRITICAL] ${message}`, errorDetails);
    }
};

// Helper to enable/disable debug categories at runtime
export const setDebugCategories = (categories: Partial<typeof DEBUG_CONFIG.categories>) => {
    Object.assign(DEBUG_CONFIG.categories, categories);
};

// Helper to enable/disable debug levels at runtime
export const setDebugLevels = (levels: Partial<typeof DEBUG_CONFIG.levels>) => {
    Object.assign(DEBUG_CONFIG.levels, levels);
};

// Export the debug object as default
export default debug; 