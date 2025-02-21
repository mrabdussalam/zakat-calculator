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
import { Button } from '@/components/ui/button'
import { FAQ } from '@/components/ui/faq'
import { ASSET_FAQS } from '@/config/faqs'

const DIVIDEND_FIELDS = [
  {
    id: 'total_dividend_earnings',
    label: 'Total Dividends Earned',
    tooltip: 'Check your brokerage statement under "Dividend Summary", "Transaction History", or "Income Report". Platforms like Fidelity, Schwab, and ETRADE list total annual dividends earned.'
  }
] as const

interface DividendEarningsTabProps {
  currency: string
  inputValues: StockValues
  onValueChange: (fieldId: keyof StockValues, event: React.ChangeEvent<HTMLInputElement>) => void
}

export function DividendEarningsTab({ 
  currency,
  inputValues,
  onValueChange
}: DividendEarningsTabProps) {

  return (
    <div className="pt-6">
      <FAQ
        title="Dividend Earnings"
        description="Enter the total amount of dividends you received from all investments this year. This can be found in your brokerage statement under 'Dividend Income' or 'Earnings Summary'."
        items={ASSET_FAQS.stocks.dividend}
        defaultOpen={false}
      />

      <div className="mt-6 space-y-4">
        {DIVIDEND_FIELDS.map((field) => (
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
                placeholder="Enter total dividends earned"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 