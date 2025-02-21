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
  // Safely get prices with fallbacks
  const goldPrice = prices?.gold || 0
  const silverPrice = prices?.silver || 0

  // Safely get values with fallbacks
  const safeValues = {
    gold_regular: values?.gold_regular || 0,
    gold_occasional: values?.gold_occasional || 0,
    gold_investment: values?.gold_investment || 0,
    silver_regular: values?.silver_regular || 0,
    silver_occasional: values?.silver_occasional || 0,
    silver_investment: values?.silver_investment || 0
  }

  // Calculate gold values
  const goldRegular = { 
    weight: safeValues.gold_regular,
    value: safeValues.gold_regular * goldPrice,
    isExempt: true,
    isZakatable: false
  }
  const goldOccasional = {
    weight: safeValues.gold_occasional,
    value: safeValues.gold_occasional * goldPrice,
    isZakatable: hawlMet,
    isExempt: false
  }
  const goldInvestment = {
    weight: safeValues.gold_investment,
    value: safeValues.gold_investment * goldPrice,
    isZakatable: hawlMet,
    isExempt: false
  }

  // Calculate silver values
  const silverRegular = {
    weight: safeValues.silver_regular,
    value: safeValues.silver_regular * silverPrice,
    isExempt: true,
    isZakatable: false
  }
  const silverOccasional = {
    weight: safeValues.silver_occasional,
    value: safeValues.silver_occasional * silverPrice,
    isZakatable: hawlMet,
    isExempt: false
  }
  const silverInvestment = {
    weight: safeValues.silver_investment,
    value: safeValues.silver_investment * silverPrice,
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
    }
  }
} 