import { IconProps } from './types'
import { BaseIcon } from './base-icon'

export function InfoIcon({ size = 20, ...props }: IconProps) {
  return (
    <BaseIcon size={size} {...props}>
      <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" />
      <path d="M12.2422 17V12C12.2422 11.5286 12.2422 11.2929 12.0957 11.1464C11.9493 11 11.7136 11 11.2422 11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.992 8H12.001" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  )
}