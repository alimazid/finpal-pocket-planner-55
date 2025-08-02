import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as currency using the appropriate currency code
 * Maps RD to DOP (Dominican Peso) for proper formatting
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  // Map RD to DOP for proper currency formatting
  const currencyCode = currency === 'RD' ? 'DOP' : currency;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
