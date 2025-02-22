import { IconProps } from './types'
import { BaseIcon } from './base-icon'

export function RealEstateIcon(props: IconProps) {
  return (
    <BaseIcon viewBox="0 0 24 24" width="20" height="20" fill="none" {...props}>
      <path opacity="0.4" d="M21 20H11V8.5L13 10H21V20Z" fill="currentColor" />
      <path opacity="0.4" d="M12.4142 9.41421L7 4H15.1265C16.0478 4 16.5084 4 16.9116 4.18882C17.3147 4.37764 17.6096 4.73152 18.1994 5.43926L22 10H13.8284C13.4197 10 13.2153 10 13.0315 9.92388C12.8478 9.84776 12.7032 9.70324 12.4142 9.41421Z" fill="currentColor" />
      <path d="M2 10L7 4M7 4L12.4142 9.41421C12.7032 9.70324 12.8478 9.84776 13.0315 9.92388C13.2153 10 13.4197 10 13.8284 10H22L18.1994 5.43926C17.6096 4.73152 17.3147 4.37764 16.9116 4.18882C16.5084 4 16.0478 4 15.1265 4H7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 8V20H3V8.85714" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 20H21V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 7.5V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.00801 12L6.99902 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 20V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 14L17 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  )
}