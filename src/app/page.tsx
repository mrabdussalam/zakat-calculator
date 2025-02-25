'use client'

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Loader2 } from "lucide-react"
import { Noto_Naskh_Arabic } from 'next/font/google'
import { useState } from 'react'
import { motion } from 'framer-motion'

const notoNaskhArabic = Noto_Naskh_Arabic({
  weight: ['400', '500', '600', '700'],
  subsets: ['arabic'],
  display: 'swap',
})

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Hero Section */}
          <div className="space-y-3">
            <h1 className="text-3xl font-nb-international font-medium tracking-tight text-gray-900 text-center">
              Zakat Calculator
            </h1>
          </div>

          {/* Quranic Verse */}
          <div className="rounded-xl border border-gray-100 p-6 space-y-4">
            <p className={`text-lg sm:text-xl text-gray-900 leading-[2] text-right font-semibold ${notoNaskhArabic.className}`} dir="rtl">
              وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَأَقْرِضُوا اللَّهَ قَرْضًا حَسَنًا ۚ وَمَا تُقَدِّمُوا لِأَنفُسِكُم مِّنْ خَيْرٍ تَجِدُوهُ عِندَ اللَّهِ هُوَ خَيْرًا وَأَعْظَمَ أَجْرًا
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                "And establish prayer and give zakat and loan Allah a goodly loan. And whatever good you put forward for yourselves—you will find it with Allah. It is better and greater in reward."
              </p>
              <p className="text-xs text-gray-500">
                Surah Al-Muzzammil [73:20]
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <Link 
            href="/dashboard" 
            className="block"
            onClick={(e) => {
              e.preventDefault()
              setIsLoading(true)
              // Small delay to show loading state
              setTimeout(() => {
                window.location.href = '/dashboard?t=' + Date.now()
              }, 800)
            }}
          >
            <motion.div>
              <Button 
                size="lg" 
                className="rounded-full px-8 h-12 text-sm w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center"
                  >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </motion.div>
                ) : (
                  <div className="flex items-center">
                    Start Calculation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                )}
              </Button>
            </motion.div>
          </Link>

          {/* Features Grid */}
          <div className="grid gap-4">
            {/* What is Zakat */}
            <div className="rounded-xl bg-gray-100/80 p-4 space-y-2">
              <h2 className="text-xl font-medium tracking-tight text-gray-900">What is Zakat?</h2>
              <p className="text-sm text-gray-600">
                Zakat is one of the five pillars of Islam. It is a mandatory charitable contribution,
                calculated as 2.5% of your eligible wealth, to be given to those in need.
              </p>
            </div>
          </div>

          {/* How it Works & Supported Assets */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            {/* How it Works */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-xl font-medium tracking-tight text-gray-900">How it works</h2>
                <div className="space-y-3">
                  {[
                    'Select your preferred currency and settings',
                    'Add your assets (cash, gold, investments, etc.)',
                    'Get instant calculation of your Zakat',
                    'Generate detailed report for your records'
                  ].map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-none flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 text-white text-xs font-medium">
                        {index + 1}
                      </div>
                      <p className="text-sm text-gray-600">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supported Assets */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h2 className="text-xl font-medium tracking-tight text-gray-900">Supported Assets</h2>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  {[
                    'Cash & Bank Accounts',
                    'Gold & Silver',
                    'Stocks & Investments',
                    'Cryptocurrency',
                    'Real Estate',
                    'Retirement Accounts'
                  ].map((asset) => (
                    <div key={asset} className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-1 h-1 rounded-full bg-gray-400" />
                      {asset}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            For personalized advice, especially in complex situations, consulting a knowledgeable scholar 
            or a trusted Islamic financial advisor is recommended.
          </p>
        </div>
      </div>
    </div>
  )
}
