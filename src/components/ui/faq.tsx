'use client'

import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FAQIcon } from '@/components/ui/icons'
import { FAQItem } from '@/config/faqs'

interface FAQProps {
  title: string
  description: string
  items?: FAQItem[]
  className?: string
  defaultOpen?: boolean
}

export function FAQ({ 
  title, 
  description, 
  items = [], 
  className,
  defaultOpen = true
}: FAQProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  
  // Create array of default values for all items - always expanded
  const defaultValues = items.map((_, index) => `item-${index}`)

  return (
    <div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md",
              "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
              "transition-colors duration-200",
              isOpen && "text-gray-900 bg-gray-50"
            )}
          >
            <FAQIcon className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Help</span>
          </button>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      {items.length > 0 && (
        <div className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isOpen ? "max-h-[1000px] opacity-100 my-4" : "max-h-0 opacity-0",
          className
        )}>
          <div className="space-y-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
            {items.map((item, index) => (
              <div 
                key={index} 
                className={cn(
                  "space-y-1.5",
                  index > 0 && "pt-4 border-t border-blue-100/50"
                )}
              >
                <h4 className="text-sm font-medium text-gray-900">{item.question}</h4>
                <p className="text-sm text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 