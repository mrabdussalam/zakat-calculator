'use client'

import dynamic from 'next/dynamic'

// Dynamically import the state debugger with no SSR
const StateDebuggerComponent = dynamic(
  () => import('./StateDebuggerLoader').then(mod => mod.StateDebuggerLoader),
  { ssr: false }
)

export function ClientDebugger() {
  return <StateDebuggerComponent />
} 