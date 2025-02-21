Determine Fund Accessibility
Question:
“Are your retirement funds currently accessible for withdrawal (even if penalties/taxes apply) or are they locked until retirement?”

Input Options (Radio Buttons or Toggle):

Option A: “Accessible – I plan to withdraw before retirement.”
Option B: “Locked – Funds are not accessible until retirement.”
Guidance:

Tooltip: “If your funds are locked until retirement, Zakat is deferred until you access them. If you are withdrawing early, your account balance (net of taxes and penalties) is subject to annual Zakat.”
Step 3A: Inputs for Approach #1 – Accessible Funds (Treat Like Cash)
If the user selects “Accessible – I plan to withdraw before retirement”:

Input – Account Balance:

Label: “Current Account Balance”
Type: Numeric input (currency formatted)
Example: “e.g., 50,000”
Input – Tax Rate:

Label: “Estimated Tax Rate on Withdrawal (%)”
Type: Numeric input (percentage)
Example: “e.g., 20%”
Guidance: “This is the percentage of your account balance that would be deducted for taxes if you withdrew early.”
Input – Early Withdrawal Penalty Rate:

Label: “Early Withdrawal Penalty Rate (%)”
Type: Numeric input (percentage)
Example: “e.g., 10%”
Guidance: “This is the percentage penalty applied for early withdrawal.”
Automated Calculation:

Net Amount Calculation:
Net Amount
=
Account Balance
−
(
Tax Rate
×
Account Balance
)
−
(
Penalty Rate
×
Account Balance
)
Net Amount=Account Balance−(Tax Rate×Account Balance)−(Penalty Rate×Account Balance)
Zakat Due Calculation:
Zakat Due
=
Net Amount
×
0.025
Zakat Due=Net Amount×0.025
Display:
Show the computed net amount and the resulting Zakat due.
Example Display:
For a $50,000 balance, 20% tax, and 10% penalty:
Net Amount = $50,000 − (0.20×$50,000) − (0.10×$50,000) = $50,000 − $10,000 − $5,000 = $35,000
Zakat Due = $35,000 × 0.025 = $875
Step 3B: Inputs for Approach #2 – Locked Funds (Deferred Zakat)
If the user selects “Locked – Funds are not accessible until retirement”:

Display Informational Message:
Message:
“Since your retirement funds are locked until retirement, Zakat is deferred. No annual Zakat is due on these funds.”
Additional Option:
If the user has already withdrawn some funds, provide a link or option:
“I have withdrawn funds from my retirement account.”
(Optional) Withdrawn Funds Calculation:
If the user indicates they have withdrawn funds:
Input – Withdrawn Amount:
Label: “Withdrawn Amount”
Type: Numeric input (currency formatted)
Guidance: “Enter the amount you have received after withdrawal (taxes/penalties no longer apply).”
Calculation – Zakat on Withdrawn Funds:
Formula:
Zakat Due
=
Withdrawn Amount
×
0.025
Zakat Due=Withdrawn Amount×0.025
Display the Result:
Show the Zakat due on the withdrawn amount.
Recommendation Reminder:
Message:
“The recommended approach is to defer Zakat on locked retirement accounts until you can access the funds. Paying Zakat on inaccessible funds may not be beneficial and can place an unnecessary burden.”
Step 4: Review and Confirmation
Review Screen:

For Approach #1 (Accessible Funds):
Display:
Account Balance
Tax Rate
Penalty Rate
Calculated Net Amount
Zakat Due
For Approach #2 (Locked Funds):
Display a message indicating that no Zakat is due on locked funds.
If withdrawn funds are provided, display the withdrawn amount and calculated Zakat due.
User Options:

Edit: Option to modify any inputs.
Finalize: Button to confirm the calculation and save/export the results.
Guidance:

Provide contextual help regarding why one approach might be more appropriate than the other, reinforcing the book’s guidance.
Step 5: Final Output
Confirmation Message:
For Approach #1:
“Based on your inputs, your accessible retirement account has a net value of $X, and your annual Zakat due is $Y.”
For Approach #2:
“Your retirement funds are currently locked. No Zakat is due until you access these funds. If you have withdrawn funds, your calculated Zakat on the withdrawn amount is $Z.”
