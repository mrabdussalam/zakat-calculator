import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Nisab is 85 grams of gold (modern standard)
const GOLD_GRAMS_NISAB = 85;
// Nisab is 595 grams of silver (modern standard)
const SILVER_GRAMS_NISAB = 595;

// Add cache mechanism for API requests
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache


interface ResponseData {
  nisabThreshold: number,
  thresholds: {
    gold: number,
    silver: number
  },
  currency: string,
  timestamp: string,
  metadata: NisabMetadata
}

interface Response {
  data: ResponseData;
  timestamp: number;
}
const cachedResponses: Record<string, Response> = {};

// Define fallback values for when metal price API fails
const FALLBACK_GOLD_PRICE = 93.98; // USD per gram
const FALLBACK_SILVER_PRICE = 1.02; // USD per gram

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

// Ensure data directory exists
function ensureDataDirectory() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Created data directory');
    }
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

// Create fallback file if it doesn't exist
function ensureFallbackFile() {
  ensureDataDirectory();
  const fallbackFilePath = path.join(process.cwd(), 'data', 'nisab-fallback.json');
  try {
    if (!fs.existsSync(fallbackFilePath)) {
      const goldNisabThreshold = FALLBACK_GOLD_PRICE * GOLD_GRAMS_NISAB;
      const silverNisabThreshold = FALLBACK_SILVER_PRICE * SILVER_GRAMS_NISAB;
      const nisabThreshold = Math.min(goldNisabThreshold, silverNisabThreshold);
      const usedMetalType = goldNisabThreshold <= silverNisabThreshold ? 'gold' : 'silver';

      const fallbackData = {
        nisabThreshold,
        thresholds: {
          gold: goldNisabThreshold,
          silver: silverNisabThreshold
        },
        currency: 'USD',
        timestamp: new Date().toISOString(),
        metadata: {
          calculatedThresholds: {
            gold: {
              price: FALLBACK_GOLD_PRICE,
              weight: GOLD_GRAMS_NISAB,
              threshold: goldNisabThreshold,
              unit: 'gram'
            },
            silver: {
              price: FALLBACK_SILVER_PRICE,
              weight: SILVER_GRAMS_NISAB,
              threshold: silverNisabThreshold,
              unit: 'gram'
            }
          },
          usedMetalType,
          conversionFailed: false,
          source: 'fallback'
        }
      };

      fs.writeFileSync(fallbackFilePath, JSON.stringify(fallbackData), 'utf8');
      console.log('Created fallback nisab file');
    }
  } catch (error) {
    console.error('Error creating fallback file:', error);
  }
}

// Try to ensure fallback file exists
ensureFallbackFile();

