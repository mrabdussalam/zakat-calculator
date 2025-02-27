/**
 * Real Estate Calculator - Calculates Zakat on property assets based on intent
 * - Primary residence is exempt from Zakat
 * - Rental property: Only net rental income is zakatable (income minus expenses) 
 * - Property for sale: Full value is zakatable if actively listed for sale and hawl is met
 * - Vacant land: Sale price is zakatable if sold and hawl is met
 * - Applies standard 2.5% Zakat rate on zakatable amounts
 */
import { AssetType, AssetBreakdown, AssetBreakdownItem, ZAKAT_RATE, safeCalculate } from './types'
import { formatCurrency } from '@/lib/utils/currency'

interface RealEstateValues {
  // Primary Residence (exempt)
  primary_residence_value?: number

  // Rental Property
  rental_income?: number
  rental_expenses?: number

  // Property for Sale
  property_for_sale_value?: number
  property_for_sale_active?: number // 1 for active, 0 for inactive

  // Vacant Land
  vacant_land_value?: number
  vacant_land_sold?: number // 1 for sold, 0 for not sold
  sale_price?: number
}

export const realEstate: AssetType = {
  id: 'real-estate',
  name: 'Real Estate',
  color: '#4F46E5', // Indigo color

  calculateTotal: (values: RealEstateValues): number => {
    if (!values) return 0

    const primaryResidenceValue = safeCalculate(values.primary_residence_value)
    const rentalIncome = safeCalculate(values.rental_income)
    const propertyForSaleValue = safeCalculate(values.property_for_sale_value)
    const vacantLandValue = safeCalculate(values.vacant_land_value)

    return primaryResidenceValue + rentalIncome + propertyForSaleValue + vacantLandValue
  },

  calculateZakatable: (values: RealEstateValues, _prices: undefined, hawlMet: boolean): number => {
    if (!values || !hawlMet) return 0

    // Rental income is zakatable (after expenses)
    const rentalIncome = safeCalculate(values.rental_income)
    const rentalExpenses = safeCalculate(values.rental_expenses)
    const netRentalIncome = Math.max(0, rentalIncome - rentalExpenses)
    const rentalZakatable = hawlMet ? netRentalIncome : 0

    // Property for sale is zakatable if actively listed
    const propertyForSaleValue = safeCalculate(values.property_for_sale_value)
    const isPropertyForSaleActive = values.property_for_sale_active === 1
    const propertyForSaleZakatable = hawlMet && isPropertyForSaleActive ? propertyForSaleValue : 0

    // Vacant land is zakatable if sold during the year
    const vacantLandValue = safeCalculate(values.vacant_land_value)
    const isVacantLandSold = values.vacant_land_sold === 1
    const salePrice = safeCalculate(values.sale_price)
    const vacantLandZakatable = hawlMet && isVacantLandSold ? salePrice : 0

    return rentalZakatable + propertyForSaleZakatable + vacantLandZakatable
  },

  getBreakdown: (values: RealEstateValues, _prices: undefined, hawlMet: boolean, currency: string = 'USD'): AssetBreakdown => {
    if (!values) {
      return {
        total: 0,
        zakatable: 0,
        zakatDue: 0,
        items: {}
      }
    }

    // Primary Residence
    const primaryResidenceValue = safeCalculate(values.primary_residence_value)

    // Rental Property
    const rentalIncome = safeCalculate(values.rental_income)
    const rentalExpenses = safeCalculate(values.rental_expenses)
    const netRentalIncome = Math.max(0, rentalIncome - rentalExpenses)
    const rentalZakatable = hawlMet ? netRentalIncome : 0
    const rentalZakatDue = rentalZakatable * ZAKAT_RATE

    // Property for Sale
    const propertyForSaleValue = safeCalculate(values.property_for_sale_value)
    const isPropertyForSaleActive = values.property_for_sale_active === 1
    const propertyForSaleZakatable = hawlMet && isPropertyForSaleActive ? propertyForSaleValue : 0
    const propertyForSaleZakatDue = propertyForSaleZakatable * ZAKAT_RATE

    // Vacant Land
    const vacantLandValue = safeCalculate(values.vacant_land_value)
    const isVacantLandSold = values.vacant_land_sold === 1
    const salePrice = safeCalculate(values.sale_price)
    const vacantLandZakatable = hawlMet && isVacantLandSold ? salePrice : 0
    const vacantLandZakatDue = vacantLandZakatable * ZAKAT_RATE

    // Calculate totals
    const total = primaryResidenceValue + rentalIncome + propertyForSaleValue + vacantLandValue
    const zakatable = rentalZakatable + propertyForSaleZakatable + vacantLandZakatable
    const zakatDue = zakatable * ZAKAT_RATE

    // Create breakdown with detailed information
    const items: Record<string, AssetBreakdownItem> = {
      primary_residence: {
        value: primaryResidenceValue,
        isZakatable: false,
        zakatable: 0,
        zakatDue: 0,
        label: 'Primary Residence',
        tooltip: 'Primary residence is exempt from zakat',
        isExempt: true
      },
      rental_property: {
        value: rentalIncome,
        isZakatable: hawlMet,
        zakatable: rentalZakatable,
        zakatDue: rentalZakatDue,
        label: 'Rental Income',
        tooltip: `Net rental income after expenses: ${formatCurrency(netRentalIncome, currency)}`
      },
      property_for_sale: {
        value: propertyForSaleValue,
        isZakatable: hawlMet && isPropertyForSaleActive,
        zakatable: propertyForSaleZakatable,
        zakatDue: propertyForSaleZakatDue,
        label: 'Property for Sale',
        tooltip: isPropertyForSaleActive
          ? 'Property is actively listed for sale'
          : 'Property is not actively listed for sale'
      },
      vacant_land: {
        value: vacantLandValue,
        isZakatable: hawlMet && isVacantLandSold,
        zakatable: vacantLandZakatable,
        zakatDue: vacantLandZakatDue,
        label: 'Vacant Land',
        tooltip: isVacantLandSold
          ? `Land was sold for ${formatCurrency(salePrice, currency)}`
          : 'Land has not been sold'
      }
    }

    return {
      total,
      zakatable,
      zakatDue,
      items
    }
  }
}