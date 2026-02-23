'use client'

import { useLocale } from '@/i18n/LocaleProvider'
import { locales, type Locale } from '@/i18n/config'
import { useTranslations } from 'next-intl'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Globe } from 'lucide-react'

// Language display names (always shown in their native script)
const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
}

// Language flag emojis
const LANGUAGE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  fr: '🇫🇷',
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()
  const t = useTranslations('languageSwitcher')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (newLocale: Locale) => {
    setLocale(newLocale)
    setIsOpen(false)
    // Also set a cookie so the server can detect the locale on next request
    document.cookie = `zakat-locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm",
          "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
        )}
        aria-label={t('label')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="h-4 w-4 flex-shrink-0" />
        <span className="font-medium">{LANGUAGE_FLAGS[locale]} {LANGUAGE_NAMES[locale]}</span>
        <ChevronDown className={cn(
          "h-3 w-3 flex-shrink-0 transition-transform duration-150",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute right-0 top-full mt-1 z-50",
            "min-w-[140px] rounded-xl bg-white shadow-lg",
            "border border-gray-100",
            "py-1 overflow-hidden"
          )}
          role="listbox"
          aria-label={t('label')}
        >
          {locales.map((loc) => (
            <button
              key={loc}
              role="option"
              aria-selected={loc === locale}
              onClick={() => handleSelect(loc)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left",
                "transition-colors duration-100",
                loc === locale
                  ? "bg-gray-50 text-gray-900 font-medium"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <span className="text-base leading-none">{LANGUAGE_FLAGS[loc]}</span>
              <span>{LANGUAGE_NAMES[loc]}</span>
              {loc === locale && (
                <span className="ml-auto text-gray-400">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
