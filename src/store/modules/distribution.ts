import { ZakatSlice, ZakatState } from '../types'
import { StateCreator } from 'zustand'

// Define the asnaf categories with educational content
export const ASNAF_CATEGORIES = [
    {
        id: 'poor',
        name: 'The Poor (Fuqara)',
        description: 'Those who lack the means to meet their basic needs.',
        examples: ['Individuals below poverty line', 'Homeless people', 'Those unable to afford basic necessities'],
        color: '#4F46E5', // Indigo
        scholarlyInfo: 'The Quran mentions this category first, highlighting its importance. These are people who possess some means but not enough to meet their basic needs.'
    },
    {
        id: 'needy',
        name: 'The Needy (Masakin)',
        description: 'Those who have some means but still cannot meet all their essential needs.',
        examples: ['Low-income families', 'Those with insufficient income for their situation', 'People facing temporary financial hardship'],
        color: '#0EA5E9', // Sky blue
        scholarlyInfo: 'Similar to the poor but in slightly better condition. They may have some income but it\'s insufficient for their needs.'
    },
    {
        id: 'administrators',
        name: 'Zakat Administrators',
        description: 'Those who collect and distribute Zakat.',
        examples: ['Zakat collection organizations', 'Administrators of Zakat funds', 'Those who manage Zakat distribution'],
        color: '#10B981', // Emerald
        scholarlyInfo: 'This category allows for the operational costs of Zakat collection and distribution, ensuring the system functions efficiently.'
    },
    {
        id: 'reconciliation',
        name: 'For Reconciliation (Muallafat-ul-Quloob)',
        description: 'Those whose hearts are inclined toward Islam or whose goodwill is sought.',
        examples: ['New Muslims who need support', 'Those interested in learning about Islam', 'Communities where building goodwill is important'],
        color: '#F59E0B', // Amber
        scholarlyInfo: 'Historically used to build alliances and support new Muslims. Today, it can include dawah efforts and supporting new converts.'
    },
    {
        id: 'freeing_captives',
        name: 'Freeing Captives (Riqab)',
        description: 'Historically for freeing slaves; now applied to freeing those in bondage or oppression.',
        examples: ['Victims of human trafficking', 'Refugees', 'Those suffering from oppression or unjust imprisonment'],
        color: '#EF4444', // Red
        scholarlyInfo: 'Originally for freeing slaves. Modern applications include helping those in various forms of bondage, including debt bondage, human trafficking, and unjust imprisonment.'
    },
    {
        id: 'indebted',
        name: 'Those in Debt (Gharimeen)',
        description: 'People burdened with debt who cannot repay it.',
        examples: ['Those with medical debt', 'Students with educational loans', 'Individuals with overwhelming personal debt'],
        color: '#8B5CF6', // Violet
        scholarlyInfo: 'This category helps those who have fallen into debt for legitimate needs (not luxury or prohibited activities) and cannot find a way out.'
    },
    {
        id: 'cause_of_allah',
        name: 'In the Cause of Allah (Fi Sabilillah)',
        description: 'Efforts and projects that serve the greater good of the community and uphold Islamic values.',
        examples: ['Islamic education initiatives', 'Community development projects', 'Humanitarian aid'],
        color: '#EC4899', // Pink
        scholarlyInfo: 'Traditionally interpreted as supporting those engaged in defense, but broadly includes various efforts that serve the common good and Islamic causes.'
    },
    {
        id: 'travelers',
        name: 'Travelers (Ibn as-Sabil)',
        description: 'Travelers who are stranded or in need while away from home.',
        examples: ['Stranded travelers', 'Refugees', 'Students studying abroad with financial difficulties'],
        color: '#14B8A6', // Teal
        scholarlyInfo: 'This category helps those who are away from home and lack the means to return or sustain themselves during their journey.'
    }
]

// Types for the distribution state
export interface DistributionAllocation {
    amount: number;
    percentage: number;
    notes: string;
}

export interface DistributionSummary {
    totalAllocated: number;
    remaining: number;
    isComplete: boolean;
    allocations: Record<string, DistributionAllocation>;
}

export interface DistributionSlice {
    // State
    distributionMode: 'equal' | 'scholar' | 'local' | 'custom';
    allocations: Record<string, DistributionAllocation>;

    // Actions
    setAllocation: (category: string, amount: number) => void;
    setAllocationPercentage: (category: string, percentage: number) => void;
    setNotes: (category: string, notes: string) => void;
    distributeEqually: () => void;
    distributeByScholar: () => void;
    resetDistribution: () => void;

