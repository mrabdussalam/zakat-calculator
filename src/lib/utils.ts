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
  // Handle null/undefined values
  if (amount === undefined || amount === null) return '';
  
  // Ensure we have a valid number
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    console.warn('Invalid number passed to formatCurrency:', amount);
    amount = 0;
  }
  
  // Format with toFixed for simple fallback
  const formattedValue = amount.toFixed(2);
  
  // Safe formatted output using multiple fallback strategies
  try {
    // First try: The simplest approach - no locale, just currency
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.warn('Primary currency formatting failed:', error);
    
    // Fallback 1: Try with USD as a very safe default
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (e) {
      console.warn('Secondary currency formatting failed:', e);
      
      // Final fallback: Basic string concatenation
      return `${currency} ${formattedValue}`;
    }
  }
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