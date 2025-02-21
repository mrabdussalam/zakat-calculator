'use client'

import * as React from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { InfoIcon } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface HawlStatusProps {
  isHawlMet: boolean
  onChange: (checked: boolean) => void
  description?: string
  className?: string
}

export function HawlStatus({
  isHawlMet,
  onChange,
  description,
  className
}: HawlStatusProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="hawl-status">Hawl Status</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">
                    Hawl is a lunar year (approximately 354 days) that must pass before Zakat is due on an asset.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
        <Switch
          id="hawl-status"
          checked={isHawlMet}
          onCheckedChange={onChange}
        />
      </div>
    </div>
  )
}