/**
 * Common props shared by all calculator components.
 * Each calculator receives these from the parent Calculator component.
 */
export interface CalculatorProps {
  currency: string
  onUpdateValues: (values: Record<string, number>) => void
  onHawlUpdate: (hawlMet: boolean) => void
  onCalculatorChange: (calculator: string) => void
  onOpenSummary?: () => void
  initialValues?: Record<string, number>
  initialHawlMet?: boolean
}
