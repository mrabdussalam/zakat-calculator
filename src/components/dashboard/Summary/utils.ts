import { AssetBreakdown } from "./types"

export function adaptMetalsBreakdown(breakdown: {
  total: number
  zakatable: number
  zakatDue: number
  goldGrams: number
  silverGrams: number
  items: Record<string, {
    value: number
    weight: number
    isZakatable?: boolean
    isExempt?: boolean
  }>
}): AssetBreakdown {
  // Transform metals items to standard format
  const adaptedItems = Object.entries(breakdown.items).reduce((acc, [key, item]) => {
    acc[key] = {
      value: item.value,
      isZakatable: item.isZakatable ?? !item.isExempt ?? true,
      zakatable: item.isZakatable ?? !item.isExempt ? item.value : 0,
      label: `${key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} (${item.weight}g)`,
      tooltip: item.isExempt ? 'Exempt from Zakat' : undefined
    }
    return acc
  }, {} as AssetBreakdown['items'])

  return {
    total: breakdown.total,
    zakatable: breakdown.zakatable,
    zakatDue: breakdown.zakatDue,
    items: adaptedItems
  }
}

export function adaptRealEstateBreakdown(breakdown: {
  total: number
  zakatable: number
  zakatDue: number
  items: Record<string, {
    value: number
    isZakatable?: boolean
    isExempt?: boolean
    label: string
    tooltip?: string
    zakatable?: number
  }>
}): AssetBreakdown {
  // Transform real estate items to standard format
  const adaptedItems = Object.entries(breakdown.items).reduce((acc, [key, item]) => {
    acc[key] = {
      value: item.value,
      isZakatable: item.isZakatable ?? !item.isExempt ?? true,
      zakatable: item.zakatable ?? (item.isZakatable ?? !item.isExempt ? item.value : 0),
      label: item.label,
      tooltip: item.tooltip
    }
    return acc
  }, {} as AssetBreakdown['items'])

  return {
    total: breakdown.total,
    zakatable: breakdown.zakatable,
    zakatDue: breakdown.zakatDue,
    items: adaptedItems
  }
}

export function adaptEmptyBreakdown(total: number): AssetBreakdown {
  return {
    total,
    zakatable: 0,
    zakatDue: 0,
    items: {}
  }
} 