import { AssetBreakdown } from '@/lib/assets/types'
export type { AssetBreakdown }

export interface AssetBreakdownWithHawl {
  total: number
  hawlMet: boolean
  breakdown?: AssetBreakdown
}
