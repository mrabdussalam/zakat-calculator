# CLAUDE.md - Zakat Guide Calculator Project Context

## 1. PROJECT OVERVIEW

**Project Name:** Zakat Guide (Islamic Zakat Calculator)
**Purpose:** A comprehensive web application that helps users calculate their Zakat obligations according to Islamic principles across multiple asset types
**Repository Status:** Active development with 244+ TypeScript files and ~4,826 lines of code
**Current Branch:** claude/create-cla-0123jgSNy6BN5YdB7qiorTsV
**Last Updated:** November 16-17, 2025

### Key Features
- Multiple asset type calculators (Cash, Precious Metals, Stocks, Real Estate, Cryptocurrency, Retirement)
- Real-time price calculations with fallback mechanisms
- Multi-currency support with automatic conversion (19+ currencies)
- Nisab threshold tracking
- Asset breakdown visualization with charts and tables
- Hawl (Islamic fiscal year) status tracking per asset type
- PDF report generation
- Zakat distribution planning
- Responsive mobile-friendly design
- User preference persistence via localStorage

---

## 2. TECH STACK

### Core Framework & Runtime
- **Next.js** 15.1.7 (React framework with App Router)
- **React** 19.0.0 (UI library)
- **TypeScript** 5.x (Type-safe JavaScript)
- **Node.js** (Runtime environment)

### State Management
- **Zustand** 5.0.3 (Lightweight state management with persistence)
- **React Context API** (Used for currency provider)

### UI & Styling
- **Tailwind CSS** 3.4.1 (Utility-first CSS framework)
- **Radix UI** (Headless component library - 15+ components):
  - Accordion, Alert Dialog, Avatar, Dialog, Dropdown Menu, Label, Popover
  - Progress, Radio Group, Scroll Area, Select, Slider, Tabs, Tooltip, Switch
- **Lucide React** 0.474.0 (Icon library)
- **Headless UI** 2.2.0 (Additional UI primitives)
- **Framer Motion** 12.1.0 (Animation library)
- **Class Variance Authority** 0.7.1 (Utility for component variants)
- **Clsx** 2.1.1 (Classname utility)

### Data Visualization
- **Recharts** 2.15.1 (React charts library)
- **D3.js** 7.9.0 + D3 Sankey 0.12.3 (Advanced visualization)
- **AG Grid** 33.1.1 (Data grid component)

### Data & Calculations
- **Date-fns** 4.1.0 (Date manipulation)
- **UUID** 11.1.0 (Unique ID generation)
- **Lodash** (Utility functions via types)

### Export & Reporting
- **JSPDF** 2.5.1 (PDF generation)
- **JSPDF AutoTable** 3.5.31 (PDF tables)
- **html2canvas** 1.4.1 (HTML to canvas conversion)
- **PDFKit** 0.16.0 (PDF creation)
- **React to PDF** 1.0.1 (PDF export utility)

### Development & Testing
- **Jest** 29.7.0 (Testing framework)
- **ts-jest** 29.2.5 (TypeScript support for Jest)
- **@testing-library/jest-dom** 6.6.3 (Jest matchers)
- **Vitest** 3.0.4 (Alternative test runner)
- **ESLint** 9.x (Code linting)
- **PostCSS** 8.x (CSS processing)

### Development Tools
- **Husky** (Git hooks for pre-commit checks)
- **Stylelint** (CSS linting)
- **VS Code Extensions** (Configured in `.vscode/`)

---

## 3. PROJECT STRUCTURE

