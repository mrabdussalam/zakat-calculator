'use client'

import { Button } from "@/components/ui/button"

interface Asset {
  id: string
  name: string
  amount: number
  currency: string
  type: string
  lastUpdated?: string
  source?: 'manual' | 'imported'
}

interface AssetCardProps {
  asset: Asset
  onEdit?: (asset: Asset) => void
  onDelete?: (assetId: string) => void
}

export function AssetCard({
  asset,
  onEdit,
  onDelete
}: AssetCardProps) {
  return (
    <div className="p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{asset.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{asset.type}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-medium text-gray-900">
            {asset.amount.toLocaleString()} {asset.currency}
          </div>
          {asset.lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Updated {new Date(asset.lastUpdated).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(asset)}
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-red-500 hover:text-red-600"
              onClick={() => onDelete(asset.id)}
            >
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  )
} 