import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm",
          "placeholder:text-gray-500",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors",
          error && "border-red-500 focus-visible:ring-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input } 