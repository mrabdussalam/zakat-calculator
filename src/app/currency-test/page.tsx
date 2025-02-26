import { Metadata } from 'next'
import CurrencySelectorTest from '@/tests/currencyTest'

export const metadata: Metadata = {
  title: 'Currency Selector Test',
  description: 'Test page for the currency selector component',
}

export default function CurrencyTestPage() {
  return <CurrencySelectorTest />
} 