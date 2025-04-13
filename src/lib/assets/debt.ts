import { AssetType, AssetBreakdown, ZAKAT_RATE } from './types';
import { DebtValues } from '@/store/types';
import { formatCurrency } from '@/lib/utils/currency';

export const debt: AssetType = {
    id: 'debt',
    name: 'Debt & Liabilities',
    color: '#6366F1', // Indigo color

    calculateTotal: (values: DebtValues) => {
        // Calculate net impact (receivables - liabilities)
        const receivables = values.receivables || 0;
        const shortTermLiabilities = values.short_term_liabilities || 0;
        const longTermLiabilitiesAnnual = values.long_term_liabilities_annual || 0;

        return receivables - (shortTermLiabilities + longTermLiabilitiesAnnual);
    },

    calculateZakatable: (values: DebtValues, prices: any, hawlMet: boolean) => {
        if (!hawlMet) return 0;

        // Only receivables are zakatable
        const receivables = values.receivables || 0;

        // Return only the receivables as zakatable
        return receivables;
    },

    getBreakdown: (values: DebtValues, prices: any, hawlMet: boolean, currency: string = 'USD') => {
        // Calculate totals
        const receivables = values.receivables || 0;
        const shortTermLiabilities = values.short_term_liabilities || 0;
        const longTermLiabilitiesAnnual = values.long_term_liabilities_annual || 0;
        const totalLiabilities = shortTermLiabilities + longTermLiabilitiesAnnual;

        // Net impact is receivables minus liabilities
        const netImpact = receivables - totalLiabilities;

        // Only receivables are zakatable
        const zakatable = hawlMet ? receivables : 0;
        const zakatDue = zakatable * ZAKAT_RATE;

        // Create breakdown items
        const items: Record<string, any> = {
            receivables: {
                value: receivables,
                isZakatable: hawlMet,
                zakatable: hawlMet ? receivables : 0,
                zakatDue: hawlMet ? receivables * ZAKAT_RATE : 0,
                label: 'Money Owed to You',
                tooltip: `Money others owe you: ${formatCurrency(receivables, currency)}`
            }
        };

        // Add liabilities as negative impact items
        if (shortTermLiabilities > 0) {
            items.short_term_liabilities = {
                value: -shortTermLiabilities, // Store as negative value
                isZakatable: false,
                zakatable: 0,
                zakatDue: 0,
                label: 'Short-Term Debt',
                tooltip: `Short-term debts: ${formatCurrency(shortTermLiabilities, currency)}`,
                isExempt: true,
                isLiability: true
            };
        }

        if (longTermLiabilitiesAnnual > 0) {
            items.long_term_liabilities_annual = {
                value: -longTermLiabilitiesAnnual, // Store as negative value
                isZakatable: false,
                zakatable: 0,
                zakatDue: 0,
                label: 'Long-Term Debt (Annual)',
                tooltip: `Annual payment for long-term debts: ${formatCurrency(longTermLiabilitiesAnnual, currency)}`,
                isExempt: true,
                isLiability: true
            };
        }

        return {
            total: netImpact, // Return net impact as total
            zakatable,
            zakatDue,
            items
        };
    }
}; 