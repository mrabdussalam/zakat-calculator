/**
 * Debt & Liabilities Calculator - Calculates impact of debts on Zakat
 *
 * KEY PRINCIPLE: Net Zakatable Wealth = Assets - Deductible Liabilities
 *
 * Current Implementation: AAOIFI/Contemporary Method
 * - Receivables (money owed TO you): Added to zakatable wealth
 * - Liabilities: Deducted from zakatable wealth
 *   - Short-term (due within 12 months): Fully deductible
 *   - Long-term: Only annual portion deductible
 *
 * Net Impact = Receivables - Total Liabilities
 * - Positive: Increases zakatable wealth
 * - Negative: Decreases zakatable wealth (deduction from other assets)
 */
import { AssetType, ZAKAT_RATE, safeCalculate, AssetBreakdown } from './types'
import { DebtValues } from '@/store/types'
import { formatCurrency } from '@/lib/utils/currency'

// Extended breakdown item type for debt (includes isLiability)
interface DebtBreakdownItem {
  value: number
  isZakatable: boolean
  zakatable: number
  zakatDue: number
  label: string
  tooltip: string
  isLiability?: boolean
  isExempt?: boolean
}

export const debt: AssetType = {
  id: 'debt',
  name: 'Debt & Liabilities',
  color: '#6366F1', // Indigo

  /**
   * Calculate total NET impact (receivables - liabilities)
   * This represents the net effect on total wealth
   */
  calculateTotal: (values: DebtValues): number => {
    if (!values) return 0

    const receivables = safeCalculate(values.receivables)
    const shortTermLiabilities = safeCalculate(values.short_term_liabilities)
    const longTermLiabilitiesAnnual = safeCalculate(values.long_term_liabilities_annual)

    // Net impact: what you're owed minus what you owe
    return receivables - (shortTermLiabilities + longTermLiabilitiesAnnual)
  },

  /**
   * Calculate zakatable amount
   *
   * FIXED LOGIC: The net impact is what's zakatable, not just receivables
   * - If net positive: That amount is added to zakatable wealth
   * - If net negative: This represents a deduction (returned as negative)
   *
   * This allows the main calculator to properly reduce total zakatable wealth
   */
  calculateZakatable: (values: DebtValues, _prices: unknown, hawlMet: boolean): number => {
    if (!values || !hawlMet) return 0

    const receivables = safeCalculate(values.receivables)
    const shortTermLiabilities = safeCalculate(values.short_term_liabilities)
    const longTermLiabilitiesAnnual = safeCalculate(values.long_term_liabilities_annual)

    // Net impact determines zakatable amount
    const netImpact = receivables - (shortTermLiabilities + longTermLiabilitiesAnnual)

    // Return net impact - can be negative (acts as deduction)
    // The calling code should handle this appropriately
    return netImpact
  },

  /**
   * Get detailed breakdown of debt components
   */
  getBreakdown: (
    values: DebtValues,
    _prices: unknown,
    hawlMet: boolean,
    currency: string = 'USD'
  ): AssetBreakdown => {
    if (!values) {
      return {
        total: 0,
        zakatable: 0,
        zakatDue: 0,
        items: {}
      }
    }

    const receivables = safeCalculate(values.receivables)
    const shortTermLiabilities = safeCalculate(values.short_term_liabilities)
    const longTermLiabilitiesAnnual = safeCalculate(values.long_term_liabilities_annual)
    const totalLiabilities = shortTermLiabilities + longTermLiabilitiesAnnual

    // Net impact calculation
    const netImpact = receivables - totalLiabilities

    // Zakatable is the net impact (can be negative for deduction)
    const zakatable = hawlMet ? netImpact : 0

    // Zakat due: only positive if net impact is positive
    const zakatDue = hawlMet && netImpact > 0 ? netImpact * ZAKAT_RATE : 0

    // Build breakdown items
    const items: Record<string, {
      value: number
      isZakatable: boolean
      zakatable: number
      zakatDue: number
      label: string
      tooltip: string
      isLiability?: boolean
      isExempt?: boolean
    }> = {
      receivables: {
        value: receivables,
        isZakatable: hawlMet && receivables > 0,
        zakatable: hawlMet ? receivables : 0,
        zakatDue: 0, // Individual item doesn't have zakat due
        label: 'Money Owed to You',
        tooltip: hawlMet
          ? `Receivables: ${formatCurrency(receivables, currency)} (adds to zakatable wealth)`
          : 'Hawl period not met yet'
      },
      short_term_liabilities: {
        value: -shortTermLiabilities, // Negative to show as deduction
        isZakatable: false,
        zakatable: hawlMet ? -shortTermLiabilities : 0, // Negative = deduction
        zakatDue: 0,
        label: 'Short-Term Debt',
        tooltip: `Short-term debts due within 12 months: ${formatCurrency(shortTermLiabilities, currency)} (deductible)`,
        isLiability: true,
        isExempt: true
      },
      long_term_liabilities_annual: {
        value: -longTermLiabilitiesAnnual, // Negative to show as deduction
        isZakatable: false,
        zakatable: hawlMet ? -longTermLiabilitiesAnnual : 0, // Negative = deduction
        zakatDue: 0,
        label: 'Long-Term Debt (Annual)',
        tooltip: `Annual payment for long-term debts: ${formatCurrency(longTermLiabilitiesAnnual, currency)} (only this year's portion deductible)`,
        isLiability: true,
        isExempt: true
      },
      net_impact: {
        value: netImpact,
        isZakatable: hawlMet,
        zakatable: zakatable,
        zakatDue: zakatDue,
        label: 'Net Debt Impact',
        tooltip: netImpact >= 0
          ? `Net positive: ${formatCurrency(netImpact, currency)} added to zakatable wealth`
          : `Net negative: ${formatCurrency(Math.abs(netImpact), currency)} deducted from zakatable wealth`
      }
    }

    return {
      total: netImpact,
      zakatable,
      zakatDue,
      items
    }
  }
}
