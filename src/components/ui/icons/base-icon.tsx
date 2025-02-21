import { IconProps } from './types'
import * as React from 'react'

export function BaseIcon({ 
  size = 24, 
  className,
  children,
  ...props
}: IconProps & React.SVGProps<SVGSVGElement> & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {children}
    </svg>
  )
} 