'use client'

import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X as CloseIcon } from 'lucide-react'

interface BrokerInfo {
  name: string
  instructions: string
}

interface BrokerInfoProps {
  title: string
  brokers: BrokerInfo[]
  note?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export function BrokerInfo({
  title,
  brokers,
  note,
  open,
  onOpenChange,
  className
}: BrokerInfoProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "bg-white/80 border-white/20 shadow-lg",
          "backdrop-blur-md",
          "bg-gradient-to-b from-white/90 to-white/80",
          "p-0 gap-0 max-w-[480px] w-full",
          "[&>button]:hidden", // Hide the default close button
          className
        )}
      >
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[14px] font-medium text-gray-700">
              {title}
            </DialogTitle>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-white/40"
              >
                <CloseIcon className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>

          {/* Broker List */}
          <div className="space-y-2">
            {brokers.map((broker, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-4 rounded-lg bg-white/60 px-4 py-3",
                  "hover:bg-white/80 transition-colors duration-200",
                  "backdrop-blur-sm"
                )}
              >
                <div className="shrink-0 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                  <span className="text-xs font-medium text-gray-600">
                    {broker.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="text-[14px] font-medium text-gray-900">
                    {broker.name}
                  </h4>
                  <p className="text-[14px] leading-relaxed text-gray-600">
                    {broker.instructions}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Note */}
          {note && (
            <div className="pt-3 mt-3 border-t border-white/20">
              <p className="text-[12px] text-gray-500">
                {note}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 