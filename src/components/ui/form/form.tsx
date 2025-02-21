'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  error?: string
  spacing?: 'tight' | 'normal' | 'loose'
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, error, children, onSubmit, spacing = 'normal', ...props }, ref) => {
    return (
      <form
        ref={ref}
        onSubmit={onSubmit}
        className={cn(
          spacing === 'tight' && "space-y-4",
          spacing === 'normal' && "space-y-6",
          spacing === 'loose' && "space-y-8",
          className
        )}
        {...props}
      >
        {children}
        {error && (
          <div className="text-sm font-normal text-red-500" role="alert">
            {error}
          </div>
        )}
      </form>
    )
  }
)
Form.displayName = "Form"

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: 'tight' | 'normal' | 'loose'
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, spacing = 'normal', ...props }, ref) => {
    return (
      <div 
        ref={ref} 
        className={cn(
          spacing === 'tight' && "space-y-2",
          spacing === 'normal' && "space-y-3",
          spacing === 'loose' && "space-y-4",
          "group",
          className
        )} 
        {...props} 
      />
    )
  }
)
FormField.displayName = "FormField"

export { Form, FormField } 