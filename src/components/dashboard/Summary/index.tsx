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
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'
import { useEffect } from 'react'
import { WeightUnit } from '@/lib/utils/units'

const adaptBreakdown = (
  breakdown: {
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
  },
  currency: string = 'USD'
): AssetBreakdown => {
  return {
    total: breakdown.total,
    zakatable: breakdown.zakatable,
    zakatDue: breakdown.zakatDue,
    items: Object.entries(breakdown.items).reduce<Record<string, AssetBreakdownItem>>((acc, [key, item]) => {
      const tooltip = item.tooltip || `${item.label}: ${item.value.toLocaleString('en-US', { style: 'currency', currency })}`
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
  const store = useZakatStore() as any;

  const {
    getTotalCash,
    getTotalStocks,
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
    getCryptoBreakdown,
    debtValues,
    debtHawlMet,
    getDebtBreakdown,
    getStocksBreakdown,
    metalsPreferences,
    getMetalsTotal,
    getTotalLiabilities,
    getTotalReceivables
  } = store;

  const breakdown = getBreakdown()
  const nisabStatus = getNisabStatus()

  // Track zakat calculation when values change
  useEffect(() => {
    trackEvent({
      ...AnalyticsEvents.ZAKAT_CALCULATION,
      currency: currency,
      value: breakdown.combined.zakatDue,
      label: nisabStatus.meetsNisab ? 'eligible' : 'not_eligible'
    })
  }, [breakdown.combined.zakatDue, currency, nisabStatus.meetsNisab])

  // Track nisab status changes
  useEffect(() => {
    trackEvent({
      ...AnalyticsEvents.NISAB_CHECK,
      value: nisabStatus.totalValue,
      label: nisabStatus.meetsNisab ? 'above' : 'below',
      currency: currency
    })
  }, [nisabStatus.meetsNisab, nisabStatus.totalValue, currency])

  // Track currency changes and force a refresh when currency changes
  useEffect(() => {
    console.log(`Summary: Currency is ${currency}, nisab currency is ${nisabStatus.currency}`);

    // If currencies don't match, we need to ensure a correct nisab status
    if (nisabStatus.currency && nisabStatus.currency !== currency) {
      console.log(`Summary: Currency mismatch detected - display: ${currency}, nisab: ${nisabStatus.currency}`);

      // Dispatch a custom event to force components to refresh with new currency
      const event = new CustomEvent('currency-changed', {
        detail: {
          from: nisabStatus.currency,
          to: currency
        }
      });

      // Small delay to ensure components are mounted
      setTimeout(() => {
        console.log('Summary: Dispatching currency-changed event');
        window.dispatchEvent(event);
      }, 100);
    }
  }, [currency, nisabStatus.currency]);

  // Get all the values we need
  const totalMetals = getMetalsTotal()
  const totalCash = getTotalCash()
  const totalStocks = getTotalStocks()
  const totalCrypto = getTotalCrypto()
  const stockBreakdown = getStocksBreakdown()
  const metalsBreakdown = getMetalsBreakdown()
  const realEstateBreakdown = getRealEstateBreakdown()
  const cryptoBreakdown = getCryptoBreakdown()
  const cashBreakdown = getCashBreakdown()
  const retirementBreakdown = getRetirementBreakdown()
  const totalLiabilities = getTotalLiabilities ? getTotalLiabilities() : 0
  const totalReceivables = getTotalReceivables ? getTotalReceivables() : 0
  const debtBreakdown = getDebtBreakdown()

  // Use the totalValue from the combined breakdown
  const totalAssets = breakdown.combined.totalValue

  // Prepare asset breakdowns with consistent format
  const assetBreakdowns: Record<string, AssetBreakdownWithHawl> = {
    cash: {
      total: totalCash,
      hawlMet: cashHawlMet,
      breakdown: adaptBreakdown(cashBreakdown, currency)
    },
    metals: {
      total: totalMetals,
      hawlMet: metalsHawlMet,
      breakdown: adaptMetalsBreakdown(
        metalsBreakdown,
        metalsPreferences?.weightUnit || 'gram',
        currency
      )
    },
    stocks: {
      total: totalStocks,
      hawlMet: stockHawlMet,
      breakdown: adaptBreakdown(stockBreakdown, currency)
    },
    retirement: {
      total: retirementBreakdown.total,
      hawlMet: retirementHawlMet,
      breakdown: adaptBreakdown(retirementBreakdown, currency)
    },
    realEstate: {
      total: realEstateBreakdown.total,
      hawlMet: realEstateHawlMet,
      breakdown: adaptRealEstateBreakdown(realEstateBreakdown, currency)
    },
    crypto: {
      total: totalCrypto,
      hawlMet: cryptoHawlMet,
      breakdown: adaptBreakdown(cryptoBreakdown, currency)
    },
    debt: {
      total: debtBreakdown.total,
      breakdown: adaptBreakdown(debtBreakdown, currency),
      hawlMet: debtHawlMet
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
          key={`nisab-status-${currency}`}
        />

        <AssetDistribution
          assetValues={{
            cash: totalCash,
            'precious-metals': totalMetals,
            stocks: totalStocks,
            retirement: retirementBreakdown.total,
            'real-estate': realEstateBreakdown.total,
            crypto: totalCrypto,
            debt: debtBreakdown.total
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