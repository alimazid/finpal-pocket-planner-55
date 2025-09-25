import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export type FeatureFlags = Record<string, boolean>;

export const FEATURE_FLAG_KEYS = {
  MENU_CLEAR_TRANSACTIONS: 'MENU_CLEAR_TRANSACTIONS',
  MENU_CLEAR_BUDGETS: 'MENU_CLEAR_BUDGETS',
  MENU_EXPORT_DATA: 'MENU_EXPORT_DATA',
  MENU_PERIOD_SELECTION: 'MENU_PERIOD_SELECTION',
  MENU_GMAIL_INTEGRATION: 'MENU_GMAIL_INTEGRATION',
  MENU_THEME_TOGGLE: 'MENU_THEME_TOGGLE',
  MENU_LANGUAGE_SELECTION: 'MENU_LANGUAGE_SELECTION',
  MENU_SIGN_OUT: 'MENU_SIGN_OUT',
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAG_KEYS;

/**
 * Hook to fetch and manage feature flags
 */
export const useFeatureFlags = () => {
  const {
    data,
    error,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const response = await apiClient.getFeatureFlags();
      return response.success ? response.data : {};
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false,
  });

  const flags = data || {};

  /**
   * Check if a specific feature flag is enabled
   */
  const isFeatureEnabled = (key: string): boolean => {
    return flags[key] === true;
  };

  /**
   * Get all enabled feature flags
   */
  const getEnabledFlags = (): string[] => {
    return Object.keys(flags).filter(key => flags[key] === true);
  };

  /**
   * Check if any feature flags are loading
   */
  const isLoadingFlags = isLoading;

  /**
   * Check if there was an error loading feature flags
   */
  const hasError = isError;

  /**
   * Refresh feature flags from server
   */
  const refreshFlags = () => {
    refetch();
  };

  return {
    flags,
    isFeatureEnabled,
    getEnabledFlags,
    isLoadingFlags,
    hasError,
    error,
    refreshFlags,
  };
};

/**
 * Higher-order component to conditionally render based on feature flag
 */
export const withFeatureFlag = (
  WrappedComponent: React.ComponentType<any>,
  flagKey: string,
  fallback: React.ComponentType<any> | null = null
) => {
  return function FeatureFlaggedComponent(props: any) {
    const { isFeatureEnabled, isLoadingFlags } = useFeatureFlags();

    if (isLoadingFlags) {
      return null; // or a loading spinner
    }

    if (!isFeatureEnabled(flagKey)) {
      return fallback ? React.createElement(fallback, props) : null;
    }

    return React.createElement(WrappedComponent, props);
  };
};

/**
 * Hook specifically for menu item feature flags with better typing
 */
export const useMenuFeatureFlags = () => {
  const { isFeatureEnabled, isLoadingFlags, hasError, refreshFlags } = useFeatureFlags();

  return {
    isMenuItemEnabled: (item: FeatureFlagKey): boolean => {
      return isFeatureEnabled(FEATURE_FLAG_KEYS[item]);
    },
    isLoadingFlags,
    hasError,
    refreshFlags,
    // Specific menu item checkers
    canShowClearTransactions: (): boolean => isFeatureEnabled(FEATURE_FLAG_KEYS.MENU_CLEAR_TRANSACTIONS),
    canShowClearBudgets: (): boolean => isFeatureEnabled(FEATURE_FLAG_KEYS.MENU_CLEAR_BUDGETS),
    canShowExportData: (): boolean => isFeatureEnabled(FEATURE_FLAG_KEYS.MENU_EXPORT_DATA),
    canShowPeriodSelection: (): boolean => isFeatureEnabled(FEATURE_FLAG_KEYS.MENU_PERIOD_SELECTION),
    canShowGmailIntegration: (): boolean => isFeatureEnabled(FEATURE_FLAG_KEYS.MENU_GMAIL_INTEGRATION),
    canShowThemeToggle: (): boolean => isFeatureEnabled(FEATURE_FLAG_KEYS.MENU_THEME_TOGGLE),
    canShowLanguageSelection: (): boolean => isFeatureEnabled(FEATURE_FLAG_KEYS.MENU_LANGUAGE_SELECTION),
    canShowSignOut: (): boolean => isFeatureEnabled(FEATURE_FLAG_KEYS.MENU_SIGN_OUT),
  };
};