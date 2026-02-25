// Server-side request configuration for next-intl.
// Detects locale from the incoming request (cookie/header) and loads messages.

import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, isValidLocale } from './config'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !isValidLocale(locale)) {
    locale = defaultLocale
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
