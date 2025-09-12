import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { DEFAULT_CURRENCY } from '@/config/currencies';

interface Budget {
  id: string;
  amount: number;
  spent: number;
  currency: string;
}

interface ConvertedTotals {
  totalBudget: number;
  totalSpent: number;
  currency: string;
  isConverting: boolean;
}

/**
 * Hook to convert all budget amounts and spent values to a common currency
 * and return the totals in that currency
 */
export function useConvertedTotals(budgets: Budget[], targetCurrency?: string): ConvertedTotals {
  const [convertedTotals, setConvertedTotals] = useState<ConvertedTotals>({
    totalBudget: 0,
    totalSpent: 0,
    currency: targetCurrency || DEFAULT_CURRENCY,
    isConverting: false,
  });

  useEffect(() => {
    if (!budgets.length) {
      setConvertedTotals({
        totalBudget: 0,
        totalSpent: 0,
        currency: targetCurrency || DEFAULT_CURRENCY,
        isConverting: false,
      });
      return;
    }

    const convertBudgets = async () => {
      setConvertedTotals(prev => ({ ...prev, isConverting: true }));
      
      try {
        const currency = targetCurrency || DEFAULT_CURRENCY;
        let totalBudget = 0;
        let totalSpent = 0;

        // Convert each budget's amount and spent to the target currency
        for (const budget of budgets) {
          let convertedAmount = budget.amount;
          let convertedSpent = budget.spent;

          // Only convert if currencies are different
          if (budget.currency !== currency) {
            try {
              // Convert budget amount
              if (budget.amount > 0) {
                const amountResponse = await apiClient.convertAmount(
                  budget.amount, 
                  budget.currency, 
                  currency
                );
                if (amountResponse.success && amountResponse.data) {
                  convertedAmount = amountResponse.data.convertedAmount;
                }
              }

              // Convert spent amount
              if (budget.spent > 0) {
                const spentResponse = await apiClient.convertAmount(
                  budget.spent, 
                  budget.currency, 
                  currency
                );
                if (spentResponse.success && spentResponse.data) {
                  convertedSpent = spentResponse.data.convertedAmount;
                }
              }
            } catch (error) {
              console.error(`Failed to convert budget ${budget.id} from ${budget.currency} to ${currency}:`, error);
              // Fall back to original values if conversion fails
            }
          }

          totalBudget += convertedAmount;
          totalSpent += convertedSpent;
        }

        setConvertedTotals({
          totalBudget,
          totalSpent,
          currency,
          isConverting: false,
        });
      } catch (error) {
        console.error('Failed to convert budget totals:', error);
        
        // Fallback: simple sum without conversion
        const fallbackTotalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
        const fallbackTotalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
        
        setConvertedTotals({
          totalBudget: fallbackTotalBudget,
          totalSpent: fallbackTotalSpent,
          currency: budgets.length > 0 ? budgets[0].currency : (targetCurrency || DEFAULT_CURRENCY),
          isConverting: false,
        });
      }
    };

    // Check if we need conversion
    const uniqueCurrencies = [...new Set(budgets.map(b => b.currency))];
    const needsConversion = uniqueCurrencies.length > 1 || 
                           (uniqueCurrencies.length === 1 && uniqueCurrencies[0] !== (targetCurrency || DEFAULT_CURRENCY));

    if (needsConversion) {
      convertBudgets();
    } else {
      // No conversion needed, simple sum
      const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
      const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
      
      setConvertedTotals({
        totalBudget,
        totalSpent,
        currency: uniqueCurrencies.length > 0 ? uniqueCurrencies[0] : (targetCurrency || DEFAULT_CURRENCY),
        isConverting: false,
      });
    }
  }, [budgets, targetCurrency]);

  return convertedTotals;
}