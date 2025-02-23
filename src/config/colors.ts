// Asset colors configuration
export const ASSET_COLORS = {
  'cash': '#7C3AED',
  'precious-metals': '#F59E0B',
  'stocks': '#3B82F6',
  'retirement': '#10B981',
  'real-estate': '#EC4899',
  'crypto': '#06B6D4',
  'business-assets': '#10B981',
  'other-financial': '#6366F1',
  'debt-receivable': '#8B5CF6'
} as const

// Asset colors with variants for UI components
export const ASSET_COLOR_VARIANTS = {
  'cash': {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    selectedBg: 'bg-purple-100',
    selectedIcon: 'text-purple-600',
    base: 'bg-purple-600',
  },
  'precious-metals': {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    selectedBg: 'bg-amber-100',
    selectedIcon: 'text-amber-600',
    base: 'bg-amber-600',
  },
  'stocks': {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    selectedBg: 'bg-blue-100',
    selectedIcon: 'text-blue-600',
    base: 'bg-blue-600',
  },
  'retirement': {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    selectedBg: 'bg-green-100',
    selectedIcon: 'text-green-600',
    base: 'bg-green-600',
  },
  'real-estate': {
    bg: 'bg-pink-50',
    icon: 'text-pink-600',
    selectedBg: 'bg-pink-100',
    selectedIcon: 'text-pink-600',
    base: 'bg-pink-600',
  },
  'crypto': {
    bg: 'bg-cyan-50',
    icon: 'text-cyan-600',
    selectedBg: 'bg-cyan-100',
    selectedIcon: 'text-cyan-600',
    base: 'bg-cyan-600',
  }
} as const

export type AssetColorKey = keyof typeof ASSET_COLORS 