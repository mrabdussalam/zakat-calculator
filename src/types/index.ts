export type AssetType = 'cash' | 'precious-metals' | 'stocks' | 'retirement' | 'real-estate' | 'crypto' | 'debt' | 'debt-receivable';

export interface AssetBreakdown {
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
    percentage?: number;
    isExempt?: boolean;
  }>;
}

export interface Asset {
  id: string
  type: AssetType
  value: number
  currency: string
  hawlMet: boolean
}

export interface ZakatResult {
  eligible: boolean
  amount: number
  breakdown: AssetBreakdown[]
}

export interface ExtendedWindow extends Window {
  hasDispatchedHydrationEvent?: boolean;
  isInitialPageLoad?: boolean;
}