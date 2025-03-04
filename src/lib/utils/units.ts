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
  // Handle edge cases
  if (value === 0 || isNaN(value)) return 0;
  if (fromUnit === toUnit) return value;

  // First convert to grams (our base unit)
  const valueInGrams = value * WEIGHT_UNITS[fromUnit].conversionFactor;

  // Then convert from grams to target unit
  const result = valueInGrams / WEIGHT_UNITS[toUnit].conversionFactor;

  // Return the result (rounding will be handled by the calling function if needed)
  return result;
}

/**
 * Convert a weight from a specific unit to grams
 * @param value The weight value to convert
 * @param fromUnit The unit to convert from
 * @returns The weight in grams
 */
export const toGrams = (value: number, fromUnit: WeightUnit): number => {
  // Handle edge cases
  if (value === 0 || isNaN(value)) return 0;

  // Convert to grams and round with appropriate precision based on unit
  const result = convertWeight(value, fromUnit, 'gram');

  // Use higher precision for ounces due to their larger conversion factor
  if (fromUnit === 'ounce') {
    return Number(result.toFixed(6));
  } else if (fromUnit === 'tola') {
    return Number(result.toFixed(4));
  } else {
    return Number(result.toFixed(3));
  }
}

/**
 * Convert a weight from grams to a specific unit
 * @param valueInGrams The weight value in grams
 * @param toUnit The unit to convert to
 * @returns The converted weight value
 */
export const fromGrams = (valueInGrams: number, toUnit: WeightUnit): number => {
  // If the value is 0 or not a valid number, return 0
  if (!valueInGrams || isNaN(valueInGrams)) return 0;

  // Convert from grams to the target unit
  const convertedValue = convertWeight(valueInGrams, 'gram', toUnit);

  // Round to appropriate decimal places based on the unit
  if (toUnit === 'ounce') {
    // Ounces need more precision due to the larger conversion factor
    return Number(convertedValue.toFixed(6));
  } else if (toUnit === 'tola') {
    // Tolas need medium precision
    return Number(convertedValue.toFixed(4));
  } else {
    // Grams can use standard precision
    return Number(convertedValue.toFixed(3));
  }
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