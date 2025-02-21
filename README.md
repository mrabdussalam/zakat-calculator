This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


Let's break down the project based on the provided code snippets and documentation. This project is a Smart Zakat Calculator designed to help users calculate their Zakat obligations based on various asset types. It uses a modern web stack, including React (Next.js) for the frontend and potentially Node.js (Express) or Python (FastAPI) for the backend.

## Project Overview

Purpose: The application calculates Zakat, a form of almsgiving in Islam, by evaluating the user's assets and applying specific rules to determine the amount due.

## Architecture
The project is structured into several layers and components, each responsible for different aspects of the application:
1. UI Layer: Handles user interactions and displays information.
2. Store Layer: Manages application state using Zustand.
3. Asset Type System: Defines and manages different asset types.
4. Calculation Layer: Contains business logic for calculating Zakat.

## Key Components and Files
1. UI Components: Located in src/components/, these include forms, buttons, and other interactive elements.
2. State Management: Managed by Zustand, with the main store in src/store/zakatStore.ts.
3. Asset Types: Defined in src/lib/assets/, with specific implementations for different asset types like cash, metals, and stocks.
4. Calculation Logic: Implemented in src/services/calculationService.ts.

## Models and Interfaces
1. AssetType: Interface for defining different asset types, including methods for calculating total and Zakatable values.
2. ZakatState: Zustand store interface managing the state of various asset categories.
3. PersistedState: Interface for storing state in local storage.

## Data Flow
1. User Input: Collected through UI components.
2. State Update: Input data is stored in the Zustand store.
3. Asset Calculations: Asset-specific calculations are performed.
4. Zakat Calculation: Total Zakat is calculated based on asset values.
5. UI Update: Results are displayed to the user.

## Example Block Diagram
Below is a simplified block diagram illustrating the flow of data and interactions within the application:

┌─────────────────────────────────────────────────────────────────┐
│                         UI LAYER                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Cash       │    │   Metals     │    │   Summary    │      │
│  │  Calculator  │    │  Calculator  │    │  Component   │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
└─────────┼──────────────────┼───────────────────┼───────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                       STORE LAYER                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Values     │    │    State     │    │  Computed    │      │
│  │ cashValues   │◄──►│  hawlStatus  │◄──►│   Results    │      │
│  │metalsValues  │    │   prices     │    │              │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
└─────────┼──────────────────┼───────────────────┼───────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ASSET TYPE SYSTEM                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Registry   │    │  Asset Type  │    │    Asset     │      │
│  │             │◄──►│  Interface   │◄──►│ Implementations│      │
│  │ getAssetType │    │             │    │ cash/metals   │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
└─────────┼──────────────────┼───────────────────┼───────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CALCULATION LAYER                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  Business    │    │ Calculation  │    │   Shared     │      │
│  │   Rules      │◄──►│   Logic      │◄──►│  Utilities   │      │
│  │ NISAB/HAWL   │    │             │    │              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘

## Example Flow
1. User selects assets: The user selects different asset types (e.g., cash, metals) through the UI.
2. State updates: The selected values are stored in the Zustand store.
3. Asset calculations: Each asset type performs its specific calculations.
4. Zakat calculation: The total Zakat due is calculated based on the asset values.
5. Results displayed: The calculated Zakat is displayed in the UI.


Let's explore the calculators built within the project, focusing on how data flows through the system, how states are updated, and which UI components are involved.
## Calculators in the Project
The project includes several calculators for different asset types, each designed to handle specific calculations related to Zakat. Here are some of the calculators mentioned in the codebase:
1. Cash Calculator: Manages cash and cash equivalents.
2. Precious Metals Calculator: Handles gold and silver assets.
3. Stock Calculator: Deals with stocks and investments.
## Data Flow and State Management
The data flow in the project is structured to ensure that user inputs are captured, processed, and displayed efficiently. Here's a general overview of the flow:
1. User Input: Users enter data through various UI components, such as forms and input fields.
2. State Update: The input data is stored in a centralized state using Zustand. This state management library allows for easy access and updates across different components.
3. Calculations: Each calculator performs specific calculations based on the asset type. These calculations are often handled by utility functions or services.
4. UI Update: The results of the calculations are displayed in the UI, providing feedback to the user.
## Example: Stock Calculator
Let's take a closer look at the Stock Calculator as an example:
### Components Involved
StockCalculator.tsx: The main component for handling stock-related inputs and calculations.
InvestmentFundsTab.tsx: A tab within the Stock Calculator for managing investment funds.
### Data Flow
User Input: Users enter stock details, such as ticker symbols and the number of shares, into the StockCalculator component.
State Update: The input values are stored in the Zustand store. Functions like setStockValue are used to update the state.
3. Calculations: The component calculates the market value of stocks and the Zakat due based on the input data. This might involve fetching real-time stock prices from an API.
UI Update: The calculated values are displayed in the UI, updating components like InvestmentFundsTab to reflect the latest data.
## State Management
Zustand Store: The store maintains the state of various asset categories, including stocks. It provides functions to update and retrieve state values.
State Synchronization: As users interact with the UI, the state is continuously updated, ensuring that all components reflect the current data.
### UI Components Updated
Dashboard Components: Components like Summary.tsx display the overall Zakat calculation results, updating as the state changes.
Form Components: Components like PreferencesForm.tsx and AssetForm.tsx capture user inputs and trigger state updates.

## Validation System

### Type Verification Requirements
The project enforces strict type checking:

1. Interface Implementation
- All interfaces must extend base types
- Required properties must be explicitly defined
- Breakdown items must include display properties
- Validation modules must use calculator template

2. Asset Display Properties
- Breakdown items require label property
- isExempt property for exempt assets
- zakatable property for calculations
- All display fields present and typed

3. Calculator Implementation
- Type exports properly defined
- Generic types properly constrained
- Type guards where needed
- Consistent type usage

### Testing Requirements

1. Calculator Tests
```typescript
describe('Calculator Tests', () => {
  test('validates required fields', () => {})
  test('validates numerical values', () => {})
  test('validates calculations', () => {})
  test('validates display properties', () => {})
})
```

2. Coverage Requirements
- Unit tests for calculators
- Integration tests for store
- Validation tests for assets
- Edge case coverage
- Display property tests
- Type checking tests

3. Breakdown Validation
- Display properties present
- Exempt status correct
- Zakatable amounts accurate
- Labels present
- Totals match items
- Percentages accurate
- Currency formatting consistent

4. Pre-commit Validation
```bash
npm run validate   # All validations
npm run type-check # Type checking
npm run test      # Test suite
npm run lint      # Code style
```

For implementation details, see calculator examples in the codebase.

