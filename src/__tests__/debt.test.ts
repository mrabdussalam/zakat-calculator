import { debt } from '@/lib/assets/debt';
import { validateDebtValues } from '@/lib/validation/debt';
import { DebtValues } from '@/store/types';

describe('Debt Asset Type', () => {
    test('calculateTotal returns correct total receivables', () => {
        const values: DebtValues = {
            receivables: 1000,
            short_term_liabilities: 200,
            long_term_liabilities_annual: 300,
            receivables_entries: [],
            liabilities_entries: []
        };

        expect(debt.calculateTotal(values)).toBe(1000);
    });

    test('calculateZakatable handles liabilities correctly', () => {
        const values: DebtValues = {
            receivables: 1000,
            short_term_liabilities: 200,
            long_term_liabilities_annual: 300,
            receivables_entries: [],
            liabilities_entries: []
        };

        // With hawl met, net impact is receivables - liabilities
        expect(debt.calculateZakatable(values, null, true)).toBe(500); // 1000 - (200 + 300)

        // With hawl not met, zakatable amount is 0
        expect(debt.calculateZakatable(values, null, false)).toBe(0);
    });

    test('calculateZakatable returns 0 when liabilities exceed receivables', () => {
        const values: DebtValues = {
            receivables: 1000,
            short_term_liabilities: 800,
            long_term_liabilities_annual: 500,
            receivables_entries: [],
            liabilities_entries: []
        };

        // Net impact is negative, so zakatable amount should be 0
        expect(debt.calculateZakatable(values, null, true)).toBe(0);
    });

    test('getBreakdown returns correct breakdown structure', () => {
        const values: DebtValues = {
            receivables: 1000,
            short_term_liabilities: 200,
            long_term_liabilities_annual: 300,
            receivables_entries: [],
            liabilities_entries: []
        };

        const breakdown = debt.getBreakdown(values, null, true, 'USD');

        expect(breakdown.total).toBe(1000);
        expect(breakdown.zakatable).toBe(500);
        expect(breakdown.zakatDue).toBe(500 * 0.025);
        expect(breakdown.items.receivables).toBeDefined();
        expect(breakdown.items.short_term_liabilities).toBeDefined();
        expect(breakdown.items.long_term_liabilities_annual).toBeDefined();
    });
});

describe('Debt Validation', () => {
    test('validates receivables correctly', () => {
        const validValues: DebtValues = {
            receivables: 1000,
            short_term_liabilities: 200,
            long_term_liabilities_annual: 300,
            receivables_entries: [],
            liabilities_entries: []
        };

        const invalidValues: DebtValues = {
            receivables: -100, // Negative value
            short_term_liabilities: 200,
            long_term_liabilities_annual: 300,
            receivables_entries: [],
            liabilities_entries: []
        };

        const validResult = validateDebtValues(validValues);
        const invalidResult = validateDebtValues(invalidValues);

        expect(validResult.isValid).toBe(true);
        expect(invalidResult.isValid).toBe(false);
        expect(invalidResult.errors.receivables).toBeDefined();
    });

    test('validates liabilities correctly', () => {
        const validValues: DebtValues = {
            receivables: 1000,
            short_term_liabilities: 200,
            long_term_liabilities_annual: 300,
            receivables_entries: [],
            liabilities_entries: []
        };

        const invalidValues: DebtValues = {
            receivables: 1000,
            short_term_liabilities: -200, // Negative value
            long_term_liabilities_annual: 300,
            receivables_entries: [],
            liabilities_entries: []
        };

        const validResult = validateDebtValues(validValues);
        const invalidResult = validateDebtValues(invalidValues);

        expect(validResult.isValid).toBe(true);
        expect(invalidResult.isValid).toBe(false);
        expect(invalidResult.errors.short_term_liabilities).toBeDefined();
    });
}); 