# Stocks Calculator Audit & Recommendations

## Current Status Overview

### Implementation Status
- ❌ Incomplete store integration
- ❌ Missing UI components
- ❌ Incomplete calculation logic
- ❌ Missing validation layer
- ❌ No test coverage
- ❌ No real-time price updates

### Architecture Compliance
- ❌ Not following layered architecture
- ❌ Incomplete state management
- ❌ Missing error handling
- ❌ Incomplete type definitions
- ❌ Missing API integration

## Detailed Findings

### 1. Store Layer Issues
- Missing proper initialization of default values
- Incomplete state updates
- No handling of currency conversions
- Missing persistence logic
- No error state management
- No price update mechanism
- Missing stock metadata storage

### 2. Calculation Layer Issues
- No validation of input values
- Missing error handling
- No integration with Nisab threshold system
- Incomplete business rules implementation
- Missing dividend calculations
- No handling of different stock types
- Missing zakatable amount logic for:
  - Trading stocks
  - Long-term investments
  - Mutual funds
  - ETFs
  - Company shares

### 3. UI Layer Issues
- Missing form validation
- No real-time calculation updates
- No proper error messaging
- Missing tooltips and help text
- No loading states
- Missing stock search functionality
- No price history visualization
- Missing portfolio overview

### 4. Dashboard Integration Issues
- Missing summary panel updates
- No real-time price updates
- Incomplete asset distribution integration
- Missing performance optimization
- No automatic totals recalculation
- No portfolio performance tracking

## Required Implementation

### 1. Type Definitions
```typescript
interface StockValues {
  // Trading stocks
  active_shares: number;
  active_price_per_share: number;
  
  // Investment stocks
  passive_shares: number;
  passive_price_per_share: number;
  
  // Company shares
  company_cash: number;
  company_receivables: number;
  company_inventory: number;
  total_shares_issued: number;
  
  // Dividends
  dividend_per_share: number;
  dividend_shares: number;
  
  // Funds
  fund_value: number;
  fund_type: 'mutual' | 'etf' | 'index';
  is_shariah_compliant: boolean;
}

interface StockMetadata {
  symbol: string;
  name: string;
  sector: string;
  last_price: number;
  price_date: Date;
  currency: string;
  exchange: string;
}

interface StockState extends StockValues {
  hawlMet: boolean;
  metadata: Record<string, StockMetadata>;
  errors: Record<keyof StockValues, string | null>;
  isValid: boolean;
}
```

### 2. Store Implementation
```typescript
const createStockSlice: StateCreator<
  ZakatState,
  [],
  [],
  StockSlice
> = (set, get) => ({
  stockState: {
    ...DEFAULT_STOCK_VALUES,
    hawlMet: false,
    metadata: {},
    errors: {},
    isValid: false
  },

  setStockValue: (field, value) => {
    set((state) => ({
      stockState: {
        ...state.stockState,
        [field]: value,
        errors: validateStockField(field, value),
        isValid: checkStockValidity({
          ...state.stockState,
          [field]: value
        })
      }
    }))
  },

  updateStockPrice: async (symbol: string) => {
    try {
      const price = await fetchStockPrice(symbol);
      set((state) => ({
        stockState: {
          ...state.stockState,
          metadata: {
            ...state.stockState.metadata,
            [symbol]: {
              ...state.stockState.metadata[symbol],
              last_price: price,
              price_date: new Date()
            }
          }
        }
      }))
    } catch (error) {
      console.error(`Failed to update price for ${symbol}:`, error);
    }
  }
})
```

### 3. Calculation Implementation
```typescript
const stockCalculator = {
  validateValues(values: StockValues): ValidationResult {
    // Implementation
  },

  calculateZakatable(
    values: StockValues,
    metadata: Record<string, StockMetadata>,
    hawlMet: boolean,
    currency: string
  ): CalculationResult {
    if (!hawlMet) return { zakatableAmount: 0, zakatDue: 0 }

    // Trading stocks (full market value)
    const tradingStocksValue = values.active_shares * 
      metadata[values.symbol]?.last_price || 0;

    // Investment stocks (only dividends)
    const dividendIncome = values.dividend_shares * 
      values.dividend_per_share;

    // Company shares (proportional assets)
    const companyAssets = calculateCompanyAssets(values);
    const sharePercentage = values.passive_shares / 
      values.total_shares_issued;
    const companyShareValue = companyAssets * sharePercentage;

    // Funds
    const fundValue = values.is_shariah_compliant ? 
      values.fund_value : 0;

    const zakatableAmount = 
      tradingStocksValue + 
      dividendIncome + 
      companyShareValue + 
      fundValue;

    return {
      zakatableAmount,
      zakatDue: zakatableAmount * ZAKAT_RATE
    }
  }
}
```

