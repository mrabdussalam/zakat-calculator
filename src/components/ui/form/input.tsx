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
          "focus:outline-none focus:ring-[0.5px] focus:ring-inset focus:ring-blue-500 focus:border-blue-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-[border,box-shadow] duration-200 ease-in-out",
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          "[&:-webkit-autofill]:!bg-white [&:-webkit-autofill]:!bg-clip-padding",
          "[&:-webkit-autofill]:!text-gray-900 [&:-webkit-autofill]:!shadow-[0_0_0_30px_white_inset]",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
        ref={ref}
        autoComplete="off"
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input } 