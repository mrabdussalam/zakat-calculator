import { cn, formatCurrency } from "@/lib/utils";
import { useZakatStore } from "@/store/zakatStore";
import { ChevronDown, AlertCircle, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { RefreshIcon } from "@/components/ui/icons";
import { useNisabStatus } from "@/hooks/useNisabStatus";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

interface NisabStatusProps {
  nisabStatus: {
    meetsNisab: boolean;
    totalValue: number;
    nisabValue: number;
    thresholds: {
      gold: number;
      silver: number;
    };
    currency?: string;
  };
  currency: string;
}

export function NisabStatus({ nisabStatus, currency }: NisabStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { convertedValues, isFetching, isOfflineMode, errorMessage, retryCount, meetsNisab, componentKey, handleRefresh, getNisabStatusMessage, getUserFriendlyErrorMessage, hasSuspiciouslyLowValues } = useNisabStatus(nisabStatus, currency);
  const friendlyErrorMessage = getUserFriendlyErrorMessage();
  const nisabInfoText = useMemo(() => {
    if (isOfflineMode || isFetching) {
      return "Using local metal price data for nisab calculations. Live prices unavailable.";
    }
    return "Nisab is the minimum amount of wealth that must be owned before Zakat becomes obligatory. It is calculated based on the value of either gold (85g) or silver (595g), whichever is lower.";
  }, [isOfflineMode, isFetching]);
  const { metalPrices, isFetchingNisab } = useZakatStore();

  // Check if we're dealing with PKR values that might be suspicious
  const isPKR = currency === 'PKR';
  const hasSuspiciousValues = hasSuspiciouslyLowValues(
    currency,
    convertedValues?.goldThreshold,
    convertedValues?.silverThreshold
  );

  // Animation variants for parent and child elements
  const containerVariants = {
    hidden: {
      height: 0,
      opacity: 0
    },
    visible: {
      height: "auto",
      opacity: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.02
      }
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: {
        duration: 0.15,
        ease: "easeInOut",
        when: "afterChildren",
        staggerChildren: 0.01,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 5
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.15,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: -2,
      transition: {
        duration: 0.1
      }
    }
  };

  if (isFetching) {
    return (
      <div className="space-y-1 p-2">
        <Skeleton className="h-4 w-20" />
        <div className="flex justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="h-8 w-32 rounded-md bg-gray-200 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-2 text-red-500">
        <p>{friendlyErrorMessage}</p>
      </div>
    );
  }

  return (
    <div key={componentKey} className="rounded-xl bg-gray-50/80">
      {/* Status Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <motion.div
            className={cn(
              "h-2 w-2 rounded-full",
              errorMessage
                ? "bg-amber-500"
                : meetsNisab
                  ? "bg-green-500"
                  : "bg-gray-300",
            )}
            animate={{
              scale: meetsNisab ? [1, 1.1, 1] : undefined,
              transition: { duration: 0.2, ease: "easeInOut" }
            }}
          />
          <div className="font-medium text-gray-900">
            {errorMessage
              ? "Nisab Status"
              : meetsNisab
                ? "Meets Nisab"
                : "Below Nisab"}
          </div>
          {(isFetching || isFetchingNisab) && (
            <div className="h-3 w-3 ml-1 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
          )}
          {errorMessage && (
            <div className="flex items-center gap-1 text-amber-600">
              <WifiOff className="h-3 w-3" />
              <span className="text-[10px]">Using local calculation</span>
            </div>
          )}
        </div>
        <motion.div
          initial={false}
          animate={{
            rotate: isExpanded ? 180 : 0,
            scale: isExpanded ? 1.05 : 1
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut"
          }}
          className="text-gray-400 group-hover:text-gray-500"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Error Message */}
              {errorMessage && (
                <motion.div
                  variants={itemVariants}
                  className="text-sm bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-lg flex items-start gap-2"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{friendlyErrorMessage}</p>
                    <p className="text-xs mt-1">
                      {nisabInfoText}
                      {retryCount > 0 && (
                        <span className="block mt-1">
                          Tried {retryCount}{" "}
                          {retryCount === 1 ? "time" : "times"} to reconnect.
                        </span>
                      )}
                      {/* Refresh button in error message - temporarily hidden */}
                      {/*
                      <button
                        onClick={handleRefresh}
                        className="text-amber-700 font-medium inline-flex items-center hover:underline ml-1"
                      >
                        Try again
                        <RefreshIcon className="h-3 w-3 ml-1" />
                      </button>
                      */}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Explanation */}
              <motion.div
                variants={itemVariants}
                className="text-sm text-gray-600 leading-relaxed"
              >
                {nisabInfoText}
              </motion.div>

              {/* Nisab threshold breakdown */}
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-2 gap-3"
              >
                <motion.div
                  className="rounded-lg p-3 bg-white/50 backdrop-blur-sm"
                >
                  <div className="text-xs text-gray-500 mb-1 flex items-center">
                    Gold Nisab (85g)
                    {!convertedValues.isDirectGoldPrice && (
                      <span className="ml-1 text-amber-500 text-[10px] px-1 py-0.5 rounded bg-amber-100/60">converted</span>
                    )}
                  </div>
                  <div className="font-medium text-gray-700">
                    {formatCurrency(convertedValues.goldThreshold, currency)}
                  </div>
                </motion.div>
                <motion.div
                  className="rounded-lg p-3 bg-white/50 backdrop-blur-sm"
                >
                  <div className="text-xs text-gray-500 mb-1 flex items-center">
                    Silver Nisab (595g)
                    {!convertedValues.isDirectSilverPrice && (
                      <span className="ml-1 text-amber-500 text-[10px] px-1 py-0.5 rounded bg-amber-100/60">converted</span>
                    )}
                  </div>
                  <div className="font-medium text-gray-700">
                    {formatCurrency(convertedValues.silverThreshold, currency)}
                  </div>
                </motion.div>
              </motion.div>

              {/* PKR Warning - Show only when values look suspicious */}
              {hasSuspiciousValues && (
                <motion.div
                  variants={itemVariants}
                  className="text-sm bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Currency Conversion Issue</p>
                    <p className="text-xs mt-1">
                      There may be an issue with the PKR nisab values. The values appear suspiciously low.
                      Please try refreshing the page or temporarily switch to USD for more accurate calculations.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Status Message */}
              <motion.div
                key={`nisab-status-${meetsNisab ? 'meets' : 'below'}`}
                variants={itemVariants}
                className={cn(
                  "text-sm font-medium rounded-lg p-3",
                  errorMessage
                    ? "bg-gray-100 text-gray-700"
                    : meetsNisab
                      ? "bg-green-500/10 text-green-700"
                      : "bg-gray-500/5 text-gray-700",
                )}
              >
                <div className="flex items-center gap-1.5">
                  {getNisabStatusMessage()}
                </div>
              </motion.div>

              {/* Last Updated */}
              <motion.div
                variants={itemVariants}
                className="text-[11px] text-gray-400 flex items-center justify-between"
              >
                <div>
                  {errorMessage ? (
                    <span className="flex items-center gap-1">
                      <WifiOff className="h-3 w-3" />
                      Using local calculation
                    </span>
                  ) : (
                    <>
                      Prices last updated:{" "}
                      {metalPrices?.lastUpdated
                        ? new Date(metalPrices.lastUpdated).toLocaleString()
                        : new Date().toLocaleString()}
                      {nisabStatus.currency &&
                        nisabStatus.currency !== currency && (
                          <span className="ml-1 text-amber-500">
                            (converted from {nisabStatus.currency})
                          </span>
                        )}
                    </>
                  )}
                </div>

                {/* Refresh button - temporarily hidden */}
                {/* 
                {!isFetching && !isFetchingNisab && (
                  <motion.button
                    onClick={handleRefresh}
                    className="text-gray-400 hover:text-gray-600 flex items-center text-[11px]"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <RefreshIcon className="h-3 w-3 mr-1" />
                    Refresh
                  </motion.button>
                )}
                */}
              </motion.div>

              {/* Offline Indicator */}
              {isOfflineMode && (
                <motion.div
                  variants={itemVariants}
                  className="flex items-center mt-2 text-amber-600 text-sm border border-amber-200 bg-amber-50 p-2 rounded-md"
                >
                  <WifiOff className="h-4 w-4 mr-2" />
                  <span>
                    Using offline nisab calculation. Live metal prices
                    unavailable in Replit environment.
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 