'use client'

import { useEffect } from 'react'
import { initToast } from './toast'

export function ToastInitializer() {
  useEffect(() => {
    // Initialize toast system on mount
    initToast()
  }, [])

  return null
} 