'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'
import { AmazonIcon } from '@/components/ui/icons/amazon'

export type Source = {
  id: string
  name: string
  icon: string
  url?: string
  color?: string
}

interface SourcesProps {
  sources: Source[]
  className?: string
}

export function Sources({ sources, className }: SourcesProps) {
  if (!sources.length) return null

  // Color mapping for different source types
  const getSourceColor = (source: Source) => {
    const colorMap: Record<string, { bg: string, text: string }> = {
      amazon: { bg: 'bg-[#FF9900]', text: 'text-white' },
      wikipedia: { bg: 'bg-gray-900', text: 'text-white' },
      wzo: { bg: 'bg-green-600', text: 'text-white' },
      ife: { bg: 'bg-blue-600', text: 'text-white' },
      ifg: { bg: 'bg-purple-600', text: 'text-white' },
      nzf: { bg: 'bg-indigo-600', text: 'text-white' },
      launchgood: { bg: 'bg-teal-600', text: 'text-white' },
      fiqh_council: { bg: 'bg-rose-600', text: 'text-white' },
      barakah_capital: { bg: 'bg-amber-600', text: 'text-white' },
      joe_bradford: { bg: 'bg-cyan-600', text: 'text-white' }
    }
    return colorMap[source.id] || { bg: 'bg-gray-600', text: 'text-white' }
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-full border border-gray-100 shadow-sm",
        className
      )}
    >
      <span className="text-xs font-medium text-gray-600">Sources</span>
      <div className="flex items-center -space-x-1">
        {sources.map((source) => {
          const colors = getSourceColor(source)
          const style = source.color ? { backgroundColor: source.color } : {}

          return (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "relative h-6 w-6 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110 hover:z-10",
                source.icon ? "bg-white" : (!source.color && colors.bg),
                colors.text
              )}
              style={style}
              title={source.name}
            >
              {source.id === 'amazon' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <AmazonIcon className="w-4 h-4 text-white" />
                </div>
              ) : source.icon ? (
                <Image
                  src={source.icon}
                  alt={source.name}
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {source.name.match(/^\[(\d+)\]/)?.[1] || source.name.charAt(0)}
                  </span>
                </div>
              )}
            </a>
          )
        })}
      </div>
    </div>
  )
} 