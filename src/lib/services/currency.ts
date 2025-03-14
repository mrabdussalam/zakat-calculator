import { create } from 'zustand'

interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyState {
  rates: ExchangeRates;
  baseCurrency: string;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
  fetchRates: (base?: string) => Promise<void>;
  convertAmount: (amount: number, from: string, to: string) => number;
  forceRefreshRates: (base?: string) => Promise<boolean>;
}

// Primary and fallback URLs as specified in the documentation
const JSDELIVR_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1'
const FALLBACK_URL = 'https://latest.currency-api.pages.dev/v1'

// Add currency names mapping
export const CURRENCY_NAMES: { [key: string]: string } = {
  // Major Global Currencies
  usd: "United States Dollar",
  eur: "Euro",
  gbp: "British Pound Sterling",
  jpy: "Japanese Yen",
  chf: "Swiss Franc",
  aud: "Australian Dollar",
  cad: "Canadian Dollar",
  nzd: "New Zealand Dollar",

  // Middle Eastern & Islamic Countries
  aed: "UAE Dirham",
  sar: "Saudi Riyal",
  kwd: "Kuwaiti Dinar",
  bhd: "Bahraini Dinar",
  omr: "Omani Rial",
  qar: "Qatari Riyal",
  jod: "Jordanian Dinar",
  egp: "Egyptian Pound",
  lyd: "Libyan Dinar",
  dzd: "Algerian Dinar",
  mad: "Moroccan Dirham",
  tnd: "Tunisian Dinar",
  iqd: "Iraqi Dinar",
  syp: "Syrian Pound",
  yer: "Yemeni Rial",
  bnd: "Brunei Dollar",
  myr: "Malaysian Ringgit",
  idr: "Indonesian Rupiah",
  pkr: "Pakistani Rupee",
  bdt: "Bangladeshi Taka",
  mvr: "Maldivian Rufiyaa",
  lbp: "Lebanese Pound",

  // Asian Currencies
  cny: "Chinese Yuan",
  hkd: "Hong Kong Dollar",
  twd: "Taiwan Dollar",
  sgd: "Singapore Dollar",
  krw: "South Korean Won",
  inr: "Indian Rupee",
  thb: "Thai Baht",
  php: "Philippine Peso",
  vnd: "Vietnamese Dong",
  mmk: "Myanmar Kyat",
  lkr: "Sri Lankan Rupee",
  npr: "Nepalese Rupee",

  // European Currencies
  sek: "Swedish Krona",
  nok: "Norwegian Krone",
  dkk: "Danish Krone",
  pln: "Polish Złoty",
  czk: "Czech Koruna",
  huf: "Hungarian Forint",
  ron: "Romanian Leu",
  bgn: "Bulgarian Lev",
  hrk: "Croatian Kuna",
  rsd: "Serbian Dinar",
  isk: "Icelandic Króna",

  // American Currencies
  mxn: "Mexican Peso",
  brl: "Brazilian Real",
  ars: "Argentine Peso",
  clp: "Chilean Peso",
  cop: "Colombian Peso",
  pen: "Peruvian Sol",
  uyu: "Uruguayan Peso",

  // African Currencies
  zar: "South African Rand",
  ngn: "Nigerian Naira",
  ghs: "Ghanaian Cedi",
  kes: "Kenyan Shilling",
  ugx: "Ugandan Shilling",
  tzs: "Tanzanian Shilling",
  mur: "Mauritian Rupee",

  // Other Major Currencies
  rub: "Russian Ruble",
  try: "Turkish Lira",
  ils: "Israeli Shekel",
  afn: "Afghan Afghani",
  azn: "Azerbaijani Manat",
  kzt: "Kazakhstani Tenge",
  uzs: "Uzbekistani Som"
}

// Add circuit breaker configuration
const CIRCUIT_BREAKER = {
  failureThreshold: 3,
  resetTimeout: 60000, // 1 minute
  lastFailure: 0,
  failureCount: 0,
  isOpen: false
};

// Add multiple API sources for redundancy
const API_SOURCES = [
  JSDELIVR_URL,
  FALLBACK_URL,
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1', // Alternative CDN
  'https://api.exchangerate.host/latest' // Additional source with different format
];

// Add a cache with TTL
const EXCHANGE_RATE_CACHE = {
  data: {} as Record<string, { rates: ExchangeRates, timestamp: number }>,
  ttl: 3600000, // 1 hour cache TTL
  set(baseCurrency: string, rates: ExchangeRates) {
    this.data[baseCurrency.toLowerCase()] = {
      rates,
      timestamp: Date.now()
    };
  },
  get(baseCurrency: string): ExchangeRates | null {
    const entry = this.data[baseCurrency.toLowerCase()];
    if (!entry) return null;

    // Check if cache is still valid
    if (Date.now() - entry.timestamp > this.ttl) {
      delete this.data[baseCurrency.toLowerCase()];
      return null;
    }

    return entry.rates;
  },
  isValid(baseCurrency: string): boolean {
    const entry = this.data[baseCurrency.toLowerCase()];
    if (!entry) return false;
    return Date.now() - entry.timestamp <= this.ttl;
  },
  delete(baseCurrency: string) {
    delete this.data[baseCurrency.toLowerCase()];
  }
};

