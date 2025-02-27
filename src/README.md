# Source Directory Documentation

## Overview

The `src` directory contains the entire source code for the Zakat Guide application, a comprehensive Islamic zakat calculator built with Next.js. This document provides a high-level overview of the directory structure, key files, and how different components interact, with particular focus on their relationship to the calculator modules.

## Directory Structure

```
src/
├── app/                # Next.js app directory (routing and layouts)
├── components/         # React components
│   ├── calculators/    # Calculator components for different asset types
│   ├── dashboard/      # Dashboard and summary components
│   ├── ui/             # Reusable UI components
│   └── shared/         # Shared components used across the application
├── store/              # Zustand state management
│   ├── modules/        # Store slices for different asset types
│   └── types/          # TypeScript types for store state
├── lib/                # Utility functions and core logic
│   ├── assets/         # Asset type definitions and calculation logic
│   ├── validation/     # Validation system for calculators
│   └── utils/          # General utility functions
├── hooks/              # Custom React hooks
├── services/           # External service integrations
├── types/              # Global TypeScript type definitions
├── config/             # Configuration constants
├── tests/              # Test files
└── fonts/              # Font files for the application
```

## Key Folders and Their Purpose

### 1. `/app`

The Next.js app directory implements the application routing following Next.js 13+ conventions:

- **Pages**: Each route corresponds to a directory with a `page.tsx` file
- **Layouts**: Layout components that wrap pages
- **API Routes**: Server-side API endpoints defined in `route.ts` files

**Connection to Calculators**: Contains the page routes that render calculator components and manage URL parameters that might affect calculator state.

### 2. `/components`

React components organized by feature and responsibility:

#### `/components/calculators`

The heart of the application, containing all calculator implementations:

- `cash/` - Cash and bank account calculator
- `precious-metals/` - Gold and silver calculator
- `stocks/` - Stocks and investments calculator
- `realestate/` - Real estate calculator
- `crypto/` - Cryptocurrency calculator
- `retirement/` - Retirement accounts calculator

See `components/calculators/README.md` for detailed documentation on calculator implementation.

#### `/components/dashboard`

Dashboard components that display summaries of zakat calculations:

- `Summary.tsx` - Overall zakat summary
- `AssetBreakdown.tsx` - Detailed breakdown by asset type
- `ZakatStatus.tsx` - Current zakat status relative to nisab threshold
- `Charts/` - Visualization components

**Connection to Calculators**: Consumes data from calculator states through the store and displays aggregated information.

#### `/components/ui`

Reusable UI components that follow a consistent design system:

- Form components (inputs, buttons, etc.)
- Navigation components
- Layout primitives
- Modal dialogs
- Toast notifications

**Connection to Calculators**: Provides the building blocks used by calculator components to create their interfaces.

### 3. `/store`

State management using Zustand, organized into modules:

- `zakatStore.ts` - Main store definition
- `/modules/` - Individual slices for different asset types
  - `cash.ts` - Cash state and actions
  - `metals.ts` - Precious metals state
  - `stocks.ts` - Stocks state
  - etc.
- `types.ts` - Type definitions for store state

**Connection to Calculators**: The store is the backbone of calculator functionality, holding all calculator state and providing actions to update it. Calculators read from and write to their respective store slices.

### 4. `/lib`

Core business logic and utilities:

#### `/lib/assets`

Asset type definitions and calculation logic:

- `registry.ts` - Central registry of all asset types
- `cash.ts`, `stocks.ts`, etc. - Asset-specific logic
- `types.ts` - Common types for assets

**Connection to Calculators**: Provides the core calculation logic that calculators use to determine zakat amounts and generate breakdowns.

#### `/lib/validation`

Validation system for ensuring data integrity:

- `/templates/calculatorValidation.ts` - Template-based validation framework
- `/calculators/` - Validation implementations for each calculator

**Connection to Calculators**: Used by calculators to validate user input and ensure compliance with zakat rules.

#### `/lib/utils`

General utility functions:

- `currency.ts` - Currency formatting and conversion
- `math.ts` - Mathematical operations
- `dates.ts` - Date handling

**Connection to Calculators**: Provides helper functions used throughout calculator components.

### 5. `/hooks`

Custom React hooks for reusable logic:

- `useAssetCalculation.ts` - Hook for asset calculations
- `useCurrency.ts` - Currency handling
- `useZakatStatus.ts` - Zakat status tracking
- `useForeignCurrency.ts` - Foreign currency conversion

**Connection to Calculators**: Provides reusable logic that calculators use to handle common operations.

### 6. `/services`

External service integrations:

- `currency.ts` - Currency conversion API
- `metals.ts` - Precious metal price API
- `stocks.ts` - Stock market data API
- `crypto.ts` - Cryptocurrency price API

**Connection to Calculators**: Provides data from external sources that calculators need for accurate calculations.

### 7. `/types`

Global TypeScript type definitions:

- `assets.ts` - Asset type interfaces
- `zakat.ts` - Zakat calculation types
- `currency.ts` - Currency-related types

**Connection to Calculators**: Provides type definitions used across the application, ensuring type safety in calculator implementations.

### 8. `/config`

Configuration constants and settings:

- `assetCategories.ts` - Asset category definitions
- `faqs.ts` - FAQ content
- `nisab.ts` - Nisab threshold configuration
- `constants.ts` - General constants

**Connection to Calculators**: Provides configuration values that calculators use to determine zakat rules and thresholds.

## Data Flow

The application follows this data flow pattern, centered around calculator functionality:

1. **User Input** → Calculator components capture user input for various assets
2. **Validation** → Input is validated using the validation system
3. **Store Update** → Validated data updates the Zustand store
4. **Calculation** → Asset type logic calculates zakatable amounts
5. **UI Update** → Calculator and dashboard UIs update to reflect new state
6. **Persistence** → State is persisted to local storage

## Key Files for Calculator Integration

Key files that connect different parts of the application to calculators:

1. `src/store/zakatStore.ts` - Central store that integrates all calculator states
2. `src/lib/assets/registry.ts` - Asset registry that defines all supported asset types
3. `src/components/dashboard/Summary.tsx` - Summary component that displays aggregated calculator data
4. `src/lib/validation/templates/calculatorValidation.ts` - Template for calculator validation
5. `src/hooks/useAssetCalculation.ts` - Hook for common calculator calculations

## Adding New Features

When adding new features that interact with calculators:

1. **New Asset Type**:
   - Add to `src/lib/assets/registry.ts`
   - Create store module in `src/store/modules/`
   - Create calculator component in `src/components/calculators/`
   - Add validation in `src/lib/validation/calculators/`

2. **New Calculation Method**:
   - Update asset type implementation in `src/lib/assets/`
   - Update corresponding store module in `src/store/modules/`
   - Update UI components as needed

3. **New UI Feature**:
   - Add components in appropriate directories
   - Connect to store via hooks
   - Update related components as needed

## Testing

Testing structure for calculator-related functionality:

- `src/tests/unit/` - Unit tests for calculation logic
- `src/tests/integration/` - Integration tests for store and components
- `src/tests/e2e/` - End-to-end tests for complete user flows

## Documentation

For more detailed documentation on specific areas:

- Calculator implementation: `src/components/calculators/README.md`
- Asset types and calculation rules: `ASSET_CALCULATOR_GUIDELINES.md`
- Store implementation: See comments in `src/store/zakatStore.ts`
- Validation system: See comments in `src/lib/validation/templates/calculatorValidation.ts` 