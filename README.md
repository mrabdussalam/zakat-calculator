# Zakat Guide

A comprehensive Islamic zakat calculator application built with Next.js that helps users calculate their zakat obligations based on various asset types.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Overview](#project-overview)
3. [Architecture](#architecture)
4. [Core Components](#core-components)
5. [Asset Calculators](#asset-calculators)
6. [State Management](#state-management)
7. [UI Components](#ui-components)
8. [Development Guidelines](#development-guidelines)
9. [Internationalization (i18n)](#internationalization-i18n)
10. [Testing](#testing)
11. [Deployment](#deployment)

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Overview

Zakat Guide is a comprehensive tool for calculating zakat obligations according to Islamic principles. The application handles various asset types, each with its own calculation logic, and provides a centralized dashboard for viewing zakat obligations.

### Key Features

- Multiple asset type calculators (Cash, Precious Metals, Stocks, Real Estate, Cryptocurrency, Retirement accounts)
- Real-time calculation updates
- Customizable currency settings
- Nisab threshold tracking
- Asset breakdown and visualization
- Hawl (Islamic fiscal year) status tracking
- Responsive design for all devices

## Architecture

The project follows a layered architecture as illustrated below:

```
+-------------------------------------------------------------------+
|                           UI LAYER                                 |
|  +----------------+    +----------------+    +----------------+    |
|  |     Cash       |    |    Metals     |    |    Summary    |     |
|  |   Calculator   |    |   Calculator  |    |   Component   |     |
|  +--------+-------+    +--------+-------+    +--------+-------+   |
+----------|--------------------|------------------|------------------+
           |                    |                 |
           v                    v                 v
+-------------------------------------------------------------------+
|                         STORE LAYER                               |
|  +----------------+    +----------------+    +----------------+    |
|  |    Values     |    |     State     |    |   Computed    |     |
|  |  cashValues   |<-->|   hawlStatus  |<-->|    Results    |     |
|  | metalsValues  |    |    prices     |    |               |     |
|  +--------+-------+    +--------+-------+    +--------+-------+   |
+----------|--------------------|------------------|------------------+
           |                    |                 |
           v                    v                 v
+-------------------------------------------------------------------+
|                      ASSET TYPE SYSTEM                            |
|  +----------------+    +----------------+    +----------------+    |
|  |    Registry    |    |   Asset Type  |    |     Asset     |     |
|  |               |<-->|   Interface   |<-->| Implementations |     |
|  |  getAssetType  |    |              |    |  cash/metals   |     |
|  +--------+-------+    +--------+-------+    +--------+-------+   |
+----------|--------------------|------------------|------------------+
           |                    |                 |
           v                    v                 v
+-------------------------------------------------------------------+
|                     CALCULATION LAYER                             |
|  +----------------+    +----------------+    +----------------+    |
|  |   Business    |    |  Calculation  |    |    Shared     |     |
|  |    Rules     |<-->|    Logic      |<-->|   Utilities   |     |
|  |  NISAB/HAWL  |    |              |    |               |     |
|  +----------------+    +----------------+    +----------------+    |
+-------------------------------------------------------------------+
```

### Directory Structure

- `/src/app`: Next.js app router pages and layouts
- `/src/components`: UI components organized by feature
  - `/calculators`: Asset-specific calculator components
  - `/dashboard`: Summary and visualization components
  - `/ui`: Base UI components (buttons, inputs, etc.)
- `/src/store`: State management using Zustand
  - `/modules`: Asset-specific store logic
  - `/types`: TypeScript interfaces for the store
- `/src/lib`: Utility functions and shared logic
- `/src/services`: External service integrations (APIs, etc.)
- `/src/types`: Global TypeScript type definitions

## Core Components

### 1. App Pages

- **Home Page** (`src/app/page.tsx`): Entry point with setup and asset selection
- **Dashboard** (`src/app/dashboard/page.tsx`): Main calculator interface with all asset types

### 2. State Management

Zakat Guide uses Zustand for state management with:

- **Main Store** (`src/store/zakatStore.ts`): Central state store with modules for each asset type
- **Persisted State**: Local storage persistence for saving user data
- **Module System**: Separate business logic for each asset type

### 3. Asset Type System

Each asset type implements a standardized interface:

- **Asset Interfaces**: Defined in `src/store/types.ts`
- **Asset Implementation**: In respective modules under `src/store/modules/`
- **Asset Registry**: Dynamic loading of asset calculators

## Asset Calculators

The application includes the following asset calculators:

### 1. Cash Calculator

- Tracks cash on hand, checking accounts, savings accounts, and digital wallets
- Supports multiple currencies with real-time conversion
- Handles foreign currency holdings

### 2. Precious Metals

- Gold and silver calculations based on market prices
- Supports investment, personal use, and occasional use categories
- Automatic nisab threshold calculation

### 3. Stocks

- Active trading vs long-term investment calculations
- Company financial data integration
- Dividend tracking

### 4. Real Estate

- Rental property calculation
- Property for sale vs personal residence handling
- Income and expense tracking

### 5. Cryptocurrency

- Support for multiple cryptocurrencies
- Market value integration
- Trading vs holding distinction

### 6. Retirement Accounts

- Traditional vs Roth accounts
- Tax and penalty considerations
- Customizable withdrawal assumptions

## State Management

### Zakat Store Structure

The main store (`zakatStore.ts`) combines multiple slices:

```typescript
export interface ZakatState {
  // Core data
  currency: string
  
  // Asset values
  cashValues: CashValues
  metalsValues: MetalsValues
  stockValues: StockValues
  realEstateValues: RealEstateValues
  retirementValues: RetirementValues
  cryptoValues: CryptoValues
  
  // Hawl status per asset type
  cashHawlMet: boolean
  metalsHawlMet: boolean
  stockHawlMet: boolean
  realEstateHawlMet: boolean
  retirementHawlMet: boolean
  cryptoHawlMet: boolean
  
  // Functions
  getBreakdown: () => ZakatBreakdown
  reset: () => void
  // And many more asset-specific functions
}
```

### Data Flow

1. User inputs values in calculator components
2. Store updates via setter functions
3. Computed values recalculate automatically
4. UI components read from store and display updated values
5. Breakdown data is generated for summary components

## UI Components

### 1. Calculator Components

Each asset type has a dedicated calculator component in `/src/components/calculators/` with:

- Input fields for asset details
- Real-time validation
- Value conversion
- Help text and guidance

### 2. Dashboard Components

- **Summary** (`/src/components/dashboard/Summary`): Displays total zakat due
- **Asset Distribution** (`/src/components/dashboard/Summary/AssetDistribution`): Visual breakdown
- **Breakdown Table** (`/src/components/dashboard/Summary/BreakdownTable`): Detailed asset list
- **Nisab Status** (`/src/components/dashboard/Summary/NisabStatus`): Threshold tracking

### 3. Shared UI

- **CurrencySelector**: Robust currency selection with formatting
- **Input Components**: Form inputs with validation
- **Tooltips**: Contextual help system

## Development Guidelines

### 1. UI Layer

- Components must be client-side (`'use client'`)
- Use base UI components from `src/components/ui/`
- Keep form logic separate from calculation logic
- Handle user input validation at this layer

### 2. Store Layer

- Single source of truth (zakatStore)
- All state mutations through setters
- Computed values update automatically
- Persist only necessary state

### 3. Asset Type System

- Each asset type implements AssetType interface
- Register new assets in registry.ts
- Keep asset-specific logic self-contained
- Use shared utilities for common calculations

### 4. Calculation Layer

- Business rules in constants/types
- Asset-specific calculations in implementations
- Shared utilities for common operations
- Maintain type safety throughout

### When Adding New Asset Types

1. Create module in `src/store/modules/`
2. Define types in `src/store/types.ts`
3. Implement calculator component in `src/components/calculators/`
4. Add to the asset registry
5. Create appropriate tests

## Testing

Run the test suite with:

```bash
npm test
```

The testing architecture includes:

- Unit tests for calculation logic
- Component tests for UI
- Integration tests for store updates
- Validation tests for all asset types

## Deployment

The Zakat Guide application can be deployed using Vercel:

```bash
npm run build
```

For production deployment, configure appropriate environment variables in `.env.production`.

## Internationalization (i18n)

The application uses [next-intl](https://next-intl-docs.vercel.app/) for internationalization. Locale selection is stored in a cookie and `localStorage` so the server can pre-render in the correct language without changing any URLs.

### Current languages

| Code | Language |
|------|----------|
| `en` | English (default) |
| `ru` | Русский (Russian) |

### Adding a new language

Follow these four steps to add a new language to the application.

**1. Register the locale**

Open `src/i18n/config.ts` and add the new locale code to the `locales` array:

```ts
// src/i18n/config.ts
export const locales = ['en', 'ru', 'ar'] as const  // e.g. adding Arabic
```

**2. Create the translation file**

Copy the English base file and translate every value:

```bash
cp messages/en.json messages/ar.json
```

Then open `messages/ar.json` and replace every English string with its translation. The file is organised into namespaced sections that mirror the UI:

```
messages/
├── en.json          # English (base locale — do not delete keys from here)
├── ru.json          # Russian
└── ar.json          # ← your new file
```

Key sections to translate:

| Section | Covers |
|---------|--------|
| `common` | Shared labels (buttons, nav, footer) |
| `home` | Landing page |
| `about` | About page |
| `dashboard` | Dashboard shell |
| `summary` | Summary panel and Nisab status |
| `assetList` | Asset sidebar names and descriptions |
| `calculatorNav` | Calculator tab labels |
| `cash` | Cash & equivalents calculator |
| `metals` | Precious metals calculator |
| `stocks` | Stocks & investments calculator |
| `retirement` | Retirement accounts calculator |
| `realEstate` | Real estate calculator |
| `crypto` | Cryptocurrency calculator |
| `report` | PDF report generator |
| `distribution` | Zakat distribution planner |
| `hawl` | Hawl status labels |
| `nisab` | Nisab threshold labels |
| `languageSwitcher` | Language switcher UI (add the new language name here) |

> **Tip:** Keep all keys present. If a translation is not yet available, copy the English string as a placeholder — `next-intl` will throw an error at runtime for any missing key.

**3. Add the language to the switcher**

Open `src/components/ui/LanguageSwitcher.tsx` and add the display name and flag:

```ts
// Native display name (shown in the dropdown in the language's own script)
const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
  ar: 'العربية',   // ← add this
}

// Country flag emoji
const LANGUAGE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  ru: '🇷🇺',
  ar: '🇸🇦',        // ← add this
}
```

Also add the display name to the `languageSwitcher.languages` object in your new `messages/ar.json`:

```json
"languageSwitcher": {
  "label": "اللغة",
  "languages": {
    "en": "English",
    "ru": "Русский",
    "ar": "العربية"
  }
}
```

**4. (Optional) Enable RTL layout**

For right-to-left languages (Arabic, Urdu, Hebrew, etc.), update `src/app/layout.tsx` to set the `dir` attribute on the `<html>` element based on the active locale:

```ts
// src/app/layout.tsx
const RTL_LOCALES = ['ar', 'ur', 'he']
const dir = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr'

// Then in the JSX:
<html lang={locale} dir={dir} suppressHydrationWarning>
```

After completing these steps, the new language will appear in the language switcher on the home page and all translated strings will be applied across the entire application.

### Currency support

In addition to language translations, the application includes robust multi-currency support:

- Real-time currency conversion via API
- Currency formatting according to locale
- Support for various number formats
- Customizable currency display options

---

For more detailed information, refer to the [Asset Calculator Guidelines](./ASSET_CALCULATOR_GUIDELINES.md) and [Flow Documentation](./flow.md).