```
/home/user/zakat-calculator/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── page.tsx                  # Home page with setup & navigation
│   │   ├── dashboard/                # Main calculator dashboard
│   │   ├── api/                      # API routes (see section 4)
│   │   ├── layout.tsx                # Root layout
│   │   ├── globals.css               # Global styles
│   │   └── [various test routes]/    # Testing pages
│   │
│   ├── components/                   # React components (~67 total)
│   │   ├── calculators/              # Asset-specific calculator UI
│   │   │   ├── cash/
│   │   │   ├── crypto/
│   │   │   ├── precious-metals/
│   │   │   ├── realestate/
│   │   │   ├── retirement/
│   │   │   └── stocks/
│   │   ├── dashboard/                # Dashboard visualization components
│   │   │   └── Summary/
│   │   ├── ui/                       # Base UI components (Radix-based)
│   │   ├── shared/                   # Shared utility components
│   │   ├── assets/                   # Asset management components
│   │   ├── setup/                    # Setup/preference components
│   │   ├── distribution/             # Zakat distribution planner
│   │   └── [various helpers]/        # Hydration, debugging components
│   │
│   ├── store/                        # Zustand state management
│   │   ├── zakatStore.ts             # Main store with persistence
│   │   ├── types/                    # Store type definitions
│   │   ├── constants/                # Store constants
│   │   ├── utils/                    # Store utilities
│   │   ├── modules/                  # Asset-specific slices
│   │   │   ├── cash.ts
│   │   │   ├── metals.ts
│   │   │   ├── stocks.ts
│   │   │   ├── realEstate.ts
│   │   │   ├── retirement.ts
│   │   │   ├── crypto.ts
│   │   │   ├── crypto.types.ts
│   │   │   ├── nisab.ts
│   │   │   └── distribution.ts
│   │   └── types.ts                  # Type definitions
│   │
│   ├── lib/                          # Utility functions & services
│   │   ├── assets/                   # Asset type implementations
│   │   │   ├── registry.ts           # Asset type registry
│   │   │   ├── types.ts              # Asset interfaces
│   │   │   ├── cash.ts, metals.ts, stocks.ts, etc.
│   │   │   └── nisab.ts
│   │   ├── api/                      # API client functions
│   │   │   ├── metals.ts
│   │   │   ├── stocks.ts
│   │   │   ├── crypto.ts
│   │   │   └── exchange-rates.ts
│   │   ├── services/                 # Business logic services
│   │   │   ├── currencyConversion.ts
│   │   │   ├── exchangeRateService.ts
│   │   │   ├── cacheValidation.ts
│   │   │   └── currency.ts
│   │   ├── validation/               # Validation schemas & tests
│   │   │   ├── __tests__/            # Validator test suite
│   │   │   ├── assetValidation.ts
│   │   │   ├── store.ts
│   │   │   └── calculators/
│   │   ├── utils/                    # Utility functions
│   │   │   ├── nisabCalculations.ts
│   │   │   ├── currency.ts
│   │   │   ├── units.ts
│   │   │   ├── debug.ts
│   │   │   └── [other utilities]
│   │   ├── context/                  # React Context providers
│   │   │   └── CurrencyContext.tsx
│   │   ├── constants.ts              # Global constants
│   │   ├── fonts.ts                  # Font imports
│   │   ├── utils.ts                  # Shared utilities
│   │   └── analytics.ts              # Analytics functions
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useStoreHydration.ts      # Store initialization
│   │   ├── dashboard/                # Dashboard-specific hooks
│   │   ├── calculators/              # Calculator-specific hooks
│   │   └── useForeignCurrency.tsx
│   │
│   ├── services/                     # Application services
│   │   └── calculationService.ts
│   │
│   ├── config/                       # Configuration files
│   │   ├── index.ts
│   │   ├── metals.ts
│   │   ├── sources.ts
│   │   ├── feedback.ts
│   │   ├── faqs.ts
│   │   ├── colors.ts
│   │   └── asset-categories.ts
│   │
│   ├── types/                        # Global TypeScript types
│   │   ├── index.ts
│   │   ├── assets.ts
│   │   ├── api.ts
│   │   ├── icon.ts
│   │   └── json.d.ts
│   │
│   ├── tests/                        # Integration & unit tests
│   │   ├── calculations/
│   │   ├── utils.ts
│   │   └── [test files]
│   │
│   └── middleware.ts                 # Next.js middleware
│
├── public/                           # Static assets
├── data/                             # Data files
│
├── Configuration Files:
│   ├── package.json                  # Dependencies & scripts
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── tailwind.config.ts            # Tailwind CSS config
│   ├── next.config.js                # Next.js configuration
│   ├── jest.config.js                # Jest configuration
│   ├── eslint.config.mjs             # ESLint configuration
│   ├── .stylelintrc.json             # Stylelint configuration
│   ├── postcss.config.mjs            # PostCSS configuration
│   └── .gitignore                    # Git ignore rules
│
└── Documentation Files:
    ├── README.md                     # Main project documentation
    ├── API_ARCHITECTURE.md           # API design & endpoints
    ├── ASSET_CALCULATOR_GUIDELINES.md # Asset calculator patterns
    ├── CODEBASE_BEST_PRACTICES_GUIDE.md # Development guide
    ├── flow.md                       # Application flow documentation
    ├── README-FEEDBACK.md            # Feedback form setup
    └── LICENSE                       # Project license
```

