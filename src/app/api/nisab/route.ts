import { NextResponse } from 'next/server'

// Nisab is 85 grams of gold (modern standard)
const GOLD_GRAMS_NISAB = 85;
// Nisab is 595 grams of silver (modern standard)
const SILVER_GRAMS_NISAB = 595;

// Add cache mechanism for API requests
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache
let cachedResponses: Record<string, {data: any, timestamp: number}> = {};

// Define interface for metadata object
interface NisabMetadata {
  calculatedThresholds: {
    gold: {
      price: number;
      weight: number;
      threshold: number;
      unit: string;
    };
    silver: {
      price: number;
      weight: number;
      threshold: number;
      unit: string;
    };
  };
  usedMetalType: string;
  conversionFailed: boolean;
  requestedCurrency?: string;
  message?: string;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const currency = url.searchParams.get('currency') || 'USD';
  // Default to gold if not specified
  // Note: We'll actually calculate both and return the lower one,
  // but we keep this parameter for backward compatibility
  const metalType = url.searchParams.get('metal')?.toLowerCase() || 'gold';
  
  // Validate metal type parameter
  if (metalType !== 'gold' && metalType !== 'silver') {
    return Response.json({ 
      error: 'Invalid metal type. Must be "gold" or "silver".'
    }, { status: 400 });
  }
  
  // Check cache first for matching currency
  const cacheKey = `${currency}_${metalType}`;
  const now = Date.now();
  if (cachedResponses[cacheKey] && now - cachedResponses[cacheKey].timestamp < CACHE_TTL_MS) {
    console.log(`Nisab API: Serving cached response for ${currency} (Cache age: ${Math.round((now - cachedResponses[cacheKey].timestamp)/1000)}s)`);
    return Response.json(cachedResponses[cacheKey].data);
  }
  
  console.log(`Nisab API: Processing request for currency ${currency} using ${metalType} standard`);
  
  try {
    // Construct the metals API URL based on the request URL
    const requestUrl = new URL(request.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    const metalApiUrl = `${baseUrl}/api/prices/metals?currency=${currency}`;
    
    console.log('Nisab API: Fetching metal prices from:', metalApiUrl);
    
    const metalsResponse = await fetch(metalApiUrl);
    
    if (!metalsResponse.ok) {
      console.error(`Nisab API: Failed to fetch metal prices - status ${metalsResponse.status}`);
      return Response.json({ error: 'Failed to fetch metal prices' }, { status: 500 });
    }
    
    const data = await metalsResponse.json();
    console.log('Nisab API: Metals API response:', data);
    
    // Check if we have valid gold price
    if (typeof data.gold !== 'number' || data.gold <= 0) {
      console.error('Nisab API: Invalid gold price data:', data);
      return Response.json({ 
        error: 'Invalid or missing gold price data',
        receivedData: data
      }, { status: 500 });
    }
    
    // Check if we have valid silver price
    if (typeof data.silver !== 'number' || data.silver <= 0) {
      console.error('Nisab API: Invalid silver price data:', data);
      return Response.json({ 
        error: 'Invalid or missing silver price data',
        receivedData: data
      }, { status: 500 });
    }
    
    // Get the actual currency from the response, which might be different from requested if conversion failed
    const actualCurrency = data.currency || 'USD';
    // Check if currency conversion failed
    const conversionFailed = data.conversionFailed || false;
    
    // Calculate both gold and silver nisab thresholds
    const goldPrice = data.gold;
    const silverPrice = data.silver;
    
    const goldNisabThreshold = goldPrice * GOLD_GRAMS_NISAB;
    const silverNisabThreshold = silverPrice * SILVER_GRAMS_NISAB;
    
    console.log(`Nisab API: Calculated gold-based threshold: ${goldNisabThreshold} ${actualCurrency}`);
    console.log(`Nisab API: Calculated silver-based threshold: ${silverNisabThreshold} ${actualCurrency}`);
    
    // According to Islamic guidance, we use the lower of the two thresholds
    const nisabThreshold = Math.min(goldNisabThreshold, silverNisabThreshold);
    
    // Determine which metal is being used for the nisab
    const usedMetalType = goldNisabThreshold <= silverNisabThreshold ? 'gold' : 'silver';
    
    console.log(`Nisab API: Using ${usedMetalType} for nisab threshold (${nisabThreshold} ${actualCurrency})`);
    console.log(`Nisab API: Gold price: ${goldPrice} ${actualCurrency}/g, Silver price: ${silverPrice} ${actualCurrency}/g`);
    
    // Define extended metadata
    const metadata: NisabMetadata = {
      calculatedThresholds: {
        gold: {
          price: goldPrice,
          weight: GOLD_GRAMS_NISAB,
          threshold: goldNisabThreshold,
          unit: 'gram'
        },
        silver: {
          price: silverPrice,
          weight: SILVER_GRAMS_NISAB,
          threshold: silverNisabThreshold,
          unit: 'gram'
        }
      },
      usedMetalType,
      conversionFailed: conversionFailed || false
    };
    
    // Add conversion status information if applicable
    if (conversionFailed) {
      metadata.requestedCurrency = currency;
      metadata.message = `Unable to convert to ${currency}. Values shown in ${actualCurrency}.`;
    }
    
    const responseData = {
      nisabThreshold,
      thresholds: {
        gold: goldNisabThreshold,
        silver: silverNisabThreshold
      },
      currency: actualCurrency,
      timestamp: new Date().toISOString(),
      metadata
    };
    
    // Cache the response
    cachedResponses[cacheKey] = {
      data: responseData,
      timestamp: now
    };
    
    // Clean up old cache entries
    const cacheKeys = Object.keys(cachedResponses);
    if (cacheKeys.length > 20) { // Limit cache to 20 entries
      const oldestKey = cacheKeys.reduce((oldest, key) => {
        return cachedResponses[key].timestamp < cachedResponses[oldest].timestamp ? key : oldest;
      }, cacheKeys[0]);
      delete cachedResponses[oldestKey];
    }
    
    console.log('Nisab API: Returning response:', responseData);
    
    return Response.json(responseData);
    
  } catch (error) {
    console.error('Nisab API: Error calculating nisab:', error);
    return Response.json({ error: 'Failed to calculate nisab value' }, { status: 500 });
  }
} 