import { StateCreator } from 'zustand'
import { ZakatState, DebtValues, DebtEntry, ReceivableEntry } from '@/store/types'
import { ZAKAT_RATE } from '@/lib/constants'
import { roundCurrency, isValidCurrencyAmount } from '@/lib/utils/currency'
import { DebtSlice } from './debt.types'
import { v4 as uuidv4 } from 'uuid'

const initialDebtValues: DebtValues = {
  receivables: 0,
  receivables_entries: [],
  short_term_liabilities: 0,
  long_term_liabilities_annual: 0,
  liabilities_entries: []
}

export const createDebtSlice: StateCreator<
  ZakatState,
  [['zustand/persist', unknown]],
  [],
  DebtSlice
> = (set, get) => ({
  debtValues: initialDebtValues,
  debtHawlMet: true,

  setDebtValue: (key, value) => {
    // Handle array values (entries)
    if (key === 'receivables_entries' || key === 'liabilities_entries') {
      if (!Array.isArray(value)) {
        console.warn(`Invalid ${key} value - expected array:`, value)
        return
      }

      set((state) => ({
        debtValues: {
          ...state.debtValues,
          [key]: value
        }
      }))

      // Recalculate totals based on entries
      const updatedState = get()
      if (key === 'receivables_entries') {
        const total = (value as ReceivableEntry[]).reduce((sum, entry) => sum + entry.amount, 0)
        set((state) => ({
          debtValues: {
            ...state.debtValues,
            receivables: roundCurrency(total)
          }
        }))
      } else if (key === 'liabilities_entries') {
        const shortTerm = (value as DebtEntry[])
          .filter((entry) => entry.is_short_term)
          .reduce((sum, entry) => sum + entry.amount, 0)
        const longTerm = (value as DebtEntry[])
          .filter((entry) => !entry.is_short_term)
          .reduce((sum, entry) => sum + entry.amount, 0)

        set((state) => ({
          debtValues: {
            ...state.debtValues,
            short_term_liabilities: roundCurrency(shortTerm),
            long_term_liabilities_annual: roundCurrency(longTerm)
          }
        }))
      }

      return
    }

    // Handle numeric values
    if (!isValidCurrencyAmount(value as number)) {
      console.warn(`Invalid debt value: ${value} for ${key}`)
      return
    }

    const roundedValue = roundCurrency(value as number)

    set((state) => ({
      debtValues: {
        ...state.debtValues,
        [key]: roundedValue
      }
    }))
  },

  setDebtHawlMet: (value) => {
    set({ debtHawlMet: value })
  },

  resetDebtValues: () => {
    set({
      debtValues: initialDebtValues,
      debtHawlMet: true
    })
  },

  updateDebtValues: (values) => {
    set((state) => ({
      debtValues: {
        ...state.debtValues,
        ...values
      }
    }))
  },

  // Entry management for receivables
  addReceivableEntry: (entry) => {
    const newEntry: ReceivableEntry = {
      ...entry,
      id: uuidv4()
    }

    set((state) => {
      const newEntries = [...state.debtValues.receivables_entries, newEntry]
      const newTotal = newEntries.reduce((sum, e) => sum + e.amount, 0)

      return {
        debtValues: {
          ...state.debtValues,
          receivables_entries: newEntries,
          receivables: roundCurrency(newTotal)
        }
      }
    })
  },

  removeReceivableEntry: (id) => {
    set((state) => {
      const newEntries = state.debtValues.receivables_entries.filter((e) => e.id !== id)
      const newTotal = newEntries.reduce((sum, e) => sum + e.amount, 0)

      return {
        debtValues: {
          ...state.debtValues,
          receivables_entries: newEntries,
          receivables: roundCurrency(newTotal)
        }
      }
    })
  },

  updateReceivableEntry: (id, updates) => {
    set((state) => {
      const newEntries = state.debtValues.receivables_entries.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      )
      const newTotal = newEntries.reduce((sum, e) => sum + e.amount, 0)

      return {
        debtValues: {
          ...state.debtValues,
          receivables_entries: newEntries,
          receivables: roundCurrency(newTotal)
        }
      }
    })
  },

  // Entry management for liabilities
  addLiabilityEntry: (entry) => {
    const newEntry: DebtEntry = {
      ...entry,
      id: uuidv4()
    }

    set((state) => {
      const newEntries = [...state.debtValues.liabilities_entries, newEntry]
      const shortTerm = newEntries
        .filter((e) => e.is_short_term)
        .reduce((sum, e) => sum + e.amount, 0)
      const longTerm = newEntries
        .filter((e) => !e.is_short_term)
        .reduce((sum, e) => sum + e.amount, 0)

      return {
        debtValues: {
          ...state.debtValues,
          liabilities_entries: newEntries,
          short_term_liabilities: roundCurrency(shortTerm),
          long_term_liabilities_annual: roundCurrency(longTerm)
        }
      }
    })
  },

  removeLiabilityEntry: (id) => {
    set((state) => {
      const newEntries = state.debtValues.liabilities_entries.filter((e) => e.id !== id)
      const shortTerm = newEntries
        .filter((e) => e.is_short_term)
        .reduce((sum, e) => sum + e.amount, 0)
      const longTerm = newEntries
        .filter((e) => !e.is_short_term)
        .reduce((sum, e) => sum + e.amount, 0)

      return {
        debtValues: {
          ...state.debtValues,
          liabilities_entries: newEntries,
          short_term_liabilities: roundCurrency(shortTerm),
          long_term_liabilities_annual: roundCurrency(longTerm)
        }
      }
    })
  },

  updateLiabilityEntry: (id, updates) => {
    set((state) => {
      const newEntries = state.debtValues.liabilities_entries.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      )
      const shortTerm = newEntries
        .filter((e) => e.is_short_term)
        .reduce((sum, e) => sum + e.amount, 0)
      const longTerm = newEntries
        .filter((e) => !e.is_short_term)
        .reduce((sum, e) => sum + e.amount, 0)

      return {
        debtValues: {
          ...state.debtValues,
          liabilities_entries: newEntries,
          short_term_liabilities: roundCurrency(shortTerm),
          long_term_liabilities_annual: roundCurrency(longTerm)
        }
      }
    })
  },

  // Getters
  getTotalReceivables: () => {
    const { debtValues } = get()
    return roundCurrency(debtValues.receivables || 0)
  },

  getTotalLiabilities: () => {
    const { debtValues } = get()
    const shortTerm = debtValues.short_term_liabilities || 0
    const longTermAnnual = debtValues.long_term_liabilities_annual || 0
    return roundCurrency(shortTerm + longTermAnnual)
  },

  getNetDebtImpact: () => {
    const { getTotalReceivables, getTotalLiabilities } = get()
    const receivables = getTotalReceivables()
    const liabilities = getTotalLiabilities()
    return roundCurrency(receivables - liabilities)
  },

  getDebtBreakdown: () => {
    const state = get()
    const { debtValues, debtHawlMet, currency } = state

    const receivables = debtValues.receivables || 0
    const shortTermLiabilities = debtValues.short_term_liabilities || 0
    const longTermLiabilitiesAnnual = debtValues.long_term_liabilities_annual || 0
    const totalLiabilities = shortTermLiabilities + longTermLiabilitiesAnnual

    // Net impact: positive means adds to wealth, negative means deduction
    const netImpact = receivables - totalLiabilities

    // Zakatable is the net impact (aligned with asset calculator)
    const zakatable = debtHawlMet ? netImpact : 0

    // Zakat due only if net positive
    const zakatDue = debtHawlMet && netImpact > 0 ? roundCurrency(netImpact * ZAKAT_RATE) : 0

    const items: Record<string, {
      value: number
      isZakatable: boolean
      zakatable: number
      zakatDue: number
      label: string
      tooltip?: string
      isLiability?: boolean
      isExempt?: boolean
    }> = {
      receivables: {
        value: roundCurrency(receivables),
        isZakatable: debtHawlMet && receivables > 0,
        zakatable: debtHawlMet ? roundCurrency(receivables) : 0,
        zakatDue: 0,
        label: 'Money Owed to You',
        tooltip: `Receivables add to your zakatable wealth`,
        isLiability: false,
        isExempt: false
      },
      short_term_liabilities: {
        value: roundCurrency(-shortTermLiabilities),
        isZakatable: false,
        zakatable: debtHawlMet ? roundCurrency(-shortTermLiabilities) : 0,
        zakatDue: 0,
        label: 'Short-Term Debt',
        tooltip: `Debts due within 12 months are fully deductible`,
        isLiability: true,
        isExempt: true
      },
      long_term_liabilities_annual: {
        value: roundCurrency(-longTermLiabilitiesAnnual),
        isZakatable: false,
        zakatable: debtHawlMet ? roundCurrency(-longTermLiabilitiesAnnual) : 0,
        zakatDue: 0,
        label: 'Long-Term Debt (Annual)',
        tooltip: `Only the annual portion of long-term debts is deductible`,
        isLiability: true,
        isExempt: true
      }
    }

    return {
      total: roundCurrency(netImpact),
      zakatable: roundCurrency(zakatable),
      zakatDue: roundCurrency(zakatDue),
      items
    }
  }
})
