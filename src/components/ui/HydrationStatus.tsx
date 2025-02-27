'use client'

import { useEffect, useState } from 'react'
import { useZakatStore } from '@/store/zakatStore'
import { useStoreHydration } from '@/hooks/useStoreHydration'
import { checkLocalStorage, logStoreState, testLocalStorage, testPartialize, testStoreSet } from '@/lib/utils/debug'

/**
 * Component that displays the current hydration status
 * Useful for debugging hydration issues
 */
export function HydrationStatus() {
    const isHydrated = useStoreHydration()
    const [storeState, setStoreState] = useState<any>(null)
    const [localStorageData, setLocalStorageData] = useState<any>(null)
    const [lsTestResult, setLsTestResult] = useState<boolean | null>(null)
    const [partializeResult, setPartializeResult] = useState<any>(null)
    const [storeSetResult, setStoreSetResult] = useState<boolean | null>(null)
    const [storeKeys, setStoreKeys] = useState<number>(0)
    const [persistStatus, setPersistStatus] = useState<string>('Unknown')
    const [globalFlag, setGlobalFlag] = useState<string>('Not Set')
    const [currency, setCurrency] = useState<string>('Unknown')
    const [debugInfo, setDebugInfo] = useState<string | null>(null)

    // Update store state periodically
    useEffect(() => {
        if (typeof window === 'undefined') return

        const updateStoreState = () => {
            // Check the store state
            setStoreState({
                hasHydrated: useZakatStore.persist.hasHydrated(),
                globalFlag: !!(window as any).zakatStoreHydrationComplete,
                storeKeys: Object.keys(useZakatStore.getState()).length,
                currency: useZakatStore.getState().currency,
                timestamp: new Date().toISOString()
            })

            // Check localStorage directly
            const lsData = checkLocalStorage()
            setLocalStorageData(lsData)

            // Log the full store state
            logStoreState(useZakatStore, 'HydrationStatus component')
        }

        // Update immediately
        updateStoreState()

        // Then update every second
        const interval = setInterval(updateStoreState, 1000)

        return () => clearInterval(interval)
    }, [])

    // Function to handle localStorage test
    const handleTestLocalStorage = () => {
        const result = testLocalStorage()
        setLsTestResult(result)
    }

    // Function to test partialize
    const handleTestPartialize = () => {
        const result = testPartialize(useZakatStore)
        setPartializeResult(result)
    }

    // Function to test store set
    const handleTestStoreSet = () => {
        const result = testStoreSet(useZakatStore)
        setStoreSetResult(result !== null)
    }

    // Function to manually save current state to localStorage
    const handleManualSave = () => {
        try {
            // Get current state
            const currentState = useZakatStore.getState()

            // Create a structure similar to what Zustand persist would create
            const storeData = {
                version: 1,
                state: {
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
                    metalPrices: currentState.metalPrices,
                    nisabData: currentState.nisabData,
                    currency: currentState.currency
                }
            }

            // Save to localStorage
            localStorage.setItem('zakat-store', JSON.stringify(storeData))

            // Update our display
            const lsData = checkLocalStorage()
            setLocalStorageData(lsData)

            alert('State manually saved to localStorage')
        } catch (e) {
            console.error('Error manually saving state:', e)
            alert(`Error saving state: ${e}`)
        }
    }

    // Always return null to hide the component while preserving functionality
    return null

    /* Original UI - commented out but preserved for future use
    // Only render in development
    if (process.env.NODE_ENV === 'production') return null

    return (
        <div className="fixed bottom-4 left-4 z-50 p-4 bg-white/90 border border-gray-200 rounded-lg shadow-lg text-xs font-mono max-w-xs overflow-auto max-h-96">
            <h3 className="font-bold text-sm mb-2">Hydration Status</h3>
            <div className="space-y-1">
                <p>Hook Status: <span className={isHydrated ? "text-green-600" : "text-red-600"}>{isHydrated ? "Hydrated" : "Not Hydrated"}</span></p>
                {storeState && (
                    <>
                        <p>Persist API: <span className={storeState.hasHydrated ? "text-green-600" : "text-red-600"}>{storeState.hasHydrated ? "Hydrated" : "Not Hydrated"}</span></p>
                        <p>Global Flag: <span className={storeState.globalFlag ? "text-green-600" : "text-red-600"}>{storeState.globalFlag ? "Set" : "Not Set"}</span></p>
                        <p>Currency: {storeState.currency || "Not Set"}</p>
                        <p>Store Keys: {storeState.storeKeys || 0}</p>

                        <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="font-bold">LocalStorage:</p>
                            {localStorageData ? (
                                <>
                                    <p>Version: {localStorageData.version}</p>
                                    <p>State Keys: {Object.keys(localStorageData.state || {}).length}</p>
                                    <div className="mt-1">
                                        <p className="font-bold">Calculator Values:</p>
                                        <p>Cash: {localStorageData.state?.cashValues ? "Present" : "Missing"}</p>
                                        <p>Metals: {localStorageData.state?.metalsValues ? "Present" : "Missing"}</p>
                                        <p>Stocks: {localStorageData.state?.stockValues ? "Present" : "Missing"}</p>
                                        <p>Real Estate: {localStorageData.state?.realEstateValues ? "Present" : "Missing"}</p>
                                        <p>Crypto: {localStorageData.state?.cryptoValues ? "Present" : "Missing"}</p>
                                        <p>Retirement: {localStorageData.state?.retirement ? "Present" : "Missing"}</p>
                                    </div>
                                </>
                            ) : (
                                <p className="text-red-600">No data in localStorage</p>
                            )}
                        </div>

                        {lsTestResult !== null && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="font-bold">LocalStorage Test:</p>
                                <p className={lsTestResult ? "text-green-600" : "text-red-600"}>
                                    {lsTestResult ? "PASSED" : "FAILED"}
                                </p>
                            </div>
                        )}

                        {partializeResult && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="font-bold">Partialize Test:</p>
                                <p>Total Keys: {partializeResult.summary.totalKeys}</p>
                                <p>Keys in Store: {partializeResult.summary.keysInCurrentState}</p>
                                <p>Keys in Storage: {partializeResult.summary.keysInPersistedState}</p>
                                <p>Missing Keys: {partializeResult.summary.missingKeys}</p>
                                <p>Missing Values: {partializeResult.summary.missingValuesKeys}</p>
                                <p>Mismatched: {partializeResult.summary.mismatchedValues}</p>
                            </div>
                        )}

                        {storeSetResult !== null && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="font-bold">Store Set Test:</p>
                                <p className={storeSetResult ? "text-green-600" : "text-red-600"}>
                                    {storeSetResult ? "RUNNING" : "FAILED"}
                                </p>
                                <p className="text-xs text-gray-500">Check console for details</p>
                            </div>
                        )}
                    </>
                )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                <button
                    onClick={() => {
                        // Force rehydration
                        useZakatStore.persist.rehydrate()
                        // Log the current state
                        logStoreState(useZakatStore, 'Manual rehydration')
                    }}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                >
                    Force Rehydrate
                </button>
                <button
                    onClick={handleTestLocalStorage}
                    className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                >
                    Test localStorage
                </button>
                <button
                    onClick={handleManualSave}
                    className="px-2 py-1 bg-purple-500 text-white rounded text-xs"
                >
                    Manual Save
                </button>
                <button
                    onClick={handleTestPartialize}
                    className="px-2 py-1 bg-yellow-500 text-white rounded text-xs"
                >
                    Test Partialize
                </button>
                <button
                    onClick={handleTestStoreSet}
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                >
                    Test Store Set
                </button>
            </div>
        </div>
    )
    */
} 