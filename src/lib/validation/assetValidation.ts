import { AssetBreakdown, AssetBreakdownItem } from '../assets/types'
import { RetirementValues, StockValues, MetalsValues, CashValues, RealEstateValues, CryptoValues } from '@/store/types'
import { roundCurrency } from '../utils/currency'

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

interface ValidationContext {
  assetType: string
  values: any
  breakdown?: AssetBreakdown
  calculatedTotal?: number
  calculatedZakatable?: number
}

export class AssetValidation {
  /**
   * Validate raw input values before storing
   */
  static validateInput(assetType: string, values: any): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

    switch (assetType) {
      case 'retirement':
        return this.validateRetirementInput(values as RetirementValues)
      case 'stocks':
        return this.validateStockInput(values as StockValues)
      case 'metals':
        return this.validateMetalsInput(values as MetalsValues)
      case 'cash':
        return this.validateCashInput(values as CashValues)
      case 'realEstate':
        return this.validateRealEstateInput(values as RealEstateValues)
      case 'crypto':
        return this.validateCryptoInput(values as CryptoValues)
      default:
        result.errors.push(`Unknown asset type: ${assetType}`)
        result.isValid = false
        return result
    }
  }

  /**
   * Validate calculated values match between components
   */
  static validateCalculations(context: ValidationContext): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

    // Verify breakdown total matches calculated total
    if (context.breakdown && context.calculatedTotal !== undefined) {
      if (roundCurrency(context.breakdown.total) !== roundCurrency(context.calculatedTotal)) {
        result.errors.push(
          `Breakdown total (${context.breakdown.total}) does not match calculated total (${context.calculatedTotal})`
        )
        result.isValid = false
      }
    }

    // Verify breakdown zakatable matches calculated zakatable
    if (context.breakdown && context.calculatedZakatable !== undefined) {
      if (roundCurrency(context.breakdown.zakatable) !== roundCurrency(context.calculatedZakatable)) {
        result.errors.push(
          `Breakdown zakatable (${context.breakdown.zakatable}) does not match calculated zakatable (${context.calculatedZakatable})`
        )
        result.isValid = false
      }
    }

    // Verify breakdown items sum to total
    if (context.breakdown) {
      const itemsTotal = Object.values(context.breakdown.items)
        .reduce((sum, item) => sum + Number(item.value), 0)
      
      if (roundCurrency(itemsTotal) !== roundCurrency(context.breakdown.total)) {
        result.errors.push(
          `Breakdown items total (${itemsTotal}) does not match breakdown total (${context.breakdown.total})`
        )
        result.isValid = false
      }
    }

    return result
  }

  /**
   * Validate retirement account input values
   */
  private static validateRetirementInput(values: RetirementValues): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

    // Check for negative values
    Object.entries(values).forEach(([key, value]) => {
      if (value < 0) {
        result.errors.push(`${key} cannot be negative`)
        result.isValid = false
      }
    })

    // Check for valid tax and penalty rates if accessible
    if (values.traditional_401k > 0 || values.traditional_ira > 0) {
      // Tax rate should be between 0-100%
      if (values.tax_rate !== undefined && (values.tax_rate < 0 || values.tax_rate > 100)) {
        result.errors.push('Tax rate must be between 0 and 100%')
        result.isValid = false
      }

      // Penalty rate should be between 0-100%
      if (values.penalty_rate !== undefined && (values.penalty_rate < 0 || values.penalty_rate > 100)) {
        result.errors.push('Penalty rate must be between 0 and 100%')
        result.isValid = false
      }
    }

    return result
  }

  /**
   * Validate stock input values
   */
  private static validateStockInput(values: StockValues): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

    // Validate active stocks
    if (Array.isArray(values.activeStocks)) {
      values.activeStocks.forEach((stock, index) => {
        if (stock.shares < 0) {
          result.errors.push(`Stock ${index + 1}: Shares cannot be negative`)
          result.isValid = false
        }
        if (stock.currentPrice < 0) {
          result.errors.push(`Stock ${index + 1}: Price cannot be negative`)
          result.isValid = false
        }
      })
    }

    // Validate passive investments
    if (values.passiveInvestments) {
      if (values.passiveInvestments.marketValue < 0) {
        result.errors.push('Passive investments market value cannot be negative')
        result.isValid = false
      }
      if (values.passiveInvestments.zakatableValue < 0) {
        result.errors.push('Passive investments zakatable value cannot be negative')
        result.isValid = false
      }
    }

    return result
  }

  /**
   * Validate metals input values
   */
  private static validateMetalsInput(values: MetalsValues): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

    // Check for negative weights
    Object.entries(values).forEach(([key, value]) => {
      if (value < 0) {
        result.errors.push(`${key} weight cannot be negative`)
        result.isValid = false
      }
    })

    return result
  }

  /**
   * Validate cash input values
   */
  private static validateCashInput(values: CashValues): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

    // Check for negative amounts
    Object.entries(values).forEach(([key, value]) => {
      if (typeof value === 'number' && value < 0) {
        result.errors.push(`${key} amount cannot be negative`)
        result.isValid = false
      }
    })

    // Validate foreign currency entries
    if (Array.isArray(values.foreign_currency_entries)) {
      values.foreign_currency_entries.forEach((entry, index) => {
        if (entry.amount < 0) {
          result.errors.push(`Foreign currency ${index + 1}: Amount cannot be negative`)
          result.isValid = false
        }
        if (!entry.currency) {
          result.errors.push(`Foreign currency ${index + 1}: Currency code is required`)
          result.isValid = false
        }
      })
    }

    return result
  }

  /**
   * Validate real estate input values
   */
  private static validateRealEstateInput(values: RealEstateValues): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

    // Check for negative values
    Object.entries(values).forEach(([key, value]) => {
      if (typeof value === 'number' && value < 0) {
        result.errors.push(`${key} value cannot be negative`)
        result.isValid = false
      }
    })

    // Validate rental calculations
    if (values.rental_income < values.rental_expenses) {
      result.warnings.push('Rental expenses exceed rental income')
    }

    return result
  }

  /**
   * Validate cryptocurrency input values
   */
  private static validateCryptoInput(values: CryptoValues): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

    // Validate crypto coins
    if (Array.isArray(values.coins)) {
      values.coins.forEach((coin, index) => {
        if (coin.quantity < 0) {
          result.errors.push(`Coin ${index + 1}: Quantity cannot be negative`)
          result.isValid = false
        }
        if (coin.currentPrice < 0) {
          result.errors.push(`Coin ${index + 1}: Price cannot be negative`)
          result.isValid = false
        }
      })
    }

    return result
  }

  /**
   * Validate breakdown structure and values
   */
  static validateBreakdown(breakdown: AssetBreakdown): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

    // Validate total calculations
    const itemsTotal = Object.values(breakdown.items)
      .reduce((sum, item) => sum + Number(item.value), 0)
    
    if (roundCurrency(itemsTotal) !== roundCurrency(breakdown.total)) {
      result.errors.push('Items total does not match breakdown total')
      result.isValid = false
    }

    // Validate zakatable calculations
    const itemsZakatable = Object.values(breakdown.items)
      .reduce((sum, item) => sum + (item.zakatable || 0), 0)
    
    if (roundCurrency(itemsZakatable) !== roundCurrency(breakdown.zakatable)) {
      result.errors.push('Items zakatable does not match breakdown zakatable')
      result.isValid = false
    }

    // Validate zakat due calculation
    const expectedZakatDue = roundCurrency(breakdown.zakatable * 0.025)
    if (roundCurrency(breakdown.zakatDue) !== expectedZakatDue) {
      result.errors.push('Zakat due does not match 2.5% of zakatable amount')
      result.isValid = false
    }

    // Validate individual items
    Object.entries(breakdown.items).forEach(([key, item]) => {
      // Check required properties
      if (!item.label) {
        result.errors.push(`Item ${key}: Missing label`)
        result.isValid = false
      }

      // Validate value relationships
      if (item.isZakatable && !item.isExempt) {
        if (item.zakatable === undefined) {
          result.errors.push(`Item ${key}: Zakatable item missing zakatable value`)
          result.isValid = false
        }
        if (item.zakatDue === undefined) {
          result.errors.push(`Item ${key}: Zakatable item missing zakatDue value`)
          result.isValid = false
        }
      }

      // Check for inconsistencies
      if (item.isExempt && item.isZakatable) {
        result.errors.push(`Item ${key}: Cannot be both exempt and zakatable`)
        result.isValid = false
      }
    })

    return result
  }
} 