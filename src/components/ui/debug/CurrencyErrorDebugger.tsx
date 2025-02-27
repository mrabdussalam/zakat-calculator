/**
 * This component is for development debugging purposes only.
 * It allows testing the currency conversion error handling mechanisms.
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useZakatStore } from '@/store/zakatStore'
import { convertCurrency } from '@/app/api/utils/currency'
import { getFallbackExchangeRate } from '@/store/utils/nisabUtils'
import { useCurrencyStore } from '@/lib/services/currency'
import { CURRENCY_NAMES } from '@/lib/services/currency'

export function CurrencyErrorDebugger() {
  const [amount, setAmount] = useState('100')
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('PKR')
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  
  const currency = useZakatStore(state => state.currency)
  const fetchNisabData = useZakatStore(state => state.fetchNisabData)
  
  const { rates, baseCurrency, fetchRates, convertAmount } = useCurrencyStore()
  
  // Add debug info
  useEffect(() => {
    const currencyKeys = Object.keys(rates || {}).sort()
    setDebugInfo({
      ratesAvailable: (rates && Object.keys(rates).length > 0) ? 'Yes' : 'No',
      baseCurrency,
      totalRates: currencyKeys.length,
      sampleRates: currencyKeys.slice(0, 5).map(key => `${key}: ${rates[key]}`),
      pkrRate: rates?.pkr || 'Not available',
      usdRate: rates?.usd || 'Not available',
      inrRate: rates?.inr || 'Not available',
    })
  }, [rates, baseCurrency])
  
  const handleConvert = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    setConvertedAmount(null)

    try {
      const numAmount = parseFloat(amount)
      if (isNaN(numAmount)) {
        throw new Error('Please enter a valid number')
      }

      // Log detailed steps for debugging
      console.log('Starting conversion process:')
      console.log(`Amount: ${numAmount} ${fromCurrency} → ${toCurrency}`)
      console.log(`Base currency: ${baseCurrency}`)
      
      if (fromCurrency === toCurrency) {
        console.log('No conversion needed - same currency')
        setConvertedAmount(numAmount)
        return
      }
      
      console.log('Available rates:', rates)
      console.log(`From currency rate: ${rates[fromCurrency.toLowerCase()]}`)
      console.log(`To currency rate: ${rates[toCurrency.toLowerCase()]}`)

      // Use local store's convertAmount
      const storeConverted = convertAmount(numAmount, fromCurrency, toCurrency)
      console.log(`Store conversion result: ${storeConverted}`)
      
      // Compare with API conversion
      const apiConverted = await convertCurrency(numAmount, fromCurrency, toCurrency)
      console.log(`API conversion result: ${apiConverted}`)
      
      // Test direct calculations
      let manualCalculation
      const fromRate = rates[fromCurrency.toLowerCase()]
      const toRate = rates[toCurrency.toLowerCase()]
      
      if (fromCurrency.toLowerCase() === baseCurrency.toLowerCase()) {
        // FROM is base currency
        manualCalculation = numAmount * toRate
        console.log(`Manual calculation (base→target): ${numAmount} × ${toRate} = ${manualCalculation}`)
      } else if (toCurrency.toLowerCase() === baseCurrency.toLowerCase()) {
        // TO is base currency
        manualCalculation = numAmount / fromRate
        console.log(`Manual calculation (source→base): ${numAmount} ÷ ${fromRate} = ${manualCalculation}`)
      } else {
        // Neither is base currency
        const inBase = numAmount / fromRate
        manualCalculation = inBase * toRate
        console.log(`Manual calculation (source→base→target): ${numAmount} ÷ ${fromRate} × ${toRate} = ${manualCalculation}`)
      }
      
      // Special test for USD → PKR conversion and gold/silver nisab
      if (fromCurrency === 'USD' && toCurrency === 'PKR') {
        // Test the nisab calculation for gold (85g)
        const goldGrams = 85;
        const goldPriceUSD = 93.98; // USD per gram
        const goldNisabUSD = goldPriceUSD * goldGrams;
        const goldNisabPKR = goldNisabUSD * toRate;
        
        // Test the nisab calculation for silver (595g)
        const silverGrams = 595;
        const silverPriceUSD = 1.02; // USD per gram
        const silverNisabUSD = silverPriceUSD * silverGrams;
        const silverNisabPKR = silverNisabUSD * toRate;
        
        console.log('**** NISAB CONVERSION TEST ****');
        console.log(`Gold Nisab (85g): ${goldNisabUSD.toFixed(2)} USD → ${goldNisabPKR.toFixed(2)} PKR`);
        console.log(`Silver Nisab (595g): ${silverNisabUSD.toFixed(2)} USD → ${silverNisabPKR.toFixed(2)} PKR`);
        console.log('Using exchange rate:', toRate);
        console.log('*******************************');
        
        // Add to the UI
        setErrorMessage(`
          Gold Nisab: $${goldNisabUSD.toFixed(2)} → ₨${goldNisabPKR.toFixed(2)}\n
          Silver Nisab: $${silverNisabUSD.toFixed(2)} → ₨${silverNisabPKR.toFixed(2)}\n
          Exchange rate: ${toRate.toFixed(4)} PKR per USD
        `);
      }
      
      setConvertedAmount(storeConverted)
      
      // Check for major discrepancies
      const discrepancyPercentage = Math.abs((storeConverted - apiConverted) / apiConverted) * 100
      if (discrepancyPercentage > 1) {
        const currentMessage = errorMessage || '';
        setErrorMessage(`${currentMessage}\nWarning: Store calculation differs from API by ${discrepancyPercentage.toFixed(2)}%`);
      }
      
    } catch (error) {
      console.error('Conversion error:', error)
      setErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Add function to refresh rates
  const handleRefreshRates = async () => {
    try {
      setIsLoading(true)
      await fetchRates(baseCurrency)
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(`Failed to refresh rates: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Currency Conversion Debugger</CardTitle>
        <CardDescription>Test currency conversion with detailed logs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input 
            id="amount" 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fromCurrency">From Currency</Label>
            <Select
              value={fromCurrency}
              onValueChange={(value) => setFromCurrency(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CURRENCY_NAMES).map(([code, name]) => (
                  <SelectItem key={code} value={code.toUpperCase()}>
                    {code.toUpperCase()} - {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="toCurrency">To Currency</Label>
            <Select
              value={toCurrency}
              onValueChange={(value) => setToCurrency(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CURRENCY_NAMES).map(([code, name]) => (
                  <SelectItem key={code} value={code.toUpperCase()}>
                    {code.toUpperCase()} - {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Debug info display */}
        {debugInfo && (
          <div className="mt-4 text-xs p-2 bg-gray-100 rounded-md">
            <p><strong>Rates available:</strong> {debugInfo.ratesAvailable}</p>
            <p><strong>Base currency:</strong> {debugInfo.baseCurrency}</p>
            <p><strong>Total rates:</strong> {debugInfo.totalRates}</p>
            <p><strong>Sample rates:</strong></p>
            <ul className="pl-4 list-disc">
              {debugInfo.sampleRates.map((rate: string, i: number) => (
                <li key={i}>{rate}</li>
              ))}
            </ul>
            <p><strong>PKR rate:</strong> {debugInfo.pkrRate}</p>
            <p><strong>USD rate:</strong> {debugInfo.usdRate}</p>
            <p><strong>INR rate:</strong> {debugInfo.inrRate}</p>
          </div>
        )}
        
        {errorMessage && (
          <div className="p-2 text-sm bg-red-50 text-red-600 rounded-md">
            {errorMessage}
          </div>
        )}

        {convertedAmount !== null && (
          <div className="p-3 text-center bg-green-50 rounded-md">
            <p className="text-sm text-gray-500">Converted Amount:</p>
            <p className="text-lg font-semibold">
              {convertedAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} {toCurrency}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {amount} {fromCurrency} = {convertedAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} {toCurrency}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleRefreshRates} 
          disabled={isLoading}
        >
          Refresh Rates
        </Button>
        <Button 
          onClick={handleConvert} 
          disabled={isLoading}
        >
          {isLoading ? 'Converting...' : 'Convert'}
        </Button>
      </CardFooter>
    </Card>
  )
} 