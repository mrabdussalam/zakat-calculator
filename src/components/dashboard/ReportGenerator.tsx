'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface Asset {
  id: string
  name: string
  amount: number
  currency: string
  type: string
  lastUpdated?: string
}

interface ReportGeneratorProps {
  assets: Asset[]
  nisabThreshold: number
  currency: string
  calculationDate: Date
}

export function ReportGenerator({
  assets,
  nisabThreshold,
  currency,
  calculationDate
}: ReportGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateReport = async () => {
    try {
      setLoading(true)
      setError(null)

      // TODO: Replace with actual API call to generate PDF
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assets,
          nisabThreshold,
          currency,
          calculationDate: calculationDate.toISOString(),
        }),
      })

      if (!response.ok) throw new Error('Failed to generate report')

      // Trigger download of the generated PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `zakat-calculation-${calculationDate.toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError('Unable to generate report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white">
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-medium text-gray-900">Generate Report</h2>
          <p className="text-sm text-gray-500">
            Download a detailed PDF report of your Zakat calculation
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-sm font-medium text-gray-500">Assets Included</div>
                <div className="text-lg font-medium text-gray-900 mt-1">
                  {assets.length}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Calculation Date</div>
                <div className="text-lg font-medium text-gray-900 mt-1">
                  {calculationDate.toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-100">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <Button
            onClick={generateReport}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Generating Report...' : 'Download PDF Report'}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            The report will include a detailed breakdown of your assets, Zakat calculation, and payment instructions.
          </p>
        </div>
      </div>
    </div>
  )
} 