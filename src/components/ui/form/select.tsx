import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-10 w-full rounded-lg border border-gray-100 bg-white px-3 py-2",
          "text-sm font-normal text-gray-900",
          "placeholder:text-gray-500",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "hover:border-gray-200 transition-colors",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

export { Select } 