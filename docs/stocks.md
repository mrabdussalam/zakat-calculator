# Step 1: Onboarding & Portfolio Connection
Welcome Screen for Active Investments

Message: “Welcome! Let’s calculate your Zakat for actively traded stocks, mutual funds, and ETFs.”
Option to Connect:
“Connect your brokerage account” (if available, using OAuth/API integrations such as with Alpha Vantage, Finnhub, or IEX Cloud)
OR
“Enter your holdings manually”
Progressive Disclosure:

If the user connects their account, automatically pull a list of all active holdings.
If manual, present a simplified form for entering individual assets.
Step 2: Enter or Auto-Fetch Asset Data
For Each Active Asset (Stock, ETF, or Mutual Fund):

Ticker Symbol:
Input: A field to enter the asset’s ticker (e.g., AAPL, SPY).
Automation: As soon as the ticker is entered, the system fetches the latest price using a stock pricing API.
Number of Shares/Units:
Input: A numeric field for how many shares or units the user owns.
Real-time Price Fetch:
Automation: Use an API (e.g., Alpha Vantage or Finnhub) to auto-populate the current market price for that ticker.
Live Calculation:
Display: Calculate the asset’s market value (shares × current price) and display it instantly.
Tooltip: “This is the current market value for your actively traded asset.”
Editable Asset List:

Allow users to add or remove assets from the list.
Dynamic Updates: As assets are added or removed, update the total market value in real time.
Step 3: Automatic Aggregation & Zakat Computation
Total Market Value Calculation:

Automation: Sum the market value of all listed assets.
Display: Show a summary section with a breakdown of:
Each asset’s market value.
The aggregated total market value.
Zakat Calculation:

Formula Applied Automatically:
Zakat Due
=
Total Market Value
×
0.025
Zakat Due=Total Market Value×0.025
Live Result:
Display the computed Zakat due alongside the total market value.
Tooltip: “Because these assets are liquid (cash equivalents), the full market value is subject to Zakat at a rate of 2.5%.”
Real-Time Adjustments:

As the market prices update (via periodic API calls) or as the user adjusts holdings, the Zakat amount recalculates automatically.
Step 4: Validation & Contextual Guidance
Input Validation:

Ticker Verification: Validate ticker symbols against a known list or API response.
Numeric Checks: Ensure that the number of shares and prices are valid (non-negative, proper format).
User Feedback: Provide immediate error messages or corrections if any data is invalid.
Contextual Guidance:

Tooltips and Info Icons: Each input field has a tooltip explaining why it’s needed (e.g., “Enter the ticker to fetch the current market price automatically.”).
Explanatory Text:
“Actively traded stocks, ETFs, and mutual funds are considered cash equivalents. Therefore, the entire market value is subject to a 2.5% Zakat rate.”
Live Progress Indicators:

A progress bar or step indicator that shows the user how far along they are in the process.
Step 5: Final Review and Confirmation
Review Screen:

Display:
A summary table with all assets, individual market values, the total market value, and the computed Zakat.
User Options:
“Edit Asset List” (to add/remove or adjust entries)
“Recalculate” (if prices or quantities have changed)
Confirmation Button: “Finalize Calculation”
Final Message:

“Your active investments total $50,000 in market value, resulting in a Zakat due of $1,250.”
Offer options to save, export, or share the calculation results.
How This Flow Is Smarter and Automated
Real-Time Data Integration:

Automatic price fetching minimizes manual errors and keeps the calculation up-to-date with current market conditions.
Progressive Disclosure:

Users start with a high-level decision (connect vs. manual entry) and are then guided through a tailored input process that only asks for necessary details.
Live Calculations & Feedback:

As soon as data is entered or updated, the system recalculates the market value and Zakat, providing instant feedback.
Validation & User Guidance:

Input validation and contextual tooltips help ensure that users provide accurate data and understand each step of the calculation process.
Modular & Extensible:

The flow is designed so that similar principles can later be applied to other asset types (e.g., passive investments, dividend earnings) using the same architecture.
This automated, step-by-step flow makes the Zakat calculation for active investments as effortless and error-free as possible for the user, aligning perfectly with your core principles of smart automation, progressive user experience, and contextual guidance.