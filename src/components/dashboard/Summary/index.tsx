import { useZakatStore } from "@/store/zakatStore"
import { getAssetType } from "@/lib/assets/registry"
import { TotalHeader } from "./TotalHeader"
import { NisabStatus } from "./NisabStatus"
import { AssetDistribution } from "./AssetDistribution"
import { BreakdownTable } from "./BreakdownTable"
import { adaptMetalsBreakdown, adaptRealEstateBreakdown, adaptEmptyBreakdown } from "./utils"
import { AssetBreakdownWithHawl } from "./types"
import { AssetBreakdown, AssetBreakdownItem } from "@/lib/assets/types"
import { ZAKAT_RATE } from "@/lib/assets/types"

const adaptBreakdown = (breakdown: {
  total: number
  zakatable: number
  zakatDue: number
  items: Record<string, {
    value: number
    isZakatable: boolean
    zakatable?: number
    zakatDue?: number
    label: string
    tooltip?: string
    isExempt?: boolean
  }>
}): AssetBreakdown => {
  return {
    total: breakdown.total,
    zakatable: breakdown.zakatable,
    zakatDue: breakdown.zakatDue,
    items: Object.entries(breakdown.items).reduce<Record<string, AssetBreakdownItem>>((acc, [key, item]) => {
      const tooltip = item.tooltip || `${item.label}: ${item.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`
      const zakatable = item.zakatable ?? (item.isZakatable ? item.value : 0)
      const zakatDue = item.zakatDue ?? (zakatable * ZAKAT_RATE)
      
      return {
        ...acc,
        [key]: {
          value: item.value,
          isZakatable: item.isZakatable,
          zakatable,
          zakatDue,
          label: item.label,
          tooltip,
          isExempt: item.isExempt
        }
      }
    }, {})
  }
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
    getCashBreakdown,
    getRetirementBreakdown,
    metalsValues,
    metalPrices,
    stockValues,
    stockPrices,
    retirementValues,
    retirementHawlMet,
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
  const stockBreakdown = getStocksBreakdown()
  const metalsBreakdown = getMetalsBreakdown()
  const realEstateBreakdown = getRealEstateBreakdown()
  const cryptoBreakdown = getCryptoBreakdown()
  const cashBreakdown = getCashBreakdown()
  const retirementBreakdown = getRetirementBreakdown()

  // Calculate total assets
  const totalAssets = totalMetals.total + totalCash + totalStocks + 
    retirementBreakdown.total + realEstateBreakdown.total + totalCrypto

  // Get nisab status and breakdown
  const nisabStatus = getNisabStatus()
  const breakdown = getBreakdown()

  // Prepare asset breakdowns with consistent format
  const assetBreakdowns: Record<string, AssetBreakdownWithHawl> = {
    cash: { 
      total: totalCash, 
      hawlMet: cashHawlMet,
      breakdown: adaptBreakdown(cashBreakdown)
    },
    metals: { 
      total: totalMetals.total, 
      hawlMet: metalsHawlMet,
      breakdown: adaptMetalsBreakdown(metalsBreakdown)
    },
    stocks: { 
      total: totalStocks, 
      hawlMet: stockHawlMet,
      breakdown: adaptBreakdown(stockBreakdown)
    },
    retirement: {
      total: retirementBreakdown.total,
      hawlMet: retirementHawlMet,
      breakdown: adaptBreakdown(retirementBreakdown)
    },
    realEstate: { 
      total: realEstateBreakdown.total, 
      hawlMet: realEstateHawlMet,
      breakdown: adaptRealEstateBreakdown(realEstateBreakdown)
    },
    crypto: { 
      total: totalCrypto, 
      hawlMet: cryptoHawlMet,
      breakdown: adaptBreakdown(cryptoBreakdown)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none space-y-6">
        <TotalHeader 
          totalAssets={totalAssets}
          breakdown={breakdown}
          nisabStatus={nisabStatus}
          currency={currency}
        />
        
        <NisabStatus 
          nisabStatus={nisabStatus} 
          currency={currency}
        />

        <AssetDistribution
          assetValues={{
            cash: totalCash,
            'precious-metals': totalMetals.total,
            stocks: totalStocks,
            retirement: retirementBreakdown.total,
            'real-estate': realEstateBreakdown.total,
            crypto: totalCrypto
          }}
          totalAssets={totalAssets}
        />
      </div>

      <BreakdownTable
        currency={currency}
        totalAssets={totalAssets}
        breakdown={{
          total: totalAssets,
          zakatable: breakdown.combined.zakatableValue,
          zakatDue: breakdown.combined.zakatDue
        }}
        assetBreakdowns={assetBreakdowns}
      />
    </div>
  )
} 