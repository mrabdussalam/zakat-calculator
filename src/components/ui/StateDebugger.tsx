'use client'

import { useState, useEffect } from 'react'
import { useZakatStore } from '@/store/zakatStore'
import { Button } from './button'

export function StateDebugger() {
  const [localStorageState, setLocalStorageState] = useState<string | null>(null)
  const [showDebugger, setShowDebugger] = useState(false)

  // Load current store values from localStorage for comparison
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedData = localStorage.getItem('zakat-store')
        setLocalStorageState(storedData)
      } catch (err) {
        console.error('Error reading from localStorage:', err)
      }
    }
  }, [])

  // Get current store state
  const currentState = useZakatStore.getState()

  // Function to manually trigger store hydration
  const forceHydration = () => {
    try {
      // Access the persist API if it exists - commented out but preserved
      /*
      // @ts-expect-error - Access the persist API if it exists
      if (useZakatStore.persist && typeof useZakatStore.persist.rehydrate === 'function') {
        // @ts-expect-error
        useZakatStore.persist.rehydrate()
        alert('Store rehydration triggered')
      } else {
        alert('Store does not have persist.rehydrate method')
      }
      */
    } catch (error) {
      console.error('Error during store hydration:', error)
      alert(`Hydration error: ${error}`)
    }
  }

  // Toggle debug display
  const toggleDebugger = () => {
    setShowDebugger(!showDebugger)
  }

  // Always return null to hide the component while preserving functionality
  return null

  /* Original UI - commented out but preserved for future use
  if (!showDebugger) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleDebugger}
          className="bg-white opacity-80 hover:opacity-100"
        >
          Debug State
        </Button>
      </div>
    )
  }
  
  return (
    <div className="fixed top-0 right-0 w-96 h-screen bg-white p-4 overflow-auto z-50 border-l border-gray-200 shadow-lg">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold">State Debugger</h3>
        <Button variant="outline" size="sm" onClick={toggleDebugger}>Close</Button>
      </div>
      
      <div className="space-y-4">
        <Button onClick={forceHydration} className="w-full">Force Rehydrate Store</Button>
        
        <div>
          <h4 className="font-medium mb-2">LocalStorage Status</h4>
          <div className="p-2 bg-gray-100 rounded-md text-xs">
            {localStorageState ? (
              <div>
                <div className="text-green-600 mb-2">✓ Data found in localStorage</div>
                <details>
                  <summary>View localStorage data</summary>
                  <pre className="mt-2 overflow-auto max-h-40">
                    {JSON.stringify(JSON.parse(localStorageState), null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="text-red-600">✗ No data found in localStorage</div>
            )}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Current Store State</h4>
          <div className="p-2 bg-gray-100 rounded-md text-xs">
            <details>
              <summary>View current store state</summary>
              <pre className="mt-2 overflow-auto max-h-40">
                {JSON.stringify(currentState, null, 2)}
              </pre>
            </details>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Testing</h4>
          <Button 
            onClick={() => {
              // Try to set a test value in the store
              try {
                // @ts-expect-error - We don't know exact store shape
                useZakatStore.setState({ _debugTestValue: new Date().toISOString() })
                alert('Test value set in store')
              } catch (err) {
                console.error('Error setting test value:', err)
                alert(`Error: ${err}`)
              }
            }}
            className="w-full mb-2"
          >
            Set Test Value
          </Button>
          
          <Button 
            onClick={() => {
              // Clear localStorage and reload
              try {
                localStorage.clear()
                alert('LocalStorage cleared. Page will reload.')
                window.location.reload()
              } catch (err) {
                console.error('Error clearing localStorage:', err)
                alert(`Error: ${err}`)
              }
            }}
            variant="destructive"
            className="w-full"
          >
            Clear Storage & Reload
          </Button>
        </div>
      </div>
    </div>
  )
  */
} 