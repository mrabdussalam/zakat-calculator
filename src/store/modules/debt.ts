import { StateCreator } from 'zustand'
import { ZakatState, DebtValues } from '../types'
import { getAssetType } from '@/lib/assets/registry'
import { ZAKAT_RATE } from '@/lib/constants'
import { roundCurrency, formatCurrency, isValidCurrencyAmount } from '@/lib/utils/currency'
import { DebtSlice } from './debt.types'
import { validateDebtValues } from '@/lib/validation'

const initialDebtValues: DebtValues = {
    receivables: 0,
    short_term_liabilities: 0,
    long_term_liabilities_annual: 0,
    receivables_entries: [],
    liabilities_entries: []
}

export const createDebtSlice: StateCreator<
    ZakatState,
    [["zustand/persist", unknown]],
    [],
    DebtSlice
> = (set, get) => ({
    debtValues: initialDebtValues,
    debtHawlMet: true,

    setDebtValue: (key, value) => {
        // Handle array values
        if (key === 'receivables_entries' || key === 'liabilities_entries') {
            if (!Array.isArray(value)) {
                console.warn(`Invalid ${key} value:`, value);
                return;
            }

            set((state) => ({
                debtValues: {
                    ...state.debtValues,
                    [key]: value
                }
            }));

            // Validate after update
            const updatedValues = {
                ...get().debtValues,
                [key]: value
            };
            const validation = validateDebtValues(updatedValues);
            if (!validation.isValid) {
                console.warn('Validation failed:', validation.errors);
            }

            return;
        }

        // Handle numeric values
        if (!isValidCurrencyAmount(value as number)) {
            console.warn(`Invalid ${key} value:`, value);
            return;
        }

        set((state) => ({
            debtValues: {
                ...state.debtValues,
                [key]: value
            }
        }));

        // Validate after update
        const updatedValues = {
            ...get().debtValues,
            [key]: value
        };
        const validation = validateDebtValues(updatedValues);
        if (!validation.isValid) {
            console.warn('Validation failed:', validation.errors);
        }
    },

    setDebtHawlMet: (value) => {
        set({ debtHawlMet: value });
    },

    resetDebtValues: () => {
        set({ debtValues: initialDebtValues });
    },

    getTotalReceivables: () => {
        const { debtValues } = get();
        return debtValues.receivables || 0;
    },

    getTotalLiabilities: () => {
        const { debtValues } = get();
        const shortTerm = debtValues.short_term_liabilities || 0;
        const longTermAnnual = debtValues.long_term_liabilities_annual || 0;
        return shortTerm + longTermAnnual;
    },

    getNetDebtImpact: () => {
        const { getTotalReceivables, getTotalLiabilities } = get();

        // For total asset calculation, include all receivables regardless of hawl status
        const receivables = getTotalReceivables();
        const liabilities = getTotalLiabilities();

        return receivables - liabilities;
    },

    updateDebtValues: (values) => {
        set((state) => ({
            debtValues: {
                ...state.debtValues,
                ...values
            }
        }));

        // Validate after update
        const updatedValues = {
            ...get().debtValues,
            ...values
        };
        const validation = validateDebtValues(updatedValues);
        if (!validation.isValid) {
            console.warn('Validation failed:', validation.errors);
        }
    },

    getDebtBreakdown: () => {
        const { debtValues, debtHawlMet, currency, getTotalReceivables, getTotalLiabilities } = get();

        const receivables = getTotalReceivables();
        const liabilities = getTotalLiabilities();
        const netImpact = receivables - liabilities;

        // Only the net impact is zakatable (not the full receivables amount)
        // and only if net impact is positive and hawl is met
        const zakatable = (netImpact > 0 && debtHawlMet) ? netImpact : 0;
        const zakatDue = zakatable * ZAKAT_RATE;

        // Create breakdown items
        const items: Record<string, any> = {
            receivables: {
                value: receivables,
                isZakatable: debtHawlMet && netImpact > 0,
                // The individual receivables item shows its full value as zakatable
                // but the overall debt breakdown zakatable amount is limited to the net impact
                zakatable: (netImpact > 0 && debtHawlMet) ? receivables : 0,
                zakatDue: (netImpact > 0 && debtHawlMet) ? receivables * ZAKAT_RATE : 0,
                label: 'Money Owed to You',
                tooltip: `Money others owe you: ${formatCurrency(receivables, currency)}`
            },
            short_term_liabilities: {
                value: -(debtValues.short_term_liabilities || 0),
                isZakatable: false,
                zakatable: 0,
                zakatDue: 0,
                label: 'Short-Term Debt',
                tooltip: `Short-term debts: ${formatCurrency(debtValues.short_term_liabilities || 0, currency)}`,
                isLiability: true,
                isExempt: true
            },
            long_term_liabilities_annual: {
                value: -(debtValues.long_term_liabilities_annual || 0),
                isZakatable: false,
                zakatable: 0,
                zakatDue: 0,
                label: 'Long-Term Debt (Annual)',
                tooltip: `Annual payment for long-term debts: ${formatCurrency(debtValues.long_term_liabilities_annual || 0, currency)}`,
                isLiability: true,
                isExempt: true
            }
        };

        return {
            total: netImpact,
            zakatable,
            zakatDue,
            items
        };
    }
}); 