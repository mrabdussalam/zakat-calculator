import { IconProps } from './types'

export function FilledIcon({ 
  size = 24, 
  className,
  children 
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={{ color: 'inherit' }}
    >
      {children}
    </svg>
  )
} 