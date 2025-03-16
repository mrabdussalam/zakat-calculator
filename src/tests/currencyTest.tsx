'use client'

import { useState } from 'react'
import { CurrencySelector } from '@/components/CurrencySelector'
import { Button } from '@/components/ui/button'

export default function CurrencySelectorTest() {
  const [currency, setCurrency] = useState('USD')
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([])

  const handleCurrencyChange = (value: string) => {
    console.log(`Currency changed from ${currency} to ${value}`)
    setCurrency(value)
    setSelectedCurrencies(prev => [...prev, value])
  }

  return (
    <div className="flex flex-col gap-6 p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Currency Selector Test</h1>

      <div className="p-4 border rounded-md bg-slate-50">
        <h2 className="font-medium mb-3">Current Selection</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-full sm:w-[240px]">
            <CurrencySelector
              value={currency}
              onValueChange={handleCurrencyChange}
            />
          </div>
          <div className="text-sm">
            <span className="font-medium">Selected:</span> {currency}
          </div>
        </div>
      </div>

      <div className="p-4 border rounded-md bg-slate-50">
        <h2 className="font-medium mb-3">Test UI</h2>
        <div className="flex gap-2 flex-wrap">
          {['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'RUB'].map(code => (
            <Button
              key={code}
              variant={currency === code ? "default" : "outline"}
              size="sm"
              onClick={() => handleCurrencyChange(code)}
            >
              {code}
            </Button>
          ))}
        </div>
      </div>

      <div className="p-4 border rounded-md bg-slate-50">
        <h2 className="font-medium mb-3">Selection History</h2>
        <div className="text-sm">
          {selectedCurrencies.length === 0 ? (
            <p className="text-gray-500 italic">No selections made yet</p>
          ) : (
            <ul className="list-disc list-inside">
              {selectedCurrencies.map((code, index) => (
                <li key={index} className="mb-1">
                  {code} <span className="text-xs text-gray-500">(at {new Date().toLocaleTimeString()})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Button
        onClick={() => setSelectedCurrencies([])}
        variant="outline"
      >
        Clear History
      </Button>
    </div>
  )
}
