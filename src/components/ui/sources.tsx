'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'
import { AmazonIcon } from '@/components/ui/icons/amazon'

export type Source = {
  id: string
  name: string
  icon: string
  url?: string
}

interface SourcesProps {
  sources: Source[]
  className?: string
}

export function Sources({ sources, className }: SourcesProps) {
  if (!sources.length) return null

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-full border border-gray-100 shadow-sm",
        className
      )}
    >
      <span className="text-xs font-medium text-gray-600">Sources</span>
      <div className="flex items-center -space-x-1">
        {sources.map((source) => (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "relative h-6 w-6 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110 hover:z-10",
              // Amazon-specific styling
              source.id === 'amazon' ? "bg-[#FF9900] text-white hover:bg-[#FF9900]/90" : "bg-white"
            )}
            title={source.name}
          >
            {source.id === 'amazon' ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <AmazonIcon className="w-4 h-4 text-white" />
              </div>
            ) : (
              <Image
                src={source.icon}
                alt={source.name}
                fill
                className="rounded-full object-cover"
              />
            )}
          </a>
        ))}
      </div>
    </div>
  )
} 