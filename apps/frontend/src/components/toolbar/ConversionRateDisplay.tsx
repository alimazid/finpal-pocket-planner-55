import { useState, useEffect, useCallback } from 'react';
import { ArrowRightLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/useTranslation';
import { exchangeRateService } from '@/lib/exchangeRateService';
import { getCurrencyDisplayAlias } from '@/config/currencies';

interface ConversionRateDisplayProps {
  language: 'english' | 'spanish';
  fromCurrency?: string;
  toCurrency?: string;
}

export function ConversionRateDisplay({
  language,
  fromCurrency = 'USD',
  toCurrency = 'DOP'
}: ConversionRateDisplayProps) {
  const { t } = useTranslation(language);
  const [rate, setRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRate = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
      exchangeRateService.clearCache();
    } else {
      setIsLoading(true);
    }

    try {
      const exchangeRate = await exchangeRateService.getExchangeRate(fromCurrency, toCurrency);
      setRate(exchangeRate);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      // Keep existing rate if available
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fromCurrency, toCurrency]);

  useEffect(() => {
    fetchRate();

    // Refresh every 5 minutes
    const intervalId = setInterval(() => {
      fetchRate();
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [fetchRate]);

  const handleRefresh = () => {
    if (!isRefreshing) {
      fetchRate(true);
    }
  };

  const formatRate = (rateValue: number): string => {
    // Format with appropriate decimal places
    if (rateValue >= 10) {
      return rateValue.toFixed(2);
    } else if (rateValue >= 1) {
      return rateValue.toFixed(4);
    } else {
      return rateValue.toFixed(6);
    }
  };

  const getLastUpdatedText = (): string => {
    if (!lastUpdated) return '';

    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) {
      return t('exchangeRateJustNow');
    } else if (diffMins < 60) {
      return language === 'spanish'
        ? `${t('exchangeRateUpdated')} ${diffMins} ${diffMins === 1 ? t('minuteAgo') : t('minutesAgo')}`
        : `${t('exchangeRateUpdated')} ${diffMins} ${diffMins === 1 ? t('minuteAgo') : t('minutesAgo')}`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return language === 'spanish'
        ? `${t('exchangeRateUpdated')} ${diffHours} ${diffHours === 1 ? t('hourAgo') : t('hoursAgo')}`
        : `${t('exchangeRateUpdated')} ${diffHours} ${diffHours === 1 ? t('hourAgo') : t('hoursAgo')}`;
    }
  };

  const fromAlias = getCurrencyDisplayAlias(fromCurrency);
  const toAlias = getCurrencyDisplayAlias(toCurrency);

  if (isLoading && rate === null) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground border border-border rounded-md bg-background/50">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">{t('loading')}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('loadingExchangeRate')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-foreground border-border hover:bg-accent h-9 px-2.5"
          >
            {isRefreshing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ArrowRightLeft className="w-3.5 h-3.5" />
            )}
            <span className="text-xs font-medium">
              <span className="font-semibold">{fromAlias}</span>
              <span className="text-muted-foreground mx-0.5">/</span>
              <span className="font-semibold">{toAlias}</span>
              {rate !== null && (
                <>
                  <span className="text-muted-foreground mx-1">:</span>
                  <span className="tabular-nums">{formatRate(rate)}</span>
                </>
              )}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{t('exchangeRate')}</p>
            {rate !== null && (
              <p className="text-sm">
                1 {fromCurrency} = {formatRate(rate)} {toCurrency}
              </p>
            )}
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">{getLastUpdatedText()}</p>
            )}
            <p className="text-xs text-muted-foreground">{t('clickToRefresh')}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
