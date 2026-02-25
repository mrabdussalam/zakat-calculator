'use client'

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Loader2 } from "lucide-react"
import { Noto_Naskh_Arabic } from 'next/font/google'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from "@/lib/utils"
import { CurrencySelector } from "@/components/ui/CurrencySelector"
import { useZakatStore } from "@/store/zakatStore"
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher"

const notoNaskhArabic = Noto_Naskh_Arabic({
  weight: ['400', '500', '600', '700'],
  subsets: ['arabic'],
  display: 'swap',
})

// Animation variants for staggered animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'tween',
      ease: [0.25, 0.1, 0.25, 1.0],
      duration: 0.3
    }
  }
}

export default function HomePage() {
  const t = useTranslations('home')
  const tc = useTranslations('common')
  const [isLoading, setIsLoading] = useState(false)
  // Initialize with saved currency from localStorage
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    try {
      return typeof window !== 'undefined' ? (localStorage.getItem('selected-currency') || 'USD') : 'USD'
    } catch {
      return 'USD'
    }
  })

  // Listen for currency selection changes and poll localStorage
  useEffect(() => {
    // Check localStorage periodically to keep state in sync
    const checkCurrency = () => {
      const savedCurrency = localStorage.getItem('selected-currency') || 'USD'
      if (savedCurrency !== selectedCurrency) {
        console.log('Currency changed in localStorage, updating state:', savedCurrency)
        setSelectedCurrency(savedCurrency)
      }
    }

    // Check immediately and then every 500ms
    checkCurrency()
    const interval = setInterval(checkCurrency, 500)

    const handleCurrencyChange = (event: CustomEvent) => {
      setSelectedCurrency(event.detail.to)
    }

    window.addEventListener('currency-changed', handleCurrencyChange as EventListener)

    return () => {
      clearInterval(interval)
      window.removeEventListener('currency-changed', handleCurrencyChange as EventListener)
    }
  }, [selectedCurrency])

  // Reset loading state when page becomes visible again
  useEffect(() => {
    // Reset loading state on initial load
    setIsLoading(false)

    // Reset loading state when user navigates back to this page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsLoading(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Also reset on page load/reload
    window.addEventListener('pageshow', (event) => {
      // Reset state even if page is loaded from cache (bfcache)
      if (event.persisted) {
        setIsLoading(false)
      }
    })

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handleVisibilityChange)
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: selectedCurrency,
    }).format(amount)
  }

  const handleStartCalculation = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Get the CURRENT currency from localStorage (source of truth)
    // Don't rely on state which may be stale
    const currentCurrency = localStorage.getItem('selected-currency') || 'USD'
    console.log('Starting calculation with currency:', currentCurrency)

    // Get the zakatStore instance
    const zakatStore = useZakatStore.getState()

    // Perform a hard reset with the new currency
    if (zakatStore && typeof zakatStore.resetWithCurrencyChange === 'function') {
      console.log('Performing hard reset with currency change to:', currentCurrency)
      zakatStore.resetWithCurrencyChange(currentCurrency)
    }

    // Small delay to show loading state
    setTimeout(() => {
      window.location.href = '/dashboard?t=' + Date.now()
    }, 800)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <motion.div
          className="max-w-xl mx-auto space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hero Section with About button */}
          <motion.div variants={itemVariants} className="flex justify-between items-center">
            <h1 className="page-title">
              {t('title')}
            </h1>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Link href="/about">
                <Button variant="ghost" size="sm" className="rounded-full">
                  {tc('about')}
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Quranic Verse */}
          <motion.div variants={itemVariants} className="rounded-xl border border-gray-100 p-6 space-y-4">
            <p className={`text-lg sm:text-xl text-gray-900 leading-[2] text-right font-semibold ${notoNaskhArabic.className}`} dir="rtl">
              {t('quranVerse')}
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {t('quranTranslation')}
              </p>
              <p className="text-xs text-gray-500">
                {t('quranReference')}
              </p>
            </div>
          </motion.div>

          {/* Currency Selection */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">{t('currencyPrompt')}</p>
            </div>

            <CurrencySelector
              value={selectedCurrency}
              onValueChange={(value) => {
                setSelectedCurrency(value)
                localStorage.setItem('selected-currency', value)
                window.dispatchEvent(new CustomEvent('currency-changed', { detail: { from: selectedCurrency, to: value } }))
              }}
            />

            {/* CTA Button */}
            <div className="pt-2">
              <a
                href="#"
                className="block"
                onClick={handleStartCalculation}
              >
                <Button
                  variant="default"
                  size="lg"
                  className="rounded-lg bg-black hover:bg-gray-800 text-white px-8 h-12 text-sm w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tc('loading')}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      {tc('startCalculation')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  )}
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div variants={itemVariants} className="grid gap-4">
            {/* What is Zakat */}
            <div className="rounded-xl bg-gray-100/80 p-6 space-y-2">
              <h2 className="text-xl font-medium tracking-tight text-gray-900">{t('whatIsZakat')}</h2>
              <p className="text-sm text-gray-600">
                {t('zakatDescription')}
              </p>
            </div>
          </motion.div>

          {/* How it Works & Supported Assets */}
          <motion.div variants={itemVariants} className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            {/* How it Works */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-xl font-medium tracking-tight text-gray-900">{t('howItWorks')}</h2>
                <div className="space-y-3">
                  {[
                    t('steps.step1'),
                    t('steps.step2'),
                    t('steps.step3'),
                    t('steps.step4')
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
                <h2 className="text-xl font-medium tracking-tight text-gray-900">{t('supportedAssets')}</h2>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  {([
                    t('assets.cash'),
                    t('assets.gold'),
                    t('assets.stocks'),
                    t('assets.crypto'),
                    t('assets.realEstate'),
                    t('assets.retirement')
                  ] as string[]).map((asset) => (
                    <div key={asset} className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-1 h-1 rounded-full bg-gray-400" />
                      {asset}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="text-xs text-gray-500">
            {t('disclaimer')}
          </motion.div>

          {/* Separator */}
          <motion.div variants={itemVariants} className="border-t border-gray-100 my-4"></motion.div>

          {/* Contact Information */}
          <motion.div variants={itemVariants} className="text-gray-600 text-xs leading-tight">
            <p className="mb-1 text-xs">
              <strong>{tc('contributors')}:</strong>{" "}
              <a
                href="https://www.linkedin.com/in/imabdussalam/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-xs"
              >
                Abdus Salam
              </a>
              ,{" "}
              <a
                href="https://github.com/MrAsimZahid"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-xs"
              >
                Asim Zahid
              </a>
              ,{" "}
              <a
                href="https://github.com/rganeyev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-xs"
              >
                Rustam Ganeyev
              </a>
            </p>
          </motion.div>

          {/* Footer Links */}
          <motion.div variants={itemVariants} className="flex flex-col items-center mt-2">
            <div className="flex items-center space-x-3">
              <Link href="mailto:abdussalam.rafiq@gmail.com">
                <Button variant="ghost" size="sm" className="rounded-full">
                  {tc('contact')}
                </Button>
              </Link>
              <div className="w-1 h-1 rounded-full bg-gray-400"></div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={(e) => {
                  e.preventDefault();
                  window.open("https://docs.google.com/forms/d/e/1FAIpQLSfD2nnRNka_P4GU-YyUuyOahFCNpJe8yHsLs3jlyLkZqRMiig/viewform?embedded=true", "_blank");
                }}
              >
                {tc('feedback')}
              </Button>
              <div className="w-1 h-1 rounded-full bg-gray-400"></div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={(e) => {
                  e.preventDefault();
                  window.open("https://github.com/mrabdussalam/zakat-calculator", "_blank");
                }}
              >
                {tc('github')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
