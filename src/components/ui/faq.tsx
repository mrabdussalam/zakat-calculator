'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { FAQIcon } from '@/components/ui/icons'
import { FAQItem, FAQSection } from '@/config/faqs'
import { motion, AnimatePresence } from 'framer-motion'
import { Sources } from './sources'
import { SOURCES, SourceKey } from '@/config/sources'

interface FAQProps {
  title: string
  description: string
  items?: FAQItem[] | FAQSection
  className?: string
  defaultOpen?: boolean
}

export function FAQ({ 
  title, 
  description, 
  items = [], 
  className,
  defaultOpen = false
}: FAQProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  
  // Handle both array and section formats
  const faqItems = Array.isArray(items) ? items : items.items || []
  const sectionSources = !Array.isArray(items) && items.sources ? items.sources : undefined

  return (
    <div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
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

      <AnimatePresence initial={false}>
        {isOpen && faqItems.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: {
                type: "spring",
                stiffness: 500,
                damping: 40,
                mass: 0.5
              },
              opacity: {
                duration: 0.2,
                ease: "easeOut"
              }
            }}
            className={cn("overflow-hidden", className)}
          >
            <div className="my-4">
              <div className="space-y-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                {faqItems.map((item, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.15,
                      delay: index * 0.02,
                      ease: [0.2, 0.0, 0.0, 1]
                    }}
                    className={cn(
                      "space-y-1.5",
                      index > 0 && "pt-4 border-t border-blue-100/50"
                    )}
                  >
                    <h4 className="text-sm font-medium text-gray-900">{item.question}</h4>
                    <p className="text-sm text-gray-600">{item.answer}</p>
                    {item.sources && (
                      <Sources 
                        sources={item.sources.map((key: SourceKey) => SOURCES[key])}
                        className="mt-2"
                      />
                    )}
                  </motion.div>
                ))}
                {sectionSources && (
                  <Sources 
                    sources={sectionSources.map((key: SourceKey) => SOURCES[key])}
                    className="mt-4"
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 