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

// Enhanced fallback conversion with more accurate rates
function getFallbackConversion(amount: number, from: string, to: string): number {
  // More comprehensive and up-to-date rates
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

  // Normalize currency codes
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  // If both currencies are in our rates list, we can do a conversion
  if (rates[fromLower] && rates[toLower]) {
    // Convert to USD first, then to target currency
    const amountInUSD = amount / rates[fromLower];
    const result = amountInUSD * rates[toLower];

    console.warn(`Using fallback conversion: ${amount} ${from} → ${result.toFixed(2)} ${to}`);
    return result;
  }

  // If we can't convert, try to use the inverse rate if available
  if (rates[toLower] && fromLower === 'usd') {
    const result = amount * rates[toLower];
    console.warn(`Using direct USD conversion: ${amount} USD → ${result.toFixed(2)} ${to}`);
    return result;
  }

  if (rates[fromLower] && toLower === 'usd') {
    const result = amount / rates[fromLower];
    console.warn(`Using inverse conversion to USD: ${amount} ${from} → ${result.toFixed(2)} USD`);
    return result;
  }

  // Last resort: return the original amount
  console.warn(`Cannot convert ${from} to ${to} using fallback rates. Returning original amount.`);
  return amount;
}

// Enhanced fetchRates function with circuit breaker pattern
export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  rates: {},
  baseCurrency: 'USD',
  lastUpdated: null,
  isLoading: false,
  error: null,

  fetchRates: async (base = 'USD') => {
    // Check if circuit breaker is open
    if (CIRCUIT_BREAKER.isOpen) {
      const timeElapsed = Date.now() - CIRCUIT_BREAKER.lastFailure;
      if (timeElapsed < CIRCUIT_BREAKER.resetTimeout) {
        console.warn(`Circuit breaker open. Using cached rates. Will retry in ${Math.round((CIRCUIT_BREAKER.resetTimeout - timeElapsed) / 1000)}s`);

        // Use cached rates if available
        const cachedRates = EXCHANGE_RATE_CACHE.get(base);
        if (cachedRates) {
          set({
            rates: cachedRates,
            baseCurrency: base,
            isLoading: false
          });
          return;
        }

        // If no cached rates, use fallback mechanism
        set({
          error: 'API service temporarily unavailable. Using fallback rates.',
          isLoading: false
        });
        return;
      } else {
        // Reset circuit breaker after timeout
        CIRCUIT_BREAKER.isOpen = false;
        CIRCUIT_BREAKER.failureCount = 0;
      }
    }

    // Check cache first
    if (EXCHANGE_RATE_CACHE.isValid(base)) {
      const cachedRates = EXCHANGE_RATE_CACHE.get(base);
      if (cachedRates) {
        console.log(`Using cached rates for ${base}`);
        set({
          rates: cachedRates,
          baseCurrency: base,
          isLoading: false
        });
        return;
      }
    }

    try {
      set({ isLoading: true, error: null });

      // Try each API source in sequence
      let response = null;
      let data = null;
      let sourceIndex = 0;
      let success = false;

      while (sourceIndex < API_SOURCES.length && !success) {
        const source = API_SOURCES[sourceIndex];
        try {
          console.log(`Trying API source ${sourceIndex + 1}/${API_SOURCES.length}: ${source}`);

          if (source === 'https://api.exchangerate.host/latest') {
            // Different format for this API
            response = await fetch(`${source}?base=${base.toUpperCase()}`);
          } else {
            response = await fetch(`${source}/currencies/${base.toLowerCase()}.json`);
          }

          if (response.ok) {
            data = await response.json();
            success = true;
          } else {
            console.warn(`API source ${sourceIndex + 1} failed: ${response.status}`);
          }
        } catch (err) {
          console.warn(`API source ${sourceIndex + 1} error:`, err);
        }

        sourceIndex++;
      }

      if (!success) {
        // Update circuit breaker
        CIRCUIT_BREAKER.failureCount++;
        CIRCUIT_BREAKER.lastFailure = Date.now();

        if (CIRCUIT_BREAKER.failureCount >= CIRCUIT_BREAKER.failureThreshold) {
          CIRCUIT_BREAKER.isOpen = true;
          console.warn('Circuit breaker opened due to repeated API failures');
        }

        throw new Error('All API sources failed');
      }

      // Reset circuit breaker on success
      CIRCUIT_BREAKER.failureCount = 0;

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
        lastUpdated: new Date(data.date || Date.now()),
        isLoading: false
      });

      console.log('Currency rates updated:', {
        baseCurrency: base,
        ratesCount: Object.keys(validatedRates).length,
        timestamp: new Date().toISOString(),
        source: API_SOURCES[sourceIndex - 1]
      });
    } catch (error) {
      // Check if we have cached rates to use as fallback
      const cachedRates = EXCHANGE_RATE_CACHE.get(base);
      if (cachedRates) {
        console.warn('API fetch failed. Using cached rates as fallback.');
        set({
          rates: cachedRates,
          baseCurrency: base,
          error: 'Using cached rates due to API failure',
          isLoading: false
        });
        return;
      }

      set({
        error: error instanceof Error ? error.message : 'Failed to fetch exchange rates',
        isLoading: false
      });
      console.error('Error fetching exchange rates:', error);
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
        throw new Error('All API sources failed during force refresh');
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
      return getFallbackConversion(amount, fromCurrency, toCurrency);
    }

    // Verify if rates exist for both currencies
    if (!rates[fromCurrency]) {
      console.warn(`Cannot convert from ${fromCurrency}: Rate not available`);
      return getFallbackConversion(amount, fromCurrency, toCurrency);
    }

    if (!rates[toCurrency]) {
      console.warn(`Cannot convert to ${toCurrency}: Rate not available`);
      return getFallbackConversion(amount, fromCurrency, toCurrency);
    }

    // Validate rates are positive numbers
    if (typeof rates[fromCurrency] !== 'number' || rates[fromCurrency] <= 0) {
      console.warn(`Invalid rate for ${fromCurrency}:`, rates[fromCurrency]);
      return getFallbackConversion(amount, fromCurrency, toCurrency);
    }

    if (typeof rates[toCurrency] !== 'number' || rates[toCurrency] <= 0) {
      console.warn(`Invalid rate for ${toCurrency}:`, rates[toCurrency]);
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
  }
})); 