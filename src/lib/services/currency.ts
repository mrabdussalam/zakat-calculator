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
    const { rates, baseCurrency } = get();
    const fromCurrency = from.toLowerCase();
    const toCurrency = to.toLowerCase();
    
    if (!rates || !rates[fromCurrency] || !rates[toCurrency]) {
      return amount; // Return original amount if conversion not possible
    }

    // Convert from source currency to base currency first (if needed)
    const inBaseCurrency = fromCurrency === baseCurrency.toLowerCase()
      ? amount 
      : amount / rates[fromCurrency];

    // Then convert from base currency to target currency
    return toCurrency === baseCurrency.toLowerCase()
      ? inBaseCurrency 
      : inBaseCurrency * rates[toCurrency];
  }
})); 