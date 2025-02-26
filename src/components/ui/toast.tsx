import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import ReactDOM from "react-dom/client"

const toastVariants = cva(
  "relative flex items-center justify-between gap-3 rounded-lg px-5 py-3 text-sm font-medium shadow-lg border",
  {
    variants: {
      variant: {
        default: "bg-gray-900 text-gray-50 border-gray-800",
        destructive: "bg-red-950 text-red-50 border-red-900",
        warning: "bg-amber-950 text-amber-50 border-amber-900",
        success: "bg-gray-900 text-gray-50 border-gray-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Type for window.toast
declare global {
  interface Window {
    toast?: (props: ToastProps) => { close: () => void }
  }
}

export interface ToastProps extends VariantProps<typeof toastVariants> {
  title: string
  description?: string  // Kept for backward compatibility
  duration?: number
}

// A unique ID for each toast to help with animations and removal
let id = 0
const getUniqueId = () => `toast-${++id}`

// Toast container - maintains the list of active toasts
const ToastContainer = () => {
  const [toasts, setToasts] = React.useState<(ToastProps & { id: string })[]>([])

  // Add global toast function to window
  React.useEffect(() => {
    const toast = (props: ToastProps) => {
      const toastId = getUniqueId()
      const newToast = { ...props, id: toastId }
      
      setToasts(prev => [...prev, newToast])
      
      // Auto-remove toast after duration
      if (props.duration !== 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId))
        }, props.duration || 4000)
      }
      
      // Return a function to manually close the toast
      return {
        close: () => setToasts(prev => prev.filter(t => t.id !== toastId))
      }
    }
    
    window.toast = toast
    
    return () => {
      if (window.toast) delete window.toast
    }
  }, [])
  
  if (toasts.length === 0) return null
  
  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col items-end pr-4 pb-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map(({ id, title, variant, duration }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.8 }}
            className="pointer-events-auto w-full max-w-md mb-2"
          >
            <div className={cn(toastVariants({ variant }))}>
              <div className="flex-1">
                <span className="font-medium">{title}</span>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== id))}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <X size={16} />
                <span className="sr-only">Close</span>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Initialize toast container once on app startup
export function initToast() {
  if (typeof document !== 'undefined') {
    const container = document.createElement('div')
    container.id = 'toast-container'
    document.body.appendChild(container)
    
    const root = ReactDOM.createRoot(container)
    root.render(<ToastContainer />)
  }
}

// Function to show a toast notification
export function toast(props: ToastProps) {
  if (typeof window !== 'undefined' && window.toast) {
    return window.toast(props)
  }
  console.warn('Toast not initialized. Call initToast() at app startup.')
  return { close: () => {} }
} 