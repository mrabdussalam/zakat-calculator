export interface AssetBreakdown {
  total: number
  zakatable: number
  zakatDue: number
  items: Record<string, {
    value: number
    isZakatable: boolean
    zakatable: number
    label: string
    tooltip?: string
  }>
}

export interface AssetBreakdownWithHawl {
  total: number
  hawlMet: boolean
  breakdown?: AssetBreakdown
} 