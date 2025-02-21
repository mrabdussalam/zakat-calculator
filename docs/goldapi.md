const CONVERSION_RATES = {
  TROY_OUNCE_TO_GRAMS: 31.1034768 // 1 troy ounce = 31.1034768 grams
};

const fetchMetalPrices = async () => {
  const sources = [
    {
      name: 'frankfurter',
      url: 'https://api.frankfurter.app/latest?from=XAU&to=USD,XAG',
      parser: (data) => ({
        gold: data.rates.USD / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS,
        silver: (data.rates.USD / data.rates.XAG) / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS
      })
    },
    {
      name: 'goldprice',
      url: 'https://data-asg.goldprice.org/dbXRates/USD',
      parser: (data) => ({
        gold: data.items[0].xauPrice / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS,
        silver: data.items[0].xagPrice / CONVERSION_RATES.TROY_OUNCE_TO_GRAMS
      })
    }
  ];

  for (const source of sources) {
    try {
      const response = await fetch(source.url);
      if (!response.ok) continue;
      
      const data = await response.json();
      return {
        ...source.parser(data),
        source: source.name,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.warn(`Failed to fetch from ${source.name}:`, error);
      continue;
    }
  }

  // Fallback to default values if all APIs fail
  return {
    gold: 65.52, // Default price per gram in USD
    silver: 0.85,
    source: 'fallback',
    timestamp: new Date().toISOString()
  };
};

// Usage with caching
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
let priceCache = null;
let lastFetchTime = null;

const getMetalPrices = async () => {
  const now = Date.now();
  
  if (priceCache && lastFetchTime && (now - lastFetchTime < CACHE_DURATION)) {
    return priceCache;
  }

  const prices = await fetchMetalPrices();
  priceCache = prices;
  lastFetchTime = now;
  
  return prices;
};