import { StateCreator } from 'zustand'
import { ZakatState } from '../types'
import { ZAKAT_RATE } from '@/lib/constants'
import { DEFAULT_HAWL_STATUS } from '../constants'
import { roundCurrency, formatCurrency, isValidCurrencyAmount } from '@/lib/utils/currency'

// Types
export interface RealEstateValues {
  primary_residence_value: number
  rental_income: number
  rental_expenses: number
  property_for_sale_value: number
  property_for_sale_active: boolean
  vacant_land_value: number
  vacant_land_sold: boolean
  sale_price: number
}

interface RealEstateErrors {
  primary_residence_value?: string
  rental_income?: string
  rental_expenses?: string
  property_for_sale_value?: string
  vacant_land_value?: string
  sale_price?: string
  [key: string]: string | undefined
}

export interface RealEstateSlice {
  // State
  realEstateValues: RealEstateValues
  realEstateErrors: RealEstateErrors
  realEstateHawlMet: boolean
  isValid: boolean

  // Actions
  setRealEstateValue: (field: keyof RealEstateValues, value: number | boolean) => void
  setRealEstateHawlMet: (value: boolean) => void
  resetRealEstateValues: () => void
  validateRealEstateValues: () => boolean
  updateRealEstateValues: (values: Partial<RealEstateValues>) => void

  // Getters
  getRealEstateTotal: () => number
  getRealEstateZakatable: () => number
  getRealEstateBreakdown: () => {
    total: number
    zakatable: number
    zakatDue: number
    items: Record<string, {
      value: number
      isZakatable?: boolean
      isExempt?: boolean
      label: string
      tooltip?: string
      zakatable?: number
      zakatDue: number
    }>
  }
}

// Validation functions
const validateRealEstateField = (field: keyof RealEstateValues, value: number | boolean): string | undefined => {
  if (typeof value === 'boolean') return undefined

  if (!isValidCurrencyAmount(value)) {
    return 'Value must be a valid currency amount'
  }

  if (field === 'rental_expenses' && value > 1000000000) {
    return 'Expenses seem unusually high'
  }

  if (field.includes('value') && value > 1000000000) {
    return 'Property value seems unusually high'
  }

  return undefined
}

// Initial state
const initialRealEstateValues: RealEstateValues = {
  primary_residence_value: 0,
  rental_income: 0,
  rental_expenses: 0,
  property_for_sale_value: 0,
  property_for_sale_active: false,
  vacant_land_value: 0,
  vacant_land_sold: false,
  sale_price: 0
}

// Store slice creator
export const createRealEstateSlice: StateCreator<
  ZakatState,
  [["zustand/persist", unknown]],
  [],
  RealEstateSlice
