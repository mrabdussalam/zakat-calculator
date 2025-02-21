import { StateCreator } from 'zustand'
import { ZakatState } from '../types'
import { getAssetType } from '@/lib/assets/registry'
import { ZAKAT_RATE } from '@/lib/constants'
import { roundCurrency, formatCurrency, isValidCurrencyAmount } from '@/lib/utils/currency'

export interface CashValues {
  cash_on_hand: number
  checking_account: number
  savings_account: number
  digital_wallets: number
  foreign_currency: number
  foreign_currency_entries?: Array<{
    amount: number
    currency: string
  }>
}

export interface CashSlice {
  cashValues: CashValues
  cashHawlMet: boolean
  setCashValue: (key: keyof CashValues, value: number) => void
  setCashHawlMet: (value: boolean) => void
  resetCashValues: () => void
  getTotalCash: () => number
  getTotalZakatableCash: () => number
  getCashBreakdown: () => {
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
    }>
  }
}

const initialCashValues: CashValues = {
  cash_on_hand: 0,
  checking_account: 0,
  savings_account: 0,
  digital_wallets: 0,
  foreign_currency: 0
}

export const createCashSlice: StateCreator<
  ZakatState,
  [["zustand/persist", unknown]],
  [],
  CashSlice
> = (set, get, store) => ({
  cashValues: initialCashValues,
  cashHawlMet: true,

  setCashValue: (key, value) => {
    if (!isValidCurrencyAmount(value)) {
      console.warn(`Invalid cash value: ${value} for ${key}`)
      return
    }

    set((state) => ({
      cashValues: {
        ...state.cashValues,
        [key]: roundCurrency(value)
      }
    }))
  },

  setCashHawlMet: (value) => set({ cashHawlMet: value }),

  resetCashValues: () => set({ 
    cashValues: initialCashValues,
    cashHawlMet: true
  }),

  getTotalCash: () => {
    const state = get()
    const cashAsset = getAssetType('cash')
    if (!cashAsset) return 0
    return roundCurrency(cashAsset.calculateTotal(state.cashValues))
  },

  getTotalZakatableCash: () => {
    const state = get()
    const cashAsset = getAssetType('cash')
    if (!cashAsset) return 0
    return roundCurrency(cashAsset.calculateZakatable(
      state.cashValues,
      undefined,
      state.cashHawlMet
    ))
  },

  getCashBreakdown: () => {
    const state = get()
    const cashAsset = getAssetType('cash')
    if (!cashAsset) {
      return {
        total: 0,
        zakatable: 0,
        zakatDue: 0,
        items: {}
      }
    }

    const breakdown = cashAsset.getBreakdown(
      state.cashValues,
      undefined,
      state.cashHawlMet
    )

    return {
      total: roundCurrency(breakdown.total),
      zakatable: roundCurrency(breakdown.zakatable),
      zakatDue: roundCurrency(breakdown.zakatDue),
      items: Object.entries(breakdown.items).reduce((acc, [key, item]) => ({
        ...acc,
        [key]: {
          value: roundCurrency(item.value),
          isZakatable: state.cashHawlMet,
          zakatable: state.cashHawlMet ? roundCurrency(item.value) : 0,
          zakatDue: state.cashHawlMet ? roundCurrency(item.value * ZAKAT_RATE) : 0,
          label: item.label,
          tooltip: state.cashHawlMet 
            ? `Full amount is zakatable: ${formatCurrency(item.value)}`
            : 'Hawl period not met yet'
        }
      }), {})
    }
  }
}) 