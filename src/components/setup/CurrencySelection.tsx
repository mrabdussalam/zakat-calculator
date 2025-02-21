'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form/form"
import { Select } from "@/components/ui/form/select"
import { Label } from "@/components/ui/form/label"

interface Currency {
  code: string
  name: string
  symbol: string
}

const POPULAR_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SR' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
]

interface CurrencySelectionProps {
  onSubmit: (currency: string) => void
  initialCurrency?: string
}

export function CurrencySelection({
  onSubmit,
  initialCurrency = 'USD'
}: CurrencySelectionProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(initialCurrency)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(selectedCurrency)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-medium text-gray-900">Select Your Currency</h2>
        <p className="text-sm text-gray-500">
          Choose the currency you would like to use for your Zakat calculation.
        </p>
      </div>

      <Form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Select
              id="currency"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
            >
              {POPULAR_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.name} ({currency.symbol})
                </option>
              ))}
            </Select>
          </div>

          <Button type="submit" className="w-full">
            Continue with {POPULAR_CURRENCIES.find(c => c.code === selectedCurrency)?.name}
          </Button>
        </div>
      </Form>
    </div>
  )
} 