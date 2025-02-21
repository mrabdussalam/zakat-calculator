import { IconProps } from './types'
import { BaseIcon } from './base-icon'

export function PlusIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 5V19" />
      <path d="M5 12H19" />
    </BaseIcon>
  )
} 