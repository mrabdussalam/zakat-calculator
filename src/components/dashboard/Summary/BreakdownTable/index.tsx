import { useState } from "react"
import { formatCurrency } from "@/lib/utils"
import { AssetBreakdownWithHawl } from "../types"
import { TableHeader } from "./TableHeader"
import { AssetRow } from "./AssetRow"
import { TotalRow } from "./TotalRow"
import { ScrollArea } from "@/components/ui/scroll-area"

interface BreakdownTableProps {
  currency: string
  totalAssets: number
  breakdown: {
    total: number
    zakatable: number
    zakatDue: number
  }
  assetBreakdowns: Record<string, AssetBreakdownWithHawl>
}

export function BreakdownTable({ 
  currency,
  totalAssets,
  breakdown,
  assetBreakdowns
}: BreakdownTableProps) {
  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState({
    cash: false,
    metals: false,
    stocks: false,
    realEstate: false,
    retirement: false,
    crypto: false
  })

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Default empty breakdown
  const emptyBreakdown = {
    total: 0,
    zakatable: 0,
    zakatDue: 0,
    items: {}
  }

  return (
    <div className="flex-1 mt-8">
      <div className="bg-gray-50 rounded-2xl p-2">
        <TableHeader />
        
        <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
          {/* Asset Categories Container */}
          <div className="divide-y divide-gray-100 p-2">
            <ScrollArea className="md:overflow-visible">
              <div className="min-w-[640px] md:w-auto">
                {/* Cash */}
                <AssetRow
                  title="Cash & Bank"
                  total={assetBreakdowns.cash?.total || 0}
                  breakdown={assetBreakdowns.cash?.breakdown || emptyBreakdown}
                  hawlMet={assetBreakdowns.cash?.hawlMet || false}
                  currency={currency}
                  assetType="cash"
                  totalAssets={totalAssets}
                  isExpanded={expandedSections.cash}
                  onToggle={() => toggleSection('cash')}
                />

                {/* Precious Metals */}
                <AssetRow
                  title="Precious Metals"
                  total={assetBreakdowns.metals?.total || 0}
                  breakdown={assetBreakdowns.metals?.breakdown || emptyBreakdown}
                  hawlMet={assetBreakdowns.metals?.hawlMet || false}
                  currency={currency}
                  assetType="precious-metals"
                  totalAssets={totalAssets}
                  isExpanded={expandedSections.metals}
                  onToggle={() => toggleSection('metals')}
                />

                {/* Stocks & Investments */}
                <AssetRow
                  title="Stocks & Investments"
                  total={assetBreakdowns.stocks?.total || 0}
                  breakdown={assetBreakdowns.stocks?.breakdown || emptyBreakdown}
                  hawlMet={assetBreakdowns.stocks?.hawlMet || false}
                  currency={currency}
                  assetType="stocks"
                  totalAssets={totalAssets}
                  isExpanded={expandedSections.stocks}
                  onToggle={() => toggleSection('stocks')}
                />

                {/* Retirement */}
                <AssetRow
                  title="Retirement Accounts"
                  total={assetBreakdowns.retirement?.total || 0}
                  breakdown={assetBreakdowns.retirement?.breakdown || emptyBreakdown}
                  hawlMet={assetBreakdowns.retirement?.hawlMet || false}
                  currency={currency}
                  assetType="retirement"
                  totalAssets={totalAssets}
                  isExpanded={expandedSections.retirement}
                  onToggle={() => toggleSection('retirement')}
                />

                {/* Real Estate */}
                <AssetRow
                  title="Real Estate"
                  total={assetBreakdowns.realEstate?.total || 0}
                  breakdown={assetBreakdowns.realEstate?.breakdown || emptyBreakdown}
                  hawlMet={assetBreakdowns.realEstate?.hawlMet || false}
                  currency={currency}
                  assetType="real-estate"
                  totalAssets={totalAssets}
                  isExpanded={expandedSections.realEstate}
                  onToggle={() => toggleSection('realEstate')}
                />

                {/* Cryptocurrency */}
                <AssetRow
                  title="Cryptocurrency"
                  total={assetBreakdowns.crypto?.total || 0}
                  breakdown={assetBreakdowns.crypto?.breakdown || emptyBreakdown}
                  hawlMet={assetBreakdowns.crypto?.hawlMet || false}
                  currency={currency}
                  assetType="crypto"
                  totalAssets={totalAssets}
                  isExpanded={expandedSections.crypto}
                  onToggle={() => toggleSection('crypto')}
                />
              </div>
            </ScrollArea>
          </div>
        </div>

        <TotalRow
          totalAssets={totalAssets}
          zakatableValue={breakdown.zakatable}
          zakatDue={breakdown.zakatDue}
          currency={currency}
        />
      </div>
    </div>
  )
} 