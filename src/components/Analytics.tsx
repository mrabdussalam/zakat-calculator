'use client'

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Track page views
  useEffect(() => {
    if (typeof window === 'undefined' || !window.gtag) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || 'G-N5SFJ07P99', {
      page_location: window.location.origin + url,
      page_path: url
    });
  }, [pathname, searchParams]);

  return null;
} 