// Function to load fallback nisab data
function loadFallbackNisab() {
  const fallbackFilePath = path.join(process.cwd(), 'data', 'nisab-fallback.json');
  try {
    if (fs.existsSync(fallbackFilePath)) {
      return JSON.parse(fs.readFileSync(fallbackFilePath, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading fallback nisab:', error);
  }

  // If file doesn't exist or error occurs, calculate fallback values
  const goldNisabThreshold = FALLBACK_GOLD_PRICE * GOLD_GRAMS_NISAB;
  const silverNisabThreshold = FALLBACK_SILVER_PRICE * SILVER_GRAMS_NISAB;
  const nisabThreshold = Math.min(goldNisabThreshold, silverNisabThreshold);
  const usedMetalType = goldNisabThreshold <= silverNisabThreshold ? 'gold' : 'silver';

  return {
    nisabThreshold,
    thresholds: {
      gold: goldNisabThreshold,
      silver: silverNisabThreshold
    },
    currency: 'USD',
    timestamp: new Date().toISOString(),
    metadata: {
      calculatedThresholds: {
        gold: {
          price: FALLBACK_GOLD_PRICE,
          weight: GOLD_GRAMS_NISAB,
          threshold: goldNisabThreshold,
          unit: 'gram'
        },
        silver: {
          price: FALLBACK_SILVER_PRICE,
          weight: SILVER_GRAMS_NISAB,
          threshold: silverNisabThreshold,
          unit: 'gram'
        }
      },
      usedMetalType,
      conversionFailed: false,
      source: 'inline-fallback'
    }
  };
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

  // CRITICAL FIX: Add check for refresh parameter
  const shouldRefresh = url.searchParams.get('refresh') === 'true';
  console.log(`Nisab API: Request with currency=${currency}, metal=${metalType}, refresh=${shouldRefresh}`);

  // Check cache first for matching currency (but skip cache if refresh is requested)
  const cacheKey = `${currency}_${metalType}`;
  const now = Date.now();
  if (!shouldRefresh && cachedResponses[cacheKey] && now - cachedResponses[cacheKey].timestamp < CACHE_TTL_MS) {
    console.log(`Nisab API: Serving cached response for ${currency} (Cache age: ${Math.round((now - cachedResponses[cacheKey].timestamp) / 1000)}s)`);
    return Response.json(cachedResponses[cacheKey].data);
  }

  console.log(`Nisab API: Processing request for currency ${currency} using ${metalType} standard`);

  try {
    // Construct the metals API URL based on the request URL
    const requestUrl = new URL(request.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

    // CRITICAL FIX: Pass the refresh parameter to the metals API call
    let metalApiUrl = `${baseUrl}/api/prices/metals?currency=${currency}`;
    if (shouldRefresh) {
      metalApiUrl += '&refresh=true';
      console.log('Nisab API: Forcing refresh of metal prices');
    }

    console.log('Nisab API: Fetching metal prices from:', metalApiUrl);

    let metalsResponse;
    try {
      metalsResponse = await fetch(metalApiUrl, {
        cache: shouldRefresh ? 'no-store' : 'default', // Skip cache if refresh requested
        // Set timeout to prevent hanging
        signal: AbortSignal.timeout(8000)
      });
    } catch (fetchError) {
      console.error(`Nisab API: Fetch error when calling metals API: ${fetchError}`);
      // Use fallback data instead of failing
      const fallbackData = loadFallbackNisab();
      return Response.json({
        ...fallbackData,
        source: 'nisab-api-fetch-fallback',
        errorReason: 'fetch_failed'
      });
    }

    if (!metalsResponse.ok) {
      console.error(`Nisab API: Failed to fetch metal prices - status ${metalsResponse.status}`);
      // Use fallback data instead of failing
      const fallbackData = loadFallbackNisab();
      return Response.json({
        ...fallbackData,
        source: 'nisab-api-status-fallback',
        errorReason: 'status_not_ok'
      });
    }

    let data;
    try {
      data = await metalsResponse.json();
      console.log('Nisab API: Metals API response:', data);
    } catch (jsonError) {
      console.error(`Nisab API: JSON parsing error: ${jsonError}`);
      // Use fallback data instead of failing
      const fallbackData = loadFallbackNisab();
      return Response.json({
        ...fallbackData,
        source: 'nisab-api-json-fallback',
        errorReason: 'json_parse_error'
      });
    }

    // Check if we have valid gold price
    if (typeof data.gold !== 'number' || data.gold <= 0) {
      console.error('Nisab API: Invalid gold price data:', data);
      // Use fallback data instead of failing
      const fallbackData = loadFallbackNisab();
      return Response.json({
        ...fallbackData,
        source: 'nisab-api-invalid-gold-fallback',
        errorReason: 'invalid_gold_price'
      });
    }

    // Check if we have valid silver price
    if (typeof data.silver !== 'number' || data.silver <= 0) {
      console.error('Nisab API: Invalid silver price data:', data);
      // Use fallback data instead of failing
      const fallbackData = loadFallbackNisab();
      return Response.json({
        ...fallbackData,
        source: 'nisab-api-invalid-silver-fallback',
        errorReason: 'invalid_silver_price'
      });
    }

    // Get the actual currency from the response, which might be different from requested if conversion failed
    const actualCurrency = data.currency || 'USD';
    // Check if currency conversion failed
    const conversionFailed = data.conversionFailed || false;

    // Validate metal prices before calculation to prevent caching invalid data
    const goldPrice = data.gold;
    const silverPrice = data.silver;

    // CRITICAL: Validate prices are valid numbers
    if (typeof goldPrice !== 'number' || !isFinite(goldPrice) || goldPrice <= 0) {
      console.error('Invalid gold price received:', goldPrice);
      throw new Error(`Invalid gold price: ${goldPrice}. Cannot cache invalid data.`);
    }

    if (typeof silverPrice !== 'number' || !isFinite(silverPrice) || silverPrice <= 0) {
      console.error('Invalid silver price received:', silverPrice);
      throw new Error(`Invalid silver price: ${silverPrice}. Cannot cache invalid data.`);
    }

    // Calculate both gold and silver nisab thresholds
    const goldNisabThreshold = goldPrice * GOLD_GRAMS_NISAB;
    const silverNisabThreshold = silverPrice * SILVER_GRAMS_NISAB;

    // Validate calculated thresholds
    if (!isFinite(goldNisabThreshold) || !isFinite(silverNisabThreshold)) {
      console.error('Invalid threshold calculated:', { goldNisabThreshold, silverNisabThreshold });
      throw new Error(`Invalid nisab thresholds calculated. Cannot cache invalid data.`);
    }

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
    // Use fallback data instead of failing
    const fallbackData = loadFallbackNisab();
    return Response.json({
      ...fallbackData,
      source: 'nisab-api-error-fallback',
      errorReason: 'general_error'
    });
  }
}
