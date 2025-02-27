import React from 'react'
import { CurrencyErrorDebugger } from '@/components/ui/debug/CurrencyErrorDebugger'
import { NisabDebugger } from '@/components/ui/debug/NisabDebugger'

export default function DevPage() {
  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-xl font-bold">Development Tools</h1>
        <p className="mt-4 text-gray-600">
          This page is only available in development mode.
        </p>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-xl font-bold">Development Tools</h1>
      <p className="text-gray-600">
        These tools are for debugging and development purposes only.
      </p>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-4">Nisab Calculation Debugger</h2>
          <NisabDebugger />
        </section>
        
        <section>
          <h2 className="text-lg font-semibold mb-4">Currency Conversion Debugger</h2>
          <CurrencyErrorDebugger />
        </section>
      </div>
    </div>
  )
} 