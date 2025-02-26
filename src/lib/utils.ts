import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Add a debounce utility function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export function evaluateExpression(expression: string): number {
  try {
    // Remove all whitespace and validate characters
    const sanitized = expression.replace(/\s/g, '').replace(/[^0-9+\-*/().]/g, '')
    if (!sanitized) return 0
    
    // Evaluate the expression
    const result = Function('"use strict";return (' + sanitized + ')')()
    
    // Check if result is valid
    if (typeof result !== 'number' || !isFinite(result)) return 0
    
    return Math.max(0, result)
  } catch (error) {
    return 0
  }
}

export function formatNumberInput(value: string): string {
  // Remove any existing commas
  const cleanValue = value.replace(/,/g, '')
  
  // If it's a simple decimal number
  if (/^\d*\.?\d*$/.test(cleanValue)) {
    const num = parseFloat(cleanValue)
    if (!isNaN(num)) {
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }
  }
  
  // Return original value if it contains arithmetic operators
  if (/[+\-*/()]/.test(cleanValue)) {
    return cleanValue
  }
  
  return value
} 