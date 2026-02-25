// Barrel export for i18n module — re-exports config, types, and LocaleProvider.

export { defaultLocale, locales, isValidLocale } from './config'
export type { Locale } from './config'
export { LocaleProvider, useLocale } from './LocaleProvider'
