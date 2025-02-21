import { AssetType } from './types'
import { cash } from './cash'
import { preciousMetals } from './precious-metals'
import { stocks } from './stocks'
import { retirement } from './retirement'
import { realEstate } from './real-estate'
import { crypto } from './crypto'

// Registry of all asset types
const assetTypes: AssetType[] = [
  cash,
  preciousMetals,
  stocks,
  retirement,
  realEstate,
  crypto
]

// Map for quick lookups
const assetTypeMap = new Map<string, AssetType>(
  assetTypes.map(type => [type.id, type])
)

export const getAssetType = (id: string): AssetType | undefined => {
  return assetTypeMap.get(id)
}

export const getAllAssetTypes = (): AssetType[] => {
  return assetTypes
}

export const getAssetColors = (): Record<string, string> => {
  return assetTypes.reduce((acc, type) => ({
    ...acc,
    [type.id]: type.color
  }), {})
}

export const getAssetNames = (): Record<string, string> => {
  return assetTypes.reduce((acc, type) => ({
    ...acc,
    [type.id]: type.name
  }), {})
}

// Define asset types with correct keys
export const assetTypesRecord: Record<string, AssetType> = {
  retirement,
  stocks,
  'precious-metals': preciousMetals,  // Use correct key
  'real-estate': realEstate,
  crypto
}

// Helper function to get asset type by ID
export function getAssetTypeRecord(id: string): AssetType | undefined {
  return assetTypesRecord[id]
}

// Helper function to get all asset types
export function getAllAssetTypesRecord(): AssetType[] {
  return Object.values(assetTypesRecord)
}

// Helper function to get asset type IDs
export function getAssetTypeIdsRecord(): string[] {
  return Object.keys(assetTypesRecord)
} 