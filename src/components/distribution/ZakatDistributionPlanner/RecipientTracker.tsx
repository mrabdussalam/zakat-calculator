'use client'

import { useState, useEffect } from 'react'
import { useZakatStore } from '@/store/zakatStore'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusCircle, Trash2, Check, Edit, Save, AlertCircle, X, ChevronDown } from 'lucide-react'
import { ASNAF_CATEGORIES } from '@/store/modules/distribution'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Define the recipient interface
interface Recipient {
    id: string;
    name: string;
    category: string;
    amount: number;
    notes: string;
    isPaid: boolean;
}

// Create a reusable label component
const StatusLabel = ({ status, children, onClick }: { status: 'pending' | 'paid' | 'unpaid'; children: React.ReactNode; onClick?: () => void }) => {
    const styles = {
        pending: 'bg-amber-50 text-amber-700 border border-amber-200 hover:border-amber-300',
        paid: 'bg-green-50 text-green-700 border border-green-200 hover:border-green-300',
        unpaid: 'bg-gray-100 text-gray-700 border border-gray-200 hover:border-gray-300'
    };

    return (
        <span
            onClick={onClick}
            className={`w-full relative rounded-md pl-3 pr-3 h-9 flex items-center justify-center text-sm transition-colors truncate whitespace-nowrap overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${styles[status]} !outline-none focus:!outline-none focus:border-blue-500 focus:!ring-0 [&:focus]:!outline-none [&:focus-visible]:!outline-none`}
            style={{ outline: 'none' }}
        >
            {children}
        </span>
    );
};

