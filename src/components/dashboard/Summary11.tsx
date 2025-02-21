'use client'

import { Button } from "@/components/ui/button"
import { cn, formatCurrency } from "@/lib/utils"
import { useZakatStore } from "@/store/zakatStore"
import { getAssetType } from "@/lib/assets/registry"
import { useEffect, useState } from "react"
import { ASSETS } from "@/components/dashboard/AssetList"
import { InfoIcon } from "@/components/ui/icons"
import { ChevronDown } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"

// Define colors directly to avoid circular dependencies
const ASSET_COLORS = {
  'cash': '#7C3AED', // Purple
  'precious-metals': '#F59E0B', // Amber
  'stocks': '#3B82F6', // Blue
  'retirement': '#10B981', // Emerald
  'real-estate': '#EC4899', // Pink
  'crypto': '#06B6D4', // Cyan
  'business-assets': '#10B981', // Emerald
  'other-financial': '#6366F1', // Indigo
  'debt-receivable': '#8B5CF6' // Violet
} as const

// Asset type to display name mapping
const ASSET_DISPLAY_NAMES = {
  'cash': 'Cash & Bank',
  'precious-metals': 'Precious Metals',
  'stocks': 'Investments',
  'retirement': 'Retirement',
  'real-estate': 'Real Estate',
  'crypto': 'Crypto',
  'business-assets': 'Business Assets',
  'other-financial': 'Other Financial',
  'debt-receivable': 'Debt Receivable'
} as const

// Define Nisab constants
const SILVER_NISAB_GRAMS = 595

interface SummaryProps {
  currency: string
  values: Record<string, number>
  assetTotals: Record<string, number>
  zakatableTotals: Record<string, number>
  totalZakatable: number
  hawlMet: Record<string, boolean>
  nisabThreshold: number | undefined
  onReset: () => void
}

// Add safe percentage calculation helper
const calculatePercentage = (value: number, total: number): string => {
  if (total === 0 || value === 0) return '0.0'
  return ((value / total) * 100).toFixed(1)
}

