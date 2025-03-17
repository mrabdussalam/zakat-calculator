import { formatCurrency } from "@/lib/utils"
import React from "react"

// Define interfaces for the breakdown items
interface BreakdownItem {
    value: number
    label: string
    isZakatable?: boolean
    zakatable?: number
    zakatDue?: number
    tooltip?: string
    isLiability?: boolean
    isExempt?: boolean
}

interface AssetBreakdown {
    total: number
    zakatable: number
    zakatDue: number
    items: Record<string, BreakdownItem>
}

interface AssetBreakdownWithHawl {
    total: number
    hawlMet: boolean
    breakdown: AssetBreakdown
}

interface DebugValuesProps {
    breakdown: any
    totalAssets: number
    currency: string
    assetBreakdowns: Record<string, AssetBreakdownWithHawl>
}

export function DebugValues({ breakdown, totalAssets, currency, assetBreakdowns }: DebugValuesProps) {
    return (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs font-mono overflow-auto">
            <h3 className="font-bold mb-2">Debug Values</h3>

            <div className="mb-4">
                <h4 className="font-semibold">Main Breakdown:</h4>
                <div className="grid grid-cols-2 gap-1">
                    <div>Total Assets:</div>
                    <div>{formatCurrency(totalAssets, currency)}</div>

                    <div>Combined Zakatable Value:</div>
                    <div>{formatCurrency(breakdown.combined.zakatableValue, currency)}</div>

                    <div>Combined Zakat Due:</div>
                    <div>{formatCurrency(breakdown.combined.zakatDue, currency)}</div>
                </div>
            </div>

            <div className="mb-4">
                <h4 className="font-semibold">Passed to BreakdownTable:</h4>
                <div className="grid grid-cols-2 gap-1">
                    <div>Total:</div>
                    <div>{formatCurrency(breakdown.total, currency)}</div>

                    <div>Zakatable:</div>
                    <div>{formatCurrency(breakdown.zakatable, currency)}</div>

                    <div>Zakat Due:</div>
                    <div>{formatCurrency(breakdown.zakatDue, currency)}</div>
                </div>
            </div>

            <div>
                <h4 className="font-semibold">Asset Breakdowns:</h4>
                {Object.entries(assetBreakdowns).map(([key, value]) => {
                    // Calculate the values as they would be displayed in the AssetRow component
                    const hawlMet = value.hawlMet || false;
                    const isDebtRow = key === 'debt';
                    const total = value.total || 0;

                    // Get the breakdown
                    const breakdown = value.breakdown || { zakatable: 0, zakatDue: 0, items: {} };

                    // Calculate zakatable amount and zakat due based on hawl status
                    const zakatableAmount = hawlMet ? breakdown.zakatable : 0;
                    const zakatDue = hawlMet ? breakdown.zakatDue : 0;

                    // For debt row, find the receivables item to display in the zakatable column
                    let displayZakatableAmount = zakatableAmount;
                    if (isDebtRow && breakdown.items && Object.keys(breakdown.items).length > 0) {
                        // Find the receivables item (usually has key 'receivables')
                        const receivablesItem = Object.entries(breakdown.items).find(([itemKey, item]) =>
                            itemKey === 'receivables' || (item as BreakdownItem).label === 'Money Owed to You'
                        );

                        if (receivablesItem && receivablesItem[1]) {
                            // Use the receivables value as the zakatable amount for display
                            displayZakatableAmount = hawlMet ? (receivablesItem[1] as BreakdownItem).value : 0;
                        }
                    }

                    return (
                        <div key={key} className="mb-2 border-t pt-2">
                            <div className="font-medium">{key}:</div>
                            <div className="grid grid-cols-2 gap-1">
                                <div>Total:</div>
                                <div>{formatCurrency(total, currency)}</div>

                                <div>Hawl Met:</div>
                                <div>{hawlMet ? "Yes" : "No"}</div>

                                <div>Breakdown Total:</div>
                                <div>{formatCurrency(breakdown.total || 0, currency)}</div>

                                <div>Breakdown Zakatable:</div>
                                <div>{formatCurrency(breakdown.zakatable || 0, currency)}</div>

                                <div>Breakdown Zakat Due:</div>
                                <div>{formatCurrency(breakdown.zakatDue || 0, currency)}</div>

                                <div className="text-blue-600">Displayed in Row:</div>
                                <div className="text-blue-600"></div>

                                <div className="text-blue-600">- Total:</div>
                                <div className="text-blue-600">{formatCurrency(total, currency)}</div>

                                <div className="text-blue-600">- Zakatable Amount:</div>
                                <div className="text-blue-600">{formatCurrency(displayZakatableAmount, currency)}</div>

                                <div className="text-blue-600">- Zakat Due:</div>
                                <div className="text-blue-600">{formatCurrency(zakatDue, currency)}</div>

                                {isDebtRow && breakdown.items && (
                                    <>
                                        <div className="text-green-600">Debt Details:</div>
                                        <div className="text-green-600"></div>

                                        {Object.entries(breakdown.items).map(([itemKey, item]) => (
                                            <React.Fragment key={itemKey}>
                                                <div className="text-green-600">- {(item as BreakdownItem).label}:</div>
                                                <div className="text-green-600">{formatCurrency((item as BreakdownItem).value, currency)}</div>
                                            </React.Fragment>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
} 