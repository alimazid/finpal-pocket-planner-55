import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as currency with custom display formats
 * Maps common invalid currency codes to valid ISO codes
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  // Map invalid/shorthand currency codes to valid ISO codes
  const currencyMap: Record<string, string> = {
    'RD': 'DOP',    // Dominican Peso
    'US': 'USD',    // US Dollar
    'EU': 'EUR',    // Euro
    'UK': 'GBP',    // British Pound
    'CA': 'CAD',    // Canadian Dollar
    'AU': 'AUD',    // Australian Dollar
    'JP': 'JPY',    // Japanese Yen
  };
  
  const currencyCode = currencyMap[currency] || currency;
  
  // Get the standard formatted currency
  const standardFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  // Apply custom display formats
  if (currency === 'USD' || currency === 'US') {
    // Replace '$' with 'US$'
    return standardFormat.replace('$', 'US$');
  }
  
  if (currency === 'DOP' || currency === 'RD') {
    // Replace any DOP format with 'RD$' - handle both 'DOP ' and 'DOP'
    return standardFormat.replace(/DOP\s?/, 'RD$');
  }
  
  return standardFormat;
}
