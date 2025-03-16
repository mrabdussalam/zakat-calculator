"use client"

import { SUPPORTED_CURRENCIES } from '@/lib/utils/currency'

// Helper function to get country code from currency code (copied from CurrencySelector)
const getCountryCode = (currencyCode: string): string => {
    // Currency code to country code mapping (exceptions for common currencies)
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
        BDT: "BD",
    }

    // Get the country code from mapping or use first two letters of currency code
    return currencyToCountry[currencyCode] ||
        (currencyCode.slice(0, 2) === 'X' ? 'UN' : currencyCode.slice(0, 2))
}

export default function TestFlagsPage() {
    // Get all supported currencies
    const currencies = Object.values(SUPPORTED_CURRENCIES)

    return (
        <div className="container mx-auto p-6 max-w-3xl">
            <h1 className="text-2xl font-bold mb-6">Currency Flag Test</h1>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {currencies.map(currency => {
                    const countryCode = getCountryCode(currency.code)

                    return (
                        <div key={currency.code} className="p-4 border rounded-md flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden border">
                                <img
                                    src={`/flags/${countryCode.toUpperCase()}.svg`}
                                    alt={`${currency.code} flag`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // Show error if flag doesn't load
                                        const target = e.target as HTMLImageElement
                                        target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/><text x="50%" y="50%" font-size="16" text-anchor="middle" fill="white">Error</text></svg>'
                                    }}
                                />
                            </div>
                            <div>
                                <div className="font-medium">{currency.code}</div>
                                <div className="text-sm text-gray-500">{currency.name}</div>
                                <div className="text-xs text-gray-400">Country: {countryCode}</div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
} 