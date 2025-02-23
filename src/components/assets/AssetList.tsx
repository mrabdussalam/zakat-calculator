'use client'

import { Button } from "@/components/ui/button"
import { AssetCard } from "./AssetCard"

interface Asset {
  id: string
  name: string
  amount: number
  currency: string
  type: string
  lastUpdated?: string
  source?: 'manual' | 'imported'
}

interface AssetListProps {
  assets: Asset[]
  onAddAsset: () => void
  onEditAsset: (asset: Asset) => void
  onDeleteAsset: (assetId: string) => void
}

export function AssetList({
  assets,
  onAddAsset,
  onEditAsset,
  onDeleteAsset
}: AssetListProps) {
  const totalAmount = assets.reduce((sum, asset) => sum + asset.amount, 0)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium text-gray-900">Your Assets</h2>
          <p className="text-sm text-gray-500 mt-1">
            {assets.length} {assets.length === 1 ? 'asset' : 'assets'} added
          </p>
        </div>
        <Button onClick={onAddAsset}>
          Add Asset
        </Button>
      </div>

      {assets.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
          <p className="text-sm text-gray-500">No assets added yet</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={onAddAsset}
          >
            Add Your First Asset
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-6">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onEdit={onEditAsset}
                onDelete={onDeleteAsset}
              />
            ))}
          </div>

          <div className="p-6 rounded-xl bg-gray-50 border border-gray-100">
            <div className="text-sm font-medium text-gray-500">Total Value</div>
            <div className="text-2xl font-medium text-gray-900 mt-1">
              {totalAmount.toLocaleString()} {assets[0]?.currency}
            </div>
          </div>
        </>
      )}
    </div>
  )
}