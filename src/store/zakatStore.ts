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
      version: 1
    }
  )
)