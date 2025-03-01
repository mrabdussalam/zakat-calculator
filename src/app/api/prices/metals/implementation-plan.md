# Implementation Plan: Multi-Currency Metal Prices API

This document outlines the plan for modifying the existing metals price API to support direct multi-currency fetching with gold purity levels and additional unit conversions.

## Phase 1: Direct Currency Fetching

### 1. Update API Parameters

Modify the API route to accept and prioritize direct currency fetching:

```typescript
// Current approach
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const currency = (searchParams.get('currency') || 'USD').toUpperCase();
  const refresh = searchParams.get('refresh') === 'true';
  
  // Rest of the implementation...
}
```

### 2. Add Direct Currency Fetching Logic

Add a new function to fetch prices directly in the requested currency:

```typescript
/**
 * Attempts to fetch metal prices directly in the requested currency
 */
async function fetchDirectCurrencyPrices(currency: string): Promise<MetalPrices | null> {
  try {
    console.log(`Attempting to fetch metal prices directly in ${currency}...`);
    
    const response = await fetch(`https://data-asg.goldprice.org/dbXRates/${currency}`, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.warn(`Direct currency fetch failed with status ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.warn('Invalid data structure from direct currency fetch');
      return null;
    }
    
    // Get the item for this currency
    const item = data.items[0];
    const goldPriceOZ = item.xauPrice;
    const silverPriceOZ = item.xagPrice;
    
    // Calculate prices in different units
    const goldPriceG = goldPriceOZ / CONVERSION_RATES.OZ_TO_GRAM;
    const goldPriceKG = goldPriceG * CONVERSION_RATES.GRAM_TO_KG;
    const goldPriceTola = goldPriceG * CONVERSION_RATES.TOLA_TO_GRAM;
    
    // Calculate gold prices for different purities
    const goldPrice24K = goldPriceG; // 24K is the base price
    const goldPrice22K = goldPriceG * PURITY.K22;
    const goldPrice21K = goldPriceG * PURITY.K21;
    const goldPrice18K = goldPriceG * PURITY.K18;
    
    // Calculate silver prices in different units
    const silverPriceG = silverPriceOZ / CONVERSION_RATES.OZ_TO_GRAM;
    const silverPriceKG = silverPriceG * CONVERSION_RATES.GRAM_TO_KG;
    const silverPriceTola = silverPriceG * CONVERSION_RATES.TOLA_TO_GRAM;
    
    return {
      gold: goldPriceG,
      silver: silverPriceG,
      lastUpdated: new Date().toISOString(),
      isCache: false,
      source: 'GoldPrice.org (direct)',
      currency: currency,
      // Add additional data for extended information
      extended: {
        gold: {
          oz: goldPriceOZ,
          kg: goldPriceKG,
          tola: goldPriceTola,
          k24: goldPrice24K,
          k22: goldPrice22K,
          k21: goldPrice21K,
          k18: goldPrice18K
        },
        silver: {
          oz: silverPriceOZ,
          kg: silverPriceKG,
          tola: silverPriceTola
        }
      }
    };
  } catch (error) {
    console.error('Error fetching direct currency prices:', error);
    return null;
  }
}
```

### 3. Modify the Main API Function

Update the main API function to try direct currency fetching first:

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const currency = (searchParams.get('currency') || 'USD').toUpperCase();
  const refresh = searchParams.get('refresh') === 'true';
  
  // Check if we have cached prices for this currency
  if (!refresh && globalMemoryCache[currency] && globalMemoryCache[currency].prices) {
    const cacheEntry = globalMemoryCache[currency];
    const cacheAge = Date.now() - cacheEntry.timestamp;
    
    if (cacheAge < MEMORY_CACHE_DURATION) {
      console.log(`Using memory cache for ${currency} (age: ${cacheAge / 1000}s)`);
      return NextResponse.json(cacheEntry.prices);
    }
  }
  
  // Try direct currency fetching first (for supported currencies)
  if (SUPPORTED_CURRENCIES[currency as SupportedCurrency]) {
    const directPrices = await fetchDirectCurrencyPrices(currency);
    
    if (directPrices) {
      // Update memory cache
      globalMemoryCache[currency] = {
        prices: directPrices,
        timestamp: Date.now()
      };
      
      return NextResponse.json(directPrices);
    }
    
    console.log(`Direct fetch for ${currency} failed, falling back to USD + conversion`);
  }
  
  // Fall back to existing USD + conversion logic
  // ... (existing implementation)
}
```

## Phase 2: Update Response Types

### 1. Define New Types

Add new types to support the extended information:

