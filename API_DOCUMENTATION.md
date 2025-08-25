# Zakat Guide - Complete API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Public APIs](#public-apis)
3. [React Components](#react-components)
4. [Custom Hooks](#custom-hooks)
5. [Store & State Management](#store--state-management)
6. [TypeScript Interfaces](#typescript-interfaces)
7. [Utility Functions](#utility-functions)
8. [Validation System](#validation-system)
9. [Services](#services)
10. [Usage Examples](#usage-examples)

---

## Overview

The Zakat Guide application is a comprehensive Islamic Zakat calculator built with Next.js, TypeScript, and Zustand for state management. This documentation covers all public APIs, components, hooks, and utilities available for developers.

### Core Technologies
- **Framework**: Next.js 15.1.7
- **State Management**: Zustand 5.0.3
- **UI Components**: Radix UI + Custom Components
- **Styling**: Tailwind CSS
- **Validation**: Custom validation system
- **Currency**: Multi-currency support with real-time conversion

---

## Public APIs

### Internal API Endpoints

All API endpoints return JSON responses and handle errors gracefully with fallback mechanisms.

#### `/api/prices/metals`
Fetches current gold and silver prices with multi-source fallback.

**Method**: `GET`

**Query Parameters**:
```typescript
interface MetalsPriceParams {
  currency?: string;  // Target currency (default: USD)
  refresh?: boolean;  // Force refresh cached data
}
```

**Response**:
```typescript
interface MetalsPriceResponse {
  gold: number;
  silver: number;
  currency: string;
  lastUpdated: string;
  source: string;
  isCache?: boolean;
}
```

**Example Usage**:
```javascript
// Fetch metal prices in USD
const response = await fetch('/api/prices/metals');
const data = await response.json();

// Fetch in specific currency with refresh
const response = await fetch('/api/prices/metals?currency=EUR&refresh=true');
```

#### `/api/prices/crypto`
Fetches cryptocurrency prices using CoinGecko API.

**Method**: `GET`

**Query Parameters**:
```typescript
interface CryptoPriceParams {
  currency?: string;  // Target currency (default: USD)
  ids?: string;       // Comma-separated crypto IDs
}
```

**Response**:
```typescript
interface CryptoPriceResponse {
  [cryptoId: string]: {
    [currency: string]: number;
  };
}
```

#### `/api/prices/stocks`
Fetches stock prices using Yahoo Finance API.

**Method**: `GET`

**Query Parameters**:
```typescript
interface StockPriceParams {
  symbol: string;     // Stock symbol (required)
  currency?: string;  // Target currency (default: USD)
}
```

**Response**:
```typescript
interface StockPriceResponse {
  symbol: string;
  price: number;
  currency: string;
  lastUpdated: string;
}
```

#### `/api/nisab`
Calculates Nisab thresholds based on current metal prices.

**Method**: `GET`

**Query Parameters**:
```typescript
interface NisabParams {
  currency?: string;  // Target currency (default: USD)
}
```

**Response**:
```typescript
interface NisabResponse {
  nisabThreshold: number;
  silverPrice: number;
  goldPrice: number;
  currency: string;
  timestamp: string;
  source: string;
  metalPrices?: {
    gold: number;
    silver: number;
  };
}
```

#### `/api/search/stocks`
Searches for stocks using Yahoo Finance.

**Method**: `GET`

**Query Parameters**:
```typescript
interface StockSearchParams {
  q: string;          // Search query (required)
  limit?: number;     // Number of results (default: 10)
}
```

**Response**:
```typescript
interface StockSearchResponse {
  stocks: Array<{
    symbol: string;
    name: string;
    exchange: string;
  }>;
}
```

---

## React Components

### Calculator Components

#### `CashCalculator`
Main calculator for cash and liquid assets.

**Location**: `src/components/calculators/cash/CashCalculator.tsx`

**Props**:
```typescript
interface CashCalculatorProps {
  // No external props - uses store directly
}
```

**Features**:
- Cash on hand tracking
- Bank account balances
- Digital wallet balances
- Foreign currency conversion
- Real-time validation
- Mathematical expression support

**Usage**:
```jsx
import { CashCalculator } from '@/components/calculators/cash/CashCalculator';

function Dashboard() {
  return (
    <div>
      <CashCalculator />
    </div>
  );
}
```

#### `PreciousMetalsCalculator`
Calculator for gold and silver assets.

**Location**: `src/components/calculators/precious-metals/`

**Props**:
```typescript
interface MetalsCalculatorProps {
  currency: string;
  metalPrices?: {
    gold: number;
    silver: number;
  };
}
```

**Features**:
- Gold/silver weight tracking
- Purity calculations (14K, 18K, 22K, 24K)
- Investment vs personal use categories
- Real-time price fetching
- Weight unit conversion

#### `StocksCalculator`
Calculator for stock and equity investments.

**Location**: `src/components/calculators/stocks/`

**Props**:
```typescript
interface StocksCalculatorProps {
  // Uses store-based state management
}
```

**Features**:
- Individual stock tracking
- Company financial data
- Active vs passive investment classification
- Dividend tracking
- Real-time price updates

### Dashboard Components

#### `Summary`
Main summary component displaying total Zakat calculations.

**Location**: `src/components/dashboard/Summary/index.tsx`

**Props**:
```typescript
interface SummaryProps {
  currency: string;
}
```

**Sub-components**:
- `TotalHeader`: Displays total Zakat due
- `NisabStatus`: Shows Nisab threshold status
- `AssetDistribution`: Visual breakdown of assets
- `BreakdownTable`: Detailed asset list

**Usage**:
```jsx
import { Summary } from '@/components/dashboard/Summary';

function Dashboard() {
  const currency = 'USD';
  return <Summary currency={currency} />;
}
```

#### `NisabStatus`
Displays whether user meets Nisab threshold.

**Location**: `src/components/dashboard/Summary/NisabStatus.tsx`

**Props**:
```typescript
interface NisabStatusProps {
  nisabStatus: {
    meetsNisab: boolean;
    totalValue: number;
    nisabValue: number;
    thresholds: {
      gold: number;
      silver: number;
    };
  };
  currency: string;
}
```

### UI Components

#### `Button`
Reusable button component with variants.

**Location**: `src/components/ui/button.tsx`

**Props**:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}
```

**Usage**:
```jsx
import { Button } from '@/components/ui/button';

// Basic button
<Button onClick={handleClick}>Click me</Button>

// Button variants
<Button variant="outline" size="lg">Large Outline</Button>
<Button variant="destructive">Delete</Button>
```

#### `Input`
Form input component with validation.

**Location**: `src/components/ui/form/input.tsx`

**Props**:
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  description?: string;
}
```

#### `CurrencySelector`
Currency selection component with real-time conversion.

**Location**: `src/components/CurrencySelector.tsx`

**Props**:
```typescript
interface CurrencySelectorProps {
  currency: string;
  onCurrencyChange: (currency: string) => void;
  currencies?: string[];
  showLabel?: boolean;
}
```

**Features**:
- 19 supported currencies
- Real-time exchange rates
- Fallback mechanisms
- Currency validation

---

## Custom Hooks

### `useNisabStatus`
Manages Nisab threshold calculations and status.

**Location**: `src/hooks/useNisabStatus.ts`

**Parameters**:
```typescript
interface UseNisabStatusParams {
  nisabStatus: {
    meetsNisab: boolean;
    totalValue: number;
    nisabValue: number;
    thresholds: {
      gold: number;
      silver: number;
    };
    currency?: string;
  };
  currency: string;
}
```

**Returns**:
```typescript
interface NisabStatusHookResult {
  // State
  convertedValues: NisabValues;
  isFetching: boolean;
  isOfflineMode: boolean;
  errorMessage: string | null;
  lastFetchTime: number;
  retryCount: number;
  meetsNisab: boolean;
  componentKey: number;

  // Actions
  handleRefresh: () => void;
  handleManualCurrencyUpdate: (currency: string, isReplitEnv?: boolean) => Promise<void>;
  forceImmediateUpdate: (forceRefresh?: boolean) => Promise<void>;
  updateLocalNisabValues: (prices: ExtendedMetalPrices) => void;
  getNisabStatusMessage: () => string;
  getNisabMetalUsed: () => "gold" | "silver";
  calculateMoreNeeded: () => number;
  getUserFriendlyErrorMessage: () => string | null;
  setComponentKey: (key: number) => void;
  hasSuspiciouslyLowValues: (currency: string, goldThreshold?: number, silverThreshold?: number) => boolean;
}
```

**Usage**:
```typescript
import { useNisabStatus } from '@/hooks/useNisabStatus';

function NisabComponent() {
  const nisabStatus = useZakatStore(state => state.getNisabStatus());
  const currency = useZakatStore(state => state.currency);
  
  const {
    convertedValues,
    isFetching,
    meetsNisab,
    handleRefresh,
    getNisabStatusMessage
  } = useNisabStatus(nisabStatus, currency);

  return (
    <div>
      <p>Status: {getNisabStatusMessage()}</p>
      <p>Meets Nisab: {meetsNisab ? 'Yes' : 'No'}</p>
      <button onClick={handleRefresh} disabled={isFetching}>
        Refresh Prices
      </button>
    </div>
  );
}
```

### `useForeignCurrency`
Manages foreign currency entries and conversions.

**Location**: `src/hooks/useForeignCurrency.tsx`

**Parameters**:
```typescript
interface UseForeignCurrencyProps {
  currency: string;
  storeEntries: ForeignCurrencyEntry[] | undefined;
  storeTotal: number;
  convertAmount: (amount: number, from: string, to: string) => number;
  updateStore: (entries: ForeignCurrencyEntry[], total: number) => void;
}
```

**Returns**:
```typescript
interface UseForeignCurrencyResult {
  foreignCurrencies: ForeignCurrencyEntry[];
  total: number;
  isConverting: boolean;
  handleAmountChange: (index: number, value: string) => void;
  handleCurrencyChange: (index: number, currency: string) => void;
  addCurrency: () => void;
  removeCurrency: (index: number) => void;
  convertAll: () => void;
}
```

### `useStoreHydration`
Manages Zustand store hydration status.

**Location**: `src/hooks/useStoreHydration.ts`

**Returns**:
```typescript
function useStoreHydration(): boolean
```

**Usage**:
```typescript
import { useStoreHydration } from '@/hooks/useStoreHydration';

function App() {
  const isHydrated = useStoreHydration();
  
  if (!isHydrated) {
    return <LoadingSpinner />;
  }
  
  return <MainApp />;
}
```

---

## Store & State Management

### Main Store: `useZakatStore`
Central Zustand store managing all application state.

**Location**: `src/store/zakatStore.ts`

**Store Structure**:
```typescript
interface ZakatState extends 
  CashSlice,
  MetalsSlice,
  StocksSlice,
  NisabSlice,
  RetirementSlice,
  RealEstateSlice,
  CryptoSlice,
  DistributionSlice {
  
  // Global settings
  currency: string;
  
  // Asset values
  cashValues: CashValues;
  metalsValues: MetalsValues;
  stockValues: StockValues;
  realEstateValues: RealEstateValues;
  retirementValues: RetirementValues;
  cryptoValues: CryptoValues;
  
  // Hawl status (Islamic year requirement)
  cashHawlMet: boolean;
  metalsHawlMet: boolean;
  stockHawlMet: boolean;
  realEstateHawlMet: boolean;
  retirementHawlMet: boolean;
  cryptoHawlMet: boolean;
  
  // Core methods
  getBreakdown: () => ZakatBreakdown;
  reset: () => void;
}
```

**Key Methods**:

#### Global Methods
```typescript
// Get complete Zakat breakdown
getBreakdown(): ZakatBreakdown

// Reset all values
reset(): void

// Currency management
setCurrency(currency: string): void
```

#### Cash Methods
```typescript
// Update cash values
updateCashValues(values: Partial<CashValues>): void

// Get cash totals
getTotalCash(): number
getCashBreakdown(): AssetBreakdown

// Foreign currency
updateForeignCurrency(entries: ForeignCurrencyEntry[], total: number): void
```

#### Metals Methods
```typescript
// Update metals values
updateMetalsValues(values: Partial<MetalsValues>): void

// Get metals calculations
getTotalMetals(): number
getMetalsBreakdown(): AssetBreakdown

// Price management
setMetalPrices(prices: MetalPrices): void
fetchNisabData(): Promise<void>
```

#### Stocks Methods
```typescript
// Update stock values
updateStockValues(values: Partial<StockValues>): void

// Stock management
addActiveStock(stock: ActiveStock): void
updateActiveStock(index: number, stock: Partial<ActiveStock>): void
removeActiveStock(index: number): void

// Get calculations
getTotalStocks(): number
getStockBreakdown(): AssetBreakdown
```

**Usage**:
```typescript
import { useZakatStore } from '@/store/zakatStore';

function Component() {
  // Select specific state
  const currency = useZakatStore(state => state.currency);
  const totalCash = useZakatStore(state => state.getTotalCash());
  const breakdown = useZakatStore(state => state.getBreakdown());
  
  // Select actions
  const updateCash = useZakatStore(state => state.updateCashValues);
  const setCurrency = useZakatStore(state => state.setCurrency);
  
  // Usage
  const handleCashUpdate = (values: CashValues) => {
    updateCash(values);
  };
  
  return (
    <div>
      <p>Currency: {currency}</p>
      <p>Total Cash: {totalCash}</p>
    </div>
  );
}
```

### Store Modules

The store is organized into modules for better maintainability:

#### Cash Module (`src/store/modules/cash.ts`)
```typescript
interface CashSlice {
  cashValues: CashValues;
  updateCashValues: (values: Partial<CashValues>) => void;
  getTotalCash: () => number;
  getCashBreakdown: () => AssetBreakdown;
  updateForeignCurrency: (entries: ForeignCurrencyEntry[], total: number) => void;
}
```

#### Metals Module (`src/store/modules/metals.ts`)
```typescript
interface MetalsSlice {
  metalsValues: MetalsValues;
  metalPrices: MetalPrices | null;
  updateMetalsValues: (values: Partial<MetalsValues>) => void;
  setMetalPrices: (prices: MetalPrices) => void;
  getTotalMetals: () => number;
  getMetalsBreakdown: () => AssetBreakdown;
}
```

#### Stocks Module (`src/store/modules/stocks.ts`)
```typescript
interface StocksSlice {
  stockValues: StockValues;
  stockPrices: StockPrices | null;
  updateStockValues: (values: Partial<StockValues>) => void;
  addActiveStock: (stock: ActiveStock) => void;
  updateActiveStock: (index: number, stock: Partial<ActiveStock>) => void;
  removeActiveStock: (index: number) => void;
  getTotalStocks: () => number;
  getStockBreakdown: () => AssetBreakdown;
}
```

---

## TypeScript Interfaces

### Core Asset Types

#### `CashValues`
```typescript
interface CashValues {
  cash_on_hand: number;
  checking_account: number;
  savings_account: number;
  digital_wallets: number;
  foreign_currency: number;
  foreign_currency_entries: ForeignCurrencyEntry[];
}

interface ForeignCurrencyEntry {
  amount: number;
  currency: string;
  rawInput: string;
}
```

#### `MetalsValues`
```typescript
interface MetalsValues {
  gold_regular: number;
  gold_occasional: number;
  gold_investment: number;
  silver_regular: number;
  silver_occasional: number;
  silver_investment: number;
}

interface MetalPrices {
  gold: number;
  silver: number;
  lastUpdated: Date;
  isCache: boolean;
  source?: string;
  currency: string;
}
```

#### `StockValues`
```typescript
interface StockValues {
  active_shares: number;
  active_price_per_share: number;
  passive_shares: number;
  company_cash: number;
  company_receivables: number;
  company_inventory: number;
  total_shares_issued: number;
  total_dividend_earnings: number;
  dividend_per_share: number;
  dividend_shares: number;
  fund_value: number;
  is_passive_fund: boolean;
  activeStocks: ActiveStock[];
  market_value: number;
  zakatable_value: number;
  price_per_share: number;
}

interface ActiveStock extends StockHolding {
  lastUpdated?: string;
  currency?: string;
  symbol: string;
  marketValue: number;
  zakatDue: number;
}
```

### Breakdown Types

#### `AssetBreakdown`
```typescript
interface AssetBreakdown {
  total: number;
  zakatable: number;
  zakatDue: number;
  items: Record<string, AssetBreakdownItem>;
}

interface AssetBreakdownItem {
  value: number;
  isZakatable: boolean;
  zakatable: number;
  zakatDue: number;
  label: string;
  tooltip?: string;
  isExempt?: boolean;
}
```

#### `ZakatBreakdown`
```typescript
interface ZakatBreakdown {
  totalAssets: number;
  totalZakatable: number;
  totalZakatDue: number;
  assets: {
    cash: AssetBreakdownWithHawl;
    metals: AssetBreakdownWithHawl;
    stocks: AssetBreakdownWithHawl;
    realEstate: AssetBreakdownWithHawl;
    retirement: AssetBreakdownWithHawl;
    crypto: AssetBreakdownWithHawl;
  };
  nisabStatus: {
    meetsNisab: boolean;
    totalValue: number;
    nisabValue: number;
    thresholds: {
      gold: number;
      silver: number;
    };
  };
}

interface AssetBreakdownWithHawl extends AssetBreakdown {
  hawlMet: boolean;
  assetType: string;
  color: string;
  icon: string;
}
```

### Currency Types

#### `CurrencyConversion`
```typescript
interface CurrencyConversion {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}

interface ExchangeRates {
  [currency: string]: number;
}
```

---

## Utility Functions

### Core Utilities (`src/lib/utils.ts`)

#### `formatCurrency`
Formats numbers as currency with proper locale support.

```typescript
function formatCurrency(amount: number, currency: string = 'USD'): string
```

**Usage**:
```typescript
import { formatCurrency } from '@/lib/utils';

const formatted = formatCurrency(1234.56, 'USD'); // "$1,234.56"
const euroFormatted = formatCurrency(1234.56, 'EUR'); // "€1,234.56"
```

#### `evaluateExpression`
Safely evaluates mathematical expressions.

```typescript
function evaluateExpression(expression: string): number
```

**Usage**:
```typescript
import { evaluateExpression } from '@/lib/utils';

const result = evaluateExpression('100 + 50 * 2'); // 200
const safeResult = evaluateExpression('invalid'); // 0
```

#### `debounce`
Debounces function calls for performance optimization.

```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void)
```

**Usage**:
```typescript
import { debounce } from '@/lib/utils';

const debouncedSearch = debounce((query: string) => {
  // Search logic
}, 300);
```

#### `cn`
Utility for merging CSS classes with Tailwind CSS.

```typescript
function cn(...inputs: ClassValue[]): string
```

**Usage**:
```typescript
import { cn } from '@/lib/utils';

const className = cn(
  'base-class',
  condition && 'conditional-class',
  { 'object-class': isActive }
); // "base-class conditional-class object-class"
```

### Calculation Utilities

#### Nisab Calculations (`src/lib/utils/nisabCalculations.ts`)
```typescript
function calculateNisabThresholds(
  goldPrice: number,
  silverPrice: number,
  currency: string
): {
  goldThreshold: number;
  silverThreshold: number;
  nisabValue: number;
}
```

#### Unit Conversions (`src/lib/utils/units.ts`)
```typescript
type WeightUnit = 'grams' | 'ounces' | 'kilograms' | 'pounds';

function convertWeight(
  value: number,
  from: WeightUnit,
  to: WeightUnit
): number
```

---

## Validation System

### Calculator Validation Template

#### Base Validation (`src/lib/validation/templates/calculatorValidation.ts`)
```typescript
interface ValidationConfig<T> {
  requiredFields: (keyof T)[];
  numericalFields: (keyof T)[];
  booleanFields?: (keyof T)[];
  customValidations?: Array<(values: T) => boolean>;
  zakatableAmountOverride?: (values: T) => number;
}

function createCalculatorValidation<T>(
  config: ValidationConfig<T>
): CalculatorValidation<T>
```

#### Cash Validation (`src/lib/validation/calculators/cashValidation.ts`)
```typescript
export const cashValidation = createCalculatorValidation<CashValues>({
  requiredFields: [
    'cash_on_hand',
    'checking_account', 
    'savings_account',
    'digital_wallets',
    'foreign_currency'
  ],
  numericalFields: [
    'cash_on_hand',
    'checking_account',
    'savings_account', 
    'digital_wallets',
    'foreign_currency'
  ],
  customValidations: [
    validateNonNegative,
    validateNumericalType,
    validatePrecision,
    validateBoundaries
  ]
});
```

#### Usage
```typescript
import { cashValidation } from '@/lib/validation/calculators/cashValidation';

const values: CashValues = {
  cash_on_hand: 1000,
  checking_account: 5000,
  savings_account: 10000,
  digital_wallets: 500,
  foreign_currency: 2000,
  foreign_currency_entries: []
};

const isValid = cashValidation.validate(values);
const errors = cashValidation.getErrors(values);
const zakatableAmount = cashValidation.getZakatableAmount(values);
```

---

## Services

### Currency Conversion Service

#### `CurrencyConversionService` (`src/lib/services/currencyConversion.ts`)
```typescript
class CurrencyConversionService {
  // Convert amount between currencies
  async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number>
  
  // Get exchange rates
  async getExchangeRates(baseCurrency: string): Promise<ExchangeRates>
  
  // Check if currency is supported
  isCurrencySupported(currency: string): boolean
  
  // Get fallback rate
  getFallbackRate(from: string, to: string): number
}
```

#### Currency Store (`src/lib/services/currency.ts`)
```typescript
interface CurrencyState {
  exchangeRates: ExchangeRates;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  updateExchangeRates: (rates: ExchangeRates) => void;
  convertAmount: (amount: number, from: string, to: string) => number;
  fetchExchangeRates: (baseCurrency: string) => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>(/* implementation */);
```

### Cache Validation Service

#### `CacheValidationService` (`src/lib/services/cacheValidation.ts`)
```typescript
class CacheValidationService {
  // Validate cached data
  validateCacheData(data: any, type: 'metals' | 'crypto' | 'stocks'): boolean
  
  // Check if data is expired
  isDataExpired(timestamp: Date, maxAgeMinutes: number): boolean
  
  // Validate price ranges
  validatePriceRange(price: number, type: string, currency: string): boolean
  
  // Prevent future dates
  isFutureDate(date: Date): boolean
}
```

---

## Usage Examples

### Basic Calculator Implementation

```typescript
import React from 'react';
import { useZakatStore } from '@/store/zakatStore';
import { CashCalculator } from '@/components/calculators/cash/CashCalculator';
import { Summary } from '@/components/dashboard/Summary';

function ZakatCalculatorApp() {
  const currency = useZakatStore(state => state.currency);
  const setCurrency = useZakatStore(state => state.setCurrency);
  const breakdown = useZakatStore(state => state.getBreakdown());

  return (
    <div className="container mx-auto p-4">
      {/* Currency Selector */}
      <div className="mb-6">
        <select 
          value={currency} 
          onChange={(e) => setCurrency(e.target.value)}
          className="border rounded p-2"
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
        </select>
      </div>

      {/* Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Cash Calculator</h2>
          <CashCalculator />
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-4">Summary</h2>
          <Summary currency={currency} />
        </div>
      </div>

      {/* Breakdown Display */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Zakat Breakdown</h3>
        <div className="bg-gray-100 p-4 rounded">
          <p>Total Assets: {formatCurrency(breakdown.totalAssets, currency)}</p>
          <p>Total Zakatable: {formatCurrency(breakdown.totalZakatable, currency)}</p>
          <p>Total Zakat Due: {formatCurrency(breakdown.totalZakatDue, currency)}</p>
        </div>
      </div>
    </div>
  );
}
```

### Custom Hook Integration

```typescript
import React from 'react';
import { useNisabStatus } from '@/hooks/useNisabStatus';
import { useZakatStore } from '@/store/zakatStore';

function NisabStatusWidget() {
  const nisabStatus = useZakatStore(state => state.getNisabStatus());
  const currency = useZakatStore(state => state.currency);
  
  const {
    convertedValues,
    isFetching,
    meetsNisab,
    handleRefresh,
    getNisabStatusMessage,
    calculateMoreNeeded
  } = useNisabStatus(nisabStatus, currency);

  const moreNeeded = calculateMoreNeeded();

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-2">Nisab Status</h3>
      
      <div className="space-y-2">
        <p className={`font-medium ${meetsNisab ? 'text-green-600' : 'text-orange-600'}`}>
          {getNisabStatusMessage()}
        </p>
        
        <p>
          Total Value: {formatCurrency(convertedValues.totalValue, currency)}
        </p>
        
        <p>
          Nisab Threshold: {formatCurrency(convertedValues.nisabValue, currency)}
        </p>
        
        {!meetsNisab && moreNeeded > 0 && (
          <p className="text-sm text-gray-600">
            Need {formatCurrency(moreNeeded, currency)} more to meet Nisab
          </p>
        )}
        
        <button 
          onClick={handleRefresh} 
          disabled={isFetching}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
        >
          {isFetching ? 'Updating...' : 'Refresh Prices'}
        </button>
      </div>
    </div>
  );
}
```

### API Integration Example

```typescript
import React, { useState, useEffect } from 'react';

function MetalPricesWidget() {
  const [prices, setPrices] = useState<{gold: number, silver: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async (currency: string = 'USD') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/prices/metals?currency=${currency}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }
      
      const data = await response.json();
      setPrices({
        gold: data.gold,
        silver: data.silver
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  if (loading) return <div>Loading prices...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!prices) return <div>No price data available</div>;

  return (
    <div className="border rounded p-4">
      <h3 className="font-semibold mb-2">Current Metal Prices</h3>
      <div className="space-y-1">
        <p>Gold: ${prices.gold.toFixed(2)}/oz</p>
        <p>Silver: ${prices.silver.toFixed(2)}/oz</p>
      </div>
      <button 
        onClick={() => fetchPrices()} 
        className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm"
      >
        Refresh
      </button>
    </div>
  );
}
```

### Form Validation Example

```typescript
import React, { useState } from 'react';
import { cashValidation } from '@/lib/validation/calculators/cashValidation';
import { CashValues } from '@/store/types';

function CashForm() {
  const [values, setValues] = useState<CashValues>({
    cash_on_hand: 0,
    checking_account: 0,
    savings_account: 0,
    digital_wallets: 0,
    foreign_currency: 0,
    foreign_currency_entries: []
  });

  const [errors, setErrors] = useState<string[]>([]);

  const handleChange = (field: keyof CashValues, value: number) => {
    const newValues = { ...values, [field]: value };
    setValues(newValues);
    
    // Real-time validation
    const validationErrors = cashValidation.getErrors(newValues);
    setErrors(validationErrors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = cashValidation.validate(values);
    if (!isValid) {
      const validationErrors = cashValidation.getErrors(values);
      setErrors(validationErrors);
      return;
    }
    
    const zakatableAmount = cashValidation.getZakatableAmount(values);
    console.log('Zakatable amount:', zakatableAmount);
    
    // Submit logic here
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Cash on Hand
        </label>
        <input
          type="number"
          value={values.cash_on_hand}
          onChange={(e) => handleChange('cash_on_hand', parseFloat(e.target.value) || 0)}
          className="border rounded px-3 py-2 w-full"
          min="0"
          step="0.01"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Checking Account
        </label>
        <input
          type="number"
          value={values.checking_account}
          onChange={(e) => handleChange('checking_account', parseFloat(e.target.value) || 0)}
          className="border rounded px-3 py-2 w-full"
          min="0"
          step="0.01"
        />
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <h4 className="text-red-800 font-medium mb-1">Validation Errors:</h4>
          <ul className="text-red-700 text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="submit"
        disabled={errors.length > 0}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        Calculate Zakat
      </button>
    </form>
  );
}
```

### Complete Integration Example

```typescript
import React from 'react';
import { useZakatStore } from '@/store/zakatStore';
import { useNisabStatus } from '@/hooks/useNisabStatus';
import { useForeignCurrency } from '@/hooks/useForeignCurrency';
import { formatCurrency } from '@/lib/utils';

function CompleteZakatDashboard() {
  const store = useZakatStore();
  const {
    currency,
    cashValues,
    getTotalCash,
    updateCashValues,
    updateForeignCurrency,
    getNisabStatus,
    getBreakdown
  } = store;

  // Nisab status hook
  const nisabStatus = getNisabStatus();
  const {
    convertedValues,
    meetsNisab,
    getNisabStatusMessage
  } = useNisabStatus(nisabStatus, currency);

  // Foreign currency hook
  const {
    foreignCurrencies,
    total: foreignTotal,
    handleAmountChange,
    handleCurrencyChange,
    addCurrency,
    removeCurrency
  } = useForeignCurrency({
    currency,
    storeEntries: cashValues.foreign_currency_entries,
    storeTotal: cashValues.foreign_currency,
    convertAmount: store.convertAmount || ((amount, from, to) => amount),
    updateStore: updateForeignCurrency
  });

  // Get complete breakdown
  const breakdown = getBreakdown();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Zakat Calculator</h1>
        <p className="text-gray-600 mt-2">
          Calculate your Islamic Zakat obligations
        </p>
      </div>

      {/* Currency Selector */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Currency Settings</h2>
        <select
          value={currency}
          onChange={(e) => store.setCurrency(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="USD">USD - US Dollar</option>
          <option value="EUR">EUR - Euro</option>
          <option value="GBP">GBP - British Pound</option>
          <option value="CAD">CAD - Canadian Dollar</option>
          <option value="AUD">AUD - Australian Dollar</option>
        </select>
      </div>

      {/* Nisab Status */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Nisab Status</h2>
        <div className={`p-4 rounded-lg ${meetsNisab ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
          <p className={`font-medium ${meetsNisab ? 'text-green-800' : 'text-orange-800'}`}>
            {getNisabStatusMessage()}
          </p>
          <div className="mt-2 text-sm space-y-1">
            <p>Total Assets: {formatCurrency(convertedValues.totalValue, currency)}</p>
            <p>Nisab Threshold: {formatCurrency(convertedValues.nisabValue, currency)}</p>
          </div>
        </div>
      </div>

      {/* Cash Calculator */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Cash & Liquid Assets</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Cash on Hand</label>
            <input
              type="number"
              value={cashValues.cash_on_hand}
              onChange={(e) => updateCashValues({ 
                cash_on_hand: parseFloat(e.target.value) || 0 
              })}
              className="border rounded px-3 py-2 w-full"
              min="0"
              step="0.01"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Checking Account</label>
            <input
              type="number"
              value={cashValues.checking_account}
              onChange={(e) => updateCashValues({ 
                checking_account: parseFloat(e.target.value) || 0 
              })}
              className="border rounded px-3 py-2 w-full"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Foreign Currency Section */}
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Foreign Currency Holdings</h3>
          
          {foreignCurrencies.map((entry, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="number"
                value={entry.rawInput}
                onChange={(e) => handleAmountChange(index, e.target.value)}
                placeholder="Amount"
                className="border rounded px-3 py-2 flex-1"
              />
              <select
                value={entry.currency}
                onChange={(e) => handleCurrencyChange(index, e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="CAD">CAD</option>
              </select>
              <button
                onClick={() => removeCurrency(index)}
                className="bg-red-500 text-white px-3 py-2 rounded"
              >
                Remove
              </button>
            </div>
          ))}
          
          <button
            onClick={addCurrency}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
          >
            Add Currency
          </button>
          
          <p className="mt-3 text-sm text-gray-600">
            Foreign currency total: {formatCurrency(foreignTotal, currency)}
          </p>
        </div>

        <div className="border-t pt-4 mt-4">
          <p className="font-medium">
            Total Cash: {formatCurrency(getTotalCash(), currency)}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Zakat Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded">
            <p className="text-sm text-gray-600">Total Assets</p>
            <p className="text-xl font-bold text-blue-700">
              {formatCurrency(breakdown.totalAssets, currency)}
            </p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded">
            <p className="text-sm text-gray-600">Zakatable Amount</p>
            <p className="text-xl font-bold text-green-700">
              {formatCurrency(breakdown.totalZakatable, currency)}
            </p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded">
            <p className="text-sm text-gray-600">Zakat Due (2.5%)</p>
            <p className="text-xl font-bold text-purple-700">
              {formatCurrency(breakdown.totalZakatDue, currency)}
            </p>
          </div>
        </div>

        {/* Asset Breakdown */}
        <div className="mt-6">
          <h3 className="font-medium mb-3">Asset Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(breakdown.assets).map(([assetType, asset]) => (
              <div key={assetType} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="capitalize">{assetType}</span>
                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(asset.zakatDue, currency)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {asset.hawlMet ? '✓ Hawl Met' : '✗ Hawl Not Met'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => store.reset()}
          className="bg-gray-500 text-white px-6 py-3 rounded-lg"
        >
          Reset All Values
        </button>
        
        <button
          onClick={() => {
            // Export or print logic
            window.print();
          }}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg"
        >
          Print Summary
        </button>
      </div>
    </div>
  );
}

export default CompleteZakatDashboard;
```

---

## Best Practices

### 1. State Management
- Use Zustand selectors to prevent unnecessary re-renders
- Keep store actions simple and focused
- Use store modules for better organization

### 2. Type Safety
- Always use TypeScript interfaces for props and state
- Leverage the validation system for runtime checks
- Use generic types for reusable components

### 3. Error Handling
- Implement graceful fallbacks for API failures
- Use the validation system for form inputs
- Provide user-friendly error messages

### 4. Performance
- Use React.memo for expensive components
- Implement debouncing for user inputs
- Leverage caching mechanisms for API calls

### 5. Accessibility
- Use semantic HTML elements
- Implement proper ARIA labels
- Ensure keyboard navigation support

---

This comprehensive documentation covers all public APIs, components, hooks, and utilities in the Zakat Guide application. For specific implementation details, refer to the individual source files mentioned in each section.