'use client'

import dynamic from 'next/dynamic'

// Dynamically import the store hydration component with no SSR
// This ensures it only runs on the client side
const StoreHydrationComponent = dynamic(
  () => import('./StoreHydration').then(mod => mod.StoreHydration),
  {
    ssr: false,
    loading: () => null
  }
)

export function ClientHydration() {
  // We use a client component to ensure hydration only happens on the client
  return <StoreHydrationComponent />
} 