# Zakat Asset Calculator Implementation Guidelines

## Core Principles

### 1. Smart Automation & Real-time Calculations
- ✅ Automate calculations wherever possible
- ✅ Integrate with pricing APIs for real-time valuations
- ✅ Support mathematical expressions in input fields
- ✅ Auto-calculate nisab thresholds based on current gold/silver prices

### 2. Progressive User Experience
- ✅ Start with high-level questions
- ✅ Show more detailed inputs based on user responses
- ✅ Display clear progress indicators
- ✅ Provide immediate feedback on user actions

### 3. Contextual Guidance
- ✅ Show relevant tooltips for each input field
- ✅ Provide asset-specific help text
- ✅ Include examples and common scenarios
- ✅ Explain zakat rules in simple terms

## Implementation Patterns

### Calculator Component Structure
```typescript
interface AssetCalculatorProps {
  currency: string
  onUpdateValues: (values: Record<string, number>) => void
  onHawlUpdate: (hawlMet: boolean) => void
  onNisabUpdate: (amount: number) => void
  initialValues?: Record<string, number>
  initialHawlMet?: boolean
}

// Core calculator states
const [values, setValues] = useState<Record<string, number>>({})
const [hawlMet, setHawlMet] = useState<boolean>(true)
const [progress, setProgress] = useState(33)
```

### Smart Input Handling
```typescript
// Support for mathematical expressions
function evaluateExpression(expression: string): number {
  // Sanitize and evaluate mathematical expressions
  // Return validated numeric result
}

// Handle input changes with real-time validation
const handleValueChange = (categoryId: string, event: React.ChangeEvent<HTMLInputElement>) => {
  const inputValue = event.target.value
  const numericValue = evaluateExpression(inputValue)
  // Update state and trigger calculations
}
```

### Asset-Specific Considerations

#### 1. Cash & Bank Accounts
- Track multiple currency holdings
- Support digital wallet balances
- Auto-convert foreign currencies

#### 2. Precious Metals
- Real-time gold/silver pricing
- Support for different forms (jewelry, coins, bars)
- Purity percentage calculations
- Weight-based calculations

#### 3. Stocks & Investments
- Market value integration
- Dividend tracking
- Trading frequency assessment
- Different rules for trading vs. long-term

#### 4. Real Estate
- Rental income tracking
- Property value assessment
- Business vs. personal use distinction
- Expense deduction calculations

#### 5. Cryptocurrency
- Real-time crypto pricing
- Multiple wallet support
- Trading vs. holding distinction
- Support for major cryptocurrencies

#### 6. Business Assets
- Inventory valuation
- Accounts receivable tracking
- Raw materials assessment
- Working capital calculations

### UI Components

#### 1. Progress Tracking
```typescript
useEffect(() => {
  const filledFields = Object.values(values).filter(v => v > 0).length
  const totalFields = CATEGORIES.length
  setProgress(33 + ((filledFields / totalFields) * 67))
}, [values])
```

#### 2. Contextual Help
```typescript
<TooltipContent>
  <p className="text-sm leading-snug">
    {getContextualHelp(category.id, values)}
  </p>
</TooltipContent>
```

#### 3. Smart Validation
```typescript
const validateInput = (category: string, value: number) => {
  // Asset-specific validation rules
  // Return validation result and helpful messages
}
```

### Integration Patterns

#### 1. API Integration
```typescript
interface PricingAPI {
  getCurrentPrice: (asset: string) => Promise<number>
  getHistoricalPrice: (asset: string, date: Date) => Promise<number>
  convertCurrency: (amount: number, from: string, to: string) => Promise<number>
}
```

#### 2. State Management
```typescript
// Centralized state updates
const updateAssetValue = (category: string, value: number) => {
  setValues(prev => ({
    ...prev,
    [category]: value
  }))
  recalculateTotal()
  updateProgress()
  validateHawl()
}
```

### Best Practices

1. **Data Validation**
   - Validate all user inputs
   - Provide clear error messages
   - Support data format flexibility

2. **Performance**
   - Debounce real-time calculations
   - Lazy load complex calculations
   - Cache API responses

3. **Accessibility**
   - Clear input labels
   - Keyboard navigation
   - Screen reader support
   - High contrast support

4. **Error Handling**
   - Graceful API fallbacks
   - Clear error states
   - Recovery options
   - Data persistence

5. **Mobile Optimization**
   - Touch-friendly inputs
   - Responsive layouts
   - Simplified calculations
   - Offline support

## Testing Considerations

1. **Unit Tests**
   - Input validation
   - Calculation accuracy
   - State management
   - API integration

