import { ZakatState } from '@/store/types'
import { StockValues, MetalsValues, CashValues, RealEstateValues, RetirementValues } from '@/store/types'

type HawlField = 'cashHawlMet' | 'metalsHawlMet' | 'stockHawlMet' | 'realEstateHawlMet'

export const validateInitialState = (state: Partial<ZakatState>): boolean => {
  // Required slices
  const requiredSlices = [
    'cashValues',
    'metalsValues',
    'stockValues',
    'metalPrices',
    'stockPrices'
  ] as const

  for (const slice of requiredSlices) {
    if (!(slice in state)) {
      console.error(`Missing required slice: ${slice}`)
      return false
    }
  }

  // Hawl status
  const hawlFields: HawlField[] = [
    'cashHawlMet',
    'metalsHawlMet',
    'stockHawlMet',
    'realEstateHawlMet'
  ]

  for (const field of hawlFields) {
    if (typeof state[field] !== 'boolean') {
      console.error(`Invalid hawl status for: ${field}`)
      return false
    }
  }

  return true
}

export const validateValueTypes = (state: Partial<ZakatState>): boolean => {
  try {
    // Validate cash values
    if (state.cashValues) {
      for (const [key, value] of Object.entries(state.cashValues)) {
        if (typeof value !== 'number' || value < 0) {
          console.error(`Invalid cash value for ${key}: ${value}`)
          return false
        }
      }
    }

    // Validate metals values
    if (state.metalsValues) {
      for (const [key, value] of Object.entries(state.metalsValues)) {
        if (typeof value !== 'number' || value < 0) {
          console.error(`Invalid metals value for ${key}: ${value}`)
          return false
        }
      }
    }

    // Validate stock values
    if (state.stockValues) {
      if (state.stockValues.activeStocks && !Array.isArray(state.stockValues.activeStocks)) {
        console.error('Invalid activeStocks array')
        return false
      }

      // Validate active stocks structure
      for (const stock of state.stockValues.activeStocks || []) {
        if (!stock.ticker || typeof stock.shares !== 'number' || typeof stock.currentPrice !== 'number') {
          console.error('Invalid active stock structure:', stock)
          return false
        }
      }
    }

    // Validate real estate values
    if (state.realEstateValues) {
      for (const [key, value] of Object.entries(state.realEstateValues)) {
        if (key.endsWith('_active') || key.endsWith('_sold')) {
          if (typeof value !== 'boolean') {
            console.error(`Invalid real estate boolean value for ${key}: ${value}`)
            return false
          }
        } else if (typeof value !== 'number' || value < 0) {
          console.error(`Invalid real estate value for ${key}: ${value}`)
          return false
        }
      }
    }

    // Validate retirement values
    if (state.retirementValues) {
      for (const [key, value] of Object.entries(state.retirementValues)) {
        if (typeof value !== 'number' || value < 0) {
          console.error(`Invalid retirement value for ${key}: ${value}`)
          return false
        }
      }
    }

    return true
  } catch (error) {
    console.error('Value type validation error:', error)
    return false
  }
}

export const validateCalculations = (state: Partial<ZakatState>): boolean => {
  try {
    const calculationChecks = [
      {
        total: state.getTotalStocks,
        breakdown: state.getStocksBreakdown,
        name: 'stocks'
      },
      {
        total: state.getRealEstateTotal,
        breakdown: state.getRealEstateBreakdown,
        name: 'real estate'
      },
      {
        total: state.getTotalCash,
        breakdown: state.getCashBreakdown,
        name: 'cash'
      },
      {
        total: state.getMetalsTotal,
        breakdown: state.getMetalsBreakdown,
        name: 'metals'
      },
      {
        total: state.getTotalRetirement,
        breakdown: state.getRetirementBreakdown,
        name: 'retirement'
      }
    ]

    for (const { total, breakdown, name } of calculationChecks) {
      if (total && breakdown) {
        const totalValue = total()
        const breakdownValue = breakdown()

        if (typeof totalValue === 'number' && typeof breakdownValue.total === 'number' &&
          Math.abs(totalValue - breakdownValue.total) > 0.01) {
          console.error(`${name} calculations mismatch`, {
            total: totalValue,
            breakdownTotal: breakdownValue.total,
            difference: totalValue - breakdownValue.total
          })
          return false
        }
      }
    }

    return true
  } catch (error) {
    console.error('Calculation validation error:', error)
    return false
  }
}

export const validateValuePropagation = (state: Partial<ZakatState>): boolean => {
  try {
    // Verify breakdown structure for each asset type
    const breakdownValidations = [
      {
        getter: state.getStocksBreakdown,
        hawlMet: state.stockHawlMet,
        name: 'stocks'
      },
      {
        getter: state.getRealEstateBreakdown,
        hawlMet: state.realEstateHawlMet,
        name: 'real estate'
      },
      {
        getter: state.getMetalsBreakdown,
        hawlMet: state.metalsHawlMet,
        name: 'metals'
      },
      {
        getter: state.getCashBreakdown,
        hawlMet: state.cashHawlMet,
        name: 'cash'
      },
      {
        getter: state.getRetirementBreakdown,
        hawlMet: true, // Retirement always considers hawl met
        name: 'retirement'
      }
    ]

    for (const { getter, hawlMet, name } of breakdownValidations) {
      if (getter) {
        const breakdown = getter()

        // Verify total matches sum of items
        const itemsTotal = Object.values(breakdown.items)
          .reduce((sum, item) => {
            if (typeof item !== 'object' || typeof item.value !== 'number') return sum
            return sum + item.value
          }, 0)

        if (typeof breakdown.total === 'number' && Math.abs(breakdown.total - itemsTotal) > 0.01) {
          console.error(`${name} breakdown total mismatch`, {
            total: breakdown.total,
            itemsTotal,
            difference: breakdown.total - itemsTotal
          })
          return false
        }

        // Verify zakatable amounts
        if (hawlMet) {
          const zakatableTotal = Object.values(breakdown.items)
            .reduce((sum, item) => {
              if (typeof item !== 'object' || typeof item.value !== 'number') return sum
              return sum + (item.isZakatable ? item.value : 0)
            }, 0)

          if (typeof breakdown.zakatable === 'number' && Math.abs(breakdown.zakatable - zakatableTotal) > 0.01) {
            console.error(`${name} zakatable amount mismatch`)
            return false
          }
        }
      }
    }

    return true
  } catch (error) {
    console.error('Value propagation validation error:', error)
    return false
  }
}

export const validateStore = (state: Partial<ZakatState>): boolean => {
  if (process.env.NODE_ENV === 'production') return true

  return (
    validateInitialState(state) &&
    validateValueTypes(state) &&
    validateCalculations(state) &&
    validateValuePropagation(state)
  )
}
