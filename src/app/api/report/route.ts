import { NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'

interface Asset {
  id: string
  name: string
  amount: number
  currency: string
  type: string
  lastUpdated?: string
}

interface ReportData {
  assets: Asset[]
  nisabThreshold: number
  currency: string
  calculationDate: string
}

function formatCurrency(amount: number, currency: string) {
  return `${amount.toLocaleString()} ${currency}`
}

async function generatePDF(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      })

      const chunks: Buffer[] = []
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))

      // Title
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Zakat Calculation Report', { align: 'center' })
        .moveDown()

      // Date
      doc
        .fontSize(12)
        .font('Helvetica')
        .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' })
        .moveDown()

      // Summary
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('Summary')
        .moveDown(0.5)

      const totalAssets = data.assets.reduce((sum, asset) => sum + asset.amount, 0)
      const isZakatDue = totalAssets >= data.nisabThreshold
      const zakatAmount = isZakatDue ? totalAssets * 0.025 : 0

      doc
        .fontSize(12)
        .font('Helvetica')
        .text(`Total Assets: ${formatCurrency(totalAssets, data.currency)}`)
        .text(`Nisab Threshold: ${formatCurrency(data.nisabThreshold, data.currency)}`)
        .text(`Zakat Due: ${formatCurrency(zakatAmount, data.currency)}`)
        .moveDown()

      // Asset Breakdown
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('Asset Breakdown')
        .moveDown(0.5)

      // Group assets by type
      const assetsByType = data.assets.reduce((acc, asset) => {
        const existing = acc.find(a => a.type === asset.type)
        if (existing) {
          existing.assets.push(asset)
          existing.total += asset.amount
        } else {
          acc.push({
            type: asset.type,
            assets: [asset],
            total: asset.amount
          })
        }
        return acc
      }, [] as { type: string; assets: Asset[]; total: number }[])

      assetsByType.forEach(category => {
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(category.type)
          .moveDown(0.5)

        category.assets.forEach(asset => {
          doc
            .fontSize(12)
            .font('Helvetica')
            .text(
              `${asset.name}: ${formatCurrency(asset.amount, data.currency)}`,
              { indent: 20 }
            )
        })

        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(
            `Total ${category.type}: ${formatCurrency(category.total, data.currency)}`,
            { indent: 20 }
          )
          .moveDown()
      })

      // Payment Instructions
      if (isZakatDue) {
        doc
          .moveDown()
          .fontSize(16)
          .font('Helvetica-Bold')
          .text('Payment Instructions')
          .moveDown(0.5)
          .fontSize(12)
          .font('Helvetica')
          .text(
            'Your Zakat should be paid to eligible recipients as soon as possible. ' +
            'Eligible recipients include the poor, needy, those in debt, and other ' +
            'categories as specified in Islamic law.'
          )
      }

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

export async function POST(request: Request) {
  try {
    const data: ReportData = await request.json()

    const pdfBuffer = await generatePDF(data)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=zakat-calculation-${
          new Date().toISOString().split('T')[0]
        }.pdf`
      }
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}