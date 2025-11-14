/**
 * Shared exchange rate fetching service
 * Used by both API routes to avoid server-to-server HTTP calls
 */

import { FALLBACK_RATES, getFallbackRate } from '@/lib/constants/currency';

interface ExchangeRateResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

/**
 * Fetch exchange rates from external APIs with multiple fallbacks
 * @param base Base currency code (e.g., 'USD')
 * @param symbols Optional comma-separated list of target currencies
 * @returns Exchange rate data or fallback rates
 */
export async function fetchExchangeRates(
  base: string,
  symbols?: string
): Promise<ExchangeRateResponse> {
  const baseUpper = base.toUpperCase();

  // Try multiple APIs in sequence until one succeeds
  try {
    // First try Frankfurter API
    console.log(`[ExchangeRateService] Trying Frankfurter API with base=${baseUpper}`);
    let url = `https://api.frankfurter.dev/v1/latest?base=${baseUpper}`;
    if (symbols) {
      url += `&symbols=${symbols}`;
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[ExchangeRateService] Successfully fetched rates from Frankfurter API`);
      return data;
    }

    console.log(`[ExchangeRateService] Frankfurter API failed with status ${response.status}`);

    // Try Open Exchange Rates API
    console.log(`[ExchangeRateService] Trying Open Exchange Rates API with base=${baseUpper}`);
    url = `https://open.er-api.com/v6/latest/${baseUpper}`;

    const fallbackResponse = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json();
      console.log(`[ExchangeRateService] Successfully fetched rates from Open Exchange Rates API`);
      return data;
    }

    console.log(`[ExchangeRateService] Open Exchange Rates API failed with status ${fallbackResponse.status}`);

    // Try ExchangeRate.host API
    console.log(`[ExchangeRateService] Trying ExchangeRate.host API with base=${baseUpper}`);
    url = `https://api.exchangerate.host/latest?base=${baseUpper}`;
    if (symbols) {
      url += `&symbols=${symbols}`;
    }

    const secondFallbackResponse = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (secondFallbackResponse.ok) {
      const data = await secondFallbackResponse.json();
      console.log(`[ExchangeRateService] Successfully fetched rates from ExchangeRate.host API`);
      return data;
    }

    console.log(`[ExchangeRateService] ExchangeRate.host API failed with status ${secondFallbackResponse.status}`);
  } catch (error) {
    console.error(`[ExchangeRateService] Error fetching exchange rates:`, error);
  }

  // If all APIs fail, return fallback rates
  console.log(`[ExchangeRateService] All APIs failed, returning fallback rates`);

  // Convert rates to the requested base currency if not USD
  if (baseUpper !== 'USD' && baseUpper in FALLBACK_RATES) {
    const baseRate = FALLBACK_RATES[baseUpper];
    const convertedRates: Record<string, number> = {};

    // Convert all rates to the new base
    Object.entries(FALLBACK_RATES).forEach(([currency, rate]) => {
      convertedRates[currency] = rate / baseRate;
    });

    // Set the base currency rate to 1
    convertedRates[baseUpper] = 1;

    return {
      base: baseUpper,
      date: new Date().toISOString().split('T')[0],
      rates: convertedRates
    };
  }

  // If base is not in our fallback rates, return USD rates
  return {
    base: 'USD',
    date: new Date().toISOString().split('T')[0],
    rates: FALLBACK_RATES
  };
}

/**
 * Get exchange rate between two currencies
 * @param from Source currency code
 * @param to Target currency code
 * @returns Exchange rate or null if not available
 */
export async function getExchangeRate(from: string, to: string): Promise<number | null> {
  const fromUpper = from.toUpperCase();
  const toUpper = to.toUpperCase();

  // If currencies are the same, no conversion needed
  if (fromUpper === toUpper) {
    return 1;
  }

  try {
    const data = await fetchExchangeRates(fromUpper, toUpper);

    if (data && data.rates && data.rates[toUpper]) {
      console.log(`[ExchangeRateService] Got exchange rate for ${fromUpper} to ${toUpper}: ${data.rates[toUpper]}`);
      return data.rates[toUpper];
    }

    // If specific symbol not found, try using fallback calculation
    const fallbackRate = getFallbackRate(fromUpper, toUpper);
    if (fallbackRate !== null) {
      console.log(`[ExchangeRateService] Using fallback rate for ${fromUpper} to ${toUpper}: ${fallbackRate}`);
      return fallbackRate;
    }

    console.warn(`[ExchangeRateService] Could not get exchange rate for ${fromUpper} to ${toUpper}`);
    return null;
  } catch (error) {
    console.error(`[ExchangeRateService] Error getting exchange rate from ${fromUpper} to ${toUpper}:`, error);

    // Try fallback calculation on error
    const fallbackRate = getFallbackRate(fromUpper, toUpper);
    if (fallbackRate !== null) {
      console.log(`[ExchangeRateService] Using fallback rate after error for ${fromUpper} to ${toUpper}: ${fallbackRate}`);
      return fallbackRate;
    }

    return null;
  }
}
