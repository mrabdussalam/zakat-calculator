'use client'

import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/form/label'
import { FAQ } from '@/components/ui/faq'
import { ASSET_FAQS } from '@/config/faqs'
import { RealEstateValues } from '@/store/modules/realEstate'
import { RadioGroup, RadioGroupCard } from '@/components/ui/form/radio-group'
import { cn } from '@/lib/utils'

export interface VacantLandTabProps {
  currency: string
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

export function VacantLandTab({
  currency,
  values,
  errors,
  onValueChange,
  onToggleChange
}: VacantLandTabProps) {
  const handleSoldChange = (value: string) => {
    onToggleChange('vacant_land_sold', value === 'yes')
  }

  return (
    <div className="pt-6">
      <div className="space-y-6">
        <div>
          <FAQ
            title="Vacant Land"
            description="Zakat is due on vacant land when it is sold or if it was purchased with the intention of resale."
            items={ASSET_FAQS.realestate.vacant}
            defaultOpen={false}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Is this land intended for sale?</Label>
            <RadioGroup
              value={values.vacant_land_sold ? 'yes' : 'no'}
              onValueChange={handleSoldChange}
              className="grid grid-cols-2 gap-4"
            >
              <RadioGroupCard 
                value="yes" 
                title="Yes, intended for sale"
              />
              <RadioGroupCard 
                value="no" 
                title="No, not for sale"
              />
            </RadioGroup>
          </div>

          {values.vacant_land_sold ? (
            <div className="space-y-2">
              <Label htmlFor="sale_price">Sale Price</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-1">{currency}</span>
                </div>
                <Input
                  id="sale_price"
                  type="text"
                  inputMode="decimal"
                  pattern="[\d+\-*/.() ]*"
                  className="pl-16 text-sm bg-white"
                  value={values.sale_price || ''}
                  onChange={(e) => onValueChange('sale_price', e)}
                  placeholder="Enter sale price"
                  error={errors.sale_price}
                />
              </div>
              {errors.sale_price && (
                <p className="text-sm text-red-500">{errors.sale_price}</p>
              )}
              <p className="text-xs text-gray-500">
                Zakat is due on the full sale price of vacant land intended for sale
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="vacant_land_value">Current Market Value</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-1">{currency}</span>
                </div>
                <Input
                  id="vacant_land_value"
                  type="text"
                  inputMode="decimal"
                  pattern="[\d+\-*/.() ]*"
                  className="pl-16 text-sm bg-white"
                  value={values.vacant_land_value || ''}
                  onChange={(e) => onValueChange('vacant_land_value', e)}
                  placeholder="Enter current market value"
                  error={errors.vacant_land_value}
                />
              </div>
              {errors.vacant_land_value && (
                <p className="text-sm text-red-500">{errors.vacant_land_value}</p>
              )}
              <p className="text-xs text-gray-500">
                This value is for record-keeping only and will not be included in Zakat calculations
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 