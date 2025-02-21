import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center transition-colors duration-200 font-medium',
  {
    variants: {
      variant: {
        primary: 'bg-gray-900 text-white hover:bg-gray-800',
        secondary: 'bg-white text-gray-500 hover:bg-gray-50',
        outline: 'border border-gray-200 text-gray-900 hover:bg-gray-50',
        ghost: 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
      },
      size: {
        sm: 'px-2 py-1 text-sm',
        md: 'px-4 py-2',
        lg: 'px-4 py-3',
      },
      fullWidth: {
        true: 'w-full',
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      disabled: false,
    },
  }
);

interface ButtonProps 
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
  icon?: ReactNode;
}

export function Button({
  children,
  variant,
  size,
  fullWidth,
  disabled,
  icon,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, size, fullWidth, disabled, className })}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
} 