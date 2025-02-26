import { MetalsValues, MetalPrices } from '../modules/metals.types'

// Helper function to safely reduce numbers
export const safeReduce = (values: number[]): number => {
  return values.reduce((sum: number, value: number) => sum + (value || 0), 0)
}

// Helper to compute metals results
export const computeMetalsResults = (
  values: MetalsValues,
  prices: MetalPrices,
  hawlMet: boolean
) => {
  // Validate and create a defensive copy of the prices to avoid side effects
  const safetyPrices = { ...prices };
  
  // Add debug logging
  console.log('Computing metals results with:', {
    currency: safetyPrices.currency,
    goldPrice: safetyPrices.gold,
    silverPrice: safetyPrices.silver,
    isCache: safetyPrices.isCache,
    timestamp: new Date().toISOString()
  });
  
  // Safety check - ensure prices have a currency
  if (!safetyPrices.currency) {
    console.error('Metal prices missing currency in computation, defaulting to USD');
    safetyPrices.currency = 'USD';
  }

  // Check validity before proceeding
  let priceValid = true;
  
  // Check if this appears to be a currency transition (both prices are 0)
  const isCurrencyTransition = 
    (!Number.isFinite(safetyPrices?.gold) || safetyPrices?.gold <= 0) && 
    (!Number.isFinite(safetyPrices?.silver) || safetyPrices?.silver <= 0);
  
  // If we detect a currency transition, we'll use a more conservative approach
  if (isCurrencyTransition) {
    console.warn(
      'Detected possible currency transition - both gold and silver prices are invalid. ' +
      `Currency=${safetyPrices?.currency}, Timestamp=${new Date().toISOString()}`
    );
    
    // During transitions, use fallback prices but log it as a transition rather than error
    priceValid = false;
    safetyPrices.gold = 65.52; // Default fallback
    safetyPrices.silver = 0.85; // Default fallback
  } else {
    // Validate prices are positive numbers and provide detailed error context
    if (!Number.isFinite(safetyPrices?.gold) || safetyPrices?.gold <= 0) {
      priceValid = false;
      console.error(
        `Invalid gold price: ${safetyPrices?.gold}, using fallback. ` +
        `This might happen during currency transitions or API failures. ` +
        `Context: Currency=${safetyPrices?.currency}, Timestamp=${new Date().toISOString()}, ` +
        `Values present: ${JSON.stringify(values)}`
      );
      safetyPrices.gold = 65.52; // Default fallback
    }
    
    if (!Number.isFinite(safetyPrices?.silver) || safetyPrices?.silver <= 0) {
      priceValid = false;
      console.error(
        `Invalid silver price: ${safetyPrices?.silver}, using fallback. ` +
        `This might happen during currency transitions or API failures. ` +
        `Context: Currency=${safetyPrices?.currency}, Timestamp=${new Date().toISOString()}, ` +
        `Values present: ${JSON.stringify(values)}`
      );
      safetyPrices.silver = 0.85; // Default fallback
    }
  }

  // Log when fallbacks are being used
  if (!priceValid) {
    console.warn(
      `Using fallback prices for metals calculation. ` +
      `Gold: ${safetyPrices.gold}, Silver: ${safetyPrices.silver}, Currency: ${safetyPrices.currency}`
    );
  }

  // Safely get values with fallbacks (all stored in grams)
  const safeValues = {
    gold_regular: values?.gold_regular || 0,
    gold_occasional: values?.gold_occasional || 0,
    gold_investment: values?.gold_investment || 0,
    silver_regular: values?.silver_regular || 0,
    silver_occasional: values?.silver_occasional || 0,
    silver_investment: values?.silver_investment || 0
  }

  // Calculate gold values (working with values in grams)
  const goldRegular = { 
    weight: safeValues.gold_regular,
    value: safeValues.gold_regular * safetyPrices.gold,
    isExempt: true,
    isZakatable: false
  }
  const goldOccasional = {
    weight: safeValues.gold_occasional,
    value: safeValues.gold_occasional * safetyPrices.gold,
    isZakatable: hawlMet,
    isExempt: false
  }
  const goldInvestment = {
    weight: safeValues.gold_investment,
    value: safeValues.gold_investment * safetyPrices.gold,
    isZakatable: hawlMet,
    isExempt: false
  }

  // Calculate silver values (working with values in grams)
  const silverRegular = {
    weight: safeValues.silver_regular,
    value: safeValues.silver_regular * safetyPrices.silver,
    isExempt: true,
    isZakatable: false
  }
  const silverOccasional = {
    weight: safeValues.silver_occasional,
    value: safeValues.silver_occasional * safetyPrices.silver,
    isZakatable: hawlMet,
    isExempt: false
  }
  const silverInvestment = {
    weight: safeValues.silver_investment,
    value: safeValues.silver_investment * safetyPrices.silver,
    isZakatable: hawlMet,
    isExempt: false
  }

  // Calculate totals
  const goldTotal = {
    weight: goldRegular.weight + goldOccasional.weight + goldInvestment.weight,
    value: goldRegular.value + goldOccasional.value + goldInvestment.value
  }

  const silverTotal = {
    weight: silverRegular.weight + silverOccasional.weight + silverInvestment.weight,
    value: silverRegular.value + silverOccasional.value + silverInvestment.value
  }

  // Calculate zakatable amounts (if hawl is met)
  const goldZakatable = {
    weight: hawlMet ? (goldOccasional.weight + goldInvestment.weight) : 0,
    value: hawlMet ? (goldOccasional.value + goldInvestment.value) : 0
  }

  const silverZakatable = {
    weight: hawlMet ? (silverOccasional.weight + silverInvestment.weight) : 0,
    value: hawlMet ? (silverOccasional.value + silverInvestment.value) : 0
  }

  // Calculate final values with safety checks
  const total = goldTotal.value + silverTotal.value
  const zakatable = goldZakatable.value + silverZakatable.value
  const zakatDue = zakatable * 0.025

  return {
    total: Number.isFinite(total) ? total : 0,
    zakatable: Number.isFinite(zakatable) ? zakatable : 0,
    zakatDue: Number.isFinite(zakatDue) ? zakatDue : 0,
    breakdown: {
      gold: {
        regular: goldRegular,
        occasional: goldOccasional,
        investment: goldInvestment,
        total: goldTotal,
        zakatable: goldZakatable
      },
      silver: {
        regular: silverRegular,
        occasional: silverOccasional,
        investment: silverInvestment,
        total: silverTotal,
        zakatable: silverZakatable
      }
    },
    // Add currency to the result to maintain currency context
    currency: safetyPrices.currency,
    // Add validity flag to indicate if actual prices were used
    validPrices: priceValid
  }
}