---

## 4. CORE ARCHITECTURE

### Layered Architecture Pattern

The application follows a strict layered architecture:

```
┌────────────────────────────────────────────────┐
│              UI LAYER (Components)             │
│  Cash, Metals, Summary, Calculators, etc.     │
└────────────────────────────────────────────────┘
                       ↓
┌────────────────────────────────────────────────┐
│         STORE LAYER (Zustand State)            │
│  cashValues, metalsValues, hawlStatus, etc.   │
└────────────────────────────────────────────────┘
                       ↓
┌────────────────────────────────────────────────┐
│      ASSET TYPE SYSTEM (Registry & Types)     │
│  AssetType Interface & Implementations         │
└────────────────────────────────────────────────┘
                       ↓
┌────────────────────────────────────────────────┐
│    CALCULATION LAYER (Business Logic)          │
│  NISAB, HAWL, Zakat Rate, Utilities            │
└────────────────────────────────────────────────┘
```

### Key Design Patterns

1. **Modular Asset System**: Each asset type is self-contained with its own store module, calculator component, and validation logic
2. **Registry Pattern**: Dynamic asset type lookup via `/lib/assets/registry.ts`
3. **Custom Hooks**: Business logic wrapped in reusable hooks for components
4. **State Persistence**: Zustand with localStorage middleware for data persistence
5. **API Abstraction**: Client-side API calls through Next.js API routes with fallback mechanisms

---

## 5. ASSET CALCULATORS (6 Types)

### 1. Cash Calculator
- **File**: `/src/components/calculators/cash/CashCalculator.tsx`
- **Store Module**: `/src/store/modules/cash.ts`
- **Tracks**:
  - Cash on hand
  - Checking & savings accounts
  - Digital wallets
  - Foreign currency holdings (with auto-conversion)
- **Features**:
  - Multi-currency support
  - Real-time foreign currency conversion
  - Hawl status tracking

### 2. Precious Metals Calculator
- **Files**: 
  - `/src/components/calculators/precious-metals/`
  - `/src/store/modules/metals.ts`
  - `/src/lib/assets/precious-metals.ts`
- **Tracks**:
  - Gold (regular, occasional, investment use)
  - Silver (regular, occasional, investment use)
  - Purity percentages (8K, 14K, 18K, 22K, 24K)
  - Weight units (grams, ounces, tolas)
- **Features**:
  - Real-time gold/silver pricing
  - Purity-based calculations
  - Multiple weight unit support
  - Nisab threshold comparison

### 3. Stocks Calculator
- **Files**:
  - `/src/components/calculators/stocks/StockCalculator.tsx`
  - `/src/store/modules/stocks.ts`
  - `/src/lib/assets/stocks.ts`
- **Tracks**:
  - Active trading stocks
  - Passive investments (mutual funds, ETFs)
  - Dividend earnings
  - Investment funds
- **Features**:
  - Market value integration
  - Active vs. passive distinction
  - Dividend tracking
  - Company financials (for CRI calculation)

### 4. Real Estate Calculator
- **Files**:
  - `/src/components/calculators/realestate/RealEstateCalculator.tsx`
  - `/src/store/modules/realEstate.ts`
  - `/src/lib/assets/real-estate.ts`
- **Tracks**:
  - Primary residence (exempt)
  - Rental properties
  - Properties for sale
  - Vacant land
- **Features**:
  - Rental income/expense tracking
  - Property value assessment
  - Personal use exemptions
  - Active sale status

### 5. Cryptocurrency Calculator
- **Files**:
  - `/src/components/calculators/crypto/CryptoCalculator.tsx`
  - `/src/store/modules/crypto.ts`
  - `/src/lib/assets/crypto.ts`
- **Tracks**:
  - Major cryptocurrencies (Bitcoin, Ethereum, etc.)
  - Real-time market values
  - Multiple wallet holdings
- **Features**:
  - Real-time crypto pricing (CoinGecko API)
  - Multiple coin support
  - Trading vs. holding distinction

### 6. Retirement Accounts Calculator
- **Files**:
  - `/src/components/calculators/retirement/RetirementCalculator.tsx`
  - `/src/store/modules/retirement.ts`
  - `/src/lib/assets/retirement.ts`
- **Tracks**:
  - Traditional 401(k) & IRA
  - Roth 401(k) & IRA
  - Pension funds
  - Other retirement savings
