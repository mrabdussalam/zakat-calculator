// Metals API module
// This file provides utilities for fetching metal prices from the API

import { getFallbackMetalPrices } from '@/lib/constants/metals'
import { IS_REPLIT_CLIENT as IS_REPLIT } from '@/lib/utils/environment'

/**
 * Fetches the latest metal prices for a given currency
 */
export async function fetchMetalPrices(
  currency: string = 'USD',
  options: { 
    refresh?: boolean,
    timeout?: number,
    useCache?: boolean,
    forceFailover?: boolean
  } = { refresh: false, timeout: 8000, useCache: true, forceFailover: false }
) {
  // If we're in Replit and forceFailover is true, skip the API call altogether
  if ((IS_REPLIT && options.forceFailover) || options.forceFailover) {
    console.log(`Using fallback metal prices for ${currency} (forced failover)`);
    return getFallbackPrices(currency);
  }

  try {
    console.log(`Fetching metal prices for ${currency} with options:`, options);
    
    // Construct the full URL to ensure we're hitting the right endpoint
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const apiUrl = `${baseUrl}/api/prices/metals?currency=${encodeURIComponent(currency)}`;
    
    // Add refresh param if specified
    const urlWithParams = options.refresh 
      ? `${apiUrl}&refresh=true` 
      : apiUrl;
    
    console.log(`Full API URL: ${urlWithParams}`);
    
    // Add a timeout to the fetch request to avoid hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);
    
    const fetchOptions: RequestInit = {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    // Only bypass cache if we specifically want fresh data
    if (options.refresh || !options.useCache) {
      fetchOptions.cache = 'no-store'; // Force bypass cache for fresh data
    }
    
    const response = await fetch(urlWithParams, fetchOptions);
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`API returned error status: ${response.status} ${response.statusText}`);
      
      // For Replit environment or severe API errors, fall back to cached values
      if (IS_REPLIT || response.status >= 500) {
        console.log(`Using fallback metal prices for ${currency} after API error`);
        return getFallbackPrices(currency);
      }
      
      throw new Error(`Failed to fetch metal prices: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate the received data
    if (!data || typeof data.gold !== 'number' || typeof data.silver !== 'number' || 
        !isFinite(data.gold) || !isFinite(data.silver)) {
      console.warn('Received invalid data format from API:', data);
      
      if (IS_REPLIT) {
        console.log(`Using fallback metal prices for ${currency} due to invalid data format`);
        return getFallbackPrices(currency);
      }
      
      throw new Error('Invalid data format received from API');
    }
    
    console.log(`Received metal prices for ${currency}:`, data);
    
    // Return the data in a standardized format
    return {
      gold: data.gold,
      silver: data.silver,
      currency: currency,
      lastUpdated: new Date(),
      isCache: data.isCache || false,
      source: data.source || 'API'
    };
  } catch (error: any) {
    console.error(`Error fetching metal prices for ${currency}:`, error);
    
    // Check if it was a timeout error
    if (error.name === 'AbortError') {
      console.warn(`Fetch operation timed out after ${options.timeout}ms`);
      
      // For Replit environment, fall back to local values on timeout
      if (IS_REPLIT) {
        console.log(`Using fallback metal prices for ${currency} after timeout`);
        return getFallbackPrices(currency);
      }
      
      throw new Error(`Request timed out after ${options.timeout}ms`);
    }
    
    // For Replit environment, always fall back to local values on any error
    if (IS_REPLIT) {
      console.log(`Using fallback metal prices for ${currency} after error`);
      return getFallbackPrices(currency);
    }
    
    throw error;
  }
}

/**
 * Get fallback prices for a given currency
 */
function getFallbackPrices(currency: string) {
  const fallbackPrices = getFallbackMetalPrices(currency);

  return {
    gold: fallbackPrices.gold,
    silver: fallbackPrices.silver,
    currency: currency,
    lastUpdated: new Date(),
    isCache: true,
    source: 'fallback'
  };
} 