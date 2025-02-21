'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form/form"
import { Select } from "@/components/ui/form/select"
import { Label } from "@/components/ui/form/label"

interface NisabThreshold {
  gold: {
    grams: number
    value: number
  }
  silver: {
    grams: number
    value: number
  }
  currency: string
  lastUpdated: string
}

interface NisabFetcherProps {
  currency: string
  onSelect: (threshold: number) => void
  initialMethod?: 'gold' | 'silver'
}

export function NisabFetcher({
  currency,
  onSelect,
  initialMethod = 'silver'
}: NisabFetcherProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nisab, setNisab] = useState<NisabThreshold | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<'gold' | 'silver'>(initialMethod)

  useEffect(() => {
    async function fetchNisabThreshold() {
      try {
        setLoading(true)
        setError(null)
        // TODO: Replace with actual API call
        const response = await fetch(`/api/nisab?currency=${currency}`)
        if (!response.ok) throw new Error('Failed to fetch Nisab threshold')
        const data = await response.json()
        setNisab(data)
      } catch (err) {
        setError('Unable to fetch current Nisab threshold. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchNisabThreshold()
  }, [currency])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!nisab) return

    const threshold = selectedMethod === 'gold' 
      ? nisab.gold.value 
      : nisab.silver.value

    onSelect(threshold)
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-lg w-3/4"></div>
        <div className="h-24 bg-gray-100 rounded-lg"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-red-100 bg-red-50">
          <p className="text-sm text-red-500">{error}</p>
        </div>
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
          className="w-full"
        >
          Retry
        </Button>
      </div>
    )
  }

  if (!nisab) return null

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-medium text-gray-900">Select Nisab Threshold</h2>
        <p className="text-sm text-gray-500">
          Choose whether to calculate your Nisab threshold based on gold or silver value.
        </p>
      </div>

      <Form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="method">Calculation Method</Label>
            <Select
              id="method"
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value as 'gold' | 'silver')}
            >
              <option value="gold">Based on Gold ({nisab.gold.grams}g)</option>
              <option value="silver">Based on Silver ({nisab.silver.grams}g)</option>
            </Select>
          </div>

          <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
            <div className="text-sm font-medium text-gray-900">
              Current Nisab Threshold
            </div>
            <div className="mt-1 text-2xl font-medium text-gray-900">
              {selectedMethod === 'gold' 
                ? `${nisab.gold.value.toLocaleString()} ${currency}`
                : `${nisab.silver.value.toLocaleString()} ${currency}`
              }
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Last updated: {new Date(nisab.lastUpdated).toLocaleString()}
            </div>
          </div>

          <Button type="submit" className="w-full">
            Continue with Selected Threshold
          </Button>
        </div>
      </Form>
    </div>
  )
} 