// Cache for Frankfurter API rates
const frankfurterRateCache = new Map<string, { rate: number; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Function to fetch rates from Frankfurter API and cache them
// This should be called proactively, not during conversion
function fetchAndCacheRate(from: string, to: string): Promise<number | null> {
  console.log(`Fetching exchange rate from ${from} to ${to}`);

  // Normalize currency codes
  const fromUpper = from.toUpperCase();
  const toUpper = to.toUpperCase();

  // Try using our server-side proxy first
  const proxyUrl = `/api/proxy/currency?base=${fromUpper}&symbols=${toUpper}`;
  console.log(`Making proxy request to: ${proxyUrl}`);

  return fetch(proxyUrl)
    .then(response => {
      if (!response.ok) {
        console.warn(`Proxy API failed with status ${response.status}, trying direct APIs...`);

        // Try Frankfurter API directly as fallback
        console.log('Trying direct Frankfurter API call...');
        const frankfurterUrl = `https://api.frankfurter.dev/v1/latest?base=${fromUpper}&symbols=${toUpper}`;

        return fetch(frankfurterUrl, {
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        })
          .then(frankfurterResponse => {
            if (!frankfurterResponse.ok) {
              console.warn(`Frankfurter API failed with status ${frankfurterResponse.status}, trying alternative API...`);

              // Try Open Exchange Rates API
              console.log('Trying Open Exchange Rates API...');
              const openExchangeUrl = `https://open.er-api.com/v6/latest/${fromUpper}`;

              return fetch(openExchangeUrl, {
                mode: 'cors',
                headers: {
                  'Accept': 'application/json'
                }
              })
                .then(openExchangeResponse => {
                  if (!openExchangeResponse.ok) {
                    console.warn(`Open Exchange Rates API failed with status ${openExchangeResponse.status}, trying final alternative...`);

                    // Try ExchangeRate.host API as last resort
                    console.log('Trying ExchangeRate.host API...');
                    const exchangeRateHostUrl = `https://api.exchangerate.host/latest?base=${fromUpper}&symbols=${toUpper}`;

                    return fetch(exchangeRateHostUrl, {
                      mode: 'cors',
                      headers: {
                        'Accept': 'application/json'
                      }
                    })
                      .then(exchangeRateHostResponse => {
                        if (!exchangeRateHostResponse.ok) {
                          console.error(`All APIs failed. Using fallback rates.`);
                          return null;
                        }
                        return exchangeRateHostResponse.json();
                      })
                      .then(data => {
                        if (!data || !data.rates || !data.rates[toUpper]) {
                          console.error(`ExchangeRate.host API response missing rate for ${toUpper}`);
                          return null;
                        }

                        const rate = data.rates[toUpper];
                        cacheRate(fromUpper, toUpper, rate);
                        return rate;
                      });
                  }

                  return openExchangeResponse.json()
                    .then(data => {
                      if (!data || !data.rates || !data.rates[toUpper]) {
                        console.error(`Open Exchange Rates API response missing rate for ${toUpper}`);
                        return null;
                      }

                      const rate = data.rates[toUpper];
                      cacheRate(fromUpper, toUpper, rate);
                      return rate;
                    });
                });
            }

            return frankfurterResponse.json()
              .then(data => {
                if (!data || !data.rates || !data.rates[toUpper]) {
                  console.error(`Frankfurter API response missing rate for ${toUpper}`);
                  return null;
                }

                const rate = data.rates[toUpper];
                cacheRate(fromUpper, toUpper, rate);
                return rate;
              });
          });
      }

      return response.json();
    })
    .then(data => {
      if (!data) return null;

      if (data.rates && data.rates[toUpper]) {
        const rate = data.rates[toUpper];
        cacheRate(fromUpper, toUpper, rate);
        return rate;
      }

      console.error(`Response missing rate for ${toUpper}:`, data);
      return null;
    })
    .catch(error => {
      console.error(`Error fetching exchange rate for ${fromUpper} to ${toUpper}:`, error);
      return null;
    });
}

// Helper function to cache a rate and its inverse
function cacheRate(from: string, to: string, rate: number) {
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  // Cache the direct rate
  const cacheKey = `${fromLower}-${toLower}`;
  frankfurterRateCache.set(cacheKey, {
    rate,
    timestamp: Date.now()
  });

  // Also cache the inverse rate
  const inverseRate = 1 / rate;
  const inverseCacheKey = `${toLower}-${fromLower}`;
  frankfurterRateCache.set(inverseCacheKey, {
    rate: inverseRate,
    timestamp: Date.now()
  });

  console.log(`Cached rate for ${from} to ${to}: ${rate}`);
}

// Get a cached rate if available and valid
function getCachedRate(from: string, to: string): number | null {
  const cacheKey = `${from.toLowerCase()}-${to.toLowerCase()}`;
  const cached = frankfurterRateCache.get(cacheKey);

  if (!cached) return null;

  // Check if cache is still valid
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    // Cache expired, fetch new rate in background
    fetchAndCacheRate(from, to).catch(() => { });
    return null;
  }

  return cached.rate;
}

