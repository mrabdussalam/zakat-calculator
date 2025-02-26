import React from 'react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/currency';
import { ActiveStock } from '@/store/types';

interface ActiveTradingProps {
  stocks: ActiveStock[];
  currency: string;
  isHawlComplete: boolean;
  onRemoveStock: (symbol: string) => void;
}

export function ActiveTrading({ 
  stocks, 
  currency, 
  isHawlComplete, 
  onRemoveStock 
}: ActiveTradingProps) {
  // Format values based on stock's own currency or fall back to global currency
  const formatStockValue = (value: number, stockCurrency?: string) => {
    const displayCurrency = stockCurrency || currency;
    return formatCurrency(value, displayCurrency);
  };

  if (stocks.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        No active stocks added yet.
      </div>
    );
  }

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zakatable</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zakat Due</th>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {stocks.map((stock) => (
            <tr key={stock.symbol}>
              <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stock.symbol}</td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{stock.shares}</td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatStockValue(stock.currentPrice, stock.currency)}
                {stock.currency && stock.currency !== currency && (
                  <span className="ml-1 text-xs text-gray-400">({stock.currency})</span>
                )}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatStockValue(stock.marketValue, stock.currency)}
                {stock.currency && stock.currency !== currency && (
                  <span className="ml-1 text-xs text-gray-400">({stock.currency})</span>
                )}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                {isHawlComplete ? formatStockValue(stock.marketValue, stock.currency) : formatCurrency(0, currency)}
                {isHawlComplete && stock.currency && stock.currency !== currency && (
                  <span className="ml-1 text-xs text-gray-400">({stock.currency})</span>
                )}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                {isHawlComplete ? formatStockValue(stock.zakatDue, stock.currency) : formatCurrency(0, currency)}
                {isHawlComplete && stock.currency && stock.currency !== currency && (
                  <span className="ml-1 text-xs text-gray-400">({stock.currency})</span>
                )}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => onRemoveStock(stock.symbol)}
                >
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 