    // Getters
    getDistributionSummary: () => DistributionSummary;
}

// Scholar-recommended distribution (example)
const SCHOLAR_DISTRIBUTION = {
    poor: 20,
    needy: 20,
    administrators: 10,
    reconciliation: 5,
    freeing_captives: 10,
    indebted: 15,
    cause_of_allah: 15,
    travelers: 5
}

// Create the distribution slice
export const createDistributionSlice: StateCreator<ZakatState, [], [], DistributionSlice> = (set, get) => {
    // Create initial allocations
    const initialAllocations = ASNAF_CATEGORIES.reduce<Record<string, DistributionAllocation>>((acc, category) => {
        acc[category.id] = {
            amount: 0,
            percentage: 0,
            notes: ''
        }
        return acc
    }, {})

    return {
        // Initial state
        distributionMode: 'equal' as const,
        allocations: initialAllocations,

        // Actions
        setAllocation: (category: string, amount: number) => {
            const { getBreakdown } = get()
            const totalZakat = getBreakdown().combined.zakatDue

            if (totalZakat <= 0) return

            const percentage = (amount / totalZakat) * 100

            set((state: ZakatState) => ({
                distributionMode: 'custom',
                allocations: {
                    ...state.allocations,
                    [category]: {
                        ...state.allocations[category],
                        amount,
                        percentage
                    }
                }
            }))
        },

        setAllocationPercentage: (category: string, percentage: number) => {
            const { getBreakdown } = get()
            const totalZakat = getBreakdown().combined.zakatDue

            if (totalZakat <= 0) return

            const amount = (percentage / 100) * totalZakat

            set((state: ZakatState) => ({
                distributionMode: 'custom',
                allocations: {
                    ...state.allocations,
                    [category]: {
                        ...state.allocations[category],
                        amount,
                        percentage
                    }
                }
            }))
        },

        setNotes: (category: string, notes: string) => {
            set((state: ZakatState) => ({
                allocations: {
                    ...state.allocations,
                    [category]: {
                        ...state.allocations[category],
                        notes
                    }
                }
            }))
        },

        distributeEqually: () => {
            const { getBreakdown } = get()
            const totalZakat = getBreakdown().combined.zakatDue

            if (totalZakat <= 0) return

            const categoryCount = ASNAF_CATEGORIES.length
            const equalPercentage = 100 / categoryCount
            const equalAmount = totalZakat / categoryCount

            const newAllocations = ASNAF_CATEGORIES.reduce<Record<string, DistributionAllocation>>((acc, category) => {
                acc[category.id] = {
                    amount: equalAmount,
                    percentage: equalPercentage,
                    notes: get().allocations[category.id]?.notes || ''
                }
                return acc
            }, {})

            set({
                distributionMode: 'equal',
                allocations: newAllocations
            })
        },

        distributeByScholar: () => {
            const { getBreakdown } = get()
            const totalZakat = getBreakdown().combined.zakatDue

            if (totalZakat <= 0) return

            const newAllocations = Object.entries(SCHOLAR_DISTRIBUTION).reduce<Record<string, DistributionAllocation>>((acc, [category, percentage]) => {
                acc[category] = {
                    amount: (percentage / 100) * totalZakat,
                    percentage,
                    notes: get().allocations[category]?.notes || ''
                }
                return acc
            }, {})

            set({
                distributionMode: 'scholar',
                allocations: newAllocations
            })
        },

        resetDistribution: () => {
            const emptyAllocations = ASNAF_CATEGORIES.reduce<Record<string, DistributionAllocation>>((acc, category) => {
                acc[category.id] = {
                    amount: 0,
                    percentage: 0,
                    notes: ''
                }
                return acc
            }, {})

            set({
                distributionMode: 'custom',
                allocations: emptyAllocations
            })
        },

        getDistributionSummary: () => {
            const { getBreakdown } = get()
            const totalZakat = getBreakdown().combined.zakatDue
            const allocations = get().allocations

            const totalAllocated = Object.values(allocations).reduce((sum: number, allocation: DistributionAllocation) => sum + allocation.amount, 0)
            const remaining = (totalZakat as number) - totalAllocated
            const isComplete = Math.abs(remaining) < 0.01 // Allow for small rounding errors

            return {
                totalAllocated,
                remaining,
                isComplete,
                allocations
            }
        }
    }
} 