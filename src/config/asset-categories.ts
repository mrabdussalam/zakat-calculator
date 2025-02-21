import { AssetCategory } from '@/types/assets'

export const ASSET_CATEGORIES: Record<string, AssetCategory> = {
  CASH: {
    id: 'cash',
    name: 'Cash and Cash Equivalents',
    description: 'Cash on hand, bank accounts, and foreign currency',
    subcategories: ['Cash on hand', 'Checking accounts', 'Savings accounts', 'Foreign currency'],
    zakatRate: 0.025, // 2.5%
    requiresNisab: true,
    metadata: {
      required: ['dateAdded'],
      optional: ['notes']
    }
  },

  PRECIOUS_METALS: {
    id: 'precious-metals',
    name: 'Precious Metals',
    description: 'Gold and silver in any form',
    subcategories: ['Gold', 'Silver'],
    zakatRate: 0.025,
    requiresNisab: true,
    metadata: {
      required: ['dateAdded', 'weight', 'purity', 'form'],
      optional: ['notes']
    }
  },

  STOCKS: {
    id: 'stocks',
    name: 'Stocks and Investments',
    description: 'Stocks, mutual funds, ETFs, and other investments',
    subcategories: ['Stocks', 'Mutual funds', 'ETFs', 'Index funds'],
    zakatRate: 0.025,
    requiresNisab: true,
    metadata: {
      required: ['dateAdded', 'isActivelyTraded'],
      optional: ['purchaseDate', 'dividendYield', 'notes']
    }
  },

  RETIREMENT: {
    id: 'retirement',
    name: 'Retirement Accounts',
    description: '401(k), IRA, pension funds',
    subcategories: ['401(k)', 'IRA', 'Pension'],
    zakatRate: 0.025,
    requiresNisab: true,
    metadata: {
      required: ['dateAdded', 'accountType'],
      optional: ['employerMatch', 'vestingPeriod', 'notes']
    }
  },

  REAL_ESTATE: {
    id: 'real-estate',
    name: 'Real Estate',
    description: 'Rental properties and properties for sale',
    subcategories: ['Rental properties', 'Properties for sale', 'Vacant land'],
    zakatRate: 0.025,
    requiresNisab: true,
    metadata: {
      required: ['dateAdded', 'propertyType', 'isForSale'],
      optional: ['rentalIncome', 'expenses', 'notes']
    }
  },

  CRYPTO: {
    id: 'crypto',
    name: 'Cryptocurrencies',
    description: 'Digital assets and tokens',
    subcategories: ['Cryptocurrencies', 'Staking rewards', 'LP tokens'],
    zakatRate: 0.025,
    requiresNisab: true,
    metadata: {
      required: ['dateAdded', 'platform'],
      optional: ['acquisitionCost', 'stakingRewards', 'notes']
    }
  },

  OTHER_FINANCIAL: {
    id: 'other-financial',
    name: 'Other Financial Accounts',
    description: 'HSA, FSA, and education accounts',
    subcategories: ['HSA', 'FSA', 'Education savings'],
    zakatRate: 0.025,
    requiresNisab: true,
    metadata: {
      required: ['dateAdded'],
      optional: ['maturityDate', 'interestRate', 'notes']
    }
  },

  DEBT_RECEIVABLE: {
    id: 'debt-receivable',
    name: 'Debt Receivables',
    description: 'Money owed to you by others',
    subcategories: ['Good debt', 'Bad debt'],
    zakatRate: 0.025,
    requiresNisab: true,
    metadata: {
      required: ['dateAdded'],
      optional: ['maturityDate', 'interestRate', 'notes']
    }
  }
} 