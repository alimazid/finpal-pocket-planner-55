export interface SupportedCurrency {
  code: string;
  displayAlias: string;
  name: string;
  sortOrder: number;
}

export interface CurrencyOption {
  value: string;
  label: string;
}

/**
 * Supported currencies configuration
 * This is the single source of truth for all supported currencies in the frontend
 */
export const SUPPORTED_CURRENCIES: readonly SupportedCurrency[] = [
  {
    code: 'DOP',
    displayAlias: 'RD',
    name: 'Dominican Peso',
    sortOrder: 1,
  },
  {
    code: 'USD',
    displayAlias: 'US',
    name: 'US Dollar',
    sortOrder: 2,
  },
  {
    code: 'EUR',
    displayAlias: 'EU',
    name: 'Euro',
    sortOrder: 3,
  },
] as const;

/**
 * Default currency for new budgets and transactions
 */
export const DEFAULT_CURRENCY = 'DOP';

/**
 * Get currency options for dropdowns/selects
 */
export function getCurrencyOptions(): CurrencyOption[] {
  return SUPPORTED_CURRENCIES.map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name}`,
  }));
}

/**
 * Get currency by code
 */
export function getCurrencyByCode(code: string): SupportedCurrency | undefined {
  return SUPPORTED_CURRENCIES.find(currency => currency.code === code);
}

/**
 * Get display alias for a currency code
 */
export function getCurrencyDisplayAlias(code: string): string {
  const currency = getCurrencyByCode(code);
  return currency?.displayAlias || code;
}

/**
 * Check if a currency is supported
 */
export function isCurrencySupported(code: string): boolean {
  return SUPPORTED_CURRENCIES.some(currency => currency.code === code);
}

/**
 * Get currency name by code
 */
export function getCurrencyName(code: string): string {
  const currency = getCurrencyByCode(code);
  return currency?.name || code;
}

/**
 * Currency mapping for backwards compatibility with old "RD" values
 * Maps legacy currency codes to actual ISO codes
 */
export const CURRENCY_CODE_MAPPINGS: Record<string, string> = {
  'RD': 'DOP',  // Legacy Dominican Peso code -> actual ISO code
  'US': 'USD',  // Legacy US Dollar code -> actual ISO code
  'EU': 'EUR',  // Legacy Euro code -> actual ISO code
} as const;

/**
 * Normalize a currency code (handles legacy codes)
 */
export function normalizeCurrencyCode(code: string): string {
  return CURRENCY_CODE_MAPPINGS[code] || code;
}