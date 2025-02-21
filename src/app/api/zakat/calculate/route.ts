import { NextResponse } from 'next/server'

const NISAB = {
  GOLD: 85,    // grams
  SILVER: 595  // grams
}

interface AssetValues {
  // Precious Metals
  gold_regular?: number
  gold_occasional?: number
  gold_investment?: number
  silver_regular?: number
  silver_occasional?: number
  silver_investment?: number
  
  // Cash & Bank
  cash_on_hand?: number
  checking_account?: number
  savings_account?: number
  digital_wallets?: number
  foreign_currency?: number
}

interface MetalPrices {
  gold: number
  silver: number
}

interface ZakatCalculation {
  totalAssets: number
  zakatableAmount: number
  zakatDue: number
  isEligible: boolean
  breakdown: {
    preciousMetals: {
      total: number
      zakatable: number
      meetsNisab: boolean
    }
    cashAndBank: {
      total: number
      zakatable: number
    }
  }
}

export async function POST(req: Request) {
  try {
    const { values, metalPrices, hawlMet } = await req.json()
    
    // Calculate precious metals totals
    const preciousMetals = calculatePreciousMetals(values, metalPrices)
    
    // Calculate cash totals
    const cashAndBank = calculateCashAndBank(values)
    
    // Calculate total zakatable amount
    const zakatableAmount = preciousMetals.zakatable + cashAndBank.zakatable
    
    // Calculate total assets
    const totalAssets = preciousMetals.total + cashAndBank.total
    
    // Check eligibility - Cash is eligible if it meets Nisab
    const cashMeetsNisab = cashAndBank.total >= (metalPrices.gold * NISAB.GOLD)
    const isEligible = hawlMet && (
      preciousMetals.meetsNisab || // Precious metals meet Nisab
      cashMeetsNisab // Cash meets Nisab
    )
    
    // If cash meets Nisab, it's all zakatable
    const finalZakatableAmount = isEligible ? (
      preciousMetals.zakatable + (cashMeetsNisab ? cashAndBank.total : 0)
    ) : 0
    
    // Calculate Zakat due
    const zakatDue = isEligible ? finalZakatableAmount * 0.025 : 0
    
    const result: ZakatCalculation = {
      totalAssets,
      zakatableAmount: finalZakatableAmount,
      zakatDue,
      isEligible,
      breakdown: {
        preciousMetals,
        cashAndBank: {
          ...cashAndBank,
          zakatable: cashMeetsNisab ? cashAndBank.total : 0
        }
      }
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error calculating Zakat:', error)
    return NextResponse.json(
      { error: 'Failed to calculate Zakat' },
      { status: 500 }
    )
  }
}

function calculatePreciousMetals(values: AssetValues, prices: MetalPrices) {
  // Calculate gold totals
  const goldRegular = (values.gold_regular || 0) * prices.gold
  const goldOccasional = (values.gold_occasional || 0) * prices.gold
  const goldInvestment = (values.gold_investment || 0) * prices.gold
  
  // Calculate silver totals
  const silverRegular = (values.silver_regular || 0) * prices.silver
  const silverOccasional = (values.silver_occasional || 0) * prices.silver
  const silverInvestment = (values.silver_investment || 0) * prices.silver
  
  // Calculate zakatable amounts
  const zakatableGold = goldOccasional + goldInvestment
  const zakatableSilver = silverOccasional + silverInvestment
  
  // Check if meets Nisab
  const goldGrams = (values.gold_occasional || 0) + (values.gold_investment || 0)
  const silverGrams = (values.silver_occasional || 0) + (values.silver_investment || 0)
  const meetsNisab = goldGrams >= NISAB.GOLD || silverGrams >= NISAB.SILVER
  
  return {
    total: goldRegular + goldOccasional + goldInvestment + silverRegular + silverOccasional + silverInvestment,
    zakatable: zakatableGold + zakatableSilver,
    meetsNisab
  }
}

function calculateCashAndBank(values: AssetValues) {
  const total = (values.cash_on_hand || 0) +
    (values.checking_account || 0) +
    (values.savings_account || 0) +
    (values.digital_wallets || 0) +
    (values.foreign_currency || 0)
  
  return {
    total,
    zakatable: total  // Cash is always potentially zakatable, subject to Nisab check
  }
} 