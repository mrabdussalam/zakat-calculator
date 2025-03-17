import { DebtValues } from '../types';
import { StateCreator } from 'zustand';
import { ZakatState } from '../types';

export interface DebtSlice {
    debtValues: DebtValues;
    debtHawlMet: boolean;
    setDebtValue: (key: keyof DebtValues, value: number | Array<any>) => void;
    setDebtHawlMet: (value: boolean) => void;
    resetDebtValues: () => void;
    getTotalReceivables: () => number;
    getTotalLiabilities: () => number;
    getNetDebtImpact: () => number; // Positive if receivables > liabilities
    updateDebtValues: (values: Partial<DebtValues>) => void;
    getDebtBreakdown: () => {
        total: number;
        zakatable: number;
        zakatDue: number;
        items: Record<string, {
            value: number;
            isZakatable: boolean;
            zakatable: number;
            zakatDue: number;
            label: string;
            tooltip?: string;
        }>;
    };
} 