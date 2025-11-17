'use client'

import { useCallback, useState, useEffect } from 'react'
import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/label'
import { useZakatStore } from '@/store/zakatStore'
import { evaluateExpression } from '@/lib/utils'
import { FAQ } from '@/components/ui/faq'
import { ASSET_FAQS } from '@/config/faqs'
import { CalculatorNav } from '@/components/ui/calculator-nav'
import { DebtCalculatorProps, DebtCategory } from './types'
import { FAQItem } from '@/config/faqs'
import { validateDebtValues } from '@/lib/validation/debt'

// Define debt categories
const RECEIVABLE_CATEGORIES: DebtCategory[] = [
    {
        id: 'receivables',
        name: 'Money Owed to You',
        description: 'Total amount of money others owe you that you expect to be repaid'
    }
]

const LIABILITY_CATEGORIES: DebtCategory[] = [
    {
        id: 'short_term_liabilities',
        name: 'Short-Term Debt',
        description: 'Debts you owe that are due within the next 12 months'
    },
    {
        id: 'long_term_liabilities_annual',
        name: 'Long-Term Debt (Annual Payment)',
        description: 'Annual payment amount for long-term debts like mortgages or student loans'
    }
]

export function DebtCalculator({
    currency,
    onUpdateValues,
    onCalculatorChange,
    onOpenSummary,
    initialHawlMet
}: DebtCalculatorProps) {
    // Get store as any type to bypass TypeScript errors
    const store = useZakatStore() as any

    // Access debt-related properties
    const {
        debtValues,
        debtHawlMet,
        setDebtValue,
        setDebtHawlMet,
    } = store

    // Local state for input values
    const [inputValues, setInputValues] = useState<Record<string, number | string>>({})
    const [rawInputValues, setRawInputValues] = useState<Record<string, string>>({})
    const [errors, setErrors] = useState<Record<string, string>>({})
    // Add state to track if store has been hydrated
    const [storeHydrated, setStoreHydrated] = useState(false)

    // Initialize input values from store
    useEffect(() => {
        if (debtValues) {
            const initialInputs: Record<string, number | string> = {}

            // Set receivables
            if (debtValues.receivables && debtValues.receivables !== 0) {
                initialInputs.receivables = debtValues.receivables
            }

            // Set liabilities
            if (debtValues.short_term_liabilities && debtValues.short_term_liabilities !== 0) {
                initialInputs.short_term_liabilities = debtValues.short_term_liabilities
            }

            if (debtValues.long_term_liabilities_annual && debtValues.long_term_liabilities_annual !== 0) {
                initialInputs.long_term_liabilities_annual = debtValues.long_term_liabilities_annual
            }

            setInputValues(initialInputs)
        }

        // Set Hawl to true by default
        if (!initialHawlMet && !debtHawlMet) {
            setDebtHawlMet(true)
        }

        // Mark store as hydrated
        setStoreHydrated(true)
    }, [debtValues, initialHawlMet, debtHawlMet, setDebtHawlMet])

    // Add a listener to detect store resets
    useEffect(() => {
        // Only process resets after hydration is complete to prevent false resets
        if (!storeHydrated) return;

        const handleReset = () => {
            console.log('DebtCalculator: Store reset event detected');

            // Check if this is still during initial page load
            if (typeof window !== 'undefined') {
                // Safe way to check for custom property without TypeScript errors
                const win = window as any;
                if (win.isInitialPageLoad) {
                    console.log('DebtCalculator: Ignoring reset during initial page load');
                    return;
                }
            }

            // This is a user-initiated reset, so clear all local state
            console.log('DebtCalculator: Clearing local state due to user-initiated reset');

            // Clear inputs
            setInputValues({});
            setRawInputValues({});
            setErrors({});

            // Ensure the total is updated after reset
            setTimeout(() => {
                onUpdateValues?.({
                    receivables: 0,
                    short_term_liabilities: 0,
                    long_term_liabilities_annual: 0
                });
            }, 100);
        };

        // Listen for both possible reset event names
        window.addEventListener('store-reset', handleReset);
        window.addEventListener('zakat-store-reset', handleReset);

        // Cleanup
        return () => {
            window.removeEventListener('store-reset', handleReset);
            window.removeEventListener('zakat-store-reset', handleReset);
        };
    }, [storeHydrated, onUpdateValues]);

    // Handle input changes
    const handleValueChange = useCallback((key: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value

        // Store raw input
        setRawInputValues(prev => ({
            ...prev,
            [key]: inputValue
        }))

        try {
            // Evaluate expression (e.g., "1000+500")
            const numericValue = evaluateExpression(inputValue)

            // Update local state
            setInputValues(prev => ({
                ...prev,
                [key]: numericValue
            }))

            // Update store
            setDebtValue(key, numericValue)

            // Clear error if exists
            if (errors[key]) {
                setErrors(prev => {
                    const newErrors = { ...prev }
                    delete newErrors[key]
                    return newErrors
                })
            }

            // Validate all values after update
            const updatedValues = {
                ...debtValues,
                [key]: numericValue
            }
            const validation = validateDebtValues(updatedValues)
            if (!validation.isValid) {
                setErrors(prev => ({
                    ...prev,
                    ...validation.errors
                }))
            }

            // Calculate updated totals
            const receivables = key === 'receivables' ? numericValue : (debtValues.receivables || 0);
            const shortTermLiabilities = key === 'short_term_liabilities' ? numericValue : (debtValues.short_term_liabilities || 0);
            const longTermLiabilities = key === 'long_term_liabilities_annual' ? numericValue : (debtValues.long_term_liabilities_annual || 0);

            // Update parent component with all values to ensure proper recalculation
            onUpdateValues?.({
                receivables,
                short_term_liabilities: shortTermLiabilities,
                long_term_liabilities_annual: longTermLiabilities
            });
        } catch (error) {
            // Handle invalid input
            setErrors(prev => ({
                ...prev,
                [key]: 'Invalid number format'
            }))
        }
    }, [setDebtValue, errors, debtValues, onUpdateValues])

    return (
        <div className="space-y-8 w-full">
            {/* Main Content */}
            <div className="space-y-10 w-full">
                {/* Receivables Section */}
                <section className="w-full">
                    <FAQ
                        title="Money Owed to You (Receivables)"
                        description="Enter money that others owe you that you expect to be repaid."
                        items={{
                            items: (ASSET_FAQS.debt?.items || []).filter((faq: FAQItem) =>
                                faq.question === "What debts are zakatable?" ||
                                faq.question === "How do I handle money owed to me?"
                            ),
                            sources: ASSET_FAQS.debt?.sources
                        }}
                        defaultOpen={false}
                    />
                    <div className="mt-6 space-y-6 w-full">
                        {RECEIVABLE_CATEGORIES.map((category) => (
                            <div key={category.id} className="space-y-2 w-full">
                                <div className="flex items-center gap-1.5">
                                    <Label htmlFor={category.id}>
                                        {category.name}
                                    </Label>
                                </div>
                                <div className="relative w-full">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <span className="text-sm font-medium text-gray-900">{currency}</span>
                                    </div>
                                    <Input
                                        id={category.id}
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[\d+\-*/.() ]*"
                                        className="pl-12 text-sm bg-white w-full"
                                        value={(rawInputValues[category.id] as string) || (inputValues[category.id] && inputValues[category.id] !== 0 ? inputValues[category.id].toString() : '')}
                                        onChange={(e) => handleValueChange(category.id, e)}
                                        placeholder="Enter amount or calculation"
                                    />
                                </div>
                                {errors[category.id] && (
                                    <p className="text-sm text-red-500">{errors[category.id]}</p>
                                )}
                                <p className="text-xs text-gray-500">
                                    {category.id === 'receivables' ?
                                        'Debts owed to you are considered part of your zakatable assets.' :
                                        category.id === 'short_term_liabilities' ?
                                            'Include credit card debt, personal loans, and other debts due within 12 months.' :
                                            'Include only the portion of long-term debts due in the next 12 months.'}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Liabilities Section */}
                <section className="w-full">
                    <FAQ
                        title="Money You Owe (Liabilities)"
                        description="Enter money that you owe to others. These amounts can be deducted from your zakatable assets."
                        items={{
                            items: (ASSET_FAQS.debt?.items || []).filter((faq: FAQItem) =>
                                faq.question === "How are long-term debts handled?" ||
                                faq.question === "Are all liabilities deductible?" ||
                                faq.question === "Can I deduct my student loan from my zakat calculation?" ||
                                faq.question === "Do I pay zakat on my mortgage?" ||
                                faq.question === "Are business loans deductible in zakat calculation?" ||
                                faq.question === "Should I deduct my monthly bills when calculating zakat?"
                            ),
                            sources: ASSET_FAQS.debt?.sources
                        }}
                        defaultOpen={false}
                    />
                    <div className="mt-6 space-y-6 w-full">
                        {LIABILITY_CATEGORIES.map((category) => (
                            <div key={category.id} className="space-y-2 w-full">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Label htmlFor={category.id}>
                                            {category.name}
                                        </Label>
                                    </div>
                                    <span className="text-xs text-green-600 font-medium">
                                        Deductible
                                    </span>
                                </div>
                                <div className="relative w-full">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <span className="text-sm font-medium text-gray-900">{currency}</span>
                                    </div>
                                    <Input
                                        id={category.id}
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[\d+\-*/.() ]*"
                                        className="pl-12 text-sm bg-white w-full"
                                        value={(rawInputValues[category.id] as string) || (inputValues[category.id] && inputValues[category.id] !== 0 ? inputValues[category.id].toString() : '')}
                                        onChange={(e) => handleValueChange(category.id, e)}
                                        placeholder="Enter amount or calculation"
                                    />
                                </div>
                                {errors[category.id] && (
                                    <p className="text-sm text-red-500">{errors[category.id]}</p>
                                )}
                                <p className="text-xs text-gray-500">
                                    {category.id === 'short_term_liabilities' ?
                                        'Current month\'s utility bills, rent, or any personal loans due within a year.' :
                                        'Mortgages or student loans etc. Deduct only up to 12 months\' worth of principal repayments due within the forthcoming lunar year. Interest payments cannot be deducted.'}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Navigation */}
            <CalculatorNav
                currentCalculator="debt"
                onCalculatorChange={onCalculatorChange}
                onOpenSummary={onOpenSummary}
            />
        </div>
    )
}
