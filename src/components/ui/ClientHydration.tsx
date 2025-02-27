'use client'

import dynamic from 'next/dynamic'

// Dynamically import the store hydration component with no SSR
const StoreHydrationComponent = dynamic(
  () => import('./StoreHydration').then(mod => mod.StoreHydration),
  { ssr: false }
)

export function ClientHydration() {
  return <StoreHydrationComponent />
} 