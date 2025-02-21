import { AssetType, AssetBreakdown, ZAKAT_RATE, safeCalculate } from './types'
import { MetalPrices, MetalsValues } from '@/store/modules/metals.types'

export const preciousMetals: AssetType = {
  id: 'precious-metals',
  name: 'Precious Metals',
  color: '#F59E0B', // Amber

  calculateTotal: (values: MetalsValues, prices: MetalPrices) => {
    const goldTotal = (
      safeCalculate(values.gold_regular) +
      safeCalculate(values.gold_occasional) +
      safeCalculate(values.gold_investment)
    ) * prices.gold

    const silverTotal = (
      safeCalculate(values.silver_regular) +
      safeCalculate(values.silver_occasional) +
      safeCalculate(values.silver_investment)
    ) * prices.silver

    return goldTotal + silverTotal
  },

  calculateZakatable: (values: MetalsValues, prices: MetalPrices, hawlMet: boolean) => {
    if (!hawlMet) return 0

    // Only occasional and investment metals are zakatable
    const zakatableGold = (
      safeCalculate(values.gold_occasional) +
      safeCalculate(values.gold_investment)
    ) * prices.gold

    const zakatableSilver = (
      safeCalculate(values.silver_occasional) +
      safeCalculate(values.silver_investment)
    ) * prices.silver

    return zakatableGold + zakatableSilver
  },

  getBreakdown: (values: MetalsValues, prices: MetalPrices, hawlMet: boolean): AssetBreakdown => {
    // Calculate individual values
    const goldRegular = {
      weight: safeCalculate(values.gold_regular),
      value: safeCalculate(values.gold_regular) * prices.gold,
      isZakatable: false, // Regular gold is exempt
      zakatable: 0,
      zakatDue: 0,
      label: 'Gold Regular',
      tooltip: 'Regular gold holdings (exempt from zakat)',
      isExempt: true
    }

    const goldOccasional = {
      weight: safeCalculate(values.gold_occasional),
      value: safeCalculate(values.gold_occasional) * prices.gold,
      isZakatable: hawlMet,
      zakatable: hawlMet ? safeCalculate(values.gold_occasional) * prices.gold : 0,
      zakatDue: hawlMet ? safeCalculate(values.gold_occasional) * prices.gold * ZAKAT_RATE : 0,
      label: 'Gold Occasional',
      tooltip: 'Occasional gold holdings'
    }

    const goldInvestment = {
      weight: safeCalculate(values.gold_investment),
      value: safeCalculate(values.gold_investment) * prices.gold,
      isZakatable: hawlMet,
      zakatable: hawlMet ? safeCalculate(values.gold_investment) * prices.gold : 0,
      zakatDue: hawlMet ? safeCalculate(values.gold_investment) * prices.gold * ZAKAT_RATE : 0,
      label: 'Gold Investment',
      tooltip: 'Investment gold holdings'
    }

    const silverRegular = {
      weight: safeCalculate(values.silver_regular),
      value: safeCalculate(values.silver_regular) * prices.silver,
      isZakatable: false, // Regular silver is exempt
      zakatable: 0,
      zakatDue: 0,
      label: 'Silver Regular',
      tooltip: 'Regular silver holdings (exempt from zakat)',
      isExempt: true
    }

    const silverOccasional = {
      weight: safeCalculate(values.silver_occasional),
      value: safeCalculate(values.silver_occasional) * prices.silver,
      isZakatable: hawlMet,
      zakatable: hawlMet ? safeCalculate(values.silver_occasional) * prices.silver : 0,
      zakatDue: hawlMet ? safeCalculate(values.silver_occasional) * prices.silver * ZAKAT_RATE : 0,
      label: 'Silver Occasional',
      tooltip: 'Occasional silver holdings'
    }

    const silverInvestment = {
      weight: safeCalculate(values.silver_investment),
      value: safeCalculate(values.silver_investment) * prices.silver,
      isZakatable: hawlMet,
      zakatable: hawlMet ? safeCalculate(values.silver_investment) * prices.silver : 0,
      zakatDue: hawlMet ? safeCalculate(values.silver_investment) * prices.silver * ZAKAT_RATE : 0,
      label: 'Silver Investment',
      tooltip: 'Investment silver holdings'
    }

    const items = {
      gold_regular: goldRegular,
      gold_occasional: goldOccasional,
      gold_investment: goldInvestment,
      silver_regular: silverRegular,
      silver_occasional: silverOccasional,
      silver_investment: silverInvestment
    }

    const total = Object.values(items).reduce((sum, item) => sum + item.value, 0)
    const zakatable = Object.values(items).reduce((sum, item) => sum + item.zakatable, 0)
    const zakatDue = Object.values(items).reduce((sum, item) => sum + item.zakatDue, 0)

    return {
      total,
      zakatable,
      zakatDue,
      items
    }
  }
} 