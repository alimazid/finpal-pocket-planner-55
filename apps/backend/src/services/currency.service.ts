import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { NotFoundError } from '../middleware/error.middleware.js';

export interface SupportedCurrency {
  id: string;
  code: string;
  displayAlias: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ExchangeRateData {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  isActive: boolean;
  updatedAt: Date;
}

export class CurrencyService {
  // Cache for exchange rates (10-minute cache)
  private exchangeRateCache = new Map<string, { rate: number; timestamp: number }>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

  /**
   * Get all supported currencies ordered by sortOrder
   */
  async getSupportedCurrencies(): Promise<SupportedCurrency[]> {
    const currencies = await prisma.currency.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return currencies.map(currency => ({
      ...currency,
      sortOrder: currency.sortOrder,
    }));
  }

  /**
   * Get a specific currency by code
   */
  async getCurrencyByCode(code: string): Promise<SupportedCurrency | null> {
    const currency = await prisma.currency.findUnique({
      where: { code, isActive: true },
    });

    return currency ? {
      ...currency,
      sortOrder: currency.sortOrder,
    } : null;
  }

  /**
   * Get exchange rate between two currencies with caching
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    // If same currency, return 1
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const cacheKey = `${fromCurrency}-${toCurrency}`;
    const cached = this.exchangeRateCache.get(cacheKey);
    
    // Check cache first
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.rate;
    }

    // Fetch from database
    const exchangeRate = await prisma.exchangeRate.findUnique({
      where: {
        fromCurrency_toCurrency: {
          fromCurrency,
          toCurrency,
        },
        isActive: true,
      },
    });

    if (!exchangeRate) {
      // Try reverse rate (divide by the opposite rate)
      const reverseRate = await prisma.exchangeRate.findUnique({
        where: {
          fromCurrency_toCurrency: {
            fromCurrency: toCurrency,
            toCurrency: fromCurrency,
          },
          isActive: true,
        },
      });

      if (reverseRate) {
        const rate = 1 / Number(reverseRate.rate);
        this.exchangeRateCache.set(cacheKey, { rate, timestamp: Date.now() });
        return rate;
      }

      throw new NotFoundError(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
    }

    const rate = Number(exchangeRate.rate);
    
    // Cache the rate
    this.exchangeRateCache.set(cacheKey, { rate, timestamp: Date.now() });
    
    return rate;
  }

  /**
   * Convert amount from one currency to another
   */
  async convertAmount(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);
    return amount * exchangeRate;
  }

  /**
   * Get all exchange rates for a specific currency
   */
  async getExchangeRatesForCurrency(baseCurrency: string): Promise<ExchangeRateData[]> {
    const rates = await prisma.exchangeRate.findMany({
      where: {
        OR: [
          { fromCurrency: baseCurrency },
          { toCurrency: baseCurrency },
        ],
        isActive: true,
      },
      orderBy: [
        { fromCurrency: 'asc' },
        { toCurrency: 'asc' },
      ],
    });

    return rates.map(rate => ({
      ...rate,
      rate: Number(rate.rate),
    }));
  }

  /**
   * Update exchange rate (for future API integration)
   */
  async updateExchangeRate(fromCurrency: string, toCurrency: string, rate: number): Promise<ExchangeRateData> {
    // Validate currencies exist
    const fromCurrencyExists = await this.getCurrencyByCode(fromCurrency);
    const toCurrencyExists = await this.getCurrencyByCode(toCurrency);

    if (!fromCurrencyExists || !toCurrencyExists) {
      throw new NotFoundError('One or both currencies not found');
    }

    const exchangeRate = await prisma.exchangeRate.upsert({
      where: {
        fromCurrency_toCurrency: {
          fromCurrency,
          toCurrency,
        },
      },
      update: {
        rate: rate,
        isActive: true,
      },
      create: {
        fromCurrency,
        toCurrency,
        rate: rate,
        isActive: true,
      },
    });

    // Clear cache for this rate
    this.exchangeRateCache.delete(`${fromCurrency}-${toCurrency}`);
    this.exchangeRateCache.delete(`${toCurrency}-${fromCurrency}`);

    return {
      ...exchangeRate,
      rate: Number(exchangeRate.rate),
    };
  }

  /**
   * Clear exchange rate cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.exchangeRateCache.clear();
  }

  /**
   * Validate if currency code is supported
   */
  async isCurrencySupported(currencyCode: string): Promise<boolean> {
    const currency = await this.getCurrencyByCode(currencyCode);
    return currency !== null;
  }
}