'use client'

import * as React from "react"
import { Input } from "@/components/ui/form/input"
import { Label } from "@/components/ui/form/label"
import { FAQ } from '@/components/ui/faq'
import { ASSET_FAQS } from '@/config/faqs'
import { RealEstateValues } from "@/store/modules/realEstate"
import { formatCurrency } from "@/lib/utils"

export interface RentalPropertyTabProps {
  values: RealEstateValues
  errors: Record<string, string | undefined>
  onValueChange: (
    fieldId: keyof RealEstateValues,
    event: React.ChangeEvent<HTMLInputElement>
  ) => void
}

export function RentalPropertyTab({
  values,
  errors,
  onValueChange
}: RentalPropertyTabProps) {
  const handleChange = (
    fieldId: keyof Pick<RealEstateValues, 'rental_income' | 'rental_expenses'>,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onValueChange(fieldId, event)
  }

  return (
    <div className="pt-6">
      <div className="space-y-6">
        <div>
          <FAQ
            title="Rental Property"
            description="Zakat is calculated on the net rental income after deducting expenses."
            items={ASSET_FAQS.realestate.rental}
            defaultOpen={false}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rental_income">Annual Rental Income</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-1">USD</span>
                </div>
                <Input
                  id="rental_income"
                  type="text"
                  inputMode="decimal"
                  pattern="[\d+\-*/.() ]*"
                  className="pl-16 text-sm bg-white"
                  value={values.rental_income || ''}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                    handleChange('rental_income', event)
                  }
                  placeholder="Enter annual rental income"
                  error={errors.rental_income}
                />
              </div>
              {errors.rental_income && (
                <p className="text-sm text-red-500">{errors.rental_income}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rental_expenses">Annual Expenses</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-1">USD</span>
                </div>
                <Input
                  id="rental_expenses"
                  type="text"
                  inputMode="decimal"
                  pattern="[\d+\-*/.() ]*"
                  className="pl-16 text-sm bg-white"
                  value={values.rental_expenses || ''}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                    handleChange('rental_expenses', event)
                  }
                  placeholder="Enter annual expenses"
                  error={errors.rental_expenses}
                />
              </div>
              {errors.rental_expenses && (
                <p className="text-sm text-red-500">{errors.rental_expenses}</p>
              )}
              <p className="text-xs text-gray-500">
                Include maintenance, insurance, property tax, and other related expenses
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 