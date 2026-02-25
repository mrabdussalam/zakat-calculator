// Client-side locale provider — wraps NextIntlClientProvider and manages
// locale state via React context. Persists preference to localStorage.
// Used in layout.tsx to wrap the entire app.

'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { defaultLocale, isValidLocale, Locale } from './config'

const LOCALE_STORAGE_KEY = 'zakat-locale'

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
})

export function useLocale() {
  return useContext(LocaleContext)
}

interface LocaleProviderProps {
  children: ReactNode
  initialMessages: Record<string, unknown>
  initialLocale: Locale
}

export function LocaleProvider({
  children,
  initialMessages,
  initialLocale,
}: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const [messages, setMessages] = useState<Record<string, unknown>>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
      if (stored && isValidLocale(stored) && stored !== locale) {
        loadLocale(stored)
      }
    } catch {
      // localStorage not available
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadLocale = useCallback(async (newLocale: Locale) => {
    if (newLocale === locale) return
    setIsLoading(true)
    try {
      const newMessages = (await import(`../../messages/${newLocale}.json`)).default
      setMessages(newMessages)
      setLocaleState(newLocale)
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
      } catch {
        // localStorage not available
      }
    } catch (error) {
      console.error(`Failed to load messages for locale: ${newLocale}`, error)
    } finally {
      setIsLoading(false)
    }
  }, [locale])

  const setLocale = useCallback((newLocale: Locale) => {
    loadLocale(newLocale)
  }, [loadLocale])

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone="UTC"
      >
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  )
}
