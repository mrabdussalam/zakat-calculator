# Calculators Module Documentation

## Overview

The calculators module is the core functionality of the Zakat Guide application, providing specialized UI components and calculation logic for various asset types that require zakat calculations. Each calculator is designed to handle specific asset types with their unique properties and calculation rules according to Islamic principles.

## Table of Contents

1. [Folder Structure](#folder-structure)
2. [Supported Asset Types](#supported-asset-types)
3. [Calculator Architecture](#calculator-architecture)
4. [State Management](#state-management)
5. [Core Features](#core-features)
6. [Validation System](#validation-system)
7. [Connections with Other Components](#connections-with-other-components)
8. [Adding New Calculators](#adding-new-calculators)
9. [Testing Guidelines](#testing-guidelines)

## Folder Structure

The calculators are organized in the following structure:

```
src/components/calculators/
├── cash/
│   ├── CashCalculator.tsx        # Main component for cash calculator
│   └── types.ts                  # Type definitions specific to cash calculator
├── precious-metals/
│   ├── PreciousMetalsCalculator.tsx
│   └── types.ts
├── stocks/
│   ├── StocksCalculator.tsx
│   └── ...
├── realestate/
│   ├── RealEstateCalculator.tsx
│   └── ...
├── crypto/
│   ├── CryptoCalculator.tsx
│   └── ...
└── retirement/
    ├── RetirementCalculator.tsx
    └── ...
```

Each calculator folder contains:
- Main component file (e.g., `CashCalculator.tsx`)
- Type definitions specific to that calculator
- Helper components or utilities as needed

## Supported Asset Types

The application currently supports the following asset calculators:

1. **Cash** - For physical cash, bank accounts, digital wallets, and foreign currencies
2. **Precious Metals** - For gold and silver in various forms (jewelry, investment, etc.)
3. **Stocks** - For publicly traded stocks, ETFs, and investment funds
4. **Real Estate** - For property investments, rental income, and property for sale
5. **Cryptocurrency** - For digital currencies and tokens
6. **Retirement Accounts** - For various retirement vehicles (401k, IRA, etc.)

Each asset type is registered in the `AssetRegistry` system (`src/lib/assets/registry.ts`), which maintains a centralized list of all supported assets with their metadata, calculation functions, and display properties.

## Calculator Architecture

Each calculator follows a consistent architecture:

### Component Structure
- **Main Calculator Component** - Container component that manages UI state and interactions
- **Input Fields** - For data entry with validation and formatting
- **Display Components** - For showing calculated values and summaries
- **Helper Functions** - For calculations, validation, and formatting

### Common Patterns
All calculators implement a consistent pattern:
- User input collection and validation
- State synchronization with the store
- Calculation of zakatable amounts
- Breakdown generation for summary displays
- Hawl status tracking and persistence
- Reset functionality

### Common Features
- Currency handling and conversion
- Input validation
- Field-level error handling
- Summary calculations
- Hawl (Islamic fiscal year) status tracking
- Reset functionality
- Currency formatting

## State Management

Calculators use a central Zustand-based store (`zakatStore`) with slices for each asset type:

### Store Organization
- **Store Modules** (`src/store/modules/`)
  - `cash.ts`
  - `metals.ts`
  - `stocks.ts`
  - `retirement.ts`
  - `realEstate.ts`
  - `crypto.ts`
  - `nisab.ts` (for threshold calculations)

### State Types
Each asset type has its own typed state interface:
- `CashValues` - For cash calculator state
- `MetalsValues` - For precious metals calculator
- `StockValues` - For stock calculator
- etc.

### Data Flow
1. User inputs values in calculator UI
2. Component calls store actions (e.g., `setCashValue`)
3. Store updates state and recalculates derived values
4. Components read updated values via hooks/selectors

### Store Features
- Persistence using Zustand persist middleware
- Type-safe actions and state
- Computed values for totals and breakdowns
- Currency-specific calculations
- History tracking for state changes

## Core Features

### Calculation Logic
- **Asset-specific formulas** - Each calculator implements specific zakat calculation rules
- **Exemption handling** - Logic for determining what portions are zakatable
- **Nisab threshold comparison** - To determine if zakat is due

### UI State Management
- **Form state** - Managing input values, validation, and submission
- **Loading states** - For asynchronous operations like currency conversion
- **Error handling** - For API failures, validation errors, etc.

### External APIs and Fallbacks
- **Currency conversion** - Integration with exchange rate APIs
- **Market prices** - For metals, stocks, and cryptocurrencies
- **Fallback mechanisms** - For when external APIs are unavailable
- **Caching** - To minimize API calls

## Validation System

The calculators implement a comprehensive validation system to ensure data integrity:

### Validation Architecture
- **Template-based validation** (`src/lib/validation/templates/calculatorValidation.ts`)
- **Asset-specific validators** (`src/lib/validation/calculators/`)
- **Runtime validation** during user input and calculation

### Validation Types
1. **Required Fields Validation** - Ensures all required fields have values
2. **Numeric Field Validation** - Validates that numeric fields contain valid numbers and are not negative
3. **Boolean Field Validation** - Ensures boolean fields have proper values
4. **Custom Validation Rules** - Asset-specific validation logic

### Validation Implementation
Each asset type has its own validation module:
- `cashValidation.ts` - For cash assets
- `metalsValidation.ts` - For precious metals
- `cryptoValidation.ts` - For cryptocurrency
- `realEstateValidation.ts` - For real estate
- `retirementValidation.ts` - For retirement accounts
- `stocksValidation.ts` - For stocks and investments

### Validation Flow
1. User inputs data in calculator form
2. Input-level validation occurs during typing
3. Form-level validation runs before submission
4. Store-level validation ensures integrity on state changes
5. Calculation-level validation ensures correct zakat computation

### Error Handling
- Input validation errors displayed in UI
- Form submission blocked on validation failures
- Console warnings for non-critical validation errors
- Full error details available in validation results

## Connections with Other Components

Calculators interact with several other system components:

### Dashboard Integration
- Calculators feed data to the dashboard summary
- Dashboard components (`src/components/dashboard/`) access calculator state via store hooks
- Summary displays and charts are updated based on calculator data

### Asset Registry
- Integration with `AssetRegistry` (`src/lib/assets/registry.ts`) for asset type definitions
- Types and metadata consistent across calculators and registry
- Asset registry provides calculation functions used by both calculators and summary displays

### Currency Services
- All calculators use `currencyService` (`src/lib/services/currency.ts`) for formatting and conversion
- International currency support across all calculators
- Currency selection affects all calculators simultaneously

### Summary Components
- Calculators provide breakdown data for summary displays
- Summary components consume calculated totals and breakdowns
- Breakdown objects follow a standardized format

### Navigation System
- Calculators integrate with the app's navigation system
- State persistence during navigation between calculators
- Tab-based navigation with state preservation

### Nisab Threshold System
- Calculators interact with the Nisab threshold system (`src/store/modules/nisab.ts`)
- Nisab values for gold and silver are fetched from external APIs
- Calculators compare totals against current Nisab thresholds

### Data Persistence Layer
- Calculator state persists across sessions via Zustand's persist middleware
- Local storage used for state persistence
- Migration strategies for handling state version changes

## Adding New Calculators

To add a new calculator:

1. Create a new folder in `src/components/calculators/`
2. Define types in `types.ts`
3. Create store module in `src/store/modules/`
4. Implement calculator component
5. Add validation in `src/lib/validation/calculators/`
6. Add asset type to `src/lib/assets/registry.ts`
7. Update `src/store/types.ts` with new interfaces
8. Add to navigation
9. Create tests

See `ASSET_CALCULATOR_GUIDELINES.md` for detailed instructions.

## Testing Guidelines

Each calculator should have comprehensive tests:

1. **Unit tests** - For calculation logic
2. **Integration tests** - For store interactions
3. **UI tests** - For component rendering and user interactions
4. **Validation tests** - For input handling and error conditions
5. **Edge cases** - For boundary conditions and special cases

Tests should verify:
- Initial state
- State updates
- Calculation accuracy
- Currency formatting
- Hawl status handling
- Breakdown generation
- Reset functionality
- Validation logic
- Error handling

## Value Verification Checklist

When implementing or modifying calculators, use the following checklist:

### 1. UI State Synchronization
- Initial values loaded from store
- Values update when accessibility changes
- Values update when withdrawn status changes
- Values update when amounts change
- Values update when tax/penalty rates change
- Values sync between calculator and summary

### 2. Summary Display
- Total Assets shows correct gross balance
- Zakatable Amount shows correct net amount
- Zakat Due shows accurate 2.5% calculation
- Breakdown items match stored values
- Asset distribution percentages are accurate
- Currency formatting is consistent across all displays

### 3. Edge Cases
- Zero values handled correctly
- Negative values prevented
- Maximum value limits enforced
- Invalid input properly handled
- Extremely large numbers formatted correctly
- Decimal precision consistent across calculations 