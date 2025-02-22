import { IconProps } from './types'
import { BaseIcon } from './base-icon'

export function RealEstateIcon(props: IconProps) {
  return (
    <BaseIcon viewBox="0 0 24 24" width="20" height="20" fill="none" {...props}>
      <path opacity="0.4" d="M4 5V19H10V13.5372C10 11.5836 14 11.3938 14 13.5372V19H20V5L12 2L4 5Z" fill="currentColor" />
      <path d="M4 5V19H20V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 19L14 13.5372C14 11.3938 10 11.5836 10 13.5372L10 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 22L10 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 5L10.7351 2.26014C11.9889 1.91329 12.0111 1.91329 13.2649 2.26014L21 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.0119 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  )
}