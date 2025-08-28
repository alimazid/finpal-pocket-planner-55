import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { getCurrencyDisplayAlias } from '@/config/currencies';

interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
}

interface ExchangeRatesDisplayProps {
  defaultCurrency: string;
}

export function ExchangeRatesDisplay({ defaultCurrency }: ExchangeRatesDisplayProps) {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getExchangeRatesForCurrency(defaultCurrency);
        
        if (response.success && response.data) {
          // Filter to show only rates TO the default currency from other major currencies
          const supportedCurrencies = ['USD', 'EUR', 'DOP'];
          const otherCurrencies = supportedCurrencies.filter(c => c !== defaultCurrency);
          
          const relevantRates = response.data
            .filter((rate: any) => 
              otherCurrencies.includes(rate.fromCurrency) && rate.toCurrency === defaultCurrency
            )
            .map((rate: any) => ({
              fromCurrency: rate.fromCurrency,
              toCurrency: rate.toCurrency,
              rate: rate.rate
            }));
            
          // If we don't have direct rates, try to get reverse rates
          if (relevantRates.length === 0) {
            const reverseRates = response.data
              .filter((rate: any) => 
                rate.fromCurrency === defaultCurrency && otherCurrencies.includes(rate.toCurrency)
              )
              .map((rate: any) => ({
                fromCurrency: rate.toCurrency,
                toCurrency: rate.fromCurrency,
                rate: 1 / rate.rate
              }));
            setRates(reverseRates);
          } else {
            setRates(relevantRates);
          }
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, [defaultCurrency]);

  if (isLoading) {
    return (
      <div className="text-sm text-white/70">
        Loading rates...
      </div>
    );
  }

  if (rates.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 text-sm text-white/90">
      {rates.map((rate, index) => (
        <div key={`${rate.fromCurrency}-${rate.toCurrency}`} className="flex items-center">
          {index > 0 && <span className="text-white/50 mr-3">•</span>}
          <span className="text-white/70">
            {getCurrencyDisplayAlias(rate.fromCurrency)}/{getCurrencyDisplayAlias(rate.toCurrency)}
          </span>
          <span className="ml-1 font-medium">
            {rate.rate.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}