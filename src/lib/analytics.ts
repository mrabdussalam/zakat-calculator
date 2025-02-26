import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Types for analytics events
export interface AnalyticsEvent {
  action: string
  category: string
  label?: string
  value?: number
  currency?: string
  assetType?: string
  calculatorType?: string
}

// Initialize GA
export const initGA = () => {
  if (typeof window === 'undefined') return

  // Load GA script
  const script = document.createElement('script')
  script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`
  script.async = true
  document.head.appendChild(script)

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || []
  function gtag(...args: any[]) {
    window.dataLayer.push(args)
  }
  gtag('js', new Date())
  gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
    page_path: window.location.pathname,
  })
}

// Track page views
export const useAnalytics = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!window.gtag) return

    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_path: pathname + searchParams.toString(),
    })
  }, [pathname, searchParams])
}

// Custom event tracking
export const trackEvent = ({ action, category, label, value, currency, assetType, calculatorType }: AnalyticsEvent) => {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
    currency: currency,
    asset_type: assetType,
    calculator_type: calculatorType,
  })
}

// Predefined analytics events
export const AnalyticsEvents = {
  // Page events
  PAGE_VIEW: {
    action: 'page_view',
    category: 'navigation',
  },
  
  // Calculator events
  CALCULATOR_START: {
    action: 'calculator_start',
    category: 'engagement',
  },
  CALCULATOR_COMPLETE: {
    action: 'calculator_complete',
    category: 'engagement',
  },
  CALCULATOR_SWITCH: {
    action: 'calculator_switch',
    category: 'navigation',
  },
  
  // Asset events
  ASSET_ADD: {
    action: 'asset_add',
    category: 'asset_management',
  },
  ASSET_UPDATE: {
    action: 'asset_update',
    category: 'asset_management',
  },
  ASSET_REMOVE: {
    action: 'asset_remove',
    category: 'asset_management',
  },
  
  // Calculation events
  ZAKAT_CALCULATION: {
    action: 'zakat_calculation',
    category: 'calculation',
  },
  NISAB_CHECK: {
    action: 'nisab_check',
    category: 'calculation',
  },
  
  // Summary events
  SUMMARY_VIEW: {
    action: 'summary_view',
    category: 'engagement',
  },
  SUMMARY_EXPORT: {
    action: 'summary_export',
    category: 'engagement',
  },
  
  // Settings events
  CURRENCY_CHANGE: {
    action: 'currency_change',
    category: 'settings',
  },
  HAWL_UPDATE: {
    action: 'hawl_update',
    category: 'settings',
  },
}

// Add type declarations for window object
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
} 