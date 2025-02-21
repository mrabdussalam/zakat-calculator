Gather Investment Details to Calculate Total Market Value
Option A – Manual Entry for Each Investment:

For Each Investment:
Ticker or Investment Name:
Input Field: Text field (e.g., “AAPL”, “SPY”, etc.)
Number of Shares/Units Owned:
Input Field: Numeric field (e.g., 100)
Current Price per Share/Unit:
Input Field: Numeric field with currency formatting
Optional Automation:
“Fetch Price” button that retrieves the current price from a financial API (e.g., Alpha Vantage, Finnhub, or IEX Cloud)
Individual Market Value Calculation (Displayed Automatically):
Calculation:
Market Value of Investment
=
Number of Shares
×
Current Price
Market Value of Investment=Number of Shares×Current Price
Display: A read-only field showing the calculated value.
Repeat:
Allow users to add multiple investments using an “Add Investment” button.
Option B – Single Entry for Overall Market Value:

Direct Input:
If the user already has the total market value from their brokerage summary, provide a single numeric input field:
Label: “Total Market Value of Your Passive Investments”
Validation: Ensure the input is numeric and positive.
Aggregation (If Using Option A):

Automatic Summing:
As investments are added, automatically sum the individual market values to display the Total Market Value.
Display:
A summary section showing:
List of individual investments with their market values.
The computed Total Market Value (e.g., $45,000).
Step 4: Quick Calculation of Zakat
Calculate Estimated Liquid Value:

Formula:
Estimated Liquid Value
=
Total Market Value
×
0.30
Estimated Liquid Value=Total Market Value×0.30
Display:
Show the estimated liquid value with an explanation:
“Approximately 30% of your total market value is assumed to be liquid and Zakatable.”
Calculate Zakat Due:

Formula:
Zakat Due
=
Estimated Liquid Value
×
0.025
Zakat Due=Estimated Liquid Value×0.025
Display:
Present the computed Zakat due.
Example:
If the Total Market Value is $50,000:
Estimated Liquid Value = $50,000 × 0.30 = $15,000
Zakat Due = $15,000 × 0.025 = $375
Step 5: Review and Confirm
Review Screen:
Summary Display:
Total Market Value: (Either directly input or aggregated from individual investments)
Estimated Liquid Value: 30% of the total market value
Zakat Due: 2.5% of the estimated liquid value
Example Recap:
Market Value: $50,000
Estimated Liquid Value: $15,000
Zakat Due: $375