import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ZakatState } from './types'
import { createCashSlice } from './modules/cash'
import { createMetalsSlice } from './modules/metals'
import { createStocksSlice } from './modules/stocks'
import { createNisabSlice } from './modules/nisab'
import { createRetirementSlice } from './modules/retirement'
import { createRealEstateSlice } from './modules/realEstate'
import { createCryptoSlice } from './modules/crypto'
import { DEFAULT_HAWL_STATUS } from './constants'

// Initial state
const initialState: Partial<ZakatState> = {
  metalsValues: {
    gold_regular: 0,
    gold_occasional: 0,
    gold_investment: 0,
    silver_regular: 0,
    silver_occasional: 0,
    silver_investment: 0
  },
  cashValues: {
    cash_on_hand: 0,
    checking_account: 0,
    savings_account: 0,
    digital_wallets: 0,
    foreign_currency: 0,
    foreign_currency_entries: []
  },
  stockValues: {
    active_shares: 0,
    active_price_per_share: 0,
    passive_shares: 0,
    company_cash: 0,
    company_receivables: 0,
    company_inventory: 0,
    total_shares_issued: 0,
    total_dividend_earnings: 0,
    dividend_per_share: 0,
    dividend_shares: 0,
    fund_value: 0,
    is_passive_fund: false,
    activeStocks: []
  },
  retirement: {
    traditional_401k: 0,
    traditional_ira: 0,
    roth_401k: 0,
    roth_ira: 0,
    pension: 0,
    other_retirement: 0
  },
  realEstateValues: {
    primary_residence_value: 0,
    rental_income: 0,
    rental_expenses: 0,
    property_for_sale_value: 0,
    property_for_sale_active: false,
    vacant_land_value: 0,
    vacant_land_sold: false,
    sale_price: 0
  },
  cryptoValues: {
    coins: [],
    total_value: 0,
    zakatable_value: 0
  },
  cashHawlMet: DEFAULT_HAWL_STATUS.cash,
  metalsHawlMet: DEFAULT_HAWL_STATUS.metals,
  stockHawlMet: DEFAULT_HAWL_STATUS.stocks,
  retirementHawlMet: DEFAULT_HAWL_STATUS.retirement,
  realEstateHawlMet: DEFAULT_HAWL_STATUS.real_estate,
  cryptoHawlMet: DEFAULT_HAWL_STATUS.crypto
}

// Create the store
export const useZakatStore = create<ZakatState>(
  persist(
    (set, get, store) => {
      // Create slices
      const cashSlice = createCashSlice(set, get, store)
      const metalsSlice = createMetalsSlice(set, get, store)
      const stocksSlice = createStocksSlice(set, get, store)
      const retirementSlice = createRetirementSlice(set, get, store)
      const realEstateSlice = createRealEstateSlice(set, get, store)
      const cryptoSlice = createCryptoSlice(set, get, store)
      const nisabSlice = createNisabSlice(set, get)

      return {
        ...initialState,
        ...cashSlice,
        ...metalsSlice,
        ...stocksSlice,
        ...retirementSlice,
        ...realEstateSlice,
        ...cryptoSlice,
        ...nisabSlice,

        // Reset all slices
        reset: () => {
          set(initialState)
          // Call individual reset functions
          cashSlice.resetCashValues?.()
          metalsSlice.resetMetalsValues?.()
          stocksSlice.resetStockValues?.()
          retirementSlice.resetRetirement?.()
          realEstateSlice.resetRealEstateValues?.()
          cryptoSlice.resetCryptoValues?.()
        },

        // Reset all calculators when currency changes
        // This is a specialized version of reset that focuses on clearing data
        // without resetting other user preferences
        resetAllCalculators: () => {
          console.log('Performing currency change reset for all calculators')
          
          // Add a delay to ensure metal prices are properly loaded
          setTimeout(() => {
            // Get the user's currency preference
            let userCurrency = 'USD'
            try {
              const savedCurrency = localStorage.getItem('selected-currency')
              if (savedCurrency) {
                userCurrency = savedCurrency
              }
            } catch (error) {
              console.error('Failed to load currency preference:', error)
            }
            
            // Reset all calculator values but preserve other settings including currency
            // This is more targeted than the full reset
            set((state) => {
              console.log('Resetting calculator values - current state:', Object.keys(state));
              return {
                ...state,
                currency: userCurrency || state.currency || 'USD',
                metalsValues: initialState.metalsValues,
                cashValues: initialState.cashValues,
                stockValues: initialState.stockValues,
                retirement: initialState.retirement,
                realEstateValues: initialState.realEstateValues,
                cryptoValues: initialState.cryptoValues
              };
            });
            
            // Also call individual reset functions to ensure complete reset
            // Do this with small delays to avoid race conditions
            setTimeout(() => cashSlice.resetCashValues?.(), 50);
            setTimeout(() => metalsSlice.resetMetalsValues?.(), 100);
            setTimeout(() => stocksSlice.resetStockValues?.(), 150);
            setTimeout(() => retirementSlice.resetRetirement?.(), 200);
            setTimeout(() => realEstateSlice.resetRealEstateValues?.(), 250);
            setTimeout(() => cryptoSlice.resetCryptoValues?.(), 300);
            
            // Keep hawl status as is or reset based on requirements
            console.log('Completed reset of all calculator values')
          }, 300); // Delay the reset to ensure prices are properly loaded
        },

        // Get complete breakdown
        getBreakdown: () => {
          const state = get()
          const totalValue = 
            state.getTotalCash() +
            state.getTotalMetals().total +
            state.getTotalStocks() +
            state.getRetirementTotal() +
            state.getRealEstateTotal() +
            state.getTotalCrypto()

          const zakatableValue = 
            state.getTotalZakatableCash() +
            state.getTotalZakatableMetals().total +
            state.getTotalZakatableStocks() +
            state.getRetirementZakatable() +
            state.getRealEstateZakatable() +
            state.getTotalZakatableCrypto()

          return {
            cash: state.getCashBreakdown(),
            metals: state.getMetalsBreakdown(),
            stocks: state.getStocksBreakdown(),
            retirement: state.getRetirementBreakdown(),
            realEstate: state.getRealEstateBreakdown(),
            crypto: state.getCryptoBreakdown(),
            combined: {
              totalValue,
              zakatableValue,
              zakatDue: zakatableValue * 0.025,
              meetsNisab: state.getNisabStatus()
            }
          }
        }
      }
    },
    {
      name: 'zakat-store',
      version: 1,
      partialize: (state) => {
        // Only persist these values to localStorage
        const { 
          metalsValues,
          cashValues,
          stockValues,
          retirement,
          realEstateValues,
          cryptoValues,
          cashHawlMet,
          metalsHawlMet,
          stockHawlMet,
          retirementHawlMet,
          realEstateHawlMet,
          cryptoHawlMet
        } = state as ZakatState;
        
        return {
          metalsValues,
          cashValues,
          stockValues,
          retirement,
          realEstateValues,
          cryptoValues,
          cashHawlMet,
          metalsHawlMet,
          stockHawlMet,
          retirementHawlMet,
          realEstateHawlMet,
          cryptoHawlMet
        };
      }
    }
  )
)