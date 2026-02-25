// Language switcher dropdown — allows users to switch between supported locales.
// Sets both a cookie (for server-side detection) and localStorage (for client persistence).
// Used on the home page header.

'use client'

import { useLocale } from '@/i18n/LocaleProvider'
import { locales, type Locale } from '@/i18n/config'
import { useTranslations } from 'next-intl'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
}

const LANGUAGE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  ru: '🇷🇺',
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()
  const t = useTranslations('languageSwitcher')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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
    document.cookie = `zakat-locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full gap-1.5"
        aria-label={t('label')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="h-4 w-4 flex-shrink-0" />
        <span>{LANGUAGE_NAMES[locale]}</span>
        <ChevronDown className={cn(
          "h-3 w-3 flex-shrink-0 transition-transform duration-150",
          isOpen && "rotate-180"
        )} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: [0.2, 0.4, 0.2, 1] }}
            className={cn(
              "absolute right-0 top-full mt-1.5 z-50",
              "min-w-[160px] rounded-xl bg-white shadow-lg",
              "border border-gray-100",
              "p-1.5"
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
                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-lg",
                  "transition-colors duration-100",
                  loc === locale
                    ? "bg-gray-100 text-gray-900 font-medium"
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
