# Zakat Guide

A comprehensive Islamic zakat calculator built with Next.js that helps users calculate their zakat obligations across multiple asset types.

**Project Owner:** Abdus Salam

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Key Features

- 6 asset type calculators with Islamic calculation methods
- Real-time price fetching (metals, crypto, stocks)
- Multi-currency support (19+ currencies)
- Nisab threshold tracking
- Hawl (lunar year) status per asset type
- PDF report generation
- Responsive design

## Asset Calculators

### Cash & Bank Accounts
Aggregates all liquid holdings (cash on hand, checking, savings, digital wallets, foreign currency). **100% zakatable at 2.5% rate** if hawl is met.

### Precious Metals
Regularly worn jewelry is **exempt**. Occasionally worn and investment metals are zakatable at current market prices. **Nisab thresholds: Gold = 87.48g, Silver = 612.36g**. Standard 2.5% rate applies.

### Stocks & Investments
- **Active trading**: 100% zakatable at market value
- **Passive investments**: 30% rule (quick) or CRI method (detailed)
- **Dividends**: 100% zakatable

Standard 2.5% rate on all zakatable amounts.

### Real Estate
- **Primary residence**: Fully exempt
- **Rental property**: Net income (income - expenses) is zakatable
- **Property for sale**: Full market value if actively listed
- **Vacant land**: Sale price if sold during the year

Standard 2.5% rate applies.

### Cryptocurrency
Treated as trading goods. **Full market value is zakatable** at 2.5% rate. Real-time prices via CoinGecko API.

### Retirement Accounts
Only **net withdrawable amount** is zakatable. Traditional 401(k)/IRA calculated after deducting 20% tax + 10% penalty. Roth accounts and pension funds are **exempt**. Standard 2.5% rate applies.

## Tech Stack

- **Framework**: Next.js 15, React 19, TypeScript
- **State**: Zustand with localStorage persistence
- **UI**: Tailwind CSS, Radix UI components
- **Charts**: Recharts, D3.js, AG Grid
- **Testing**: Jest with ts-jest

## Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm test             # Run tests
npm run lint         # ESLint check
npm run test:watch   # Tests in watch mode
```

## Documentation

For comprehensive project details, see:
- **[CLAUDE.md](./CLAUDE.md)** - Complete project context, architecture, and guidelines
- **[API_ARCHITECTURE.md](./API_ARCHITECTURE.md)** - API design and endpoints
- **[ASSET_CALCULATOR_GUIDELINES.md](./ASSET_CALCULATOR_GUIDELINES.md)** - Calculator implementation patterns

## License

See [LICENSE](./LICENSE) file for details.
