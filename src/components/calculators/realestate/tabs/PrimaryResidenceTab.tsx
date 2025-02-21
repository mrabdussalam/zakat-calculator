'use client'

import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/form/label'
import { RealEstateValues } from '@/store/modules/realEstate'
import { Alert } from '@/components/ui/alert'
import { FAQ } from '@/components/ui/faq'
import { ASSET_FAQS } from '@/config/faqs'

export interface PrimaryResidenceTabProps {
  values: RealEstateValues
  errors: Record<string, string | undefined>
  onValueChange: (
    fieldId: keyof RealEstateValues,
    event: React.ChangeEvent<HTMLInputElement>
  ) => void
}

export function PrimaryResidenceTab({
  values,
  errors,
  onValueChange
}: PrimaryResidenceTabProps) {
  return (
    <div className="pt-6">
      <div className="space-y-6">
        <div>
          <FAQ
            title="Primary Residence"
            description="Primary residence used for personal accommodation is exempt from Zakat."
            items={ASSET_FAQS.realestate.primary}
            defaultOpen={false}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primary_residence_value">Property Value</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center">
                <span className="text-sm font-medium text-gray-900 mr-1">USD</span>
              </div>
              <Input
                id="primary_residence_value"
                type="text"
                inputMode="decimal"
                pattern="[\d+\-*/.() ]*"
                className="pl-16 text-sm bg-white"
                value={values.primary_residence_value || ''}
                onChange={(e) => onValueChange('primary_residence_value', e)}
                placeholder="Enter property value (for record only)"
                error={errors.primary_residence_value}
              />
            </div>
            {errors.primary_residence_value && (
              <p className="text-sm text-red-500">{errors.primary_residence_value}</p>
            )}
            <p className="text-xs text-gray-500">
              This value is for record-keeping only and will not be included in Zakat calculations
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}