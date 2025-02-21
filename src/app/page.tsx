import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-md space-y-6 px-4">
        <div className="rounded-xl bg-white p-6 shadow-xs space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium text-gray-900">
              Zakat Guide
            </h1>
            <p className="text-sm text-gray-500">
              Calculate your Zakat accurately and easily with our step-by-step guide.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <h2 className="font-medium text-gray-900">What is Zakat?</h2>
              <p className="mt-1 text-sm text-gray-500">
                Zakat is one of the five pillars of Islam. It is a mandatory charitable contribution,
                calculated as 2.5% of your eligible wealth, to be given to those in need.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <h2 className="font-medium text-gray-900">How it works</h2>
              <ul className="mt-2 space-y-2">
                {[
                  'Select your preferred currency and settings',
                  'Add your assets (cash, gold, investments, etc.)',
                  'Get instant calculation of your Zakat',
                  'Generate detailed report for your records'
                ].map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-gray-500">
                    <span className="font-medium text-gray-900">{index + 1}.</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Link href="/setup" className="block">
            <Button className="w-full">
              Start Calculation
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
