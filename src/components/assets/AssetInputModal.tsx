'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form/form"
import { Input } from "@/components/ui/form/input"
import { Label } from "@/components/ui/form/label"
import { Select } from "@/components/ui/form/select"

interface Asset {
  id: string
  name: string
  amount: number
  currency: string
  type: string
  lastUpdated?: string
  source?: 'manual' | 'imported'
}

interface AssetInputModalProps {
  onSubmit: (asset: Omit<Asset, 'id' | 'lastUpdated'>) => void
  onCancel: () => void
  initialAsset?: Asset
  currency: string
}

const ASSET_TYPES = [
  'Cash',
  'Bank Account',
  'Gold',
  'Silver',
  'Stocks',
  'Cryptocurrency',
  'Business Inventory',
  'Accounts Receivable',
  'Other',
]

export function AssetInputModal({
  onSubmit,
  onCancel,
  initialAsset,
  currency
}: AssetInputModalProps) {
  const [name, setName] = useState(initialAsset?.name ?? '')
  const [amount, setAmount] = useState(initialAsset?.amount?.toString() ?? '')
  const [type, setType] = useState(initialAsset?.type ?? ASSET_TYPES[0])
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum)) {
      setError('Please enter a valid amount')
      return
    }

    if (!name.trim()) {
      setError('Please enter an asset name')
      return
    }

    onSubmit({
      name: name.trim(),
      amount: amountNum,
      type,
      currency,
      source: 'manual'
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-medium text-gray-900">
            {initialAsset ? 'Edit Asset' : 'Add New Asset'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter the details of your asset below.
          </p>
        </div>

        <Form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Asset Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Savings Account"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  {currency}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="type">Asset Type</Label>
              <Select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {ASSET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>

            {error && (
              <div className="text-sm text-red-500" role="alert">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {initialAsset ? 'Save Changes' : 'Add Asset'}
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  )
} 