## Business Rules to Implement

1. **Stock Types**
   - Trading Stocks (full market value is zakatable)
   - Investment Stocks (only dividends are zakatable)
   - Company Shares (proportional assets are zakatable)
   - Mutual Funds (based on fund composition)
   - ETFs (based on underlying assets)

2. **Calculation Rules**
   - Trading Portfolio: Calculate on current market value
   - Long-term Investments: Calculate on dividends only
   - Company Shares: Calculate proportional zakatable assets
   - Funds: Calculate based on fund composition
   - Mixed Portfolios: Separate calculations by intention

3. **Hawl Requirements**
   - Trading Stocks: Hawl from purchase date
   - Dividends: Hawl from receipt date
   - Investment Stocks: Hawl from holding period
   - Funds: Based on fund holding period

4. **Price Updates**
   - Real-time price updates for active trading
   - Daily updates for investments
   - Market close prices for calculations
   - Currency conversion handling

## Implementation Checklist

### 1. Store Layer
- [ ] Implement proper state initialization
- [ ] Add validation logic
- [ ] Add error handling
- [ ] Implement currency conversion
- [ ] Add state persistence
- [ ] Add computed values
- [ ] Implement reset functionality
- [ ] Add price update mechanism

### 2. Calculation Layer
- [ ] Implement input validation
- [ ] Add business rules
- [ ] Implement Nisab integration
- [ ] Add currency handling
- [ ] Implement breakdown calculations
- [ ] Add audit trail
- [ ] Add price history tracking

### 3. UI Layer
- [ ] Create stock search component
- [ ] Implement form validation
- [ ] Add real-time updates
- [ ] Implement error messages
- [ ] Add loading states
- [ ] Add tooltips
- [ ] Implement help text
- [ ] Add responsive design
- [ ] Add price charts

### 4. API Integration
- [ ] Implement stock price API
- [ ] Add market data service
- [ ] Implement websocket updates
- [ ] Add fallback mechanisms
- [ ] Implement rate limiting
- [ ] Add error recovery
- [ ] Implement caching

### 5. Dashboard Integration
- [ ] Portfolio summary
- [ ] Performance tracking
- [ ] Asset allocation
- [ ] Risk analysis
- [ ] Market updates
- [ ] Alert system

## Performance Considerations

1. **Price Updates**
   - Implement websocket connections
   - Batch price updates
   - Implement update throttling
   - Cache recent prices
   - Handle connection drops

2. **Calculation Optimization**
   - Memoize expensive calculations
   - Batch state updates
   - Implement debouncing
   - Cache intermediate results
   - Optimize rerender triggers

3. **Data Management**
   - Implement efficient storage
   - Handle large portfolios
   - Optimize price history
   - Implement data pruning
   - Add compression for history

## Next Steps

1. **Immediate Actions**
   - Complete type definitions
   - Implement basic store
   - Create UI components
   - Add price fetching

2. **Short-term Goals**
   - Implement calculation logic
   - Add error handling
   - Create test suite
   - Add documentation

3. **Long-term Goals**
   - Add advanced features
   - Implement optimization
   - Add analytics
   - Improve user experience

## Additional Recommendations

1. **Documentation**
   - Add API documentation
   - Create usage examples
   - Document business rules
   - Add troubleshooting guide

2. **Monitoring**
   - Add performance monitoring
   - Implement error tracking
   - Add usage analytics
   - Create audit logs

3. **Testing**
   - Unit tests for calculations
   - Integration tests for API
   - UI component tests
   - Performance benchmarks
   - Load testing
   - API mocking

4. **Security**
   - Implement rate limiting
   - Add input sanitization
   - Secure API keys
   - Add request validation
   - Implement error masking 