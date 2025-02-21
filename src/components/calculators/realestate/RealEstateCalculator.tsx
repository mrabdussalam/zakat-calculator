'use client'

import React, { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CalculatorSummary } from '@/components/ui/calculator-summary'
import { useZakatStore } from '@/store/zakatStore'
import { RealEstateValues } from '@/store/modules/realEstate'
import { Alert } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { InfoIcon } from 'lucide-react'
import { AssetType, AssetBreakdown } from '@/lib/assets/types'
import { realEstate } from '@/lib/assets/real-estate'

import { RentalPropertyTab } from './tabs/RentalPropertyTab'
import { PrimaryResidenceTab } from './tabs/PrimaryResidenceTab'
import { PropertyForSaleTab } from './tabs/PropertyForSaleTab'
import { VacantLandTab } from './tabs/VacantLandTab'

type RealEstateErrors = Record<string, string | undefined>

const PROPERTY_TYPE_INFO = {
  rental: {
    title: 'Rental Property',
    description: 'Net rental income is zakatable after expenses',
    tooltip: 'Calculate Zakat on net rental income (income minus expenses) if Hawl is met'
  },
  primary: {
    title: 'Primary Residence',
    description: 'Personal residence is exempt from Zakat',
    tooltip: 'Primary residence for personal use is not subject to Zakat'
  },
  sale: {
    title: 'Property for Sale',
    description: 'Property intended for sale is zakatable',
    tooltip: 'Full market value is zakatable if property is actively for sale and Hawl is met'
  },
  vacant: {
    title: 'Vacant Land',
    description: 'Zakatable if intended for sale',
    tooltip: 'Land value is zakatable if intended for sale and Hawl requirement is met'
  }
} as const

export function RealEstateCalculator() {
  const [isLoading, setIsLoading] = useState(false)
  const {
    realEstateValues,
    realEstateErrors,
    realEstateHawlMet,
    isValid,
    setRealEstateValue,
    setRealEstateHawlMet,
    getRealEstateBreakdown,
    validateRealEstateValues
  } = useZakatStore()

  // Set hawl met to true by default
  useEffect(() => {
    setRealEstateHawlMet(true)
  }, [setRealEstateHawlMet])

  const handleValueChange = (
    fieldId: keyof RealEstateValues,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIsLoading(true)
    try {
      const value = event.target.value === '' ? 0 : parseFloat(event.target.value)
      if (!isNaN(value)) {
        setRealEstateValue(fieldId, value)
        validateRealEstateValues()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleChange = (
    fieldId: keyof RealEstateValues,
    checked: boolean
  ) => {
    if (typeof checked === 'boolean') {
      setRealEstateValue(fieldId, checked)
    }
  }

  const breakdown = getRealEstateBreakdown()

  return (
    <div className="space-y-6">
      <Tabs defaultValue="rental" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rental">
            <div className="w-full">Rental</div>
          </TabsTrigger>
          <TabsTrigger value="primary">
            <div className="w-full">Primary</div>
          </TabsTrigger>
          <TabsTrigger value="sale">
            <div className="w-full">For Sale</div>
          </TabsTrigger>
          <TabsTrigger value="vacant">
            <div className="w-full">Vacant</div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rental">
          <RentalPropertyTab
            values={realEstateValues}
            errors={realEstateErrors as Record<string, string | undefined>}
            onValueChange={handleValueChange}
          />
        </TabsContent>

        <TabsContent value="primary">
          <PrimaryResidenceTab
            values={realEstateValues}
            errors={realEstateErrors as Record<string, string | undefined>}
            onValueChange={handleValueChange}
          />
        </TabsContent>

        <TabsContent value="sale">
          <PropertyForSaleTab
            values={realEstateValues}
            errors={realEstateErrors as Record<string, string | undefined>}
            onValueChange={handleValueChange}
            onToggleChange={handleToggleChange}
          />
        </TabsContent>

        <TabsContent value="vacant">
          <VacantLandTab
            currency="USD"
            values={realEstateValues}
            errors={realEstateErrors as Record<string, string | undefined>}
            onValueChange={handleValueChange}
            onToggleChange={handleToggleChange}
          />
        </TabsContent>
      </Tabs>

      <CalculatorSummary
        title="Real Estate Summary"
        description="Review your real estate assets and calculated Zakat."
        assetType={{
          ...realEstate,
          getFieldLabel: (key: string) => {
            switch (key) {
              case 'rental':
                return 'Rental Property (Net Income)'
              case 'property_for_sale':
                return 'Property for Sale'
              case 'vacant_land':
                return 'Vacant Land'
              case 'primary_residence':
                return 'Primary Residence'
              default:
                return key
            }
          }
        }}
        breakdown={breakdown}
        hawlMet={true}
        footnote={{
          text: "Primary residence is exempt from Zakat."
        }}
      />
    </div>
  )
} 