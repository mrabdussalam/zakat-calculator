import { createCalculatorValidation } from '../templates/calculatorValidation'
import { RealEstateValues } from '@/store/types'

// Define real estate-specific validation rules
const realEstateValidation = createCalculatorValidation<RealEstateValues>({
  name: 'Real Estate Calculator',
  requiredFields: [
    'primary_residence_value',
    'rental_income',
    'rental_expenses',
    'property_for_sale_value',
    'property_for_sale_active',
    'vacant_land_value',
    'vacant_land_sold',
    'sale_price'
  ],
  numericalFields: [
    'primary_residence_value',
    'rental_income',
    'rental_expenses',
    'property_for_sale_value',
    'vacant_land_value',
    'sale_price'
  ],
  booleanFields: [
    'property_for_sale_active',
    'vacant_land_sold'
  ],
  customValidations: [
    // Add real estate-specific validation rules
    (values: RealEstateValues) => {
      // Ensure rental expenses don't exceed rental income
      if (values.rental_expenses > values.rental_income) {
        console.error('Rental expenses cannot exceed rental income')
        return false
      }

      // Validate sale price when property is marked for sale
      if (values.property_for_sale_active && !values.property_for_sale_value) {
        console.error('Property for sale must have a value')
        return false
      }

      // Validate sale price when vacant land is marked as sold
      if (values.vacant_land_sold && !values.sale_price) {
        console.error('Sold vacant land must have a sale price')
        return false
      }

      return true
    }
  ]
})

// Add real estate-specific zakatable amount validation
const validateRealEstateZakatable = (values: RealEstateValues, hawlMet: boolean): boolean => {
  if (!hawlMet) return true // If hawl not met, no zakat is due

  try {
    // Calculate zakatable amount based on rules:
    // 1. Primary residence is exempt
    // 2. Rental income (minus expenses) is zakatable
    // 3. Property for sale is zakatable if active
    // 4. Vacant land is zakatable if sold
    const zakatableAmount = (
      Math.max(0, values.rental_income - values.rental_expenses) +
      (values.property_for_sale_active ? values.property_for_sale_value : 0) +
      (values.vacant_land_sold ? values.sale_price : 0)
    )

    if (zakatableAmount < 0) {
      console.error('Zakatable amount cannot be negative')
      return false
    }

    return true
  } catch (error) {
    console.error('Error validating real estate zakatable amount:', error)
    return false
  }
}

// Override the template's zakatable validation with real estate-specific logic
realEstateValidation.validateZakatableAmount = validateRealEstateZakatable

export default realEstateValidation 