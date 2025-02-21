# Project Name: Smart Zakat Calculator
# Stack: React (Next.js) for Frontend, Node.js (Express) or Python (FastAPI) for Backend
# Scope: 
- Interactive UI with a chat-like question flow
- Smart asset categorization and Zakat calculations
- No database (stateless API calls)
- API integrations for real-time gold, silver, crypto, stock prices

## Frontend (React/Next.js):
1. Set up a Next.js project with Tailwind CSS.
2. Create a chat-like UI component using React hooks (useState, useEffect).
3. Implement a dynamic step-by-step question flow.
4. Use Zustand for lightweight state management.
5. Fetch live Nisab thresholds from a gold/silver API.

## Backend (Node.js/Express OR Python/FastAPI):
1. Create a backend server with Express.js (Node) or FastAPI (Python).
2. Implement Zakat calculation logic for cash, gold, stocks, crypto, business assets.
3. Fetch real-time asset values using:
   - Metals API for gold/silver prices
   - CoinGecko API for crypto prices
   - Yahoo Finance API for stock prices
4. Accept user input from the frontend and return real-time Zakat results.

## Next Steps:
- Develop frontend question flow
- Connect backend calculation logic
- Optimize for speed and usability
