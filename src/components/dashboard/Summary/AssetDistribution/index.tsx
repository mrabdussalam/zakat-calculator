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
      <div className="space-y-3 sm:space-y-4">
        <div className="text-sm font-medium text-gray-900">Asset Distribution</div>
        
        {/* Chart */}
        <div className="h-2 bg-gray-50 rounded-full overflow-hidden flex gap-0.5 px-0.5">
          {filteredAssets.map(([type, value]) => {
            const percentage = calculatePercentage(value, totalAssets)
            return (
              <div
                key={type}
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: ASSET_COLORS[type as keyof typeof ASSET_COLORS] 
                }}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
          {filteredAssets.map(([type, value]) => {
            const percentage = calculatePercentage(value, totalAssets)
            return (
              <div key={type} className="flex items-center gap-1.5 sm:gap-2">
                <div 
                  className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ASSET_COLORS[type as keyof typeof ASSET_COLORS] }}
                />
                <span className="text-[10px] sm:text-xs text-gray-500 truncate">
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