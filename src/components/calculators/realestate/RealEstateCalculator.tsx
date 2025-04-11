'use client'

import React, { useState, useEffect } from 'react'
import { Tabs } from '@/components/ui/tabs'
import { useZakatStore } from '@/store/zakatStore'
import { RealEstateValues } from '@/store/modules/realEstate'
import { CalculatorNav } from '@/components/ui/calculator-nav'

import { RentalPropertyTab } from './tabs/RentalPropertyTab'
import { PrimaryResidenceTab } from './tabs/PrimaryResidenceTab'
import { PropertyForSaleTab } from './tabs/PropertyForSaleTab'
import { VacantLandTab } from './tabs/VacantLandTab'
import { ExtendedWindow } from '@/types'

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

interface RealEstateCalculatorProps {
  currency: string
  onUpdateValues: (values: Record<string, number>) => void
  onHawlUpdate: (hawlMet: boolean) => void
  onCalculatorChange: (calculator: string) => void
  onOpenSummary?: () => void
  initialValues?: Record<string, number>
  initialHawlMet?: boolean
}

export function RealEstateCalculator({
  currency,
  onUpdateValues,
  onHawlUpdate,
  onCalculatorChange,
  onOpenSummary,
  initialValues = {},
  initialHawlMet = true
}: RealEstateCalculatorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isPropertyForSaleActive, setIsPropertyForSaleActive] = useState(false);
  const [isVacantLandSold, setIsVacantLandSold] = useState(false);

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

  // Add a state to track if store has been hydrated
  const [storeHydrated, setStoreHydrated] = useState(false)

  // Add a listener for the store hydration event
  useEffect(() => {
    const handleHydrationComplete = () => {
      console.log('RealEstateCalculator: Store hydration complete event received')
      setStoreHydrated(true)

      // After hydration, safely initialize form values from store with a small delay
      setTimeout(() => {
        console.log('RealEstateCalculator: Initializing values from store after hydration');

        // Set initial values from store
        if (realEstateValues) {
          // First, set the boolean values 
          if (typeof realEstateValues.property_for_sale_active === 'boolean') {
            // Use local state setter functions, not store functions
            setIsPropertyForSaleActive(realEstateValues.property_for_sale_active);
          }

          if (typeof realEstateValues.vacant_land_sold === 'boolean') {
            // Use local state setter functions, not store functions
            setIsVacantLandSold(realEstateValues.vacant_land_sold);
          }

          // Then set Hawl status
          setRealEstateHawlMet(realEstateHawlMet);
          onHawlUpdate(realEstateHawlMet);

          // Notify parent component of current values
          if (onUpdateValues) {
            // Convert to Record<string, number> to match the expected type
            const numericValues: Record<string, number> = {
              primary_residence_value: realEstateValues.primary_residence_value || 0,
              rental_income: realEstateValues.rental_income || 0,
              rental_expenses: realEstateValues.rental_expenses || 0,
              property_for_sale_value: realEstateValues.property_for_sale_value || 0,
              vacant_land_value: realEstateValues.vacant_land_value || 0,
              sale_price: realEstateValues.sale_price || 0
            };

            onUpdateValues(numericValues);
          }
        }

        console.log('RealEstateCalculator: Values initialized from store after hydration');
      }, 50); // Small delay to ensure store is fully ready
    }

    // Listen for the custom hydration event
    window.addEventListener('store-hydration-complete', handleHydrationComplete)

    // Check if hydration already happened
    if (typeof window !== 'undefined') {
      // Safe way to check for custom property without TypeScript errors

      const win = window as ExtendedWindow;
      if (win.hasDispatchedHydrationEvent) {
        handleHydrationComplete();
      }
    }

    return () => {
      window.removeEventListener('store-hydration-complete', handleHydrationComplete)
    }
  }, [realEstateValues, setRealEstateHawlMet, setIsPropertyForSaleActive, setIsVacantLandSold, onHawlUpdate, onUpdateValues])

  // Add a listener to detect store resets
  useEffect(() => {
    // Only process resets after hydration is complete to prevent false resets
    if (!storeHydrated) return;

    const handleReset = (event?: Event) => {
      console.log('RealEstateCalculator: Store reset event detected');

      // Check if this is still during initial page load
      if (typeof window !== 'undefined' && 'isInitialPageLoad' in window) {
        // @ts-ignore - Custom property added to window
        if (window.isInitialPageLoad) {
          console.log('RealEstateCalculator: Ignoring reset during initial page load');
          return;
        }
      }

      // This is a user-initiated reset, so clear all local state
      console.log('RealEstateCalculator: Clearing local state due to user-initiated reset');

      // Clear local component state that would need resetting
      // We don't need to call store functions as the store itself will be reset

      // Ensure local state is in sync with the reset store
      // by updating any UI-only state variables
    };

    // Listen for the store-reset event
    window.addEventListener('store-reset', handleReset);

    // Cleanup
    return () => {
      window.removeEventListener('store-reset', handleReset);
    };
  }, [storeHydrated]);

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
      <Tabs
        tabs={[
          {
            id: 'rental',
            label: 'Rental',
            content: (
              <RentalPropertyTab
                values={realEstateValues}
                errors={realEstateErrors as Record<string, string | undefined>}
                onValueChange={handleValueChange}
                currency={currency}
              />
            )
          },
          {
            id: 'primary',
            label: 'Primary',
            content: (
              <PrimaryResidenceTab
                values={realEstateValues}
                errors={realEstateErrors as Record<string, string | undefined>}
                onValueChange={handleValueChange}
                currency={currency}
              />
            )
          },
          {
            id: 'sale',
            label: 'For Sale',
            content: (
              <PropertyForSaleTab
                values={realEstateValues}
                errors={realEstateErrors as Record<string, string | undefined>}
                onValueChange={handleValueChange}
                onToggleChange={handleToggleChange}
                currency={currency}
              />
            )
          },
          {
            id: 'vacant',
            label: 'Vacant',
            content: (
              <VacantLandTab
                currency={currency}
                values={realEstateValues}
                errors={realEstateErrors as Record<string, string | undefined>}
                onValueChange={handleValueChange}
                onToggleChange={handleToggleChange}
              />
            )
          }
        ]}
        defaultTab="rental"
      />

      {/* Navigation */}
      <CalculatorNav
        currentCalculator="real-estate"
        onCalculatorChange={onCalculatorChange}
        onOpenSummary={onOpenSummary}
      />
    </div>
  )
} 