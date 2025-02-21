'use client'

import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/label'
import { InfoIcon } from '@/components/ui/icons'
import { 
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip"
import { StockValues } from '@/lib/assets/stocks'
import { FAQ } from '@/components/ui/faq'
import { ASSET_FAQS } from '@/config/faqs'

const FUND_FIELDS = [
  {
    id: 'fund_value',
    label: 'Total Investment in Funds ($)',
    tooltip: 'Enter the total market value of all Mutual Funds, ETFs, and Index Funds you own. This is available in your brokerage account under "Portfolio Holdings" or "Investment Summary".'
  }
] as const

interface InvestmentFundsTabProps {
  currency: string
  inputValues: StockValues
  onValueChange: (fieldId: string, event: React.ChangeEvent<HTMLInputElement>) => void
  isPassiveFund: boolean
  onFundTypeChange: (isPassive: boolean) => void
}

export function InvestmentFundsTab({ 
  currency,
  inputValues,
  onValueChange
}: InvestmentFundsTabProps) {

  return (
    <div className="pt-6">
      <FAQ
        title="Investment Funds"
        description="Enter the total market value of your investment funds, including ETFs, mutual funds, and index funds. You can find this information in your brokerage account."
        items={ASSET_FAQS.stocks.funds}
        defaultOpen={false}
      />

      <div className="mt-6 space-y-4">
        {FUND_FIELDS.map((field) => (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <InfoIcon className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-gray-200 max-w-xs">{field.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center">
                <span className="text-sm font-medium text-gray-900 mr-1">{currency}</span>
              </div>
              <Input
                id={field.id}
                type="text"
                inputMode="decimal"
                pattern="[\d+\-*/.() ]*"
                className="pl-12"
                value={String(inputValues[field.id] || '')}
                onChange={(e) => onValueChange(field.id, e)}
                placeholder="Enter total fund value"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 