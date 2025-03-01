import { StateCreator } from 'zustand'
import { ZakatState } from '../types'
import { ZAKAT_RATE } from '@/lib/constants'
import { DEFAULT_HAWL_STATUS } from '../constants'
import { getCryptoPrice, CryptoAPIError } from '@/lib/api/crypto'
import { roundCurrency } from '@/lib/utils/currency'
import { CryptoSlice, CryptoValues, CryptoHolding } from './crypto.types'

// Initial state
const initialCryptoValues: CryptoValues = {
  coins: [],
  total_value: 0,
  zakatable_value: 0
}

export const createCryptoSlice: StateCreator<
  ZakatState,
  [["zustand/persist", unknown]],
  [],
  CryptoSlice
> = (set, get) => ({
  // Initial state
  cryptoValues: initialCryptoValues,
  cryptoHawlMet: DEFAULT_HAWL_STATUS.crypto,
  isLoading: false,
  lastError: null,

  // Actions
  addCoin: async (symbol: string, quantity: number, currency: string = 'USD') => {
    if (typeof quantity !== 'number' || !isFinite(quantity) || quantity < 0) {
      console.warn(`Invalid crypto quantity: ${quantity} for ${symbol}`)
      return
    }

    try {
      const currentPrice = await getCryptoPrice(symbol, currency)
      const marketValue = roundCurrency(quantity * currentPrice)
      const zakatDue = roundCurrency(marketValue * ZAKAT_RATE)

      set((state: ZakatState) => {
        const newCoins = [...state.cryptoValues.coins, {
          symbol: symbol.toUpperCase(),
          quantity,
          currentPrice: roundCurrency(currentPrice),
          marketValue,
          zakatDue,
          currency
        }]

        const total = roundCurrency(newCoins.reduce((sum: number, coin: CryptoHolding) => sum + coin.marketValue, 0))

        return {
          cryptoValues: {
            coins: newCoins,
            total_value: total,
            zakatable_value: state.cryptoHawlMet ? total : 0
          }
        }
      })
    } catch (error) {
      console.error('Error adding coin:', error)
      throw error
    }
  },

  removeCoin: (symbol: string) => {
    set((state: ZakatState) => {
      const newCoins = state.cryptoValues.coins.filter(
        (coin: CryptoHolding) => coin.symbol !== symbol.toUpperCase()
      )

      const total = roundCurrency(newCoins.reduce((sum: number, coin: CryptoHolding) => sum + coin.marketValue, 0))

      return {
        cryptoValues: {
          coins: newCoins,
          total_value: total,
          zakatable_value: state.cryptoHawlMet ? total : 0
        }
      }
    })
  },

  resetCryptoValues: () => set({
    cryptoValues: initialCryptoValues,
    cryptoHawlMet: DEFAULT_HAWL_STATUS.crypto
  }),

  setCryptoHawl: (value: boolean) => {
    set((state: ZakatState) => ({
      cryptoHawlMet: value,
      cryptoValues: {
        ...state.cryptoValues,
        zakatable_value: value ? state.cryptoValues.total_value : 0
      }
    }))
  },

  updatePrices: async (currency: string = 'USD') => {
    set({ isLoading: true, lastError: null })

    const state = get()
    const coins = state.cryptoValues.coins

    if (!Array.isArray(coins) || coins.length === 0) {
      set({ isLoading: false })
      return
    }

    const failedUpdates: string[] = []
    const updatedCoins = [...coins]

    try {
      // Update each coin individually to handle failures gracefully
      for (const coin of coins) {
        try {
          const currentPrice = await getCryptoPrice(coin.symbol, currency)
          const marketValue = roundCurrency(coin.quantity * currentPrice)
          const zakatDue = roundCurrency(marketValue * ZAKAT_RATE)

          const index = updatedCoins.findIndex(c => c.symbol === coin.symbol)
          if (index !== -1) {
            updatedCoins[index] = {
              ...coin,
              currentPrice: roundCurrency(currentPrice),
              marketValue,
              zakatDue,
              currency
            }
          }
        } catch (error) {
          // If price update fails, keep existing price and track failure
          console.error(`Failed to update price for ${coin.symbol}:`, error)
          failedUpdates.push(coin.symbol)
        }
      }

      // Calculate total after all updates
      const total = roundCurrency(updatedCoins.reduce((sum: number, coin: CryptoHolding) => sum + coin.marketValue, 0))

      // First update the state with new values
      set((state: ZakatState) => ({
        isLoading: false,
        cryptoValues: {
          coins: updatedCoins,
          total_value: total,
          zakatable_value: state.cryptoHawlMet ? total : 0
        }
      }))

      // Then if there were any failures, throw an error
      if (failedUpdates.length > 0) {
        throw new CryptoAPIError(
          `Could not update prices for: ${failedUpdates.join(', ')}. Previous prices retained.`
        )
      }

    } catch (error) {
      console.error('Failed to update crypto prices:', error)
      set({ isLoading: false })
      // Re-throw the error to be handled by the component
      throw error instanceof Error ? error : new Error('Failed to update crypto prices')
    }
  },

  // Implementation of updateCryptoPrices for currency conversion
  updateCryptoPrices: (targetCurrency: string, fromCurrency?: string) => {
    console.log(`Updating crypto prices from ${fromCurrency || 'current'} to ${targetCurrency}`);
    const state = get();

    // Check if we have coins to update
    if (!state.cryptoValues || !Array.isArray(state.cryptoValues.coins) || state.cryptoValues.coins.length === 0) {
      console.warn('Cannot update crypto prices: no coins to update');
      return;
    }

    // Use basic conversion function if advanced currency conversion not available
    const convertValue = (value: number, fromCurr: string, toCurr: string): number => {
      // Simple conversion rates for common currencies
      const rates: Record<string, number> = {
        'USD-SAR': 3.75,  // 1 USD = 3.75 SAR
        'SAR-USD': 1 / 3.75,
        'USD-PKR': 278.5, // 1 USD = 278.5 PKR
        'PKR-USD': 1 / 278.5,
        'USD-GBP': 0.78,  // 1 USD = 0.78 GBP
        'GBP-USD': 1 / 0.78,
        'USD-EUR': 0.92,  // 1 USD = 0.92 EUR
        'EUR-USD': 1 / 0.92,
        'USD-AED': 3.67,  // 1 USD = 3.67 AED
        'AED-USD': 1 / 3.67
      };

      console.log(`Crypto conversion: ${value} ${fromCurr} → ${toCurr}`);

      // If same currency, no conversion needed
      if (fromCurr === toCurr) {
        console.log(`No conversion needed for ${fromCurr} to ${toCurr}`);
        return value;
      }

      // Try to find conversion rate
      const rateKey = `${fromCurr}-${toCurr}`;
      const rate = rates[rateKey];

      if (rate) {
        const result = value * rate;
        console.log(`Direct conversion ${fromCurr} to ${toCurr}: ${value} * ${rate} = ${result}`);
        return result;
      }

      // If no direct conversion found, try to convert through USD
      if (fromCurr !== 'USD' && toCurr !== 'USD') {
        const fromToUSD = rates[`${fromCurr}-USD`] || (1 / rates[`USD-${fromCurr}`]);
        const usdToTarget = rates[`USD-${toCurr}`] || (1 / rates[`${toCurr}-USD`]);

        if (fromToUSD && usdToTarget) {
          const result = value * fromToUSD * usdToTarget;
          console.log(`Indirect conversion via USD: ${value} ${fromCurr} → ${value * fromToUSD} USD → ${result} ${toCurr}`);
          return result;
        }
      }

      // If all else fails, return original value
      console.warn(`No conversion rate found for ${fromCurr} to ${toCurr}, using original value`);
      return value;
    };

    // Update each coin with the new currency
    const updatedCoins = state.cryptoValues.coins.map(coin => {
      // If coin already has this currency or no from currency specified, don't convert
      if (coin.currency === targetCurrency) {
        console.log(`Coin ${coin.symbol} already in ${targetCurrency}, skipping conversion`);
        return coin;
      }

      // Determine the source currency - use the coin's currency if available, otherwise use fromCurrency or default to USD
      const sourceCurrency = coin.currency || fromCurrency || 'USD';
      console.log(`Converting coin ${coin.symbol} from ${sourceCurrency} to ${targetCurrency}`);

      // Convert the coin's values to the new currency
      const convertedPrice = convertValue(coin.currentPrice, sourceCurrency, targetCurrency);
      const convertedMarketValue = convertValue(coin.marketValue, sourceCurrency, targetCurrency);
      const convertedZakatDue = convertValue(coin.zakatDue, sourceCurrency, targetCurrency);

      console.log(`Conversion results for ${coin.symbol}:`, {
        price: `${coin.currentPrice} ${sourceCurrency} → ${convertedPrice} ${targetCurrency}`,
        marketValue: `${coin.marketValue} ${sourceCurrency} → ${convertedMarketValue} ${targetCurrency}`,
        zakatDue: `${coin.zakatDue} ${sourceCurrency} → ${convertedZakatDue} ${targetCurrency}`
      });

      return {
        ...coin,
        currentPrice: roundCurrency(convertedPrice),
        marketValue: roundCurrency(convertedMarketValue),
        zakatDue: roundCurrency(convertedZakatDue),
        currency: targetCurrency, // Update the currency property
        sourceCurrency: sourceCurrency // Track the original currency
      };
    });

    // Calculate the new total 
    const newTotal = roundCurrency(updatedCoins.reduce((sum, coin) => sum + coin.marketValue, 0));
    const newZakatable = state.cryptoHawlMet ? newTotal : 0;

    console.log(`Calculated new crypto totals:`, {
      total: newTotal,
      zakatable: newZakatable,
      coins: updatedCoins.map(coin => ({
        symbol: coin.symbol,
        marketValue: coin.marketValue,
        currency: coin.currency
      }))
    });

    // Update the state
    set({
      cryptoValues: {
        coins: updatedCoins,
        total_value: newTotal,
        zakatable_value: newZakatable
      }
    });

    console.log(`Crypto values updated to ${targetCurrency}`, {
      coinCount: updatedCoins.length,
      newTotal,
      newZakatable
    });
  },

  // Getters
  getTotalCrypto: () => {
    const { cryptoValues } = get()
    return cryptoValues.total_value
  },

  getTotalZakatableCrypto: () => {
    const { cryptoValues, cryptoHawlMet } = get()
    return cryptoHawlMet ? cryptoValues.total_value : 0
  },

  getCryptoBreakdown: () => {
    const state = get()
    const total = roundCurrency(state.getTotalCrypto())
    const zakatable = roundCurrency(state.getTotalZakatableCrypto())

    // Ensure coins array exists
    const coins = state.cryptoValues?.coins || []

    // Get the current currency from the state or default to USD
    const currentCurrency = state.currency || 'USD'
    console.log(`Getting crypto breakdown with currency: ${currentCurrency}`)

    return {
      total,
      zakatable,
      zakatDue: roundCurrency(zakatable * ZAKAT_RATE),
      items: coins.reduce((acc: Record<string, {
        value: number;
        isZakatable: boolean;
        zakatable: number;
        zakatDue: number;
        label: string;
        tooltip: string;
        percentage: number;
        isExempt: boolean;
      }>, coin: CryptoHolding) => ({
        ...acc,
        [coin.symbol.toLowerCase()]: {
          value: roundCurrency(coin.marketValue),
          isZakatable: state.cryptoHawlMet,
          zakatable: state.cryptoHawlMet ? roundCurrency(coin.marketValue) : 0,
          zakatDue: state.cryptoHawlMet ? roundCurrency(coin.marketValue * ZAKAT_RATE) : 0,
          label: `${coin.symbol} (${coin.quantity} coins)`,
          tooltip: `${coin.quantity} ${coin.symbol} at ${new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: coin.currency || currentCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(roundCurrency(coin.currentPrice))} each`,
          percentage: total > 0 ? roundCurrency((coin.marketValue / total) * 100) : 0,
          isExempt: false
        }
      }), {})
    }
  }
}) 