- **Features**:
  - Tax and penalty considerations
  - Customizable withdrawal assumptions
  - Different rules per account type

---

## 6. STATE MANAGEMENT

### Zustand Store (`/src/store/zakatStore.ts`)

**Main State Interface** (`ZakatState`):
```typescript
{
  // Currency & preferences
  currency: string
  
  // Asset values (one per asset type)
  cashValues: CashValues
  metalsValues: MetalsValues
  stockValues: StockValues
  realEstateValues: RealEstateValues
  retirementValues: RetirementValues
  cryptoValues: CryptoValues
  
  // Hawl (fiscal year) tracking per asset type
  cashHawlMet: boolean
  metalsHawlMet: boolean
  stockHawlMet: boolean
  realEstateHawlMet: boolean
  retirementHawlMet: boolean
  cryptoHawlMet: boolean
  
  // Methods: 100+ setter/getter functions
  setCashValue(), setMetalsValue(), etc.
  getTotalCash(), getTotalMetals(), etc.
  getBreakdown(), getNisabStatus(), etc.
  reset(), resetCashValues(), etc.
}
```

### Store Modules
Each asset type has a dedicated module in `/src/store/modules/`:
- `cash.ts` - Cash calculator state
- `metals.ts` - Precious metals state
- `stocks.ts` - Stocks & investments state
- `realEstate.ts` - Real estate state
- `retirement.ts` - Retirement accounts state
- `crypto.ts` - Cryptocurrency state
- `nisab.ts` - Nisab threshold calculations
- `distribution.ts` - Zakat distribution planning

### Data Persistence
- **Method**: Zustand's `persist` middleware
- **Storage**: Browser's `localStorage`
- **Key**: `zakat-store`
- **Hydration**: Custom `hydratePersistedData()` function with validation

---

## 7. API ARCHITECTURE

### Internal API Endpoints

Located in `/src/app/api/`:

| Endpoint | Method | Purpose | Fallback |
|----------|--------|---------|----------|
| `/api/prices/metals` | GET | Fetch gold/silver prices | Hardcoded values |
| `/api/prices/stocks` | GET | Fetch stock prices (Yahoo Finance) | Cached values |
| `/api/prices/crypto` | GET | Fetch crypto prices (CoinGecko) | Cached values |
| `/api/nisab` | GET | Calculate nisab thresholds | Hardcoded values |
| `/api/search/stocks` | GET | Search for stocks | Error handling |
| `/api/crypto/prices` | GET | Batch crypto prices | CoinGecko with cache |
| `/api/crypto/[id]` | GET | Specific crypto details | CoinGecko with cache |
| `/api/zakat/calculate` | GET | Calculate zakat due | Computation |
| `/api/report` | GET | Generate report | JSON response |

### External API Dependencies

1. **Metal Prices**:
   - Primary: GoldPrice.org
   - Secondary: Frankfurter API
   - Tertiary: Metals.live API
   - Fallback: Hardcoded values

2. **Cryptocurrency**:
   - Primary: CoinGecko API
   - Fallback: Cached values + hardcoded rates

3. **Stock Prices**:
   - Primary: Yahoo Finance API
   - Fallback: Cached values

4. **Currency Conversion**:
   - Primary: Frankfurter API
   - Secondary: Open Exchange Rates API
   - Fallback: Hardcoded rates (19+ currencies)

### Fallback Mechanisms
- Multi-source fetching with sequential retry
- In-memory caching
- File-based cache persistence
- Hardcoded fallback values for all critical data
- Timeout handling (default: 5000ms)
- Validation against expected value ranges

---

## 8. KEY COMPONENTS & FEATURES

### Home Page (`/src/app/page.tsx`)
- Hero section with feature descriptions
- Currency selection
- Navigation to dashboard
- About & feedback links
- Animated introduction

### Dashboard (`/src/app/dashboard/page.tsx`)
- Multi-tab calculator interface
- Real-time calculation updates
- Summary panel with total zakat due
- Asset distribution visualization (pie chart)
- Detailed breakdown table
- Nisab status indicator
- Export to PDF functionality

### Calculator Components
- Modular design: each calculator is self-contained
- Real-time validation & feedback
- Progressive disclosure (show more fields as needed)
- Help text & tooltips for guidance
- Currency auto-conversion

### Visualization Components
- Asset Distribution (Pie/Donut charts using Recharts)
- Breakdown Table (AG Grid data grid)
- Nisab Status (progress indicators)
- Sankey Diagram for distribution planning

