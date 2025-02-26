// Weight unit conversion utilities

export type WeightUnit = 'gram' | 'tola' | 'ounce'

export interface WeightUnitConfig {
  value: WeightUnit
  label: string
  symbol: string
  conversionFactor: number
}

// Define weight units and their conversion factors (to grams)
export const WEIGHT_UNITS: Record<WeightUnit, WeightUnitConfig> = {
  gram: { 
    value: 'gram', 
    label: 'Grams', 
    symbol: 'g',
    conversionFactor: 1 
  },
  tola: { 
    value: 'tola', 
    label: 'Tola', 
    symbol: 't',
    conversionFactor: 11.664 // 1 tola = 11.664 grams
  },
  ounce: { 
    value: 'ounce', 
    label: 'Ounces', 
    symbol: 'oz',
    conversionFactor: 31.1035 // 1 troy ounce = 31.1035 grams
  }
}

/**
 * Convert a weight from one unit to another
 * @param value The weight value to convert
 * @param fromUnit The unit to convert from
 * @param toUnit The unit to convert to
 * @returns The converted weight value
 */
export const convertWeight = (
  value: number, 
  fromUnit: WeightUnit, 
  toUnit: WeightUnit
): number => {
  if (fromUnit === toUnit) return value
  
  // First convert to grams (our base unit)
  const valueInGrams = value * WEIGHT_UNITS[fromUnit].conversionFactor
  
  // Then convert from grams to target unit
  return valueInGrams / WEIGHT_UNITS[toUnit].conversionFactor
}

/**
 * Convert a weight from a specific unit to grams
 * @param value The weight value to convert
 * @param fromUnit The unit to convert from
 * @returns The weight in grams
 */
export const toGrams = (value: number, fromUnit: WeightUnit): number => {
  return convertWeight(value, fromUnit, 'gram')
}

/**
 * Convert a weight from grams to a specific unit
 * @param valueInGrams The weight value in grams
 * @param toUnit The unit to convert to
 * @returns The converted weight value
 */
export const fromGrams = (valueInGrams: number, toUnit: WeightUnit): number => {
  return convertWeight(valueInGrams, 'gram', toUnit)
}

/**
 * Format a weight value with its unit symbol
 * @param value The weight value
 * @param unit The weight unit
 * @param fractionDigits Number of decimal places to show
 * @returns Formatted weight string with unit symbol
 */
export const formatWeight = (
  value: number, 
  unit: WeightUnit,
  fractionDigits: number = 2
): string => {
  if (value === 0) return `-${WEIGHT_UNITS[unit].symbol}`
  return `${value.toFixed(fractionDigits)}${WEIGHT_UNITS[unit].symbol}`
} 