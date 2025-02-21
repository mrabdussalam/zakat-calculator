interface RetirementAccountDetails {
  balance: number
  taxRate: number
  penaltyRate: number
  isWithdrawn: boolean
  withdrawnAmount: number
}

interface RetirementCalculatorProps {
  currency: string
} 