export function RecipientTracker() {
    const { getBreakdown, currency, getDistributionSummary } = useZakatStore()
    const [recipients, setRecipients] = useState<Recipient[]>([])
    const [error, setError] = useState<string | null>(null)

    const breakdown = getBreakdown()
    const totalZakat = breakdown.combined.zakatDue
    const distributionSummary = getDistributionSummary()

    // Load recipients from localStorage on mount
    useEffect(() => {
        const savedRecipients = localStorage.getItem('zakatRecipients')
        if (savedRecipients) {
            try {
                setRecipients(JSON.parse(savedRecipients))
            } catch (e) {
                console.error('Failed to parse saved recipients', e)
            }
        }
    }, [])

    // Save recipients to localStorage when they change
    useEffect(() => {
        localStorage.setItem('zakatRecipients', JSON.stringify(recipients))
    }, [recipients])

    // Calculate totals
    const totalAllocated = recipients.reduce((sum, recipient) => sum + recipient.amount, 0)
    const totalPaid = recipients.filter(r => r.isPaid).reduce((sum, recipient) => sum + recipient.amount, 0)
    const totalUnpaid = totalAllocated - totalPaid

    // Calculate percentage of total Zakat allocated to recipients
    const percentageAllocated = totalZakat > 0 ? (totalAllocated / totalZakat) * 100 : 0
    const isOverAllocated = totalAllocated > totalZakat
    const remainingToAllocate = Math.max(0, totalZakat - totalAllocated)

    // Handle adding a new empty recipient
    const handleAddRecipient = () => {
        const newId = Date.now().toString()
        setRecipients([
            ...recipients,
            {
                id: newId,
                name: '',
                category: '',
                amount: 0,
                notes: '',
                isPaid: false
            }
        ])
        setError(null)
    }

    // Handle deleting a recipient
    const handleDeleteRecipient = (id: string) => {
        setRecipients(recipients.filter(recipient => recipient.id !== id))
        setError(null)
    }

    // Handle toggling paid status
    const handleTogglePaid = (id: string) => {
        setRecipients(recipients.map(recipient =>
            recipient.id === id
                ? { ...recipient, isPaid: !recipient.isPaid }
                : recipient
        ))
    }

    // Handle updating a recipient field
    const handleUpdateRecipient = (id: string, field: keyof Recipient, value: any) => {
        // For amount field, check if it would exceed total Zakat due
        if (field === 'amount') {
            const numValue = parseFloat(value) || 0
            const currentAmount = recipients.find(r => r.id === id)?.amount || 0
            const otherRecipientsTotal = totalAllocated - currentAmount
            const newTotal = otherRecipientsTotal + numValue

            if (newTotal > totalZakat) {
                setError(`This would exceed your total Zakat due by ${formatCurrency(newTotal - totalZakat, currency)}. The maximum you can allocate to this recipient is ${formatCurrency(totalZakat - otherRecipientsTotal, currency)}.`)
                // Still update the value, but show the error
            } else {
                setError(null)
            }
        }

        setRecipients(recipients.map(recipient =>
            recipient.id === id
                ? { ...recipient, [field]: value }
                : recipient
        ))
    }

    return (
        <div className="flex flex-col gap-6 bg-white">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Recipient Tracker</h2>
                <div className="text-sm text-gray-500">
                    {recipients.length} {recipients.length === 1 ? 'recipient' : 'recipients'}
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-500">Zakat Due</div>
                    <div className="text-lg font-medium text-gray-900">
                        {formatCurrency(totalZakat, currency)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        Total amount to distribute
                    </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-500">Total Allocated</div>
                    <div className={`text-lg font-medium ${isOverAllocated ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatCurrency(totalAllocated, currency)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {Math.min(100, Math.round(percentageAllocated))}% of Zakat due
                    </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-sm text-gray-500">Total Paid</div>
                    <div className="text-lg font-medium text-green-600">
                        {formatCurrency(totalPaid, currency)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {totalAllocated > 0 ? Math.round((totalPaid / totalAllocated) * 100) : 0}% of allocated amount
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Allocation Progress</span>
                    <span>{Math.min(100, Math.round(percentageAllocated))}% of Zakat Due</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className={`h-2.5 rounded-full ${isOverAllocated ? 'bg-red-600' : percentageAllocated >= 100 ? 'bg-green-600' : 'bg-blue-600'}`}
                        style={{ width: `${Math.min(100, percentageAllocated)}%` }}
                    ></div>
                </div>
                {remainingToAllocate > 0 && !isOverAllocated && (
                    <div className="text-xs text-gray-500 mt-1 text-right">
                        {formatCurrency(remainingToAllocate, currency)} remaining to allocate
                    </div>
                )}
                {isOverAllocated && (
                    <div className="text-xs text-red-500 mt-1 text-right">
                        Over-allocated by {formatCurrency(totalAllocated - totalZakat, currency)}
                    </div>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800">{error}</div>
                </div>
            )}

            {/* Excel-like Recipients table */}
            <div className="flex-1">
                <div className="bg-gray-50 rounded-2xl p-2">
                    {/* Table Header */}
                    <div className="px-2 py-2.5 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center">
                            <div className="flex-1 min-w-0 flex items-center h-8">
                                <span className="text-xs font-medium text-gray-500 whitespace-nowrap px-2">Recipient</span>
                            </div>
                            <div className="w-[120px] flex items-center h-8">
                                <span className="text-xs font-medium text-gray-500 whitespace-nowrap px-2">Category</span>
                            </div>
                            <div className="w-[120px] flex items-center h-8">
                                <span className="text-xs font-medium text-gray-500 whitespace-nowrap px-2">Amount</span>
                            </div>
                            <div className="w-[120px] flex items-center h-8 px-2">
                                <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Status</span>
                            </div>
                            <div className="w-[36px] flex items-center h-8">
                                {/* Actions header removed */}
                            </div>
                        </div>
                    </div>

                    {/* Table Body */}
                    <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
                        <div className="py-2 px-2">
                            {/* Recipient rows */}
                            {recipients.map((recipient, index) => (
                                <div
                                    key={recipient.id}
                                    className="flex items-center min-h-[36px]"
                                >
                                    <div className="flex items-center w-full">
                                        <div className="flex-1 min-w-0 p-1">
                                            <Input
                                                value={recipient.name}
                                                onChange={(e) => handleUpdateRecipient(recipient.id, 'name', e.target.value)}
                                                placeholder="Recipient name"
                                                className="w-full bg-white border border-gray-200 pl-3 pr-3 h-9 text-left font-normal relative rounded-md hover:border-gray-300 transition-colors !outline-none focus:!outline-none focus:border-blue-500 focus:!ring-0 [&:focus]:!outline-none [&:focus-visible]:!outline-none selection:bg-blue-100"
                                                style={{ outline: 'none' }}
                                            />
                                        </div>
                                        <div className="w-[120px] p-1">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <button
                                                        className="flex h-9 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:border-gray-300 !outline-none focus:!outline-none focus:border-blue-500 focus:!ring-0 [&:focus]:!outline-none [&:focus-visible]:!outline-none selection:bg-blue-100"
                                                        style={{ outline: 'none' }}
                                                    >
                                                        <span className="truncate max-w-[70px] inline-block selection:bg-blue-100">
                                                            {recipient.category ?
                                                                ASNAF_CATEGORIES.find(c => c.id === recipient.category)?.name || "Category"
                                                                : "Category"}
                                                        </span>
                                                        <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="p-0 w-[200px]" align="start">
                                                    <div className="max-h-[200px] overflow-auto">
                                                        {ASNAF_CATEGORIES.map(category => (
                                                            <button
                                                                key={category.id}
                                                                className="relative flex w-full cursor-pointer select-none items-center py-1.5 px-3 text-sm !outline-none hover:bg-gray-100 text-left selection:bg-blue-100"
                                                                onClick={() => handleUpdateRecipient(recipient.id, 'category', category.id)}
                                                                style={{ outline: 'none' }}
                                                            >
                                                                <span className="truncate selection:bg-blue-100">{category.name}</span>
                                                                {recipient.category === category.id && (
                                                                    <Check className="h-4 w-4 ml-auto" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="w-[120px] p-1">
                                            <Input
                                                type="number"
                                                value={recipient.amount || ''}
                                                onChange={(e) => handleUpdateRecipient(recipient.id, 'amount', parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                className={`w-full bg-white border border-gray-200 pl-3 pr-3 h-9 text-left font-normal relative rounded-md hover:border-gray-300 transition-colors !outline-none focus:!outline-none focus:border-blue-500 focus:!ring-0 [&:focus]:!outline-none [&:focus-visible]:!outline-none selection:bg-blue-100 ${isOverAllocated ? 'text-red-600' : ''}`}
                                                style={{ outline: 'none' }}
                                            />
                                        </div>
                                        <div className="w-[120px] p-1">
                                            {recipient.isPaid ? (
                                                <StatusLabel status="paid" onClick={() => handleTogglePaid(recipient.id)}>
                                                    Paid
                                                </StatusLabel>
                                            ) : (
                                                <StatusLabel status="unpaid" onClick={() => handleTogglePaid(recipient.id)}>
                                                    Mark Paid
                                                </StatusLabel>
                                            )}
                                        </div>
                                        <div className="w-[36px] p-0">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteRecipient(recipient.id)}
                                                title="Delete recipient"
                                                className="text-gray-500 hover:bg-gray-50 hover:text-gray-700 h-9 w-[36px] p-0"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Add Recipient Button */}
                            <div className="flex">
                                <div className="flex-1 p-1">
                                    <Button
                                        onClick={handleAddRecipient}
                                        variant="outline"
                                        size="sm"
                                        className="mt-2 rounded-full"
                                    >
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Add Recipient
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 