// Enhanced fallback conversion with more accurate rates
function getFallbackConversion(amount: number, from: string, to: string): number {
  // Normalize currency codes
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  // First try to use cached Frankfurter rates
  const cachedRate = getCachedRate(fromLower, toLower);
  if (cachedRate !== null) {
    console.log(`Using cached Frankfurter rate for ${fromLower} to ${toLower}: ${cachedRate}`);
    return amount * cachedRate;
  }

  // If no cached rate, try inverse cached rate
  const inverseCachedRate = getCachedRate(toLower, fromLower);
  if (inverseCachedRate !== null) {
    console.log(`Using inverse cached Frankfurter rate for ${fromLower} to ${toLower}: ${1 / inverseCachedRate}`);
    return amount / inverseCachedRate;
  }

  // Fetch new rate in background for next time
  fetchAndCacheRate(fromLower, toLower).catch(() => { });

  // Fall back to static rates
  const rates: Record<string, number> = {
    'usd': 1,
    'eur': 0.92,
    'gbp': 0.78,
    'jpy': 150.5,
    'cad': 1.35,
    'aud': 1.52,
    'inr': 83.15,
    'pkr': 278.5,
    'aed': 3.67,
    'sar': 3.75,
    'myr': 4.65,
    'sgd': 1.35,
    'bdt': 110.5,
    'egp': 30.9,
    'idr': 15600,
    'kwd': 0.31,
    'ngn': 1550,
    'qar': 3.64,
    'zar': 18.5
  };

  console.log(`Static fallback conversion attempt: ${amount} ${fromLower} → ${toLower}`);

  // If both currencies are in our rates list, we can do a conversion
  if (rates[fromLower] && rates[toLower]) {
    // Convert to USD first, then to target currency
    const amountInUSD = amount / rates[fromLower];
    const result = amountInUSD * rates[toLower];

    console.warn(`Using static fallback conversion: ${amount} ${from} → ${result.toFixed(2)} ${to} (via USD)`);
    return result;
  }

  // If we can't convert, try to use the inverse rate if available
  if (rates[toLower] && fromLower === 'usd') {
    const result = amount * rates[toLower];
    console.warn(`Using direct USD static conversion: ${amount} USD → ${result.toFixed(2)} ${to}`);
    return result;
  }

  if (rates[fromLower] && toLower === 'usd') {
    const result = amount / rates[fromLower];
    console.warn(`Using inverse static conversion to USD: ${amount} ${from} → ${result.toFixed(2)} USD`);
    return result;
  }

  // Last resort: return the original amount
  console.warn(`Cannot convert ${from} to ${to} using any fallback method. Returning original amount.`);
  return amount;
}

// Enhanced validation function
function validateRates(rates: Record<string, number>, baseCurrency: string): Record<string, number> {
  const validatedRates: Record<string, number> = {};
  let validCount = 0;
  let invalidCount = 0;

  // Define expected ranges for common currencies relative to USD
  const expectedRangesUSD: Record<string, [number, number]> = {
    'eur': [0.8, 1.0],
    'gbp': [0.7, 0.9],
    'jpy': [100, 160],
    'inr': [70, 90],
    'pkr': [250, 300],
    'aed': [3.5, 3.8],
    'sar': [3.6, 3.9]
  };

  // Convert expected ranges to the base currency if not USD
  const expectedRanges: Record<string, [number, number]> = {};
  if (baseCurrency.toLowerCase() !== 'usd') {
    // We'll populate this later when we have the USD rate
  }

  // First pass: check if we have a USD rate if base is not USD
  const usdRate = baseCurrency.toLowerCase() !== 'usd' ? rates['usd'] : 1;

  // If we have a USD rate and base is not USD, convert expected ranges
  if (usdRate && baseCurrency.toLowerCase() !== 'usd') {
    Object.entries(expectedRangesUSD).forEach(([currency, [min, max]]) => {
      expectedRanges[currency] = [min / usdRate, max / usdRate];
    });
  }

  // Second pass: validate each rate
  Object.entries(rates).forEach(([currency, rate]) => {
    // Basic validation
    if (typeof rate !== 'number' || !isFinite(rate) || rate <= 0) {
      console.warn(`Invalid rate for ${currency}: ${rate}`);
      invalidCount++;
      return;
    }

    // Range validation if we have expected ranges
    if (expectedRanges[currency]) {
      const [min, max] = expectedRanges[currency];
      if (rate < min * 0.5 || rate > max * 1.5) {
        console.warn(`Rate for ${currency} outside expected range: ${rate} (expected ${min}-${max})`);
        invalidCount++;
        return;
      }
    }

    validatedRates[currency] = rate;
    validCount++;
  });

  console.log(`Rate validation: ${validCount} valid, ${invalidCount} invalid`);
  return validatedRates;
}

