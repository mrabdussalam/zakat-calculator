'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/form/select"
import { Label } from "@/components/ui/form/label"

interface PreferencesFormProps {
  onSubmit: (preferences: {
    language: string
    currency: string
  }) => void
}

const LANGUAGES = [
  { code: 'en', name: 'English (en)' },
  { code: 'ar', name: 'العربية (ar)' },
  { code: 'ur', name: 'اردو (ur)' },
  { code: 'ms', name: 'Bahasa Melayu (ms)' },
]

const CURRENCIES = [
  { code: 'USD', name: 'United States Dollar (USD)', symbol: '$' },
  { code: 'EUR', name: 'Euro (EUR)', symbol: '€' },
  { code: 'GBP', name: 'British Pound (GBP)', symbol: '£' },
  { code: 'SAR', name: 'Saudi Riyal (SAR)', symbol: 'SR' },
  { code: 'AED', name: 'UAE Dirham (AED)', symbol: 'د.إ' },
]

export function PreferencesForm({ onSubmit }: PreferencesFormProps) {
  const [language, setLanguage] = useState('en')
  const [currency, setCurrency] = useState('USD')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit({
      language,
      currency,
    })
  }

  // Format example values based on current preferences
  const exampleAmount = 2323.25
  const exampleChange = 78.90
  const exampleChangePercent = 6.39

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-medium text-gray-900">Configure your preferences</h2>
        <p className="text-sm text-gray-500">
          Let's configure your preferences.
        </p>
      </div>

      {/* Preview Card */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-2">
        <div className="text-sm font-medium text-gray-500">Example account</div>
        <div className="text-3xl font-medium text-gray-900">
          {formatCurrency(exampleAmount)}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-green-500">
            +{formatCurrency(exampleChange)} (+{exampleChangePercent}%)
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Preview how values will display based on your preferences.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="language">Language</Label>
          <Select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.name}
              </option>
            ))}
          </Select>
        </div>

        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>
    </div>
  )
} 