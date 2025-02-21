# Zakat Guide Application Flow

## 1. Initial Setup (User Preferences)

### Components
- `PreferencesForm.tsx`: Handles language and currency selection
  - Language options: English, Arabic, etc.
  - Currency options: USD, EUR, GBP, etc.
  - Live preview of how data will be displayed

### State Management
```typescript
interface Preferences {
  language: string
  currency: string
}
```

## 2. Asset Selection

### Asset Categories
1. Cash and Cash Equivalents
   - Cash on hand
   - Checking accounts
   - Savings accounts
   - Foreign currency

2. Precious Metals
   - Gold (bars, coins, jewelry)
   - Silver (bars, coins, jewelry)

3. Stocks and Investments
   - Stocks (active/passive)
   - Mutual funds
   - ETFs
   - Index funds

4. Retirement Accounts
   - 401(k)
   - IRA
   - Pension funds

5. Real Estate
   - Rental properties
   - Properties for sale
   - Vacant land

6. Business Assets
   - Inventory
   - Accounts receivable
   - Equipment

7. Cryptocurrencies
   - Bitcoin/Ethereum
   - Staking rewards
   - LP tokens

8. Illiquid Assets
   - Artwork
   - Antiques
   - Private equity

9. Other Financial
   - HSA
   - FSA
   - Education accounts

10. Debt Receivables
    - Good debt
    - Bad debt

### Components
- `AssetSelection.tsx`: Main asset selection interface
  - Uses icon components from `@/components/ui/icons`
  - Groups assets by category
  - Shows category descriptions
  - Provides visual feedback for selection

### State Management
```typescript
interface AssetSelectionState {
  selectedAssets: AssetIconType[]
  categoryExpanded: Record<string, boolean>
}
```

## 3. Asset Details Collection

### For Each Selected Asset:
1. Value input in selected currency
2. Additional metadata based on asset type:
   - Precious Metals: purity, weight
   - Stocks: purchase date, dividend info
   - Real Estate: rental income, expenses
   - Crypto: acquisition cost, staking rewards

### Components
- `AssetForm.tsx`: Dynamic form based on asset type
- `AssetSummary.tsx`: Running total and breakdown
- `NisabComparison.tsx`: Shows position relative to Nisab

## 4. Calculation and Report

### Calculation Logic
- Apply appropriate Zakat rules per asset type
- Handle currency conversions
- Calculate Nisab thresholds
- Generate detailed breakdown

### Components
- `ZakatSummary.tsx`: Final calculation results
- `ReportGenerator.tsx`: PDF report generation
- `SavedCalculation.tsx`: Save/load functionality

## Data Flow
```typescript
Preferences -> Asset Selection -> Asset Details -> Calculation -> Report
```

## Technical Implementation

### Icon System
```typescript
// Base icon configuration
interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number
  className?: string
}

// Asset category configuration
interface AssetConfig {
  id: string
  color: string
  category: string
}
```

### Asset Management
```typescript
// Asset type definition
interface Asset {
  type: AssetIconType
  value: number
  currency: string
  metadata: Record<string, any>
}

// Calculation state
interface CalculationState {
  assets: Asset[]
  nisabThreshold: number
  zakatDue: number
}
```