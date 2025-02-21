import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const toastVariants = cva(
  "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-white text-gray-900",
        destructive: "bg-red-50 text-red-900",
        warning: "bg-yellow-50 text-yellow-900",
        success: "bg-green-50 text-green-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ToastProps extends VariantProps<typeof toastVariants> {
  title: string
  description?: string
  duration?: number
}

let toastTimeout: NodeJS.Timeout

export function toast({ title, description, variant = "default", duration = 3000 }: ToastProps) {
  // Clear any existing toast
  if (toastTimeout) {
    clearTimeout(toastTimeout)
  }

  // Remove existing toast
  const existingToast = document.getElementById('toast')
  if (existingToast) {
    existingToast.remove()
  }

  // Create new toast
  const toastElement = document.createElement('div')
  toastElement.id = 'toast'
  toastElement.className = toastVariants({ variant })

  const content = `
    <div class="flex flex-col gap-1">
      <div class="font-semibold">${title}</div>
      ${description ? `<div class="text-sm opacity-90">${description}</div>` : ''}
    </div>
  `

  toastElement.innerHTML = content
  document.body.appendChild(toastElement)

  // Remove toast after duration
  toastTimeout = setTimeout(() => {
    toastElement.remove()
  }, duration)
} 