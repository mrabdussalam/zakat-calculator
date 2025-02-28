# Zakat Guide API Architecture

This document provides a comprehensive overview of the API architecture, endpoints, connections, and fallback mechanisms implemented in the Zakat Guide application.

## Table of Contents

1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [External API Dependencies](#external-api-dependencies)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Currency Conversion System](#currency-conversion-system)
6. [Fallback Mechanisms](#fallback-mechanisms)
7. [Caching Strategy](#caching-strategy)
8. [Validation Systems](#validation-systems)
9. [Error Handling](#error-handling)
10. [Security Considerations](#security-considerations)

## Overview

The Zakat Guide application relies on several APIs to fetch real-time financial data for calculating Zakat. The architecture is designed with multiple layers of fallbacks to ensure reliability even when external services are unavailable.

## API Endpoints

### Internal API Endpoints

| Endpoint | Method | Description | Fallback Mechanism |
|----------|--------|-------------|-------------------|
| `/api/prices/metals` | GET | Fetches current gold and silver prices | Multiple external sources + hardcoded values |
| `/api/prices/stocks` | GET | Fetches stock prices using Yahoo Finance | Cached values + hardcoded conversion rates |
| `/api/prices/crypto` | GET | Fetches cryptocurrency prices using CoinGecko | Cached values + hardcoded conversion rates |
| `/api/nisab` | GET | Calculates nisab thresholds based on metal prices | Fallback to hardcoded nisab values |
| `/api/search/stocks` | GET | Searches for stocks using Yahoo Finance | Rate-limited with fallback error messages |
| `/api/crypto/prices` | GET | Batch fetches cryptocurrency prices | CoinGecko with caching |
| `/api/crypto/[id]` | GET | Fetches detailed info for a specific cryptocurrency | CoinGecko with caching |
| `/api/test-metals` | GET | Diagnostic endpoint for testing metal price sources | N/A (testing only) |

### Request Parameters

Most price endpoints accept the following parameters:
- `currency`: Target currency code (default: USD)
- `refresh`: Boolean flag to force refresh cached data
- `symbol`/`id`: Asset identifier (stock symbol, crypto ID, etc.)

## External API Dependencies

### Stock Price Data
- **Primary**: Yahoo Finance API (`https://query2.finance.yahoo.com/v8/finance/chart`)
- **Fallback**: None (relies on caching and hardcoded conversion)
- **Implementation**: Custom wrapper with error handling in `/app/api/prices/stocks/route.ts`

### Cryptocurrency Data
- **Primary**: CoinGecko API (`https://api.coingecko.com/api/v3/simple/price`)
- **Fallback**: None (relies on caching and hardcoded conversion)
- **Implementation**: Custom wrapper with symbol mapping in `/app/api/prices/crypto/route.ts`

### Metal Price Data
- **Primary Sources** (tried in sequence):
  1. GoldPrice.org (`https://data-asg.goldprice.org/dbXRates/USD`)
  2. Frankfurter API (`https://api.frankfurter.app/latest?from=XAU&to=USD,XAG`)
  3. Metals.live API (`https://api.metals.live/v1/spot/gold,silver`)
- **Fallback**: Hardcoded recent values
- **Implementation**: Multi-source fetching with validation in `/app/api/prices/metals/route.ts`

### Currency Conversion
- **Primary**: Frankfurter API (`https://api.frankfurter.app/latest`)
- **Secondary**: Open Exchange Rates API (`https://open.er-api.com/v6/latest/USD`)
- **Fallback**: Comprehensive hardcoded conversion rates
- **Implementation**: `CurrencyConversionService` in `/lib/services/currencyConversion.ts`

## Data Flow Architecture

1. **Client Request Flow**:
   - Client requests data (e.g., dashboard loads)
   - Client-side API calls to internal endpoints
   - Internal endpoints fetch from external sources or use cache
   - Response returned with appropriate currency conversion

2. **Currency Conversion Flow**:
   - All prices are fetched in USD first
   - Conversion to target currency happens in the API layer
   - Multiple fallback mechanisms ensure conversion always succeeds
   - Converted values are cached to reduce API calls

3. **Caching Flow**:
   - In-memory cache for frequent requests
   - File-based cache for persistent storage
   - Cache validation to prevent stale or invalid data
   - Configurable TTL (Time To Live) for different data types

## Currency Conversion System

The application implements a robust currency conversion system through the `CurrencyConversionService` class. Key features include:

1. **Centralized Conversion Logic**:
   - All currency conversions use the same service
   - Consistent behavior across the application
   - Validation of conversion results

2. **Multi-tier Fallback System**:
   - Primary: Real-time exchange rates from Frankfurter API
   - Secondary: Alternative exchange rate API
   - Tertiary: Comprehensive hardcoded conversion rates
   - Validation against expected ranges to detect anomalies

3. **Supported Currencies**:
   - USD, EUR, GBP, JPY, CAD, AUD, INR, PKR, AED, SAR, MYR, SGD, BDT, EGP, IDR, KWD, NGN, QAR, ZAR
   - Hardcoded fallback rates for all supported currencies
   - Special handling for problematic currencies (AED, INR, PKR, SAR)

4. **Implementation Details**:
   - Exchange rates stored in Zustand store
   - Validation against expected ranges
   - Detailed logging for debugging
   - Graceful degradation when APIs fail

## Fallback Mechanisms

The application implements multiple layers of fallbacks to ensure reliability:

### 1. API Request Fallbacks

- **Timeout Handling**: All external API requests have configurable timeouts
- **Multiple Sources**: Metal prices fetched from multiple sources in sequence
- **Alternative APIs**: Currency conversion tries multiple external APIs
- **Error Recovery**: Graceful handling of network errors and API failures

### 2. Data Validation Fallbacks

- **Range Validation**: Prices and exchange rates validated against expected ranges
- **Future Date Detection**: Prevention of future-dated cache entries
- **Format Validation**: Strict validation of API response formats
- **Suspicious Data Detection**: Rejection of anomalous values

### 3. Hardcoded Fallbacks

- **Metal Prices**: Recent market values for gold and silver
- **Exchange Rates**: Comprehensive table of currency conversion rates
- **Nisab Thresholds**: Conservative fallback values for Zakat calculation
- **Environment-specific Fallbacks**: Special handling for restricted environments (e.g., Replit)

## Caching Strategy

The application implements a multi-level caching strategy:

1. **In-memory Cache**:
   - Fast access for frequent requests
   - Configurable TTL
   - Automatic invalidation

2. **File-based Cache**:
   - Persistent storage for metal prices
   - Fallback when APIs are unavailable
   - Automatic refresh on configurable schedule

3. **Cache Validation**:
   - `CacheValidationService` ensures cache integrity
   - Prevention of future-dated entries
   - Validation against expected value ranges
   - Automatic rejection of suspicious data

4. **Cache Headers**:
   - HTTP cache headers for client-side caching
   - `stale-while-revalidate` pattern for optimal performance
   - Different TTLs for different data types

## Validation Systems

The application implements comprehensive validation through the `CacheValidationService`:

1. **Price Validation**:
   - Metal prices validated against expected ranges
   - Cryptocurrency prices checked for reasonableness
   - Stock prices validated against historical patterns

2. **Exchange Rate Validation**:
   - Rates checked against expected ranges
   - Special handling for volatile currencies
   - Detection of suspicious conversion results

3. **Timestamp Validation**:
   - Prevention of future-dated entries
   - Expiration of stale cache entries
   - Safe timestamp generation

4. **Format Validation**:
   - Type checking of API responses
   - Required field validation
   - Structural integrity checks

## Error Handling

The application implements robust error handling:

1. **Graceful Degradation**:
   - Fallback to cached data when APIs fail
   - Hardcoded values when cache is unavailable
   - User-friendly error messages

2. **Detailed Logging**:
   - Comprehensive logging of API interactions
   - Error tracking with context
   - Performance monitoring

3. **Rate Limiting**:
   - Protection against API abuse
   - Configurable limits
   - Graceful handling of rate limit errors

4. **Retry Mechanisms**:
   - Automatic retry for transient failures
   - Exponential backoff
   - Circuit breaking for persistent failures

## Security Considerations

1. **API Key Protection**:
   - No client-side exposure of API keys
   - Server-side proxying of all external API calls
   - Environment variable management

2. **Rate Limiting**:
   - Protection against abuse
   - IP-based tracking
   - Configurable limits

3. **Data Validation**:
   - Input sanitization
   - Response validation
   - Prevention of injection attacks

4. **Error Handling**:
   - No exposure of sensitive information in errors
   - Graceful handling of all error conditions
   - User-friendly error messages 