'use client'

import { useTranslations } from 'next-intl'

export function TableHeader() {
  const t = useTranslations('summary')

  return (
    <div className="px-2 py-2.5 bg-gray-50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">{t('tableHeaders.category')}</span>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="w-[100px] sm:w-[140px] text-right text-xs font-medium text-gray-500">{t('tableHeaders.assetValue')}</span>
          <span className="hidden sm:block w-[140px] text-right text-xs font-medium text-gray-500">{t('tableHeaders.zakatableAmount')}</span>
          <span className="w-[80px] sm:w-[100px] text-right text-xs font-medium text-gray-500">{t('tableHeaders.zakatDue')}</span>
        </div>
      </div>
    </div>
  )
} 