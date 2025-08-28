import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getCurrencyDisplayAlias, normalizeCurrencyCode, CURRENCY_CODE_MAPPINGS } from "@/config/currencies"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as currency with custom display formats
 * Uses the currency configuration for consistent display aliases
 */
export function formatCurrency(amount: number, currency: string = 'DOP'): string {
  // Normalize currency code (handles legacy codes like 'RD' -> 'DOP')
  const normalizedCurrency = normalizeCurrencyCode(currency);
  
  // Get the standard formatted currency using the normalized code
  const standardFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: normalizedCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  // Get display alias from configuration
  const displayAlias = getCurrencyDisplayAlias(normalizedCurrency);
  
  // Apply custom display formats based on currency
  switch (normalizedCurrency) {
    case 'USD':
      // Replace '$' with display alias + '$' (US$)
      return standardFormat.replace('$', `${displayAlias}$`);
    
    case 'DOP':
      // Replace any DOP format with display alias + '$' (RD$)
      return standardFormat.replace(/DOP\s?/, `${displayAlias}$`);
    
    case 'EUR':
      // Replace '€' with display alias + '€' (EU€)
      return standardFormat.replace('€', `${displayAlias}€`);
    
    default:
      // For any other currencies, use the display alias as prefix if it's different from the code
      if (displayAlias !== normalizedCurrency) {
        // Extract the symbol from the standard format and replace with alias
        const symbolMatch = standardFormat.match(/^[^\d\s,.-]+/);
        if (symbolMatch) {
          return standardFormat.replace(symbolMatch[0], displayAlias);
        }
      }
      return standardFormat;
  }
}