export function Summary({ currency }: { currency: string }) {
  const { 
    getTotalMetals,
    getTotalCash,
    getTotalStocks,
    getTotalZakatableStocks,
    getNisabStatus,
    metalsHawlMet,
    cashHawlMet,
    stockHawlMet,
    getBreakdown,
    getMetalsBreakdown,
    metalsValues,
    metalPrices,
    stockValues,
    stockPrices,
    retirementValues,
    realEstateValues,
    realEstateHawlMet,
    getRealEstateBreakdown,
    cryptoValues,
    cryptoHawlMet,
    getTotalCrypto,
    getTotalZakatableCrypto,
    getCryptoBreakdown,
    reset,
    getStocksBreakdown
  } = useZakatStore()

  // Get all the values we need
  const totalMetals = getTotalMetals()
  const totalCash = getTotalCash()
  const totalStocks = getTotalStocks()
  const totalCrypto = getTotalCrypto()
  const stockAsset = getAssetType('stocks')
  const stockBreakdown = getStocksBreakdown()

  // Get retirement values
  const retirementAsset = getAssetType('retirement')
  const retirementBreakdown = retirementAsset ? retirementAsset.getBreakdown(retirementValues, {}, true) : {
    total: 0,
    zakatable: 0,
    zakatDue: 0,
    items: {}
  }

  // Get real estate values
  const realEstateBreakdown = getRealEstateBreakdown()

  // Get crypto values
  const cryptoBreakdown = getCryptoBreakdown()

  // Get metals breakdown
  const metalsBreakdown = getMetalsBreakdown()

  const totalAssets = totalMetals.total + totalCash + totalStocks + 
    retirementBreakdown.total + realEstateBreakdown.total + totalCrypto
  const nisabStatus = getNisabStatus()
  const breakdown = getBreakdown()

  // Calculate metal values
  const goldRegularValue = (metalsValues.gold_regular || 0) * metalPrices.gold
  const goldOccasionalValue = (metalsValues.gold_occasional || 0) * metalPrices.gold
  const goldInvestmentValue = (metalsValues.gold_investment || 0) * metalPrices.gold
  const silverRegularValue = (metalsValues.silver_regular || 0) * metalPrices.silver
  const silverOccasionalValue = (metalsValues.silver_occasional || 0) * metalPrices.silver
  const silverInvestmentValue = (metalsValues.silver_investment || 0) * metalPrices.silver

  // Calculate totals (considering Hawl)
  const totalZakatableGold = metalsHawlMet ? (goldOccasionalValue + goldInvestmentValue) : 0
  const totalZakatableSilver = metalsHawlMet ? (silverOccasionalValue + silverInvestmentValue) : 0
  const totalZakatableMetals = totalZakatableGold + totalZakatableSilver
  const totalMetalsZakatDue = totalZakatableMetals * 0.025

  // Calculate cash totals (considering Hawl)
  const zakatableCash = cashHawlMet ? totalCash : 0
  const cashZakatDue = zakatableCash * 0.025

  // Calculate stock values consistently
  const zakatableStocks = stockBreakdown.zakatable
  const stockZakatDue = stockBreakdown.zakatDue

  // Get individual category values from breakdown items
  const activeValue = stockBreakdown.items.active_trading?.value || 0
  const activeZakatable = stockBreakdown.items.active_trading?.zakatable || 0
  const activeZakatDue = activeZakatable * 0.025

  const passiveValue = stockBreakdown.items.passive_investments?.value || 0
  const passiveZakatable = stockBreakdown.items.passive_investments?.zakatable || 0
  const passiveZakatDue = passiveZakatable * 0.025

  const dividendValue = stockBreakdown.items.dividends?.value || 0
  const dividendZakatable = stockBreakdown.items.dividends?.zakatable || 0
  const dividendZakatDue = dividendZakatable * 0.025

  const fundValue = stockBreakdown.items.investment_funds?.value || 0
  const fundZakatable = stockBreakdown.items.investment_funds?.zakatable || 0
  const fundZakatDue = fundZakatable * 0.025

  // Get passive investment method for label
  const passiveMethod = stockValues.passiveInvestments?.method
  const passiveLabel = stockBreakdown.items.passive_investments?.label || 
    (passiveMethod === 'detailed' ? 'Passive Investments (CRI Method)' : 'Passive Investments (30% Rule)')
  const passiveTooltip = passiveMethod === 'detailed'
    ? 'CRI Method: Based on company\'s liquid assets'
    : 'Quick Method: 30% of market value is considered zakatable'

  // For debugging
  useEffect(() => {
    console.log('Passive Investments:', stockValues.passiveInvestments)
    console.log('Method:', stockValues.passiveInvestments?.method)
  }, [stockValues.passiveInvestments])

  // Add this state to track expanded sections
  const [expandedSections, setExpandedSections] = useState<{
    metals: boolean;
    stocks: boolean;
    realEstate: boolean;
    retirement: boolean;
    crypto: boolean;
  }>({
    metals: false,
    stocks: false,
    realEstate: false,
    retirement: false,
    crypto: false
  });

  // Add this helper function to toggle sections
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Add verification helpers
  const verifyStockTotals = () => {
    if (process.env.NODE_ENV === 'development') {
      // Verify asset values
      const subCategoryAssetTotal = activeValue + passiveValue + dividendValue + fundValue;
      if (Math.abs(subCategoryAssetTotal - totalStocks) > 0.01) {
        console.warn('Stock asset values mismatch:', {
          subCategoryTotal: subCategoryAssetTotal,
          parentTotal: totalStocks,
          difference: subCategoryAssetTotal - totalStocks
        });
      }

      // Verify zakatable values
      const subCategoryZakatableTotal = activeZakatable + passiveZakatable + dividendZakatable + fundZakatable;
      if (Math.abs(subCategoryZakatableTotal - zakatableStocks) > 0.01) {
        console.warn('Stock zakatable values mismatch:', {
          subCategoryTotal: subCategoryZakatableTotal,
          parentTotal: zakatableStocks,
          difference: subCategoryZakatableTotal - zakatableStocks
        });
      }

      // Verify zakat due values
      const subCategoryZakatDueTotal = activeZakatDue + passiveZakatDue + dividendZakatDue + fundZakatDue;
      if (Math.abs(subCategoryZakatDueTotal - stockZakatDue) > 0.01) {
        console.warn('Stock zakat due values mismatch:', {
          subCategoryTotal: subCategoryZakatDueTotal,
          parentTotal: stockZakatDue,
          difference: subCategoryZakatDueTotal - stockZakatDue
        });
      }
    }
  }

  // Add verification effect
  useEffect(() => {
    verifyStockTotals();
  }, [
    activeValue, passiveValue, dividendValue, fundValue, totalStocks,
    activeZakatable, passiveZakatable, dividendZakatDue, fundZakatDue, stockZakatDue
  ]);

  return (
    <div className="h-full flex flex-col">
      {/* Total Assets and Zakat Due */}
      <div className="flex-none space-y-6">
        <div className="flex flex-col gap-4 bg-white rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Total Assets</div>
              <div className="text-2xl font-medium text-gray-900">
                {formatCurrency(totalAssets)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Zakat Due</div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <div className="text-2xl font-medium text-green-600">
                      {formatCurrency(breakdown.combined.zakatDue)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {!nisabStatus.meetsNisab ? 'No Zakat due (Below Nisab)' : '2.5% of eligible assets'}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">
                    {!nisabStatus.meetsNisab 
                      ? `Your total wealth (${formatCurrency(totalAssets)}) is below the Nisab threshold (${formatCurrency(nisabStatus.nisabValue)}). Zakat is only due when your wealth exceeds Nisab.`
                      : 'Zakat is calculated as 2.5% of your eligible assets that have completed their Hawl period.'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Nisab Status */}
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              nisabStatus.meetsNisab ? "bg-green-500" : "bg-gray-300"
            )} />
            <div className="font-medium text-gray-900">
              {nisabStatus.meetsNisab ? "Meets Nisab" : "Below Nisab"}
            </div>
          </div>
        </div>

        {/* Asset Distribution */}
        <div className="bg-white rounded-lg">
          <div className="space-y-4">
            <div className="text-sm font-medium text-gray-900">Asset Distribution</div>
            <div className="h-3 bg-gray-50 rounded-full overflow-hidden flex">
              {Object.entries({ 
                cash: totalCash, 
                'precious-metals': totalMetals.total,
                stocks: totalStocks,
                retirement: retirementBreakdown.total,
                'real-estate': realEstateBreakdown.total,
                crypto: totalCrypto
              })
                .filter(([_, value]) => value > 0)
                .map(([type, value]) => {
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
              {Object.entries({ 
                cash: totalCash, 
                'precious-metals': totalMetals.total,
                stocks: totalStocks,
                retirement: retirementBreakdown.total,
                'real-estate': realEstateBreakdown.total,
                crypto: totalCrypto
              })
                .filter(([_, value]) => value > 0)
                .map(([type, value]) => {
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
      </div>

      {/* Breakdown Table */}
      <div className="mt-6">
        <div className="divide-y divide-gray-100">
          {/* Header Row */}
          <div className="px-4 py-2 bg-gray-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Category</span>
              <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                <span className="w-[140px] text-right">Asset Value</span>
                <span className="w-[140px] text-right">Zakatable Amount</span>
                <span className="w-[100px] text-right">Zakat Due</span>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div>
            {/* Main categories */}
            <div>
              {/* Cash Row */}
              <div className="border-b border-gray-100">
                <div className="px-2 py-2.5">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-8 flex items-center justify-center">
                        <ChevronDown 
                          className="h-4 w-4 -rotate-90 text-gray-300"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                        <span className="text-gray-900">Cash & Bank</span>
                        <span className="text-xs text-gray-500">
                          {calculatePercentage(totalCash, totalAssets)}%
                        </span>
                        {!cashHawlMet && (
                          <span className="text-xs text-amber-600">(Hawl not met)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="w-[140px] text-right text-gray-500">
                        {formatCurrency(totalCash)}
                      </span>
                      <span className="w-[140px] text-right text-gray-500">
                        {formatCurrency(zakatableCash)}
                      </span>
                      <span className="w-[100px] text-right text-gray-500">
                        {formatCurrency(cashZakatDue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Precious Metals Row */}
              <div className="border-b border-gray-100">
                <div className="px-2 py-2.5">
                  <div 
                    className="flex justify-between text-sm cursor-pointer"
                    onClick={() => toggleSection('metals')}
                  >
                    <div className="flex items-center">
                      <div className="w-8 flex items-center justify-center">
                        <ChevronDown 
                          className={cn(
                            "h-4 w-4 -rotate-90 transition-transform",
                            expandedSections.metals && "rotate-0"
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="text-gray-900">Precious Metals</span>
                        <span className="text-xs text-gray-500">
                          {calculatePercentage(totalMetals.total, totalAssets)}%
                        </span>
                        {!metalsHawlMet && (
                          <span className="text-xs text-amber-600">(Hawl not met)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="w-[140px] text-right text-gray-500">
                        {formatCurrency(totalMetals.total)}
                      </span>
                      <span className="w-[140px] text-right text-gray-500">
                        {formatCurrency(metalsBreakdown.zakatable)}
                      </span>
                      <span className="w-[100px] text-right text-gray-500">
                        {formatCurrency(metalsBreakdown.zakatDue)}
                      </span>
                    </div>
                  </div>
                </div>
                {totalMetals.total > 0 && expandedSections.metals && (
                  <div className="pl-10 py-2">
                    <div className="space-y-2">
                      {/* Regular Gold */}
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Regular Gold (exempt)</span>
                        <div className="flex items-center gap-4">
                          <span className="w-[140px] text-right text-gray-500">
                            {`${metalsValues.gold_regular.toFixed(2)}g`}
                          </span>
                          <span className="w-[140px] text-right text-gray-500">
                            {formatCurrency(0)} {/* Exempt */}
                          </span>
                          <span className="w-[100px] text-right">
                            {formatCurrency(0)}
                          </span>
                        </div>
                      </div>

                      {/* Occasional Gold */}
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Occasional Gold</span>
                        <div className="flex items-center gap-4">
                          <span className="w-[140px] text-right text-gray-500">
                            {`${metalsValues.gold_occasional.toFixed(2)}g`}
                          </span>
                          <span className="w-[140px] text-right text-gray-500">
                            {formatCurrency(metalsValues.gold_occasional * metalPrices.gold)}
                          </span>
                          <span className="w-[100px] text-right">
                            {formatCurrency(metalsValues.gold_occasional * metalPrices.gold * 0.025)}
                          </span>
                        </div>
                      </div>

                      {/* Investment Gold */}
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Investment Gold</span>
                        <div className="flex items-center gap-4">
                          <span className="w-[140px] text-right text-gray-500">
                            {`${metalsValues.gold_investment.toFixed(2)}g`}
                          </span>
                          <span className="w-[140px] text-right text-gray-500">
                            {formatCurrency(metalsValues.gold_investment * metalPrices.gold)}
                          </span>
                          <span className="w-[100px] text-right">
                            {formatCurrency(metalsValues.gold_investment * metalPrices.gold * 0.025)}
                          </span>
                        </div>
                      </div>

                      {/* Regular Silver */}
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Regular Silver (exempt)</span>
                        <div className="flex items-center gap-4">
                          <span className="w-[140px] text-right text-gray-500">
                            {`${metalsValues.silver_regular.toFixed(2)}g`}
                          </span>
                          <span className="w-[140px] text-right text-gray-500">
                            {formatCurrency(0)} {/* Exempt */}
                          </span>
                          <span className="w-[100px] text-right">
                            {formatCurrency(0)}
                          </span>
                        </div>
                      </div>

                      {/* Occasional Silver */}
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Occasional Silver</span>
                        <div className="flex items-center gap-4">
                          <span className="w-[140px] text-right text-gray-500">
                            {`${metalsValues.silver_occasional.toFixed(2)}g`}
                          </span>
                          <span className="w-[140px] text-right text-gray-500">
                            {formatCurrency(metalsValues.silver_occasional * metalPrices.silver)}
                          </span>
                          <span className="w-[100px] text-right">
                            {formatCurrency(metalsValues.silver_occasional * metalPrices.silver * 0.025)}
                          </span>
                        </div>
                      </div>

                      {/* Investment Silver */}
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Investment Silver</span>
                        <div className="flex items-center gap-4">
                          <span className="w-[140px] text-right text-gray-500">
                            {`${metalsValues.silver_investment.toFixed(2)}g`}
                          </span>
                          <span className="w-[140px] text-right text-gray-500">
                            {formatCurrency(metalsValues.silver_investment * metalPrices.silver)}
                          </span>
                          <span className="w-[100px] text-right">
                            {formatCurrency(metalsValues.silver_investment * metalPrices.silver * 0.025)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stocks Row */}
              <div className="border-b border-gray-100">
                <div className="px-2 py-2.5">
                  <div 
                    className="flex justify-between text-sm cursor-pointer"
                    onClick={() => toggleSection('stocks')}
                  >
                    <div className="flex items-center">
                      <div className="w-8 flex items-center justify-center">
                        <ChevronDown 
                          className={cn(
                            "h-4 w-4 -rotate-90 transition-transform",
                            expandedSections.stocks && "rotate-0"
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-gray-900">Stocks & Investments</span>
                        <span className="text-xs text-gray-500">
                          {calculatePercentage(totalStocks, totalAssets)}%
                        </span>
                        {!stockHawlMet && (
                          <span className="text-xs text-amber-600">(Hawl not met)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="w-[140px] text-right text-gray-500">
                        {formatCurrency(totalStocks)}
                      </span>
                      <span className="w-[140px] text-right text-gray-500">
                        {formatCurrency(zakatableStocks)}
                      </span>
                      <span className="w-[100px] text-right text-gray-500">
                        {formatCurrency(stockZakatDue)}
                      </span>
                    </div>
                  </div>
                </div>
                {totalStocks > 0 && expandedSections.stocks && (
                  <div className="pl-10 py-2">
                    <div className="space-y-2">
                      {/* Active Trading */}
                      {activeValue > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Active Trading</span>
                          <div className="flex items-center gap-4">
                            <span className="w-[140px] text-right text-gray-500">
                              {formatCurrency(activeValue)}
                            </span>
                            <span className="w-[140px] text-right text-gray-500">
                              {formatCurrency(activeZakatable)}
                            </span>
                            <span className="w-[100px] text-right">
                              {formatCurrency(activeZakatDue)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Passive Investments */}
                      {passiveValue > 0 && (
                        <div className="flex justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">{passiveLabel}</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <InfoIcon className="h-3 w-3 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>{passiveTooltip}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="w-[140px] text-right text-gray-500">
                              {formatCurrency(passiveValue)}
                            </span>
                            <span className="w-[140px] text-right text-gray-500">
                              {formatCurrency(passiveZakatable)}
                            </span>
                            <span className="w-[100px] text-right">
                              {formatCurrency(passiveZakatDue)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Dividends */}
                      {dividendValue > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Dividend Earnings</span>
                          <div className="flex items-center gap-4">
                            <span className="w-[140px] text-right text-gray-500">
                              {formatCurrency(dividendValue)}
                            </span>
                            <span className="w-[140px] text-right text-gray-500">
                              {formatCurrency(dividendZakatable)}
                            </span>
                            <span className="w-[100px] text-right">
                              {formatCurrency(dividendZakatDue)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Investment Funds */}
                      {fundValue > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Investment Funds</span>
                          <div className="flex items-center gap-4">
                            <span className="w-[140px] text-right text-gray-500">
                              {formatCurrency(fundValue)}
                            </span>
                            <span className="w-[140px] text-right text-gray-500">
                              {formatCurrency(fundZakatable)}
                            </span>
                            <span className="w-[100px] text-right">
                              {formatCurrency(fundZakatDue)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Retirement Row */}
              <div className="border-b border-gray-100">
                <div className="px-2 py-2.5">
                  <div 
                    className="flex justify-between text-sm cursor-pointer"
                    onClick={() => toggleSection('retirement')}
                  >
                    <div className="flex items-center">
                      <div className="w-8 flex items-center justify-center">
                        <ChevronDown 
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expandedSections.retirement ? "" : "-rotate-90"
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                        <span className="text-gray-900">Retirement Accounts</span>
                        <span className="text-xs text-gray-500">
                          {calculatePercentage(retirementBreakdown.total, totalAssets)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="w-[140px] text-right text-gray-500">
                        {formatCurrency(retirementBreakdown.total)}
                      </span>
                      <span className="w-[140px] text-right text-gray-500">
                        {formatCurrency(retirementBreakdown.zakatable)}
                      </span>
                      <span className="w-[100px] text-right text-gray-500">
                        {formatCurrency(retirementBreakdown.zakatDue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real Estate Row */}
              <div className="border-b border-gray-100">
                <div className="px-2 py-2.5">
                  <div 
                    className="flex justify-between text-sm cursor-pointer"
                    onClick={() => toggleSection('realEstate')}
                  >
                    <div className="flex items-center">
                      <div className="w-8 flex items-center justify-center">
                        <ChevronDown 
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expandedSections.realEstate ? "" : "-rotate-90"
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-pink-600" />
                        <span className="text-gray-900">Real Estate</span>
                        <span className="text-xs text-gray-500">
                          {calculatePercentage(realEstateBreakdown.total, totalAssets)}%
                        </span>
                        {!realEstateHawlMet && (
                          <span className="text-xs text-amber-600">(Hawl not met)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="w-[140px] text-right text-gray-500">
                        {formatCurrency(realEstateBreakdown.total)}
                      </span>
                      <span className="w-[140px] text-right text-gray-500">
                        {formatCurrency(realEstateBreakdown.zakatable)}
                      </span>
                      <span className="w-[100px] text-right text-gray-500">
                        {formatCurrency(realEstateBreakdown.zakatDue)}
                      </span>
                    </div>
                  </div>
                </div>
                {expandedSections.realEstate && (
                  <div className="pl-10 py-2">
                    {Object.entries(realEstateBreakdown.items).map(([key, item]) => {
                      if (key === 'real_estate') return null; // Skip the parent item
                      return (
                        <div key={key} className="flex justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900">{item.label}</span>
                            {item.isExempt && (
                              <span className="text-xs text-gray-500">(Exempt)</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="w-[140px] text-right text-gray-500">
                              {formatCurrency(item.value)}
                            </span>
                            <span className="w-[140px] text-right text-gray-500">
                              {formatCurrency(item.zakatable || 0)}
                            </span>
                            <span className="w-[100px] text-right text-gray-500">
                              {formatCurrency((item.zakatable || 0) * 0.025)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Crypto Row */}
              <div>
                <div className="px-2 py-2.5">
                  <div 
                    className="flex justify-between text-sm cursor-pointer"
                    onClick={() => toggleSection('crypto')}
                  >
                    <div className="flex items-center">
                      <div className="w-8 flex items-center justify-center">
                        <ChevronDown 
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expandedSections.crypto ? "" : "-rotate-90"
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-600" />
                        <span className="text-gray-900">Cryptocurrency</span>
                        <span className="text-xs text-gray-500">
                          {calculatePercentage(totalCrypto, totalAssets)}%
                        </span>
                        {!cryptoHawlMet && (
                          <span className="text-xs text-amber-600">(Hawl not met)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="w-[140px] text-right text-gray-500">
                        {formatCurrency(totalCrypto)}
                      </span>
                      <span className="w-[140px] text-right text-gray-500">
                        {formatCurrency(cryptoBreakdown.zakatable)}
                      </span>
                      <span className="w-[100px] text-right text-gray-500">
                        {formatCurrency(cryptoBreakdown.zakatDue)}
                      </span>
                    </div>
                  </div>
                </div>
                {expandedSections.crypto && (
                  <div className="pl-10 py-2">
                    {Object.entries(cryptoBreakdown.items).map(([symbol, item]) => {
                      if (!item || typeof item !== 'object') return null;
                      const cryptoItem = item as {
                        value: number
                        isZakatable: boolean
                        label: string
                        tooltip?: string
                      };
                      
                      return (
                        <div key={symbol} className="flex justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900">{cryptoItem.label}</span>
                            {cryptoItem.tooltip && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <InfoIcon className="h-4 w-4 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-sm">{cryptoItem.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="w-[140px] text-right text-gray-500">
                              {formatCurrency(cryptoItem.value)}
                            </span>
                            <span className="w-[140px] text-right text-gray-500">
                              {formatCurrency(cryptoHawlMet && cryptoItem.isZakatable ? cryptoItem.value : 0)}
                            </span>
                            <span className="w-[100px] text-right text-gray-500">
                              {formatCurrency(cryptoHawlMet && cryptoItem.isZakatable ? cryptoItem.value * 0.025 : 0)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Total Row */}
          <div className="px-4 py-2.5 bg-gray-50 rounded-b-lg">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-900">Total</span>
              <div className="flex items-center gap-4">
                <span className="w-[140px] text-right text-gray-900">
                  {formatCurrency(totalAssets)}
                </span>
                <span className="w-[140px] text-right text-gray-900">
                  {formatCurrency(breakdown.combined.zakatableValue)}
                </span>
                <span className="w-[100px] text-right text-green-600">
                  {formatCurrency(breakdown.combined.zakatDue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 