export function calculateNisabThreshold(
  prices: { gold: number; silver: number },
  metal: 'gold' | 'silver' = 'silver'
): { threshold: number; type: 'gold' | 'silver' } {
  // Create a copy of the prices object to avoid mutating the input
  const safetyPrices = { ...prices };
  
  // More detailed validation and logging
  if (!Number.isFinite(safetyPrices?.gold) || safetyPrices?.gold <= 0) {
    console.error(
      `Invalid gold price: ${safetyPrices?.gold}, using fallback. ` +
      `This might happen during currency transitions or API failures. ` +
      `Context: Current timestamp: ${new Date().toISOString()}`
    );
    safetyPrices.gold = 65.52; // Default fallback
  }
  
  if (!Number.isFinite(safetyPrices?.silver) || safetyPrices?.silver <= 0) {
    console.error(
      `Invalid silver price: ${safetyPrices?.silver}, using fallback. ` +
      `This might happen during currency transitions or API failures. ` +
      `Context: Current timestamp: ${new Date().toISOString()}`
    );
    safetyPrices.silver = 0.72; // Default fallback
  }
  
  // Use the copied and validated prices for calculation
  const goldNisab = safetyPrices.gold * 85;
  const silverNisab = safetyPrices.silver * 595;
  
  // Return the requested threshold type
  return {
    threshold: metal === 'gold' ? goldNisab : silverNisab,
    type: metal,
  };
} 