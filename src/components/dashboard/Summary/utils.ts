import { AssetBreakdown } from "./types"

type AssetBreakdownItem = {
  value: number
  isZakatable: boolean
  zakatable: number
  zakatDue: number
  label: string
  tooltip?: string
  isExempt?: boolean
}

export function adaptMetalsBreakdown(breakdown: {
  total: number
  zakatable: number
  zakatDue: number
  goldGrams: number
  silverGrams: number
  items: Record<string, {
    value: number
    weight: number
    isZakatable: boolean
    isExempt: boolean
    zakatable: number
    zakatDue: number
  }>
}): AssetBreakdown {
  return {
    total: breakdown.total,
    zakatable: breakdown.zakatable,
    zakatDue: breakdown.zakatDue,
    items: Object.entries(breakdown.items).reduce<Record<string, AssetBreakdownItem>>((acc, [key, item]) => {
      const label = `${key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} (${item.weight}g)`
      
      acc[key] = {
        value: item.value,
        isZakatable: item.isZakatable,
        zakatable: item.zakatable,
        zakatDue: item.zakatDue,
        label,
        tooltip: item.isExempt ? 'Exempt from Zakat' : `${label}: ${item.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
        isExempt: item.isExempt
      }
      return acc
    }, {})
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
    const isZakatable = item.isZakatable ?? !item.isExempt ?? true
    const zakatable = item.zakatable ?? (isZakatable ? item.value : 0)
    const zakatDue = zakatable * 0.025 // 2.5% Zakat rate
    
    acc[key] = {
      value: item.value,
      isZakatable,
      zakatable,
      zakatDue,
      label: item.label,
      tooltip: item.tooltip,
      isExempt: item.isExempt
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