import { IconProps } from "@/types/icon"

export function RetirementIcon({ size = 24, className }: IconProps) {
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
    >
      <path d="M11 8V14M15 8V14" />
      <path d="M7 14L18 14" />
      <path d="M16 14L18 20" />
      <path d="M4 2L8 14L6 20" />
      <path d="M6 8H16.5C17.3284 8 18 8.67157 18 9.5" />
      <path d="M4 18C5.72574 20.412 8.66464 22 12 22C15.3354 22 18.2743 20.412 20 18" />
    </svg>
  )
}