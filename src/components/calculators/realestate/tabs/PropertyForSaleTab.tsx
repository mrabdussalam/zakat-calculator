'use client'

import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/form/label'
import { FAQ } from '@/components/ui/faq'
import { ASSET_FAQS } from '@/config/faqs'
import { RealEstateValues } from '@/store/modules/realEstate'
import { RadioGroup, RadioGroupCard } from '@/components/ui/form/radio-group'
import { cn } from '@/lib/utils'

export interface PropertyForSaleTabProps {
  values: RealEstateValues
  errors: Record<string, string | undefined>
  onValueChange: (
    fieldId: keyof RealEstateValues,
    event: React.ChangeEvent<HTMLInputElement>
  ) => void
  onToggleChange: (
    fieldId: keyof RealEstateValues,
    checked: boolean
  ) => void
}

export function PropertyForSaleTab({
  values,
  errors,
  onValueChange,
  onToggleChange
}: PropertyForSaleTabProps) {
  const handleActiveChange = (value: string) => {
    onToggleChange('property_for_sale_active', value === 'yes')
  }

  return (
    <div className="pt-6">
      <div className="space-y-6">
        <div>
          <FAQ
            title="Property For Sale"
            description="Properties actively listed for sale are subject to Zakat on their full market value."
            items={ASSET_FAQS.realestate.sale}
            defaultOpen={false}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Is this property actively listed for sale?</Label>
            <RadioGroup
              value={values.property_for_sale_active ? 'yes' : 'no'}
              onValueChange={handleActiveChange}
              className="grid grid-cols-2 gap-4"
            >
              <RadioGroupCard 
                value="yes" 
                title="Yes, it is listed for sale"
              />
              <RadioGroupCard 
                value="no" 
                title="No, not listed for sale"
              />
            </RadioGroup>
          </div>

          {values.property_for_sale_active && (
            <div className="space-y-2">
              <Label htmlFor="property_for_sale_value">Current Market Value</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-1">USD</span>
                </div>
                <Input
                  id="property_for_sale_value"
                  type="text"
                  inputMode="decimal"
                  pattern="[\d+\-*/.() ]*"
                  className="pl-16 text-sm bg-white"
                  value={values.property_for_sale_value || ''}
                  onChange={(e) => onValueChange('property_for_sale_value', e)}
                  placeholder="Enter current market value"
                  error={errors.property_for_sale_value}
                />
              </div>
              {errors.property_for_sale_value && (
                <p className="text-sm text-red-500">{errors.property_for_sale_value}</p>
              )}
              <p className="text-xs text-gray-500">
                Zakat is due on the full market value of properties actively listed for sale if Hawl is met
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 