// Enhanced fetchRates function with circuit breaker pattern
export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  rates: {},
  baseCurrency: 'USD',
  lastUpdated: null,
  isLoading: false,
  error: null,

  fetchRates: async (base = 'USD') => {
    const state = get();

    // Don't fetch if already loading
    if (state.isLoading) {
      console.log('Already fetching rates, skipping duplicate request');
      return;
    }

    // Set loading state
    set({ isLoading: true, error: null });

    try {
      // Normalize base currency
      const baseCurrency = base.toUpperCase();
      console.log(`Fetching exchange rates with base currency: ${baseCurrency}`);

      // Try to use a server-side proxy to avoid CORS issues
      // This will make the request from the server side which should avoid CORS problems
      const proxyUrl = `/api/proxy/currency?base=${baseCurrency}`;
      console.log(`Making proxy request to: ${proxyUrl}`);

      try {
        const response = await fetch(proxyUrl);

        if (response.ok) {
          const data = await response.json();

          if (data && data.rates && Object.keys(data.rates).length > 0) {
            // Process the data
            const normalizedRates: Record<string, number> = {};
            normalizedRates[baseCurrency.toLowerCase()] = 1;

            Object.entries(data.rates).forEach(([currency, rate]) => {
              normalizedRates[currency.toLowerCase()] = rate as number;

              // Also populate our cache with these rates
              const cacheKey = `${baseCurrency.toLowerCase()}-${currency.toLowerCase()}`;
              frankfurterRateCache.set(cacheKey, {
                rate: rate as number,
                timestamp: Date.now()
              });

              // Also cache the inverse rate
              const inverseCacheKey = `${currency.toLowerCase()}-${baseCurrency.toLowerCase()}`;
              frankfurterRateCache.set(inverseCacheKey, {
                rate: 1 / (rate as number),
                timestamp: Date.now()
              });
            });

            // Validate the rates
            const validatedRates = validateRates(normalizedRates, baseCurrency.toLowerCase());

            // Update state with new rates
            set({
              rates: validatedRates,
              baseCurrency: baseCurrency.toLowerCase(),
              lastUpdated: new Date(),
              isLoading: false,
              error: null
            });

            console.log(`Successfully fetched ${Object.keys(validatedRates).length} exchange rates with base ${baseCurrency}`);
            return;
          }
        }

        console.warn(`Proxy request failed or returned invalid data: ${response.status}`);
        // Continue to direct API calls if proxy fails
      } catch (proxyError) {
        console.warn('Error using proxy endpoint:', proxyError);
        // Continue to direct API calls if proxy fails
      }

      // Try direct API calls as fallback
      // First try Frankfurter API
      console.log('Trying direct Frankfurter API call...');
      const frankfurterUrl = `https://api.frankfurter.dev/v1/latest?base=${baseCurrency}`;

      try {
        const response = await fetch(frankfurterUrl, {
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();

          if (data && data.rates && Object.keys(data.rates).length > 0) {
            // Process the data
            const normalizedRates: Record<string, number> = {};
            normalizedRates[baseCurrency.toLowerCase()] = 1;

            Object.entries(data.rates).forEach(([currency, rate]) => {
              normalizedRates[currency.toLowerCase()] = rate as number;

              // Also populate our cache with these rates
              const cacheKey = `${baseCurrency.toLowerCase()}-${currency.toLowerCase()}`;
              frankfurterRateCache.set(cacheKey, {
                rate: rate as number,
                timestamp: Date.now()
              });

              // Also cache the inverse rate
              const inverseCacheKey = `${currency.toLowerCase()}-${baseCurrency.toLowerCase()}`;
              frankfurterRateCache.set(inverseCacheKey, {
                rate: 1 / (rate as number),
                timestamp: Date.now()
              });
            });

            // Validate the rates
            const validatedRates = validateRates(normalizedRates, baseCurrency.toLowerCase());

            // Update state with new rates
            set({
              rates: validatedRates,
              baseCurrency: baseCurrency.toLowerCase(),
              lastUpdated: new Date(),
              isLoading: false,
              error: null
            });

            console.log(`Successfully fetched ${Object.keys(validatedRates).length} exchange rates with base ${baseCurrency}`);
            return;
          }
        }

        console.warn(`Frankfurter API request failed: ${response.status}`);
        // Continue to alternative APIs
      } catch (frankfurterError) {
        console.warn('Error using Frankfurter API:', frankfurterError);
        // Continue to alternative APIs
      }

      // Try Open Exchange Rates API
      console.log('Trying Open Exchange Rates API...');
      const openExchangeUrl = `https://open.er-api.com/v6/latest/${baseCurrency}`;

      try {
        const response = await fetch(openExchangeUrl, {
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();

          if (data && data.rates && Object.keys(data.rates).length > 0) {
            // Process the data
            const normalizedRates: Record<string, number> = {};
            normalizedRates[baseCurrency.toLowerCase()] = 1;

            Object.entries(data.rates).forEach(([currency, rate]) => {
              normalizedRates[currency.toLowerCase()] = rate as number;

              // Also populate our cache with these rates
              const cacheKey = `${baseCurrency.toLowerCase()}-${currency.toLowerCase()}`;
              frankfurterRateCache.set(cacheKey, {
                rate: rate as number,
                timestamp: Date.now()
              });

              // Also cache the inverse rate
              const inverseCacheKey = `${currency.toLowerCase()}-${baseCurrency.toLowerCase()}`;
              frankfurterRateCache.set(inverseCacheKey, {
                rate: 1 / (rate as number),
                timestamp: Date.now()
              });
            });

            // Validate the rates
            const validatedRates = validateRates(normalizedRates, baseCurrency.toLowerCase());

            // Update state with new rates
            set({
              rates: validatedRates,
              baseCurrency: baseCurrency.toLowerCase(),
              lastUpdated: new Date(),
              isLoading: false,
              error: null
            });

            console.log(`Successfully fetched ${Object.keys(validatedRates).length} exchange rates from Open Exchange Rates with base ${baseCurrency}`);
            return;
          }
        }

        console.warn(`Open Exchange Rates API request failed: ${response.status}`);
        // Continue to alternative APIs
      } catch (openExchangeError) {
        console.warn('Error using Open Exchange Rates API:', openExchangeError);
        // Continue to alternative APIs
      }

      // Try ExchangeRate.host API as last resort
      console.log('Trying ExchangeRate.host API...');
      const exchangeRateHostUrl = `https://api.exchangerate.host/latest?base=${baseCurrency}`;

      try {
        const response = await fetch(exchangeRateHostUrl, {
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();

          if (data && data.rates && Object.keys(data.rates).length > 0) {
            // Process the data
            const normalizedRates: Record<string, number> = {};
            normalizedRates[baseCurrency.toLowerCase()] = 1;

            Object.entries(data.rates).forEach(([currency, rate]) => {
              normalizedRates[currency.toLowerCase()] = rate as number;

              // Also populate our cache with these rates
              const cacheKey = `${baseCurrency.toLowerCase()}-${currency.toLowerCase()}`;
              frankfurterRateCache.set(cacheKey, {
                rate: rate as number,
                timestamp: Date.now()
              });

              // Also cache the inverse rate
              const inverseCacheKey = `${currency.toLowerCase()}-${baseCurrency.toLowerCase()}`;
              frankfurterRateCache.set(inverseCacheKey, {
                rate: 1 / (rate as number),
                timestamp: Date.now()
              });
            });

            // Validate the rates
            const validatedRates = validateRates(normalizedRates, baseCurrency.toLowerCase());

            // Update state with new rates
            set({
              rates: validatedRates,
              baseCurrency: baseCurrency.toLowerCase(),
              lastUpdated: new Date(),
              isLoading: false,
              error: null
            });

            console.log(`Successfully fetched ${Object.keys(validatedRates).length} exchange rates from ExchangeRate.host with base ${baseCurrency}`);
            return;
          }
        }

        console.warn(`ExchangeRate.host API request failed: ${response.status}`);
        // Fall back to static rates
      } catch (exchangeRateHostError) {
        console.warn('Error using ExchangeRate.host API:', exchangeRateHostError);
        // Fall back to static rates
      }

      // If all API calls fail, use static fallback rates
      console.log('All API calls failed, using static fallback rates');

      // Create static fallback rates
      const fallbackRates: Record<string, number> = {
        'usd': 1,
        'eur': 0.92,
        'gbp': 0.78,
        'jpy': 150.5,
        'cad': 1.35,
        'aud': 1.52,
        'inr': 83.15,
        'pkr': 278.5,
        'aed': 3.67,
        'sar': 3.75,
        'myr': 4.65,
        'sgd': 1.35,
        'bdt': 110.5,
        'egp': 30.9,
        'idr': 15600,
        'kwd': 0.31,
        'ngn': 1550,
        'qar': 3.64,
        'zar': 18.5
      };

      // Convert to the requested base currency if not USD
      const normalizedRates: Record<string, number> = {};
      const baseLower = base.toLowerCase();

      if (baseLower === 'usd') {
        // If base is USD, use rates directly
        Object.assign(normalizedRates, fallbackRates);
      } else if (fallbackRates[baseLower]) {
        // If base is in our fallback rates, convert all rates
        const baseRate = fallbackRates[baseLower];

        // Add base currency with rate 1
        normalizedRates[baseLower] = 1;

        // Convert all other rates relative to the new base
        Object.entries(fallbackRates).forEach(([currency, rate]) => {
          if (currency !== baseLower) {
            normalizedRates[currency] = rate / baseRate;
          }
        });
      } else {
        // If base is not in our fallback rates, just use USD rates
        Object.assign(normalizedRates, fallbackRates);
        console.warn(`Cannot convert to base ${base}, using USD as base instead`);
      }

      // Update state with fallback rates
      set({
        rates: normalizedRates,
        baseCurrency: baseLower,
        lastUpdated: new Date(),
        isLoading: false,
        error: 'Using fallback rates due to API errors'
      });
    } catch (error) {
      console.error('Unexpected error fetching exchange rates:', error);

      // Use static fallback rates if all APIs fail
      console.log('Using static fallback rates due to unexpected error');

      // Create static fallback rates
      const fallbackRates: Record<string, number> = {
        'usd': 1,
        'eur': 0.92,
        'gbp': 0.78,
        'jpy': 150.5,
        'cad': 1.35,
        'aud': 1.52,
        'inr': 83.15,
        'pkr': 278.5,
        'aed': 3.67,
        'sar': 3.75,
        'myr': 4.65,
        'sgd': 1.35,
        'bdt': 110.5,
        'egp': 30.9,
        'idr': 15600,
        'kwd': 0.31,
        'ngn': 1550,
        'qar': 3.64,
        'zar': 18.5
      };

      // Convert to the requested base currency if not USD
      const normalizedRates: Record<string, number> = {};
      const baseLower = base.toLowerCase();

      if (baseLower === 'usd') {
        // If base is USD, use rates directly
        Object.assign(normalizedRates, fallbackRates);
      } else if (fallbackRates[baseLower]) {
        // If base is in our fallback rates, convert all rates
        const baseRate = fallbackRates[baseLower];

        // Add base currency with rate 1
        normalizedRates[baseLower] = 1;

        // Convert all other rates relative to the new base
        Object.entries(fallbackRates).forEach(([currency, rate]) => {
          if (currency !== baseLower) {
            normalizedRates[currency] = rate / baseRate;
          }
        });
      } else {
        // If base is not in our fallback rates, just use USD rates
        Object.assign(normalizedRates, fallbackRates);
        console.warn(`Cannot convert to base ${base}, using USD as base instead`);
      }

      // Update state with fallback rates
      set({
        rates: normalizedRates,
        baseCurrency: baseLower,
        lastUpdated: new Date(),
        isLoading: false,
        error: `Using fallback rates due to API error: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  },

  forceRefreshRates: async (base = 'USD') => {
    console.log(`Force refreshing exchange rates for ${base}`);

    // Clear any cached rates for this base currency
    EXCHANGE_RATE_CACHE.delete(base);

    // Reset circuit breaker if it's open
    if (CIRCUIT_BREAKER.isOpen) {
      console.log('Resetting circuit breaker for force refresh');
      CIRCUIT_BREAKER.isOpen = false;
      CIRCUIT_BREAKER.failureCount = 0;
      CIRCUIT_BREAKER.lastFailure = 0;
    }

    // Set loading state
    set({ isLoading: true, error: null });

    try {
      // Try each API source in sequence
      let response = null;
      let data = null;
      let sourceIndex = 0;
      let success = false;

      while (sourceIndex < API_SOURCES.length && !success) {
        const source = API_SOURCES[sourceIndex];
        try {
          console.log(`Force refresh: Trying API source ${sourceIndex + 1}/${API_SOURCES.length}: ${source}`);

          // Add cache-busting parameter
          const cacheBuster = Date.now();

          if (source === 'https://api.exchangerate.host/latest') {
            // Different format for this API
            response = await fetch(`${source}?base=${base.toUpperCase()}&_=${cacheBuster}`, {
              cache: 'no-store',
              headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
            });
          } else {
            response = await fetch(`${source}/currencies/${base.toLowerCase()}.json?_=${cacheBuster}`, {
              cache: 'no-store',
              headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
            });
          }

          if (response.ok) {
            data = await response.json();
            success = true;
            console.log(`Force refresh: Successfully fetched rates from ${source}`);
          } else {
            console.warn(`Force refresh: API source ${sourceIndex + 1} failed: ${response.status}`);
          }
        } catch (err) {
          console.warn(`Force refresh: API source ${sourceIndex + 1} error:`, err);
        }

        sourceIndex++;
      }

      if (!success) {
        console.warn('All API sources failed during force refresh, using fallback rates');
        // Use fallback hardcoded exchange rates instead of throwing an error
        success = true;

        // Fallback exchange rates with USD as base
        const fallbackRates: Record<string, number> = {
          USD: 1,
          GBP: 0.78,
          EUR: 0.91,
          PKR: 278.5,
          INR: 83.15,
          SAR: 3.75
        };

        // Create data structure that matches the expected format
        if (base.toUpperCase() === 'USD') {
          // If base is USD, use the fallback rates directly
          data = { rates: fallbackRates };
          // Set sourceIndex to match exchangerate.host for processing
          sourceIndex = API_SOURCES.indexOf('https://api.exchangerate.host/latest') + 1;
        } else {
          // For other base currencies, we need to convert
          // Create a structure that matches currency-api format
          const baseKey = base.toUpperCase();
          const baseRate = baseKey in fallbackRates ? fallbackRates[baseKey] : 1;
          const convertedRates: Record<string, number> = {};

          // Convert all rates to the new base
          Object.entries(fallbackRates).forEach(([currency, rate]) => {
            convertedRates[currency.toLowerCase()] = rate / baseRate;
          });

          // Format data to match currency-api response
          data = { [base.toLowerCase()]: convertedRates };
          // Set sourceIndex to match currency-api for processing
          sourceIndex = API_SOURCES.indexOf('https://api.exchangerate.host/latest') + 2;
        }

        console.log(`Using fallback exchange rates with base ${base}`);
      }

      // Process the data based on the source format
      let rates;
      if (sourceIndex - 1 === API_SOURCES.indexOf('https://api.exchangerate.host/latest')) {
        // Format for exchangerate.host
        if (data && data.rates && typeof data.rates === 'object') {
          rates = data.rates;
        } else {
          throw new Error('Invalid response format from exchangerate.host');
        }
      } else {
        // Format for currency-api
        if (data && data[base.toLowerCase()] && typeof data[base.toLowerCase()] === 'object') {
          rates = data[base.toLowerCase()];
        } else {
          throw new Error('Invalid response format from currency-api');
        }
      }

      // Validate the rates
      const validatedRates = validateRates(rates, base);

      // Update cache
      EXCHANGE_RATE_CACHE.set(base, validatedRates);

      // Update state
      set({
        rates: validatedRates,
        baseCurrency: base,
        lastUpdated: new Date(),
        isLoading: false,
        error: null
      });

      console.log('Force refresh: Currency rates updated:', {
        baseCurrency: base,
        ratesCount: Object.keys(validatedRates).length,
        timestamp: new Date().toISOString(),
        source: API_SOURCES[sourceIndex - 1]
      });

      return true;
    } catch (error) {
      console.error('Force refresh: Error fetching exchange rates:', error);

      set({
        error: error instanceof Error ? error.message : 'Failed to force refresh exchange rates',
        isLoading: false
      });

      return false;
    }
  },

  convertAmount: (amount: number, from: string, to: string) => {
    // Validate amount
    if (amount === undefined || amount === null ||
      typeof amount !== 'number' ||
      isNaN(amount) || !isFinite(amount)) {
      console.warn('Invalid amount passed to convertAmount:', amount);
      return 0;
    }

    // Validate currency codes
    if (!from || typeof from !== 'string') {
      console.warn('Invalid source currency:', from);
      return amount; // Return original amount as fallback
    }

    if (!to || typeof to !== 'string') {
      console.warn('Invalid target currency:', to);
      return amount; // Return original amount as fallback
    }

    const { rates, baseCurrency } = get();
    const fromCurrency = from.toLowerCase();
    const toCurrency = to.toLowerCase();

    if (fromCurrency === toCurrency) {
      return amount; // No conversion needed if currencies are the same
    }

    // Check if we have the necessary rates
    if (!rates || Object.keys(rates).length === 0) {
      console.warn('Cannot convert currency: No exchange rates available');

      // Proactively fetch rates for next time
      fetchAndCacheRate(fromCurrency, toCurrency).catch(() => { });

      return getFallbackConversion(amount, fromCurrency, toCurrency);
    }

    // Verify if rates exist for both currencies
    if (!rates[fromCurrency]) {
      console.warn(`Cannot convert from ${fromCurrency}: Rate not available`);

      // Proactively fetch rates for next time
      fetchAndCacheRate(fromCurrency, toCurrency).catch(() => { });

      return getFallbackConversion(amount, fromCurrency, toCurrency);
    }

    if (!rates[toCurrency]) {
      console.warn(`Cannot convert to ${toCurrency}: Rate not available`);

      // Proactively fetch rates for next time
      fetchAndCacheRate(fromCurrency, toCurrency).catch(() => { });

      return getFallbackConversion(amount, fromCurrency, toCurrency);
    }

    // Validate rates are positive numbers
    if (typeof rates[fromCurrency] !== 'number' || rates[fromCurrency] <= 0) {
      console.warn(`Invalid rate for ${fromCurrency}:`, rates[fromCurrency]);

      // Proactively fetch rates for next time
      fetchAndCacheRate(fromCurrency, toCurrency).catch(() => { });

      return getFallbackConversion(amount, fromCurrency, toCurrency);
    }

    if (typeof rates[toCurrency] !== 'number' || rates[toCurrency] <= 0) {
      console.warn(`Invalid rate for ${toCurrency}:`, rates[toCurrency]);

      // Proactively fetch rates for next time
      fetchAndCacheRate(fromCurrency, toCurrency).catch(() => { });

      return getFallbackConversion(amount, fromCurrency, toCurrency);
    }

    try {
      // For conversions, we need to:
      // 1. Calculate equivalent value in base currency (USD)
      // 2. Then convert from base currency to target currency

      // If source currency is the base, we already have its base value
      let inBaseCurrency;
      if (fromCurrency === baseCurrency.toLowerCase()) {
        inBaseCurrency = amount;
      } else {
        // Convert from source to base currency using the rate
        inBaseCurrency = amount / rates[fromCurrency];
      }

      // Now convert from base currency to target currency
      if (toCurrency === baseCurrency.toLowerCase()) {
        const result = inBaseCurrency;

        // Log the conversion for debugging
        console.log(`Currency conversion: ${amount} ${fromCurrency} → ${result.toFixed(2)} ${toCurrency}`);

        return result;
      } else {
        // Convert from base to target using the rate
        const result = inBaseCurrency * rates[toCurrency];

        // Log the conversion for debugging
        console.log(`Currency conversion: ${amount} ${fromCurrency} → ${result.toFixed(2)} ${toCurrency}`);

        return result;
      }
    } catch (error) {
      console.error('Error during currency conversion:', error instanceof Error ? error.message : String(error));
      return getFallbackConversion(amount, fromCurrency, toCurrency);
    }
  },

  // Convert currency using the store's exchange rates
  convertCurrency(amount: number, from: string, to: string): number {
    const { rates, baseCurrency } = get();

    // If currencies are the same, no conversion needed
    if (from.toUpperCase() === to.toUpperCase()) {
      return amount;
    }

    // If we don't have rates, use fallback conversion
    if (!rates || Object.keys(rates).length === 0) {
      console.log(`No exchange rates available in store, using fallback`);
      const converted = getFallbackConversion(amount, from, to);
      console.log(`Using hardcoded conversion: ${amount} ${from} → ${converted} ${to}`);
      return converted;
    }

    try {
      // Normalize currency codes
      const fromUpper = from.toUpperCase();
      const toUpper = to.toUpperCase();
      const baseUpper = baseCurrency.toUpperCase();

      // Direct conversion if base currency matches from currency
      if (baseUpper === fromUpper) {
        // If we have a direct rate for the target currency
        if (rates[toUpper]) {
          return amount * rates[toUpper];
        }
      }

      // Convert from source to base currency first, then to target
      if (baseUpper === toUpper) {
        // If we have a direct rate for the source currency
        if (rates[fromUpper]) {
          return amount / rates[fromUpper];
        }
      }

      // Cross-currency conversion: from -> base -> to
      if (rates[fromUpper] && rates[toUpper]) {
        const amountInBaseCurrency = amount / rates[fromUpper];
        return amountInBaseCurrency * rates[toUpper];
      }

      // If we get here, we couldn't convert using available rates
      console.warn(`Could not convert ${from} to ${to} using available rates, falling back to hardcoded rates`);
      const converted = getFallbackConversion(amount, from, to);
      console.log(`Using hardcoded conversion: ${amount} ${from} → ${converted} ${to}`);
      return converted;
    } catch (error) {
      console.error('Error converting currency:', error);
      // Use fallback if anything goes wrong
      return getFallbackConversion(amount, from, to);
    }
  }
}));

// Function to pre-populate cache with common currency pairs
function prePopulateCommonRates() {
  console.log('Pre-populating cache with common currency pairs...');

  // Define common base currencies
  const commonBaseCurrencies = ['USD', 'EUR', 'GBP', 'SAR', 'PKR', 'INR'];

  // Define common target currencies
  const commonTargetCurrencies = ['USD', 'EUR', 'GBP', 'SAR', 'PKR', 'INR', 'AED', 'CAD', 'AUD'];

  // Create a queue of promises to fetch rates
  const fetchPromises: Promise<any>[] = [];

  // For each base currency, fetch rates for all target currencies
  commonBaseCurrencies.forEach(base => {
    // Skip fetching rates for the same currency
    const targets = commonTargetCurrencies.filter(target => target !== base);

    // Fetch rates for this base currency
    const promise = fetch(`https://api.frankfurter.dev/v1/latest?base=${base}`)
      .then(response => {
        if (!response.ok) {
          console.warn(`Failed to pre-populate rates for ${base}: ${response.status}`);
          return null;
        }
        return response.json();
      })
      .then(data => {
        if (!data || !data.rates) return;

        // Cache each rate
        Object.entries(data.rates).forEach(([target, rate]) => {
          const cacheKey = `${base.toLowerCase()}-${target.toLowerCase()}`;
          frankfurterRateCache.set(cacheKey, {
            rate: rate as number,
            timestamp: Date.now()
          });

          // Also cache the inverse rate
          const inverseRate = 1 / (rate as number);
          const inverseCacheKey = `${target.toLowerCase()}-${base.toLowerCase()}`;
          frankfurterRateCache.set(inverseCacheKey, {
            rate: inverseRate,
            timestamp: Date.now()
          });
        });

        console.log(`Pre-populated rates for ${base} with ${Object.keys(data.rates).length} currencies`);
      })
      .catch(error => {
        console.error(`Error pre-populating rates for ${base}:`, error);
      });

    fetchPromises.push(promise);
  });

  // Wait for all fetches to complete
  Promise.all(fetchPromises)
    .then(() => {
      console.log('Finished pre-populating currency rate cache');
    })
    .catch(error => {
      console.error('Error during pre-population:', error);
    });
}

// Initialize the cache with common currency pairs
if (typeof window !== 'undefined') {
  // Only run in browser environment
  setTimeout(() => {
    prePopulateCommonRates();
  }, 1000); // Delay by 1 second to not block initial page load
} 