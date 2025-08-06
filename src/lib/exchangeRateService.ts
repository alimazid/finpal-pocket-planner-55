interface ExchangeRateCache {
  [key: string]: {
    rate: number;
    timestamp: number;
    expires: number;
  };
}

class ExchangeRateService {
  private cache: ExchangeRateCache = {};
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes to match toolbar
  private readonly API_URL = 'https://api.exchangerate-api.com/v4/latest';

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const cacheKey = `${fromCurrency}-${toCurrency}`;
    const cached = this.cache[cacheKey];
    const now = Date.now();

    // Return cached rate if still valid
    if (cached && now < cached.expires) {
      return cached.rate;
    }

    try {
      // Fetch fresh rate from API - same as toolbar
      const response = await fetch(`${this.API_URL}/${fromCurrency}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rate: ${response.statusText}`);
      }
      
      const data = await response.json();
      const rate = data.rates[toCurrency];
      
      if (!rate) {
        throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
      }

      // Cache the rate
      this.cache[cacheKey] = {
        rate,
        timestamp: now,
        expires: now + this.CACHE_DURATION
      };

      // Also store in database for budget calculations (async, don't wait)
      this.storeRateInDatabase(fromCurrency, toCurrency, rate).catch(error => {
        console.warn('Failed to store rate in database:', error);
      });

      return rate;
    } catch (error) {
      console.error(`Exchange rate fetch error for ${fromCurrency}/${toCurrency}:`, error);
      
      // Return cached rate even if expired as fallback
      if (cached) {
        console.log(`Using expired cached rate for ${fromCurrency}/${toCurrency}: ${cached.rate}`);
        return cached.rate;
      }
      
      // Only use hardcoded rates as last resort
      const hardcodedRate = this.getHardcodedRate(fromCurrency, toCurrency);
      if (hardcodedRate !== null) {
        console.log(`Using hardcoded fallback rate for ${fromCurrency}/${toCurrency}: ${hardcodedRate}`);
        return hardcodedRate;
      }
      
      throw error;
    }
  }

  private getHardcodedRate(fromCurrency: string, toCurrency: string): number | null {
    // Keep hardcoded rates only as last resort
    const rates: { [key: string]: number } = {
      'USD-DOP': 59.5,
      'USD-RD': 59.5,
      'DOP-USD': 1.0 / 59.5,
      'RD-USD': 1.0 / 59.5,
      'DOP-RD': 1.0,
      'RD-DOP': 1.0,
    };
    
    return rates[`${fromCurrency}-${toCurrency}`] || null;
  }

  // Get the current cached rate (for displaying in toolbar)
  getCachedRate(fromCurrency: string, toCurrency: string): number | null {
    const cacheKey = `${fromCurrency}-${toCurrency}`;
    const cached = this.cache[cacheKey];
    
    if (cached && Date.now() < cached.expires) {
      return cached.rate;
    }
    
    return null;
  }

  // Store rate in database for budget calculations
  private async storeRateInDatabase(fromCurrency: string, toCurrency: string, rate: number): Promise<void> {
    try {
      // Dynamic import to avoid circular dependencies
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data: result, error } = await supabase.functions.invoke('get-exchange-rate', {
        body: { 
          from: fromCurrency, 
          to: toCurrency,
          store_rate: true,
          rate: rate 
        }
      });
      
      if (error) {
        throw error;
      }
      
      console.log(`📦 Stored exchange rate: ${fromCurrency}/${toCurrency} = ${rate}`);
    } catch (error) {
      console.warn(`Failed to store ${fromCurrency}/${toCurrency} rate in database:`, error);
      throw error;
    }
  }

  // Clear cache (useful for testing or manual refresh)
  clearCache(): void {
    this.cache = {};
  }
}

// Export singleton instance
export const exchangeRateService = new ExchangeRateService();