### UI Component Library (`/src/components/ui/`)
- Built on Radix UI primitives
- Tailwind CSS styling
- ~20+ reusable components:
  - Button, Input, Label, Dropdown
  - Dialog, Alert Dialog, Tabs
  - Progress, Slider, Tooltip, etc.

---

## 9. TESTING SETUP

### Test Framework
- **Jest** 29.7.0 with ts-jest preset
- **Test Environment**: Node.js (no jsdom)
- **Configuration**: `/jest.config.js`

### Test Coverage

**Test Locations**:
- `/src/tests/calculations/zakat.test.ts` - Zakat calculation tests
- `/src/lib/validation/__tests__/` - Validation tests:
  - `cash.test.ts` - Cash calculator validation
  - `metals.test.ts` - Precious metals validation
  - `stocks.test.ts` - Stocks validation
  - `crypto.test.ts` - Cryptocurrency validation
  - `retirement.test.ts` - Retirement accounts
  - `store.test.ts` - Store operations
  - `currency-integration.test.ts` - Currency conversion

**Test Types**:
1. **Calculation Tests**: Verify zakat calculations for all asset types
2. **Validation Tests**: Ensure input validation works correctly
3. **Integration Tests**: Test store updates and state flow
4. **Currency Tests**: Validate multi-currency conversions

### Running Tests
```bash
npm test                    # Run all tests once
npm run test:watch        # Watch mode for development
npm run test:coverage     # Generate coverage report
```

---

## 10. BUILD & DEVELOPMENT COMMANDS

### Available NPM Scripts
```json
{
  "dev": "next dev",                    // Start dev server (port 3000)
  "build": "next build",                // Build for production
  "start": "next start",                // Run production build
  "lint": "next lint",                  // Run ESLint
  "test": "jest",                       // Run test suite
  "test:watch": "jest --watch",         // Watch mode
  "test:coverage": "jest --coverage",   // Coverage report
  "precommit": "npm run test"           // Pre-commit hook
}
```

### Development Workflow
```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Open http://localhost:3000

# During development
npm run lint              # Check code quality
npm test                  # Run tests
npm run test:watch       # Tests in watch mode

# Before committing
npm run test             # Tests must pass (husky pre-commit)

# Build for production
npm run build
npm start
```

### Git Hooks
- **Pre-commit**: Runs `npm run test` via Husky
- Located in: `.husky/pre-commit`

---

## 11. CONFIGURATION FILES

### TypeScript (`tsconfig.json`)
- Target: ES2017
- Module: ESNext
- Strict mode enabled
- Path alias: `@/*` → `./src/*`
- Isolated modules: true

### Tailwind CSS (`tailwind.config.ts`)
- Dark mode support
- Extended color palette (HSL-based)
- Custom animations
- Extended fonts

### Next.js (`next.config.js`)
- Security headers (HSTS, CSP, X-Frame-Options, etc.)
- Webpack optimization
- Module resolution for TS/TSX
- Cache configuration

### ESLint (`eslint.config.mjs`)
- Extends: next/core-web-vitals + next/typescript
- Custom rules: unused vars off, no unescaped entities

### Husky Git Hooks
- Pre-commit: Run tests before commit

---

## 12. KEY LIBRARIES & UTILITIES

### Custom Hooks
- `useStoreHydration()` - Initialize store from localStorage
- `useNisabStatus()` - Calculate nisab thresholds
- `useForeignCurrency()` - Handle foreign currency conversion
- `useMetalsPrices()` - Fetch metal prices
- `useDashboardState()` - Dashboard-specific state
- `useDashboardCurrencyConversion()` - Currency conversion for dashboard

### Utility Functions
- `nisabCalculations.ts` - Nisab threshold logic
- `currency.ts` - Currency utilities
- `units.ts` - Weight unit conversion
- `debug.ts` - Debugging utilities

### Services
- `CurrencyConversionService` - Multi-tier currency conversion
- `ExchangeRateService` - Exchange rate fetching
- `CacheValidationService` - Cache integrity checks
- `CalculationService` - Zakat calculation logic

---

## 13. DOCUMENTATION

