import { NextResponse } from 'next/server';

// Troy ounce to grams conversion
const CONVERSION_RATES = {
  TROY_OUNCE_TO_GRAMS: 31.1034768
};

/**
 * Test endpoint to diagnose metal prices API issues
 */
export async function GET() {
  const results = {
    tests: [] as any[],
    summary: {
      successful: 0,
      failed: 0
    }
  };

  // Test Frankfurter API
  try {
    console.log('Testing Frankfurter API...');
    const frankfurterResponse = await fetch('https://api.frankfurter.app/latest?from=XAU&to=USD,XAG', {
      cache: 'no-store'
    });
    
    if (!frankfurterResponse.ok) {
      throw new Error(`Status: ${frankfurterResponse.status}`);
    }

    const frankfurterData = await frankfurterResponse.json();
    console.log('Frankfurter raw data:', JSON.stringify(frankfurterData));
    
    const goldPrice = frankfurterData.rates?.USD / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS;
    const silverPrice = (frankfurterData.rates?.USD / frankfurterData.rates?.XAG) / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS;
    
    results.tests.push({
      name: 'frankfurter',
      success: true,
      goldPrice,
      silverPrice,
      rawData: frankfurterData
    });
    
    results.summary.successful++;
  } catch (error) {
    console.error('Frankfurter API error:', error);
    results.tests.push({
      name: 'frankfurter',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
    
    results.summary.failed++;
  }

  // Test Goldprice API
  try {
    console.log('Testing Goldprice API...');
    const goldpriceResponse = await fetch('https://data-asg.goldprice.org/dbXRates/USD', {
      cache: 'no-store'
    });
    
    if (!goldpriceResponse.ok) {
      throw new Error(`Status: ${goldpriceResponse.status}`);
    }

    const goldpriceData = await goldpriceResponse.json();
    console.log('Goldprice raw data:', JSON.stringify(goldpriceData));
    
    if (!goldpriceData.items || goldpriceData.items.length === 0) {
      throw new Error('Invalid data structure: no items found');
    }

    const goldPrice = goldpriceData.items[0].xauPrice / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS;
    const silverPrice = goldpriceData.items[0].xagPrice / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS;
    
    results.tests.push({
      name: 'goldprice',
      success: true,
      goldPrice,
      silverPrice,
      rawData: goldpriceData
    });
    
    results.summary.successful++;
  } catch (error) {
    console.error('Goldprice API error:', error);
    results.tests.push({
      name: 'goldprice',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
    
    results.summary.failed++;
  }

  // Test Metals API
  try {
    console.log('Testing Metals-api...');
    const metalsResponse = await fetch('https://api.metals.live/v1/spot/gold,silver', {
      cache: 'no-store'
    });
    
    if (!metalsResponse.ok) {
      throw new Error(`Status: ${metalsResponse.status}`);
    }

    const metalsData = await metalsResponse.json();
    console.log('Metals-api raw data:', JSON.stringify(metalsData));
    
    const goldData = metalsData.find((m: any) => m.metal === 'gold');
    const silverData = metalsData.find((m: any) => m.metal === 'silver');
    
    if (!goldData || !silverData) {
      throw new Error('Invalid data structure: gold or silver data not found');
    }

    const goldPrice = goldData.price / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS;
    const silverPrice = silverData.price / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS;
    
    results.tests.push({
      name: 'metals-api',
      success: true,
      goldPrice,
      silverPrice,
      rawData: metalsData
    });
    
    results.summary.successful++;
  } catch (error) {
    console.error('Metals-api error:', error);
    results.tests.push({
      name: 'metals-api',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
    
    results.summary.failed++;
  }

  return NextResponse.json(results);
} 