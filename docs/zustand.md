Why Zustand Might Help


Single Source of Truth


By maintaining your Zakat data (cash, metals, etc.) in one central store, changes from any calculator automatically update the store—no need to manually lift state up to a parent or worry about re-renders resetting local state.


Persistence


Even if you unmount CashCalculator while viewing PersonalJewelryForm, the data remains in the Zustand store. When you switch back, your previous inputs still exist.


Flexibility


Zustand has a minimal API—just a function create() that you call with any state logic. Consuming components only subscribe to the slices of state they need.


---


Example Setup


Below is a simplified approach on how you might set up a Zustand store for your Zakat data and integrate it into your existing components.


1) Create a Zakat Store


Create a new file under something like src/store/zakatStore.ts:


zakatStore.ts


import { create } from 'zustand'

interface ZakatState {
  // Cash values
  cashValues: Record<string, number>
  setCashValue: (key: string, value: number) => void

  // Precious metals
  metalsValues: Record<string, number>
  setMetalsValue: (key: string, value: number) => void

  // Holding periods
  cashHawlMet: boolean
  metalsHawlMet: boolean
  setCashHawl: (value: boolean) => void
  setMetalsHawl: (value: boolean) => void
}

// You can define defaults or load from localStorage if needed
const initialCash: Record<string, number> = {
  cash_on_hand: 0,
  checking_account: 0,
  savings_account: 0,
  digital_wallets: 0,
  foreign_currency: 0
}

const initialMetals: Record<string, number> = {
  gold_regular: 0,
  gold_occasional: 0,
  gold_investment: 0,
  silver_regular: 0,
  silver_occasional: 0,
  silver_investment: 0
}

export const useZakatStore = create<ZakatState>((set) => ({
  cashValues: initialCash,
  setCashValue: (key, value) => {
    set((state) => ({
      cashValues: {
        ...state.cashValues,
        [key]: value
      }
    }))
  },

  metalsValues: initialMetals,
  setMetalsValue: (key, value) => {
    set((state) => ({
      metalsValues: {
        ...state.metalsValues,
        [key]: value
      }
    }))
  },

  cashHawlMet: true,
  metalsHawlMet: true,

  setCashHawl: (value) => {
    set(() => ({ cashHawlMet: value }))
  },
  setMetalsHawl: (value) => {
    set(() => ({ metalsHawlMet: value }))
  }
}))





Explanation:


• We track separate slices for “cashValues” and “metalsValues” (and you can add more if needed).


• Functions like setCashValue and setMetalsValue update a single field by key.


• For the holding period, we keep booleans cashHawlMet and metalsHawlMet with their own setters.


---


2) Use in Your CashCalculator


In your CashCalculator.tsx, rather than using local state for each field, you might directly consume/state-set from the Zustand store:


CashCalculator.tsx



'use client'

import { evaluateExpression } from '@/lib/safeEvaluate' 
import { useZakatStore } from '@/store/zakatStore'
import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
// ...other imports

export function CashCalculator({ currency }: { currency:string }) {
  // Access state and actions from Zustand
  const {
    cashValues,
    setCashValue,
    cashHawlMet,
    setCashHawl
  } = useZakatStore()

  // Example usage:
  const handleValueChange = (categoryId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value
    const numericValue = evaluateExpression(inputValue)
    setCashValue(categoryId, numericValue)
  }

  const handleHawlChange = (value: boolean) => {
    setCashHawl(value)
    // This is now stored globally, so switching components won't reset
  }

  return (
    <TooltipProvider delayDuration={50}>
      <div className="space-y-8">
        {/* ... */}
        {Object.keys(cashValues).map((key) => (
          <div key={key} className="space-y-2">
            <Label>{key}</Label>
            <Input 
              type="text"
              // read from the store
              value={cashValues[key]}
              onChange={(e) => handleValueChange(key, e)}
            />
          </div>
        ))}
        {/* Example “Hawl” toggle */}
        <Button
          variant={cashHawlMet ? 'default' : 'outline'}
          onClick={() => handleHawlChange(!cashHawlMet)}
        >
          {cashHawlMet ? 'Hawl Met' : 'Hawl Not Met'}
        </Button>
      </div>
    </TooltipProvider>
  )
}




Now, your cash data is preserved as long as the page is alive. When you switch views, CashCalculator may unmount, but your store data remains.


---


3) Use in Your PersonalJewelryForm


Similarly, in PersonalJewelryForm.tsx, consume metals state from the store:


PersonalJewelryForm.tsx



'use client'

import { useZakatStore } from '@/store/zakatStore'
import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
// ...other imports

export function PersonalJewelryForm({ currency }: { currency:string }) {
  const {
    metalsValues,
    setMetalsValue,
    metalsHawlMet,
    setMetalsHawl
  } = useZakatStore()

  const handleValueChange = (key: string, value: number) => {
    setMetalsValue(key, value)
  }

  return (
    <div className="space-y-8">
      {/* ... */}
      <div className="space-y-2">
        <Label>Gold Regular</Label>
        <Input
          type="number"
          value={metalsValues.gold_regular}
          onChange={(e) => handleValueChange('gold_regular', Number(e.target.value))}
        />
      </div>
      {/* ...similar for other metals fields... */}

      <Button
        variant={metalsHawlMet ? 'default' : 'outline'}
        onClick={() => setMetalsHawl(!metalsHawlMet)}
      >
        {metalsHawlMet ? 'Hawl Met' : 'Hawl Not Met'}
      </Button>
    </div>
  )
}


Now, no matter how often the user navigates between “Cash Calculator” and “Personal Jewelry,” the store retains the data.


---


Suggestions & Considerations


Reset Logic


If you do need to clear out data at some point (e.g., logging out, starting a new calculation), provide a reset function in your Zustand store that sets cashValues and metalsValues back to defaults.


Local Storage or Server Persistence


If you need longer-term persistence (along page reloads), you can integrate Zustand with localStorage or your own backend. Zustand has built-in middleware for persisting state to localStorage.


Avoid Overly Large Global Stores


Keep only the data that truly needs to be global. If some form data can remain local to one screen, that’s fine. However, for shared calculations, a shared store is great.


Performance


Zustand is quite performant, but keep an eye on how many components are subscribing to the store. Each subscribed component re-renders on store changes to subscribed slices. Consider splitting large stores if needed.


---


In Conclusion


Switching from local component state to a global React store, like Zustand, is often the easiest way to manage multi-step or multi-component flows in Next.js—especially when you need to preserve values after unmounting components. This centralizes your data, avoids unexpected resets, and keeps your logic consistent across both calculators.