### Available Documentation Files
- **README.md** - Main project overview & setup
- **API_ARCHITECTURE.md** - Detailed API documentation (234 lines)
- **ASSET_CALCULATOR_GUIDELINES.md** - Asset calculator patterns (200+ lines)
- **CODEBASE_BEST_PRACTICES_GUIDE.md** - Development practices (450+ lines)
- **flow.md** - Application flow documentation
- **README-FEEDBACK.md** - Feedback form setup instructions
- **LICENSE** - Project license

### Key Documentation Topics
- Architecture patterns
- Asset calculator implementation
- API design & fallback mechanisms
- Validation systems
- Caching strategies
- Development guidelines
- Common mistakes to avoid

---

## 14. CURRENCY SUPPORT

### Supported Currencies (19)
USD, EUR, GBP, JPY, CAD, AUD, INR, PKR, AED, SAR, MYR, SGD, BDT, EGP, IDR, KWD, NGN, QAR, ZAR

### Currency Features
- Real-time exchange rate fetching
- Multi-tier fallback mechanism
- Hardcoded fallback rates
- Comprehensive validation
- Currency-specific formatting

---

## 15. COMMON DEVELOPMENT PATTERNS

### Adding a New Feature

1. **UI Component**: Create in appropriate folder under `/src/components/`
2. **Store Logic**: Add getter/setter in relevant module under `/src/store/modules/`
3. **Validation**: Add tests in `/src/lib/validation/__tests__/`
4. **Styling**: Use Tailwind CSS classes
5. **Testing**: Write test cases
6. **Documentation**: Update relevant MD files

### Adding a New Asset Type

1. Create store module: `/src/store/modules/[assetName].ts`
2. Define types: Add to `/src/store/types.ts`
3. Create calculator component: `/src/components/calculators/[assetName]/`
4. Register in asset registry: `/src/lib/assets/registry.ts`
5. Implement asset type: `/src/lib/assets/[assetName].ts`
6. Add validation: `/src/lib/validation/calculators/[assetName]Validation.ts`
7. Create tests: `/src/lib/validation/__tests__/[assetName].test.ts`

### API Route Pattern
```typescript
// /src/app/api/[endpoint]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const currency = searchParams.get('currency') || 'USD'
  
  try {
    // Fetch from external API or cache
    // Apply fallback if needed
    return NextResponse.json(data)
  } catch (error) {
    // Handle error gracefully
    return NextResponse.json(fallbackData)
  }
}
```

---

## 16. KNOWN ISSUES & CONSIDERATIONS

### Environment Handling
- Special fallback handling for restricted environments (e.g., Replit)
- Metal prices configuration excluded from TypeScript compilation

### Testing Notes
- Tests use fresh store instances via reset functions
- Mock data includes realistic currency-specific values
- Validation tests ensure all asset types handle edge cases

### Performance Considerations
- In-memory caching for API responses
- File-based cache for metal prices
- Zustand optimized for performance
- Component memoization where needed

---

## 17. DEPLOYMENT

### Build Process
```bash
npm run build  # Next.js build with optimization
npm start      # Run production server
```

### Hosting Options
- **Vercel** (Recommended - native Next.js support)
- Any Node.js hosting (AWS, GCP, Azure, etc.)
- Static export possible for some pages

### Environment Variables
- Configure in `.env.production` for production
- All API keys handled server-side for security

---

## 18. PROJECT STATISTICS

- **Total TypeScript Files**: 244+
- **Lines of Code**: ~4,826
- **UI Components**: ~67
- **API Routes**: 14+
- **Asset Calculators**: 6
- **Test Files**: 8+
- **Store Modules**: 8
- **Supported Currencies**: 19

---

## 19. QUICK REFERENCE CHECKLIST

When starting work on this project:

- [ ] `npm install` - Install all dependencies
- [ ] `npm run dev` - Start development server
- [ ] Review `/src/store/zakatStore.ts` - Understand state structure
- [ ] Check `/src/lib/assets/registry.ts` - See asset type pattern
- [ ] Read `API_ARCHITECTURE.md` - Understand API structure
- [ ] Run `npm test` - Verify test setup
- [ ] Check `/src/components/calculators/` - See calculator patterns
- [ ] Review store modules - Understand how each asset works

---

## 20. IMPORTANT CONTACTS & RESOURCES

**Project Owner**: Abdussalam Rafiq
- Email: abdussalam.rafiq@gmail.com
- LinkedIn: https://www.linkedin.com/in/imabdussalam/

**License**: Check LICENSE file for details

**Community Feedback**: Via integrated Google Form in the application

---

**Last Updated**: November 17, 2025
**Document Version**: 1.0
