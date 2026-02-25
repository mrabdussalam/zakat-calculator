"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { SUPPORTED_CURRENCIES } from "@/lib/utils/currency"
import { motion, AnimatePresence } from "framer-motion"
import { CURRENCY_NAMES } from "@/lib/services/currency"

interface CurrencySelectorProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

// Currency code to country code mapping
const getCountryCode = (currencyCode: string): string => {
  const currencyToCountry: Record<string, string> = {
    USD: "US",
    EUR: "EU",
    GBP: "GB",
    JPY: "JP",
    AUD: "AU",
    CAD: "CA",
    CHF: "CH",
    CNY: "CN",
    HKD: "HK",
    NZD: "NZ",
    SEK: "SE",
    KRW: "KR",
    SGD: "SG",
    NOK: "NO",
    MXN: "MX",
    INR: "IN",
    RUB: "RU",
    ZAR: "ZA",
    TRY: "TR",
    BRL: "BR",
    TWD: "TW",
    DKK: "DK",
    PLN: "PL",
    THB: "TH",
    IDR: "ID",
    HUF: "HU",
    CZK: "CZ",
    ILS: "IL",
    CLP: "CL",
    PHP: "PH",
    AED: "AE",
    SAR: "SA",
    PKR: "PK",
    QAR: "QA",
    BDT: "BD",
  }

  return currencyToCountry[currencyCode] ||
    (currencyCode.slice(0, 2) === 'X' ? 'UN' : currencyCode.slice(0, 2))
}

// Flag component that loads SVGs from /flags/ with a colored circle fallback
const CountryFlag = ({ countryCode }: { countryCode: string }) => {
  const [flagLoaded, setFlagLoaded] = React.useState(false)
  const [flagError, setFlagError] = React.useState(false)

  const getColorFromCode = (code: string): string => {
    const colors = [
      "#e53935", "#d81b60", "#8e24aa", "#5e35b1",
      "#3949ab", "#1e88e5", "#039be5", "#00acc1",
      "#00897b", "#43a047", "#7cb342", "#c0ca33",
      "#fdd835", "#ffb300", "#fb8c00", "#f4511e"
    ]
    let hash = 0
    for (let i = 0; i < code.length; i++) {
      hash = code.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const backgroundColor = getColorFromCode(countryCode)

  React.useEffect(() => {
    const img = new Image()
    img.onload = () => setFlagLoaded(true)
    img.onerror = () => setFlagError(true)
    img.src = `/flags/${countryCode.toUpperCase()}.svg`

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [countryCode])

  if (!flagLoaded || flagError) {
    return (
      <svg width="100%" height="100%" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="20" fill={backgroundColor} />
        <text
          x="50%"
          y="50%"
          fontFamily="sans-serif"
          fontSize="16"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {countryCode}
        </text>
      </svg>
    )
  }

  return (
    <img
      src={`/flags/${countryCode.toUpperCase()}.svg`}
      alt={`${countryCode} flag`}
      className="w-full h-full object-cover rounded-full"
    />
  )
}

const getCurrencyName = (code: string): string => {
  const lowerCode = code.toLowerCase()
  return CURRENCY_NAMES[lowerCode] || code
}

// Animation variants for hover text swap
const textVariants = {
  initial: { opacity: 0, y: 5 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -5 }
}

// Priority ordering for currency grid
const priorityOrder = ["USD", "PKR", "GBP", "SAR", "INR", "RUB"]

export function CurrencySelector({ value, onValueChange, className }: CurrencySelectorProps) {
  const [hoveredCurrency, setHoveredCurrency] = React.useState<string | null>(null)

  const currencyArray = Object.values(SUPPORTED_CURRENCIES)

  const sortedCurrencyArray = [...currencyArray].sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a.code)
    const bIndex = priorityOrder.indexOf(b.code)
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return 0
  })

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-2 w-full">
        {sortedCurrencyArray.map((currency) => (
          <button
            key={currency.code}
            type="button"
            onClick={() => onValueChange(currency.code)}
            onMouseEnter={() => setHoveredCurrency(currency.code)}
            onMouseLeave={() => setHoveredCurrency(null)}
            className={cn(
              "flex flex-col items-center justify-center py-3 px-1 rounded-xl transition-all w-full",
              value === currency.code
                ? "bg-white ring-2 ring-primary ring-offset-2 shadow-md border border-gray-100"
                : "bg-white hover:bg-gray-50 border border-gray-200"
            )}
          >
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center mb-1 bg-gray-50 border border-gray-100">
              <CountryFlag countryCode={getCountryCode(currency.code)} />
            </div>
            <div className="h-8 flex items-center justify-center px-1 overflow-hidden relative w-full">
              <AnimatePresence mode="wait" initial={false}>
                {hoveredCurrency === currency.code ? (
                  <motion.span
                    key="full-name"
                    className="font-medium text-[0.65rem] text-gray-900 text-center line-clamp-2 leading-tight w-full"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={textVariants}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  >
                    {getCurrencyName(currency.code)}
                  </motion.span>
                ) : (
                  <motion.span
                    key="code"
                    className="font-medium text-sm text-gray-900 w-full text-center"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={textVariants}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  >
                    {currency.code}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
