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

// Initial state
const initialState: Partial<ZakatState> = {
  retirement: {
    traditional_401k: 0,
    traditional_ira: 0,
    roth_401k: 0,
    roth_ira: 0,
    pension: 0,
    other_retirement: 0
  },
  retirementHawlMet: false
}

// Create the store
export const useZakatStore = create<ZakatState>()(
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