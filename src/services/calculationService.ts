// Type definitions for calculation service
interface Asset {
  type: string
  value: number
  hawlMet: boolean
}

interface ZakatResult {
  total: number
  zakatable: number
  zakatDue: number
}

export class CalculationService {
  calculateZakat(assets: Asset[]): ZakatResult {
    // Move calculation logic here
    const total = assets.reduce((sum, asset) => sum + asset.value, 0)
    const zakatable = assets.filter(a => a.hawlMet).reduce((sum, asset) => sum + asset.value, 0)
    return {
      total,
      zakatable,
      zakatDue: zakatable * 0.025
    }
  }

  validateHawl(asset: Asset): boolean {
    // Move validation logic here
    return asset.hawlMet
  }
} 