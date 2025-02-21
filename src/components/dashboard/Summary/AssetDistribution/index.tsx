import { ASSET_COLORS, ASSET_DISPLAY_NAMES, calculatePercentage } from "../constants"

interface AssetDistributionProps {
  assetValues: Record<string, number>
  totalAssets: number
}

export function AssetDistribution({ assetValues, totalAssets }: AssetDistributionProps) {
  const filteredAssets = Object.entries(assetValues)
    .filter(([_, value]) => value > 0)

  return (
    <div className="bg-white rounded-lg">
      <div className="space-y-4">
        <div className="text-sm font-medium text-gray-900">Asset Distribution</div>
        
        {/* Chart */}
        <div className="h-3 bg-gray-50 rounded-full overflow-hidden flex">
          {filteredAssets.map(([type, value]) => {
            const percentage = calculatePercentage(value, totalAssets)
            return (
              <div
                key={type}
                className="h-full transition-all"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: ASSET_COLORS[type as keyof typeof ASSET_COLORS] 
                }}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          {filteredAssets.map(([type, value]) => {
            const percentage = calculatePercentage(value, totalAssets)
            return (
              <div key={type} className="flex items-center gap-2">
                <div 
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: ASSET_COLORS[type as keyof typeof ASSET_COLORS] }}
                />
                <span className="text-xs text-gray-500">
                  {ASSET_DISPLAY_NAMES[type as keyof typeof ASSET_DISPLAY_NAMES]} ({percentage}%)
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 