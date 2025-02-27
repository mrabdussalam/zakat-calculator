'use client'

import { useState, useEffect } from 'react'
import { useZakatStore } from '@/store/zakatStore'
import { Button } from './button'
import { Input } from './form/input'
import { Label } from './label'
import { useStoreHydration } from '@/hooks/useStoreHydration'

/**
 * Component to test hydration and persistence
 * This component allows setting and retrieving values from the store
 */
export function HydrationTester() {
    const isHydrated = useStoreHydration()
    const [testValue, setTestValue] = useState('')
    const [storeValue, setStoreValue] = useState<number | null>(null)
    const [lastSaved, setLastSaved] = useState<string | null>(null)
    const [debugInfo, setDebugInfo] = useState<string | null>(null)

    // Get the setCashValue function from the store
    const { setCashValue, cashValues, forcePersist } = useZakatStore()

    // Update the displayed store value whenever cashValues changes
    useEffect(() => {
        if (cashValues) {
            setStoreValue(cashValues.cash_on_hand || 0)
        }
    }, [cashValues])

    // Function to save the test value to the store
    const handleSaveToStore = () => {
        const numValue = parseFloat(testValue)
        if (!isNaN(numValue)) {
            // Save to the store
            setCashValue('cash_on_hand', numValue)
            setLastSaved(new Date().toISOString())
            console.log(`HydrationTester: Saved value ${numValue} to store`)

            // Check localStorage after a short delay to ensure it's updated
            setTimeout(() => {
                const result = checkLocalStorage()
                if (result && result.state && result.state.cashValues) {
                    const storedValue = result.state.cashValues.cash_on_hand
                    if (storedValue === numValue) {
                        setDebugInfo(`✅ Value ${numValue} successfully persisted to localStorage`)
                    } else {
                        setDebugInfo(`❌ Value mismatch! Store: ${numValue}, localStorage: ${storedValue}`)
                    }
                } else {
                    setDebugInfo(`❌ Failed to find value in localStorage`)
                }
            }, 500)
        }
    }

    // Function to force a store update
    const handleForceUpdate = () => {
        // Get the current value and add 1
        const currentValue = cashValues.cash_on_hand || 0
        const newValue = currentValue + 1

        // Update the store
        setCashValue('cash_on_hand', newValue)
        setLastSaved(new Date().toISOString())
        console.log(`HydrationTester: Forced update to ${newValue}`)

        // Check localStorage after a short delay
        setTimeout(checkLocalStorage, 500)
    }

    // Function to directly check localStorage
    const checkLocalStorage = () => {
        try {
            const storeData = localStorage.getItem('zakat-store')
            if (storeData) {
                const parsed = JSON.parse(storeData)
                console.log('LocalStorage content:', parsed)

                // Extract and display cash_on_hand value from localStorage
                const cashOnHand = parsed.state?.cashValues?.cash_on_hand
                setDebugInfo(`LocalStorage: cash_on_hand = ${cashOnHand !== undefined ? cashOnHand : 'not found'}`)

                // Log more details about the stored state
                if (parsed.state) {
                    console.log('Stored state details:', {
                        hasCashValues: !!parsed.state.cashValues,
                        cashOnHand: parsed.state.cashValues?.cash_on_hand,
                        version: parsed.version,
                        timestamp: new Date(parsed.timestamp || 0).toISOString()
                    })
                }

                return parsed
            } else {
                setDebugInfo('LocalStorage: zakat-store not found')
                console.warn('zakat-store not found in localStorage')
            }
        } catch (error: any) {
            setDebugInfo(`LocalStorage error: ${error.message}`)
            console.error('Error reading from localStorage:', error)
        }
        return null
    }

    // Function to test localStorage directly
    const testLocalStorage = () => {
        try {
            // Write a test value directly to localStorage
            const testObj = { test: 'value', timestamp: Date.now() }
            localStorage.setItem('zakat-test-item', JSON.stringify(testObj))

            // Read it back
            const readBack = localStorage.getItem('zakat-test-item')
            const success = readBack !== null

            setDebugInfo(`Direct localStorage test: ${success ? 'SUCCESS' : 'FAILED'}`)
            console.log('Direct localStorage test:', success ? 'SUCCESS' : 'FAILED')

            // Clean up
            localStorage.removeItem('zakat-test-item')
        } catch (error: any) {
            setDebugInfo(`LocalStorage test error: ${error.message}`)
            console.error('Error during localStorage test:', error)
        }
    }

    // Test the partialize function
    const testPartialize = () => {
        try {
            // Get current store state
            const state = useZakatStore.getState()
            console.log('Current store state:', state)

            // Check what's in localStorage
            const stored = checkLocalStorage()

            if (stored && stored.state) {
                // Compare values
                const storeValue = state.cashValues.cash_on_hand
                const storedValue = stored.state.cashValues?.cash_on_hand

                setDebugInfo(`Partialize test: Store=${storeValue}, localStorage=${storedValue}`)
            } else {
                setDebugInfo('Partialize test: No data in localStorage')
            }
        } catch (error: any) {
            setDebugInfo(`Partialize test error: ${error.message}`)
            console.error('Error during partialize test:', error)
        }
    }

    // Test store.set function
    const testStoreSet = () => {
        try {
            // Set a test value using the store's set function directly
            const testValue = Date.now()

            // Use the store's setState method
            useZakatStore.setState(state => {
                console.log('Current state before update:', {
                    cashValues: state.cashValues,
                    hasCashValues: !!state.cashValues
                })

                return {
                    ...state,
                    cashValues: {
                        ...state.cashValues,
                        cash_on_hand: testValue
                    }
                }
            })

            setDebugInfo(`Set test value: ${testValue}`)
            console.log(`Set test value directly: ${testValue}`)

            // Check localStorage after a short delay
            setTimeout(() => {
                const result = checkLocalStorage()
                if (result && result.state && result.state.cashValues) {
                    const storedValue = result.state.cashValues.cash_on_hand
                    if (storedValue === testValue) {
                        setDebugInfo(`✅ Direct setState: ${testValue} successfully persisted`)
                    } else {
                        setDebugInfo(`❌ Direct setState mismatch! Set: ${testValue}, stored: ${storedValue}`)
                    }
                }
            }, 500)
        } catch (error: any) {
            setDebugInfo(`Store set test error: ${error.message}`)
            console.error('Error during store set test:', error)
        }
    }

    // Force a manual persist
    const forceManualPersist = () => {
        try {
            // Get the current state
            const currentState = useZakatStore.getState()

            // Log the current state
            console.log('Current state before manual persist:', {
                cashValues: currentState.cashValues,
                hasCashValues: !!currentState.cashValues
            })

            // Use the store's forcePersist function
            forcePersist()

            setDebugInfo(`Manually triggered persist at ${new Date().toISOString()}`)

            // Check localStorage after a short delay
            setTimeout(checkLocalStorage, 500)
        } catch (error: any) {
            setDebugInfo(`Manual persist error: ${error.message}`)
            console.error('Error during manual persist:', error)
        }
    }

    // Only render in development
    if (process.env.NODE_ENV === 'production') return null

    // Comment out the UI rendering but keep the component and its functionality
    return null

    /* Original UI - commented out but preserved for future use
    return (
        <div className="fixed top-4 right-4 z-50 p-4 bg-white/90 border border-gray-200 rounded-lg shadow-lg max-w-xs">
            <h3 className="font-bold text-sm mb-2">Hydration Tester</h3>

            <div className="space-y-4">
                <div>
                    <p>Hydration Status: <span className={isHydrated ? "text-green-600" : "text-red-600"}>{isHydrated ? "Hydrated" : "Not Hydrated"}</span></p>
                    <p>Current Store Value: <span className="font-bold">{storeValue !== null ? storeValue : 'N/A'}</span></p>
                    {lastSaved && <p className="text-xs text-gray-500">Last saved: {lastSaved}</p>}
                    {debugInfo && <p className="text-xs text-amber-600 mt-1 break-words">{debugInfo}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="test-value">Test Value</Label>
                    <Input
                        id="test-value"
                        type="number"
                        value={testValue}
                        onChange={(e) => setTestValue(e.target.value)}
                        placeholder="Enter a number"
                    />
                </div>

                <div className="flex space-x-2">
                    <Button
                        onClick={handleSaveToStore}
                        disabled={!isHydrated || testValue === ''}
                        size="sm"
                    >
                        Save to Store
                    </Button>

                    <Button
                        onClick={handleForceUpdate}
                        disabled={!isHydrated}
                        variant="outline"
                        size="sm"
                    >
                        +1
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                    <Button onClick={checkLocalStorage} size="sm" variant="secondary">
                        Check Storage
                    </Button>
                    <Button onClick={testLocalStorage} size="sm" variant="secondary">
                        Test Storage
                    </Button>
                    <Button onClick={testPartialize} size="sm" variant="secondary">
                        Test Partialize
                    </Button>
                    <Button onClick={testStoreSet} size="sm" variant="secondary">
                        Test Store Set
                    </Button>
                    <Button onClick={forceManualPersist} size="sm" variant="secondary">
                        Force Persist
                    </Button>
                </div>

                <div className="text-xs text-gray-500 mt-2">
                    <p>This component tests store persistence.</p>
                    <p>Enter a value, save it, then refresh the page to see if it persists.</p>
                </div>
            </div>
        </div>
    )
    */
} 