// Define colors directly to avoid circular dependencies
export const ASSET_COLORS = {
  'cash': '#7C3AED', // Purple
  'precious-metals': '#F59E0B', // Amber
  'stocks': '#3B82F6', // Blue
  'retirement': '#10B981', // Emerald
  'real-estate': '#EC4899', // Pink
  'crypto': '#06B6D4', // Cyan
  'business-assets': '#10B981', // Emerald
  'other-financial': '#6366F1', // Indigo
  'debt-receivable': '#8B5CF6', // Violet
  'debt': '#6366F1' // Indigo
} as const

// Asset type to display name mapping
export const ASSET_DISPLAY_NAMES = {
  'cash': 'Cash & Bank',
  'precious-metals': 'Precious Metals',
  'stocks': 'Investments',
  'retirement': 'Retirement',
  'real-estate': 'Real Estate',
  'crypto': 'Crypto',
  'business-assets': 'Business Assets',
  'other-financial': 'Other Financial',
  'debt-receivable': 'Debt Receivable',
  'debt': 'Debt & Receivables'
} as const 