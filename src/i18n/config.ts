// i18n configuration — defines supported locales and type-safe locale utilities.
// Used by LocaleProvider, LanguageSwitcher, layout.tsx, and request.ts.

export const defaultLocale = 'en' as const

export const locales = ['en', 'ru'] as const

export type Locale = (typeof locales)[number]

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}