2. **Integration Tests**
   - Full calculation flows
   - API fallbacks
   - State persistence
   - Cross-browser compatibility

3. **User Testing**
   - Usability testing
   - Edge case handling
   - Error recovery
   - Performance monitoring

## Future Enhancements

1. **Smart Defaults**
   - Location-based currency
   - Previous year data
   - Common asset patterns

2. **Advanced Features**
   - Multi-currency support
   - Tax integration
   - Historical tracking
   - Report generation

3. **AI Integration**
   - Smart categorization
   - Prediction models
   - Personalized advice
   - Pattern recognition

## Summary Panel Integration

### 1. Real-time Summary Updates
```typescript
interface SummaryData {
  totalAssets: number
  zakatDue: number
  assetBreakdown: {
    categoryId: string
    amount: number
    percentage: number
    zakatDue: number
  }[]
  nisabStatus: {
    threshold: number
    isMet: boolean
  }
  hawlStatus: Record<string, boolean>
}

// Update summary when any asset changes
useEffect(() => {
  const summary = calculateSummary({
    assets: values,
    hawlStatus,
    nisabThreshold,
    currency
  })
  
  onSummaryUpdate(summary)
}, [values, hawlStatus, nisabThreshold])
```

### 2. Visual Breakdown Components
```typescript
// Asset distribution chart
<AssetBreakdown
  data={summary.assetBreakdown}
  currency={currency}
  colorMapping={assetColors}
/>

// Progress towards Nisab
<NisabProgress
  current={summary.totalAssets}
  threshold={summary.nisabStatus.threshold}
  currency={currency}
/>

// Zakat Summary Card
<ZakatSummary
  totalAssets={summary.totalAssets}
  zakatDue={summary.zakatDue}
  currency={currency}
  isEligible={summary.nisabStatus.isMet && anyHawlMet}
/>
```

### 3. Category-specific Calculations
```typescript
const categoryCalculations = {
  'cash': (values: Record<string, number>) => ({
    total: Object.values(values).reduce((sum, v) => sum + v, 0),
    zakatRate: 0.025
  }),
  'precious-metals': (values: Record<string, number>, prices: MetalPrices) => ({
    total: calculateMetalsValue(values, prices),
    zakatRate: 0.025
  }),
  // ... other category calculations
}
```

### 4. Summary Panel Features

#### Real-time Totals
- Automatic recalculation on any input change
- Running totals per asset category
- Overall zakat liability calculation
- Percentage breakdown of assets

#### Visual Elements
- Color-coded category indicators
- Progress bars for nisab threshold
- Asset distribution charts
- Eligibility indicators

#### Interactive Elements
- Expandable category details
- Tooltip explanations
- Quick-edit category values
- Download/share summary

#### Conditional Displays
```typescript
// Show relevant information based on asset mix
{summary.assetBreakdown.map(category => (
  <CategorySummary
    key={category.id}
    data={category}
    showDetails={category.amount > 0}
    specialRules={getSpecialRules(category.id)}
  />
))}
```

### 5. Summary Calculations

#### Total Assets
```typescript
const calculateTotal = (values: Record<string, number>) => {
  return Object.entries(values).reduce((total, [category, value]) => {
    const calculator = categoryCalculations[category]
    const { total: categoryTotal } = calculator(value)
    return total + categoryTotal
  }, 0)
}
```

#### Zakat Eligibility
```typescript
const checkEligibility = (summary: SummaryData) => {
  const hasReachedNisab = summary.totalAssets >= summary.nisabStatus.threshold
  const hasCompletedHawl = Object.values(summary.hawlStatus).some(met => met)
  
  return {
    isEligible: hasReachedNisab && hasCompletedHawl,
    reasons: getEligibilityReasons(summary)
  }
}
```

#### Asset Distribution
```typescript
const calculateDistribution = (values: Record<string, number>) => {
  const total = calculateTotal(values)
  
  return Object.entries(values).map(([category, value]) => ({
    category,
    amount: value,
    percentage: (value / total) * 100,
    zakatDue: value * categoryCalculations[category].zakatRate
  }))
}
```

### 6. Summary Panel States

#### Loading State
```typescript
{isCalculating ? (
  <SummaryPlaceholder />
) : (
  <SummaryContent data={summary} />
)}
```

#### Error State
```typescript
{error ? (
  <SummaryError 
    message={error.message}
    onRetry={recalculate}
  />
) : (
  <SummaryContent data={summary} />
)}
```

#### Empty State
```typescript
{!hasAnyAssets ? (
  <EmptySummary 
    message="Add some assets to see your Zakat calculation"
    callToAction={<AddAssetButton />}
  />
) : (
  <SummaryContent data={summary} />
)} 