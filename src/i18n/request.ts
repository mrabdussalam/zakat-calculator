import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, isValidLocale } from './config'

export default getRequestConfig(async ({ requestLocale }) => {
  // This is called for every request. `requestLocale` is the locale
  // that was detected from the request (e.g. from a cookie or header).
  let locale = await requestLocale

  // Ensure that a valid locale is used
  if (!locale || !isValidLocale(locale)) {
    locale = defaultLocale
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
