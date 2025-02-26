'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useZakatStore } from '@/store/zakatStore'
import { ForeignCurrencyEntry } from '@/store/types'
import { useForeignCurrency } from '@/hooks/useForeignCurrency'
import { useCurrencyStore } from '@/lib/services/currency'

export default function ResetTest() {
  const { 
    cashValues, 
    resetCashValues, 
    setCashValue,
    currency
  } = useZakatStore()
  
  const { convertAmount } = useCurrencyStore()
  
  // Monitor hook state during tests
  const [hookState, setHookState] = useState<{
    foreignCurrencies: ForeignCurrencyEntry[]
  }>({
    foreignCurrencies: []
  })
  
  const [testResults, setTestResults] = useState<string[]>([])
  
  // Track hook updates
  const updateHookStore = (entries: ForeignCurrencyEntry[], total: number) => {
    setCashValue('foreign_currency_entries', entries)
    setCashValue('foreign_currency', total)
    addResult(`Hook updated store: entries=${entries.length}, total=${total}`)
  }
  
  // Use the hook and monitor its state
  const {
    foreignCurrencies,
    handleForeignCurrencyChange,
    removeForeignCurrency,
    addForeignCurrency: addCurrency
  } = useForeignCurrency({
    currency,
    storeEntries: cashValues.foreign_currency_entries,
    storeTotal: cashValues.foreign_currency,
    convertAmount,
    updateStore: updateHookStore
  })
  
  // Track hook state changes
  useEffect(() => {
    setHookState({ foreignCurrencies })
  }, [foreignCurrencies])
  
  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toISOString().slice(11, 19)}: ${message}`])
  }
  
  const addDirectEntry = () => {
    // Add a test foreign currency entry directly to the store
    const entry: ForeignCurrencyEntry = {
      amount: 100,
      currency: 'EUR',
      rawInput: '100'
    }
    
    // Check current state
    addResult(`Before direct add: entries=${cashValues.foreign_currency_entries?.length || 0}, total=${cashValues.foreign_currency}`)
    addResult(`Hook state before: entries=${hookState.foreignCurrencies.length}`)
    
    // Update the store directly
    setCashValue('foreign_currency_entries', [entry])
    setCashValue('foreign_currency', 100)
    
    // Log after update in next tick
    setTimeout(() => {
      addResult(`After direct add: entries=${cashValues.foreign_currency_entries?.length || 0}, total=${cashValues.foreign_currency}`)
      addResult(`Hook state after: entries=${hookState.foreignCurrencies.length}`)
    }, 100)
  }
  
  const addViaHook = () => {
    // Add a test entry via the hook
    addResult(`Before hook add: entries=${hookState.foreignCurrencies.length}`)
    addCurrency() // Add entry via hook function
    
    // Log after update in next tick
    setTimeout(() => {
      addResult(`After hook add: entries=${hookState.foreignCurrencies.length}`)
    }, 100)
  }
  
  const testReset = () => {
    // Add a test entry first if needed
    if (!cashValues.foreign_currency_entries || cashValues.foreign_currency_entries.length === 0) {
      setCashValue('foreign_currency_entries', [{
        amount: 100,
        currency: 'EUR',
        rawInput: '100'
      }])
      setCashValue('foreign_currency', 100)
    }
    
    // Log before reset
    addResult(`Before reset: store entries=${cashValues.foreign_currency_entries?.length || 0}, total=${cashValues.foreign_currency}`)
    
    const hookEntryDetails = hookState.foreignCurrencies.length > 0 
      ? `First entry before reset: amount=${hookState.foreignCurrencies[0].amount}, currency=${hookState.foreignCurrencies[0].currency}, rawInput="${hookState.foreignCurrencies[0].rawInput}"`
      : 'No entries';
    addResult(hookEntryDetails)
    
    // Reset the values
    resetCashValues()
    
    // Log immediately after reset
    addResult(`Immediately after reset: store entries=${cashValues.foreign_currency_entries?.length || 0}, total=${cashValues.foreign_currency}`)
    
    // Log after short delay
    setTimeout(() => {
      addResult(`After reset (100ms): store entries=${cashValues.foreign_currency_entries?.length || 0}, total=${cashValues.foreign_currency}`)
      addResult(`Hook state entries=${hookState.foreignCurrencies.length}`)
      
      // Check entry contents
      if (hookState.foreignCurrencies.length > 0) {
        const entry = hookState.foreignCurrencies[0];
        addResult(`Entry details: amount=${entry.amount}, currency=${entry.currency}, rawInput="${entry.rawInput}"`)
      } else {
        addResult('No entries in hook state')
      }
    }, 100)
    
    // Log after longer delay
    setTimeout(() => {
      addResult(`After reset (500ms): store entries=${cashValues.foreign_currency_entries?.length || 0}, total=${cashValues.foreign_currency}`)
      addResult(`Hook state entries=${hookState.foreignCurrencies.length}`)
      
      // Check entry contents
      if (hookState.foreignCurrencies.length > 0) {
        const entry = hookState.foreignCurrencies[0];
        addResult(`Entry details: amount=${entry.amount}, currency=${entry.currency}, rawInput="${entry.rawInput}"`)
      } else {
        addResult('No entries in hook state')
      }
    }, 500)
  }
  
  const clearResults = () => {
    setTestResults([])
  }
  
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Reset Functionality Test</h1>
      
      <div className="space-y-2">
        <Button onClick={addDirectEntry} className="mr-2">
          Add Entry to Store
        </Button>
        
        <Button onClick={addViaHook} className="mr-2">
          Add Entry via Hook
        </Button>
        
        <Button onClick={testReset} className="mr-2" variant="destructive">
          Test Reset
        </Button>
        
        <Button onClick={clearResults} variant="outline">
          Clear Results
        </Button>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-lg font-semibold">Store State:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-60">
            {JSON.stringify({
              entries: cashValues.foreign_currency_entries || [],
              total: cashValues.foreign_currency
            }, null, 2)}
          </pre>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Hook State:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-60">
            {JSON.stringify(hookState, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="mt-4">
        <h2 className="text-lg font-semibold">Test Results:</h2>
        <div className="bg-gray-100 p-2 rounded max-h-60 overflow-auto text-sm">
          {testResults.length === 0 ? (
            <p className="text-gray-500">No results yet. Run a test.</p>
          ) : (
            <ul className="list-disc pl-5">
              {testResults.map((result, index) => (
                <li key={index}>{result}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
} 