import { NISAB } from '@/store/constants'
import { useCurrencyStore } from '@/lib/services/currency'

// Define a simple interface for the currency state we need
interface SimpleCurrencyState {
  selectedCurrency: string;
  nisabType: 'gold' | 'silver';
  silverPrice: Record<string, number>;
  goldPrice: Record<string, number>;
}

/**
 * Calculates if the given value exceeds the nisab threshold
 * based on the current settings
 */
export function isAboveNisab(
  value: number, 
  currencyInfo: SimpleCurrencyState,
  isCrypto = false
): boolean {
  if (!currencyInfo || !value) return false
  
  const { selectedCurrency, nisabType, silverPrice, goldPrice } = currencyInfo
  
  // Get the base nisab value in the user's preferred currency
  const nisabResult = getNisabValue(nisabType, goldPrice, silverPrice, selectedCurrency)
  const nisabInUserCurrency = nisabResult.value
  
  // Special case for crypto with higher threshold
  if (isCrypto && nisabInUserCurrency) {
    // Some scholars argue that cryptocurrency should be calculated with a higher threshold
    // This is a configurable multiplier
    return value >= nisabInUserCurrency
  }
  
  // Standard comparison
  return value >= (nisabInUserCurrency || 0)
}

/**
 * Gets the nisab value in the user's selected currency
 * Returns an object with the value and a flag indicating if it's a direct price or converted
 */
export function getNisabValue(
  nisabType: 'gold' | 'silver', 
  goldPrice: Record<string, number>, 
  silverPrice: Record<string, number>,
  selectedCurrency: string
): { value: number; isDirectPrice: boolean } {
  // Get weight thresholds
  const goldWeightGrams = NISAB.GOLD.GRAMS
  const silverWeightGrams = NISAB.SILVER.GRAMS
  
  // Add detailed logging
  console.log(`Computing nisab value for ${nisabType} in ${selectedCurrency}`, {
    goldPrice,
    silverPrice,
    goldWeightGrams,
    silverWeightGrams
  });
  
  // Get appropriate price based on selected nisab type
  if (nisabType === 'gold') {
    // Check if we have a direct price in the selected currency
    if (goldPrice[selectedCurrency]) {
      const goldPricePerGram = goldPrice[selectedCurrency]
      const nisabValue = goldPricePerGram * goldWeightGrams
      
      console.log(`Using direct gold price in ${selectedCurrency}:`, {
        pricePerGram: goldPricePerGram,
        calculatedNisab: nisabValue
      });
      
      return { 
        value: nisabValue,
        isDirectPrice: true 
      }
    }
    
    // Fallback: Try to convert from USD if available
    if (goldPrice['USD']) {
      // Use currency conversion service
      const currencyStore = useCurrencyStore.getState();
      
      // Check if we have the necessary conversion rates
      if (!currencyStore.rates || Object.keys(currencyStore.rates).length === 0) {
        console.warn(`No currency rates available for converting gold price from USD to ${selectedCurrency}`);
        // Return zero to indicate conversion failure
        return { value: 0, isDirectPrice: false };
      }
      
      // Get the USD price
      const usdPricePerGram = goldPrice['USD'];
      
      // Convert to user's currency
      const convertedPricePerGram = currencyStore.convertAmount(
        usdPricePerGram, 
        'USD', 
        selectedCurrency
      );
      
      const nisabValue = convertedPricePerGram * goldWeightGrams;
      
      console.log(`Converted gold price from USD to ${selectedCurrency}:`, {
        usdPricePerGram,
        convertedPricePerGram,
        calculatedNisab: nisabValue,
        conversionRate: convertedPricePerGram / usdPricePerGram
      });
      
      return { 
        value: nisabValue,
        isDirectPrice: false 
      }
    }
    
    // Last resort fallback
    console.warn(`No gold price available for calculating nisab`);
    return { value: 0, isDirectPrice: false }
  } else {
    // For silver nisab
    // Check if we have a direct price in the selected currency
    if (silverPrice[selectedCurrency]) {
      const silverPricePerGram = silverPrice[selectedCurrency]
      const nisabValue = silverPricePerGram * silverWeightGrams
      
      console.log(`Using direct silver price in ${selectedCurrency}:`, {
        pricePerGram: silverPricePerGram,
        calculatedNisab: nisabValue
      });
      
      return { 
        value: nisabValue,
        isDirectPrice: true 
      }
    }
    
    // Fallback: Try to convert from USD if available
    if (silverPrice['USD']) {
      // Use currency conversion service
      const currencyStore = useCurrencyStore.getState();
      
      // Check if we have the necessary conversion rates
      if (!currencyStore.rates || Object.keys(currencyStore.rates).length === 0) {
        console.warn(`No currency rates available for converting silver price from USD to ${selectedCurrency}`);
        // Return zero to indicate conversion failure
        return { value: 0, isDirectPrice: false };
      }
      
      // Get the USD price
      const usdPricePerGram = silverPrice['USD'];
      
      // Convert to user's currency
      const convertedPricePerGram = currencyStore.convertAmount(
        usdPricePerGram, 
        'USD', 
        selectedCurrency
      );
      
      const nisabValue = convertedPricePerGram * silverWeightGrams;
      
      console.log(`Converted silver price from USD to ${selectedCurrency}:`, {
        usdPricePerGram,
        convertedPricePerGram,
        calculatedNisab: nisabValue,
        conversionRate: convertedPricePerGram / usdPricePerGram
      });
      
      return { 
        value: nisabValue,
        isDirectPrice: false 
      }
    }
    
    // Last resort fallback
    console.warn(`No silver price available for calculating nisab`);
    return { value: 0, isDirectPrice: false }
  }
} 