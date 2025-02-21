import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    // Add decimal handling for number inputs
    const inputProps = {
      ...props,
      // Allow decimal input by default for number fields
      inputMode: type === 'number' ? 'decimal' : props.inputMode,
      // Update pattern to allow decimals and arithmetic
      pattern: type === 'number' ? '[0-9]*[.]?[0-9]*' : props.pattern,
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-500 focus-visible:ring-red-500",
          className
        )}
        ref={ref}
        {...inputProps}
      />
    )
  }
)
Input.displayName = "Input"

export { Input } 