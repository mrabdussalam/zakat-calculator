Calculating Zakat for Crypto
A. Purely Held Coins (BTC, ETH, etc.)
Zakat = 2.5% × (Market Value of All Held Coins)
If total crypto holdings exceed Nisab (measured by gold or silver value), you owe Zakat.
System automatically sums up BTC, ETH, stablecoins, etc. in USD (or any fiat).
Check if total ≥ gold/silver Nisab threshold.
Gold Nisab: ~85g gold.
Silver Nisab: ~595g silver.
Example:

BTC holding = 1.2 BTC at $30,000 each → $36,000
ETH holding = 5 ETH at $2,000 each → $10,000
Total = $46,000
Zakat = $46,000 × 2.5% = $1,150

Building a Smart Zakat Crypto Calculator
Backend Architecture
Data Ingestion
Wallet/Exchange APIs → fetch balances.

Example User Journey
Connect Wallet & Exchanges

They also add read-only API keys for centralized exchanges.
Automatic Balance Fetch

It fetches real-time prices for each token from a price aggregator (e.g., exchange-api).
System Aggregates Values

Example output:
BTC = $30,000
ETH = $10,000
List of Coins/Tokens:

Provide a section where the user can add one or more cryptocurrencies.
For Each Cryptocurrency, Ask:

Coin/Token Name:
Example: BTC, ETH, USDT, etc.
Tooltip: “Select or enter the coin you hold.”
Quantity Held:
Input Field (numeric, e.g., 1.2 for BTC or 5 for ETH)
Tooltip: “Enter the number of units you own.”
Current Market Price (USD or chosen fiat):
Input Field (numeric, auto-filled if auto-fetch is enabled)
Tooltip: “Enter the current market price per coin. This can be auto-populated using live market data.”
Individual Asset Calculation:

Automatically compute and display:
Market Value
=
Quantity
×
Current Price
Market Value=Quantity×Current Price
Example: If you have 1.2 BTC at $30,000 each, the market value is $36,000.
Ability to Add More Assets:

Provide an “Add Another Coin” button to include multiple cryptocurrencies.
Step 4: Total Market Value & Nisab Check
Aggregate Calculation:

Sum the market values of all entered coins to display your Total Crypto Market Value.
Example: BTC ($36,000) + ETH ($10,000) = $46,000 total.

Zakat Calculation
If Holdings Exceed Nisab:
Calculation Formula:
Zakat Due
=
Total Crypto Market Value
×
0.025
Zakat Due=Total Crypto Market Value×0.025
Example:
With a total value of $46,000:
Zakat Due
=
$
46
,
000
×
0.025
=
$
1
,
150
Zakat Due=$46,000×0.025=$1,150
Display the Result:
Show a summary card with:
Total Market Value: $46,000
Zakat Due (2.5%): $1,150