import { DebtValues, DebtEntry, ReceivableEntry } from '@/store/types'

export interface DebtSlice {
  debtValues: DebtValues
  debtHawlMet: boolean

  // Actions
  setDebtValue: (key: keyof DebtValues, value: number | DebtEntry[] | ReceivableEntry[]) => void
  setDebtHawlMet: (value: boolean) => void
  resetDebtValues: () => void
  updateDebtValues: (values: Partial<DebtValues>) => void

  // Entry management
  addReceivableEntry: (entry: Omit<ReceivableEntry, 'id'>) => void
  removeReceivableEntry: (id: string) => void
  updateReceivableEntry: (id: string, updates: Partial<ReceivableEntry>) => void

  addLiabilityEntry: (entry: Omit<DebtEntry, 'id'>) => void
  removeLiabilityEntry: (id: string) => void
  updateLiabilityEntry: (id: string, updates: Partial<DebtEntry>) => void

  // Getters
  getTotalReceivables: () => number
  getTotalLiabilities: () => number
  getNetDebtImpact: () => number
  getDebtBreakdown: () => {
    total: number
    zakatable: number
    zakatDue: number
    items: Record<string, {
      value: number
      isZakatable: boolean
      zakatable: number
      zakatDue: number
      label: string
      tooltip?: string
      isLiability?: boolean
      isExempt?: boolean
    }>
  }
}
