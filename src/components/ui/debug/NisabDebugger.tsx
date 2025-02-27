/**
 * This component is for development debugging purposes only.
 * It allows monitoring and debugging nisab calculations.
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useZakatStore } from '@/store/zakatStore'
import { NISAB } from '@/store/constants'
import { getNisabValue } from '@/lib/assets/nisab'
import { useCurrencyStore } from '@/lib/services/currency'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { RefreshIcon } from '@/components/ui/icons'

// Create a simple Badge component since it's missing
interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  children: React.ReactNode;
}

function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span 
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variant === 'default' && "bg-primary-500 text-primary-foreground",
        variant === 'secondary' && "bg-amber-100 text-amber-700",
        variant === 'destructive' && "bg-red-100 text-red-700",
        variant === 'outline' && "border border-gray-300 bg-transparent text-gray-700",
        className
      )}
    >
      {children}
    </span>
  );
}

export function NisabDebugger() {
  const [nisabValues, setNisabValues] = useState<{
    gold: { value: number; isDirectPrice: boolean };
    silver: { value: number; isDirectPrice: boolean };
  }>({
    gold: { value: 0, isDirectPrice: true },
    silver: { value: 0, isDirectPrice: true },
  })
  
  const [expectedValues, setExpectedValues] = useState<{
    gold: number;
    silver: number;
  }>({
    gold: 0,
    silver: 0,
  })
  
  const [error, setError] = useState<string | null>(null)
  
  // Get state from stores
  const { currency, isFetchingNisab, fetchNisabData, metalPrices } = useZakatStore()
  const { rates, baseCurrency, fetchRates } = useCurrencyStore()
  
  // Calculate nisab values
  const calculateNisabValues = () => {
    try {
      // Get current price data
      if (!metalPrices) {
        setError('No metal prices available')
        return
      }
      
      // Extract gold and silver prices
      const goldPrice: Record<string, number> = {}
      const silverPrice: Record<string, number> = {}
      
      // Add USD prices
      if (typeof metalPrices.gold === 'number') {
        goldPrice['USD'] = metalPrices.gold
      }
      
      if (typeof metalPrices.silver === 'number') {
        silverPrice['USD'] = metalPrices.silver
      }
      
      // Add currency-specific prices if available
      if (metalPrices.currency && metalPrices.currency !== 'USD') {
        goldPrice[metalPrices.currency] = metalPrices.gold
        silverPrice[metalPrices.currency] = metalPrices.silver
      }
      
      // Calculate expected values based on raw multiplication
      const expectedGoldValue = goldPrice['USD'] * NISAB.GOLD.GRAMS
      const expectedSilverValue = silverPrice['USD'] * NISAB.SILVER.GRAMS
      
      // Use the conversion utility to get the actual values
      const goldNisabResult = getNisabValue('gold', goldPrice, silverPrice, currency)
      const silverNisabResult = getNisabValue('silver', goldPrice, silverPrice, currency)
      
      // Update state
      setNisabValues({
        gold: goldNisabResult,
        silver: silverNisabResult
      })
      
      setExpectedValues({
        gold: expectedGoldValue,
        silver: expectedSilverValue
      })
      
      setError(null)
    } catch (err) {
      console.error('Error calculating nisab values:', err)
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }
  
  // Initial calculation and when dependencies change
  useEffect(() => {
    calculateNisabValues()
  }, [currency, metalPrices, rates])
  
  // Handle refresh click
  const handleRefresh = async () => {
    try {
      await fetchNisabData()
      await fetchRates(baseCurrency)
      calculateNisabValues()
    } catch (err) {
      setError(`Refresh failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }
  
  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  // Calculate the expected converted values
  const expectedGoldValueConverted = rates && rates[currency.toLowerCase()] 
    ? expectedValues.gold * rates[currency.toLowerCase()] 
    : null
    
  const expectedSilverValueConverted = rates && rates[currency.toLowerCase()] 
    ? expectedValues.silver * rates[currency.toLowerCase()] 
    : null
  
  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Nisab Calculation Debugger
          <Badge variant={error ? "destructive" : "outline"}>
            {currency}
          </Badge>
        </CardTitle>
        <CardDescription>
          Monitor and debug the nisab threshold calculations
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 border p-3 rounded-md">
            <h3 className="font-medium text-sm">Gold Nisab (85g)</h3>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold">
                {nisabValues.gold.value.toLocaleString(undefined, { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} {currency}
              </span>
              {!nisabValues.gold.isDirectPrice && (
                <Badge variant="secondary" className="text-xs">converted</Badge>
              )}
            </div>
            
            <div className="text-xs text-gray-500 space-y-1">
              <div>
                <span>Base: </span>
                <span className="font-mono">
                  {expectedValues.gold.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                </span>
              </div>
              
              {expectedGoldValueConverted && (
                <div>
                  <span>Expected: </span>
                  <span className="font-mono">
                    {expectedGoldValueConverted.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>
              )}
              
              {expectedGoldValueConverted && (
                <div>
                  <span>Difference: </span>
                  <span className={`font-mono ${Math.abs((nisabValues.gold.value - expectedGoldValueConverted) / expectedGoldValueConverted) > 0.1 ? 'text-red-500' : 'text-green-500'}`}>
                    {((nisabValues.gold.value - expectedGoldValueConverted) / expectedGoldValueConverted * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2 border p-3 rounded-md">
            <h3 className="font-medium text-sm">Silver Nisab (595g)</h3>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold">
                {nisabValues.silver.value.toLocaleString(undefined, { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} {currency}
              </span>
              {!nisabValues.silver.isDirectPrice && (
                <Badge variant="secondary" className="text-xs">converted</Badge>
              )}
            </div>
            
            <div className="text-xs text-gray-500 space-y-1">
              <div>
                <span>Base: </span>
                <span className="font-mono">
                  {expectedValues.silver.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                </span>
              </div>
              
              {expectedSilverValueConverted && (
                <div>
                  <span>Expected: </span>
                  <span className="font-mono">
                    {expectedSilverValueConverted.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>
              )}
              
              {expectedSilverValueConverted && (
                <div>
                  <span>Difference: </span>
                  <span className={`font-mono ${Math.abs((nisabValues.silver.value - expectedSilverValueConverted) / expectedSilverValueConverted) > 0.1 ? 'text-red-500' : 'text-green-500'}`}>
                    {((nisabValues.silver.value - expectedSilverValueConverted) / expectedSilverValueConverted * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-xs bg-gray-50 p-2 rounded-md space-y-1">
          <div><strong>Metal Prices:</strong> {metalPrices ? `Gold: ${metalPrices.gold}, Silver: ${metalPrices.silver} (${metalPrices.currency || 'USD'})` : 'None'}</div>
          <div><strong>Exchange Rates:</strong> {rates ? `Base: ${baseCurrency.toUpperCase()}, ${Object.keys(rates).length} currencies available` : 'None'}</div>
          <div><strong>Last Updated:</strong> {metalPrices?.lastUpdated ? new Date(metalPrices.lastUpdated).toLocaleString() : 'Unknown'}</div>
          <div><strong>Source:</strong> {metalPrices?.source || 'Unknown'}</div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleRefresh} 
          disabled={isFetchingNisab}
          variant="outline"
          className="text-xs flex items-center gap-1"
        >
          {isFetchingNisab ? (
            <>
              <div className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-gray-600 rounded-full mr-1" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshIcon className="h-3 w-3" />
              Refresh Data
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
} 