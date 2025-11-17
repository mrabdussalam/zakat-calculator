import { DebtValues } from '@/store/types';

/**
 * Validates debt values to ensure they meet requirements
 * @param values The debt values to validate
 * @returns Object containing validation result and any errors
 */
export function validateDebtValues(values: DebtValues) {
    const errors: Record<string, string> = {};

    // Check for negative values
    if (values.receivables < 0) {
        errors.receivables = 'Receivables cannot be negative';
    }

    if (values.short_term_liabilities < 0) {
        errors.short_term_liabilities = 'Short-term liabilities cannot be negative';
    }

    if (values.long_term_liabilities_annual < 0) {
        errors.long_term_liabilities_annual = 'Long-term liabilities cannot be negative';
    }

    // Check that entry totals match main values if entries exist
    if (values.receivables_entries && values.receivables_entries.length > 0) {
        const totalReceivables = values.receivables_entries.reduce((sum, entry) => sum + entry.amount, 0);
        if (Math.abs(totalReceivables - values.receivables) > 0.01) {
            errors.receivables = 'Total receivables does not match the sum of entries';
        }
    }

    // Check liabilities entries
    if (values.liabilities_entries && values.liabilities_entries.length > 0) {
        const shortTermEntries = values.liabilities_entries.filter(entry => entry.is_short_term);
        const longTermEntries = values.liabilities_entries.filter(entry => !entry.is_short_term);

        const totalShortTerm = shortTermEntries.reduce((sum, entry) => sum + entry.amount, 0);
        const totalLongTerm = longTermEntries.reduce((sum, entry) => sum + entry.amount, 0);

        if (Math.abs(totalShortTerm - values.short_term_liabilities) > 0.01) {
            errors.short_term_liabilities = 'Short-term liabilities do not match the sum of entries';
        }

        if (Math.abs(totalLongTerm - values.long_term_liabilities_annual) > 0.01) {
            errors.long_term_liabilities_annual = 'Long-term liabilities do not match the sum of entries';
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}
