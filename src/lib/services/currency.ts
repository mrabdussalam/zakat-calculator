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

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  rates: {},
  baseCurrency: 'USD',
  lastUpdated: null,
  isLoading: false,
  error: null,

  fetchRates: async (base = 'USD') => {
    try {
      set({ isLoading: true, error: null });
      
      // Try primary URL first
      let response = await fetch(`${JSDELIVR_URL}/currencies/${base.toLowerCase()}.json`);
      
      // If primary fails, try fallback URL
      if (!response.ok) {
        console.log('Primary URL failed, trying fallback...');
        response = await fetch(`${FALLBACK_URL}/currencies/${base.toLowerCase()}.json`);
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch rates: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // The API returns { date: string, [baseCurrency]: { ... } }
      if (data && data[base.toLowerCase()] && typeof data[base.toLowerCase()] === 'object') {
        set({
          rates: data[base.toLowerCase()],
          baseCurrency: base,
          lastUpdated: new Date(data.date),
          isLoading: false
        });
      } else {
        throw new Error('Invalid response format or base currency not found');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch exchange rates',
        isLoading: false 
      });
      console.error('Error fetching exchange rates:', error);
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
      return amount;
    }
    
    // Verify if rates exist for both currencies
    if (!rates[fromCurrency]) {
      console.warn(`Cannot convert from ${fromCurrency}: Rate not available`);
      return amount;
    }
    
    if (!rates[toCurrency]) {
      console.warn(`Cannot convert to ${toCurrency}: Rate not available`);
      return amount;
    }
    
    // Validate rates are positive numbers
    if (typeof rates[fromCurrency] !== 'number' || rates[fromCurrency] <= 0) {
      console.warn(`Invalid rate for ${fromCurrency}:`, rates[fromCurrency]);
      return amount;
    }
    
    if (typeof rates[toCurrency] !== 'number' || rates[toCurrency] <= 0) {
      console.warn(`Invalid rate for ${toCurrency}:`, rates[toCurrency]);
      return amount;
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
        return inBaseCurrency;
      } else {
        // Convert from base to target using the rate
        return inBaseCurrency * rates[toCurrency];
      }
    } catch (error) {
      console.error('Error during currency conversion:', error);
      return amount; // Return original amount as fallback
    }
  }
})); 