```typescript
// Add to the existing types
interface ExtendedGoldPrices {
  oz: number;
  kg: number;
  tola: number;
  k24: number;
  k22: number;
  k21: number;
  k18: number;
}

interface ExtendedSilverPrices {
  oz: number;
  kg: number;
  tola: number;
}

interface ExtendedMetalPrices {
  gold: ExtendedGoldPrices;
  silver: ExtendedSilverPrices;
}

// Update the MetalPrices interface
interface MetalPrices {
  gold: number;
  silver: number;
  lastUpdated: string;
  isCache: boolean;
  source: string;
  currency: string;
  exchangeRate?: number;
  goldUSD?: number;
  silverUSD?: number;
  timestamp: string;
  extended?: ExtendedMetalPrices;
}
```

### 2. Add Constants for Conversions

Add constants for unit conversions and purity levels:

```typescript
// Add at the top of the file with other constants
const CONVERSION_RATES = {
  OZ_TO_GRAM: 31.1034768, // Troy ounce to grams
  GRAM_TO_KG: 1000,       // Grams to kilograms
  TOLA_TO_GRAM: 11.66     // Tolas to grams
};

const PURITY = {
  K24: 1.00,   // 100% pure gold
  K22: 0.9167, // 91.67% pure gold
  K21: 0.8750, // 87.5% pure gold
  K18: 0.7500  // 75% pure gold
};
```

## Phase 3: Update Fallback Logic

### 1. Modify the Conversion Logic

Update the existing conversion logic to include extended information:

```typescript
// In the existing conversion logic
const convertedPrices = {
  gold: Number(goldPriceInTargetCurrency.toFixed(2)),
  silver: Number(silverPriceInTargetCurrency.toFixed(2)),
  lastUpdated: usdPrices.lastUpdated,
  isCache: usdPrices.isCache,
  source: usdPrices.source,
  currency: currency,
  exchangeRate: Number(exchangeRate.toFixed(4)),
  goldUSD: Number(usdPrices.gold.toFixed(2)),
  silverUSD: Number(usdPrices.silver.toFixed(2)),
  timestamp: getSafeTimestamp(),
  // Add extended information
  extended: {
    gold: {
      oz: Number((goldPriceInTargetCurrency * CONVERSION_RATES.OZ_TO_GRAM).toFixed(2)),
      kg: Number((goldPriceInTargetCurrency * CONVERSION_RATES.GRAM_TO_KG).toFixed(2)),
      tola: Number((goldPriceInTargetCurrency * CONVERSION_RATES.TOLA_TO_GRAM).toFixed(2)),
      k24: Number(goldPriceInTargetCurrency.toFixed(2)),
      k22: Number((goldPriceInTargetCurrency * PURITY.K22).toFixed(2)),
      k21: Number((goldPriceInTargetCurrency * PURITY.K21).toFixed(2)),
      k18: Number((goldPriceInTargetCurrency * PURITY.K18).toFixed(2))
    },
    silver: {
      oz: Number((silverPriceInTargetCurrency * CONVERSION_RATES.OZ_TO_GRAM).toFixed(2)),
      kg: Number((silverPriceInTargetCurrency * CONVERSION_RATES.GRAM_TO_KG).toFixed(2)),
      tola: Number((silverPriceInTargetCurrency * CONVERSION_RATES.TOLA_TO_GRAM).toFixed(2))
    }
  }
};
```

## Phase 4: Update Cache Handling

### 1. Update Memory Cache Structure

Ensure the memory cache can handle the extended information:

```typescript
// Update the MemoryCacheEntry interface
interface MemoryCacheEntry {
  prices: MetalPrices | null;
  timestamp: number;
}
```

### 2. Update File Cache Handling

If you're using file-based caching, update the cache validation service to handle the extended information.

## Phase 5: Testing and Validation

### 1. Test with All Supported Currencies

Test the API with all supported currencies:
- USD
- GBP
- SAR
- INR
- PKR

### 2. Verify Direct Fetching vs. Conversion

Compare the results of direct fetching versus USD + conversion to ensure accuracy.

### 3. Test Caching Behavior

Verify that caching works correctly for all currencies.

### 4. Test Fallback Behavior

Test the fallback behavior by simulating failures in the direct currency fetching.

## Implementation Timeline

1. **Day 1**: Implement Phase 1 (Direct Currency Fetching)
2. **Day 2**: Implement Phase 2 (Update Response Types)
3. **Day 3**: Implement Phase 3 (Update Fallback Logic)
4. **Day 4**: Implement Phase 4 (Update Cache Handling)
5. **Day 5**: Testing and Validation

## Rollout Strategy

1. Deploy the changes to a staging environment
2. Test thoroughly with the test page
3. Monitor for any issues
4. Deploy to production
5. Monitor API performance and error rates

## Fallback Strategy

If any issues arise with the direct currency fetching, the system will automatically fall back to the existing USD + conversion logic, ensuring continuity of service. 