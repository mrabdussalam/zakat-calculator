export interface DebtCalculatorProps {
    currency: string;
    onUpdateValues: (values: Record<string, number>) => void;
    onHawlUpdate?: (hawlMet: boolean) => void;
    onCalculatorChange: (calculator: string) => void;
    onOpenSummary?: () => void;
    initialValues?: Record<string, number>;
    initialHawlMet?: boolean;
}

export interface DebtCategory {
    id: string;
    name: string;
    description: string;
}

export interface DebtInputFieldProps {
    id: string;
    name: string;
    currency: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
}

export interface EventHandlerProps {
    id: string;
    event: React.ChangeEvent<HTMLInputElement>;
}

export type DebtKey = 'receivables' | 'short_term_liabilities' | 'long_term_liabilities_annual'; 