> = (set, get) => ({
  // State
  realEstateValues: initialRealEstateValues,
  realEstateErrors: {},
  realEstateHawlMet: DEFAULT_HAWL_STATUS.real_estate,
  isValid: true,

  // Actions
  setRealEstateValue: (field: keyof RealEstateValues, value: number | boolean) => {
    set((state: ZakatState) => {
      const newValues = {
        ...state.realEstateValues,
        [field]: typeof value === 'number' ? roundCurrency(value) : value
      }

      const error = validateRealEstateField(field, value)
      const newErrors = {
        ...state.realEstateErrors,
        [field]: error
      }

      const isValid = !Object.values(newErrors).some(error => error !== undefined)

      return {
        realEstateValues: newValues,
        realEstateErrors: newErrors,
        isValid
      }
    })
  },

  updateRealEstateValues: (values: Partial<RealEstateValues>) => {
    set((state: ZakatState) => {
      const newValues = {
        ...state.realEstateValues,
        ...values
      }

      // Validate the new values
      const newErrors: RealEstateErrors = { ...state.realEstateErrors }
      Object.entries(values).forEach(([field, value]) => {
        if (typeof value === 'number' || typeof value === 'boolean') {
          const error = validateRealEstateField(field as keyof RealEstateValues, value)
          newErrors[field] = error
        }
      })

      const isValid = !Object.values(newErrors).some(error => error !== undefined)

      return {
        realEstateValues: newValues,
        realEstateErrors: newErrors,
        isValid
      }
    })
  },

  setRealEstateHawlMet: (value: boolean) => {
    set({ realEstateHawlMet: value })
  },

  resetRealEstateValues: () => {
    set({
      realEstateValues: initialRealEstateValues,
      realEstateErrors: {},
      realEstateHawlMet: DEFAULT_HAWL_STATUS.real_estate,
      isValid: true
    })
  },

  validateRealEstateValues: () => {
    const { realEstateValues } = get()
    const errors: RealEstateErrors = {}

    // Validate each field
    Object.entries(realEstateValues).forEach(([field, value]) => {
      if (typeof value === 'number') {
        const error = validateRealEstateField(field as keyof RealEstateValues, value)
        if (error) {
          errors[field as keyof RealEstateErrors] = error
        }
      }
    })

    const isValid = Object.keys(errors).length === 0

    set({ realEstateErrors: errors, isValid })
    return isValid
  },

  // Getters
  getRealEstateTotal: () => {
    const { realEstateValues } = get()
    const total = (
      realEstateValues.primary_residence_value +
      realEstateValues.rental_income +
      (realEstateValues.property_for_sale_active ? realEstateValues.property_for_sale_value : 0) +
      (realEstateValues.vacant_land_sold ? realEstateValues.sale_price : realEstateValues.vacant_land_value)
    )
    return roundCurrency(total)
  },

  getRealEstateZakatable: () => {
    const { realEstateValues, realEstateHawlMet } = get()
    if (!realEstateHawlMet) return 0

    const rentalNet = Math.max(0, realEstateValues.rental_income - realEstateValues.rental_expenses)
    const propertyForSale = realEstateValues.property_for_sale_active ? realEstateValues.property_for_sale_value : 0
    const vacantLand = realEstateValues.vacant_land_sold ? realEstateValues.sale_price : 0

    return roundCurrency(rentalNet + propertyForSale + vacantLand)
  },

  getRealEstateBreakdown: () => {
    const state = get();
    const { realEstateValues, realEstateHawlMet } = get()

    // Calculate values
    const rentalIncome = roundCurrency(realEstateValues.rental_income || 0)
    const rentalExpenses = roundCurrency(realEstateValues.rental_expenses || 0)
    const rentalNet = roundCurrency(Math.max(0, rentalIncome - rentalExpenses))

    const propertyForSaleValue = roundCurrency(realEstateValues.property_for_sale_value || 0)
    const propertyForSaleActive = realEstateValues.property_for_sale_active || false

    const vacantLandValue = roundCurrency(realEstateValues.vacant_land_value || 0)
    const vacantLandSold = realEstateValues.vacant_land_sold || false
    const salePrice = roundCurrency(realEstateValues.sale_price || 0)

    const primaryResidenceValue = roundCurrency(realEstateValues.primary_residence_value || 0)

    // Calculate totals
    const total = roundCurrency(primaryResidenceValue + rentalIncome +
      (propertyForSaleActive ? propertyForSaleValue : 0) +
      (vacantLandSold ? salePrice : vacantLandValue))

    const zakatable = realEstateHawlMet ? roundCurrency(
      rentalNet +
      (propertyForSaleActive ? propertyForSaleValue : 0) +
      (vacantLandSold ? salePrice : 0)
    ) : 0

    const zakatDue = roundCurrency(zakatable * ZAKAT_RATE)

    // Calculate individual zakatDue values
    const rentalZakatDue = realEstateHawlMet ? roundCurrency(rentalNet * ZAKAT_RATE) : 0
    const propertyForSaleZakatDue = (propertyForSaleActive && realEstateHawlMet) ? roundCurrency(propertyForSaleValue * ZAKAT_RATE) : 0
    const vacantLandZakatDue = (vacantLandSold && realEstateHawlMet) ? roundCurrency(salePrice * ZAKAT_RATE) : 0

    return {
      total,
      zakatable,
      zakatDue,
      items: {
        primary_residence: {
          value: primaryResidenceValue,
          isZakatable: false,
          isExempt: true,
          zakatable: 0,
          zakatDue: 0,
          label: 'Primary Residence',
          tooltip: `Primary residence is exempt from Zakat (${formatCurrency(primaryResidenceValue, state.currency)})`
        },
        rental: {
          value: rentalIncome,
          isZakatable: realEstateHawlMet,
          zakatable: realEstateHawlMet ? rentalNet : 0,
          zakatDue: rentalZakatDue,
          label: 'Rental Property',
          tooltip: `Rental income: ${formatCurrency(rentalIncome, state.currency)}, Expenses: ${formatCurrency(rentalExpenses, state.currency)}, Net: ${formatCurrency(rentalNet, state.currency)}`
        },
        property_for_sale: {
          value: propertyForSaleValue,
          isZakatable: propertyForSaleActive && realEstateHawlMet,
          zakatable: (propertyForSaleActive && realEstateHawlMet) ? propertyForSaleValue : 0,
          zakatDue: propertyForSaleZakatDue,
          label: 'Property for Sale',
          tooltip: propertyForSaleActive
            ? `Property is actively listed for sale (${formatCurrency(propertyForSaleValue, state.currency)})`
            : 'Not currently for sale'
        },
        vacant_land: {
          value: vacantLandSold ? salePrice : vacantLandValue,
          isZakatable: vacantLandSold && realEstateHawlMet,
          zakatable: (vacantLandSold && realEstateHawlMet) ? salePrice : 0,
          zakatDue: vacantLandZakatDue,
          label: vacantLandSold ? 'Vacant Land (Sold)' : 'Vacant Land',
          tooltip: vacantLandSold
            ? `Land has been sold for ${formatCurrency(salePrice, state.currency)}`
            : `Land is not currently for sale (${formatCurrency(vacantLandValue, state.currency)})`
        }
      }
    }
  }
})