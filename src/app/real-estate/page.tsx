'use client'

import { RealEstateCalculator } from '@/components/calculators/realestate/RealEstateCalculator'
import { useZakatStore } from '@/store/zakatStore'

export default function RealEstatePage() {
  const { setRealEstateValue, setRealEstateHawlMet } = useZakatStore()

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-medium mb-6">Real Estate Zakat</h1>
      <RealEstateCalculator
        currency="USD"
        onUpdateValues={() => {}}
        onHawlUpdate={() => {}}
        onCalculatorChange={() => {}}
      />
    </div>
  )
} 