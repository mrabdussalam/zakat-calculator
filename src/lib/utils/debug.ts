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