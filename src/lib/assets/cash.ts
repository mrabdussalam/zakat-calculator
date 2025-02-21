import { AssetType, AssetBreakdown, AssetBreakdownItem, ZAKAT_RATE, safeCalculate } from './types'
import { formatCurrency } from '@/lib/utils/currency'

interface CashValues {
  [key: string]: number
}

export const cash: AssetType = {
  id: 'cash',
  name: 'Cash & Bank',
  color: '#7C3AED', // Purple

  calculateTotal: (values: CashValues) => {
    return Object.values(values).reduce((sum, value) => {
      return sum + safeCalculate(value)
    }, 0)
  },

  calculateZakatable: (values: CashValues, _prices: undefined, hawlMet: boolean) => {
    // Cash is zakatable only if hawl is met
    if (!hawlMet) return 0
    return Object.values(values).reduce((sum, value) => {
      return sum + safeCalculate(value)
    }, 0)
  },

  getBreakdown: (values: CashValues, _prices: undefined, hawlMet: boolean): AssetBreakdown => {
    const items = Object.entries(values).reduce((acc, [key, value]) => {
      if (key === 'foreign_currency_entries') return acc
      
      const safeValue = safeCalculate(value)
      const zakatable = hawlMet ? safeValue : 0
      const zakatDue = hawlMet ? safeValue * ZAKAT_RATE : 0
      
      return {
        ...acc,
        [key]: {
          value: safeValue,
          isZakatable: hawlMet,
          zakatable,
          zakatDue,
          label: key.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          tooltip: hawlMet 
            ? `Full amount is zakatable: ${formatCurrency(safeValue)}`
            : 'Hawl period not met yet'
        }
      }
    }, {} as Record<string, AssetBreakdownItem>)

    const total = cash.calculateTotal(values)
    const zakatable = cash.calculateZakatable(values, undefined, hawlMet)
    const zakatDue = zakatable * ZAKAT_RATE

    return {
      total,
      zakatable,
      zakatDue,
      items
    }
  }
} 