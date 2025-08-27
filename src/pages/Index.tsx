import React, { useState, useEffect } from "react";
import { apiClient, type User } from "@/lib/api-client";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

import { BudgetSummary } from "@/components/budget/BudgetSummary";
import { BudgetPeriodNavigator } from "@/components/budget/BudgetPeriodNavigator";
import { TransactionList } from "@/components/transactions/TransactionList";
import { UncategorizedTransactions } from "@/components/transactions/UncategorizedTransactions";
import ExchangeRateWidget from "@/components/exchange/ExchangeRateWidget";
import { ExchangeRateSync } from "@/components/exchange/ExchangeRateSync";
import { PeriodSelectionModal } from "@/components/periods/PeriodSelectionModal";

import { DollarSign, TrendingUp, Target, CreditCard, Calendar, AlertTriangle, Menu, LogOut, Trash2, Languages, Settings, ChevronLeft, ChevronRight, Home, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useBudgetPeriodTemplate } from "@/hooks/useBudgetPeriodTemplate";
import { addCalculatedPeriods, getCurrentTargetMonth, calculatePeriodDates, getNextPeriod, getPreviousPeriod } from "@/lib/periodCalculations";
import type { CalculatedBudget } from "@/lib/periodCalculations";
import { exportAllFinancialData, downloadJSON } from "@/lib/exportFinancialData";

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  description: string;
  category: string | null;
  date: Date;
  type: 'expense' | 'income';
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

interface BudgetCategory {
  id: string;
  userId: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  spent: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  targetYear: number;
  targetMonth: number;
  category?: BudgetCategory;
}

// Helper function to get current period as fallback (moved outside component to prevent re-creation)
const getCurrentPeriodFallback = () => {
  const now = new Date();
  return {
    targetYear: now.getFullYear(),
    targetMonth: now.getMonth() + 1
  };
};

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("spanish");
  const [isTranslationOpen, setIsTranslationOpen] = useState(false);
  const [isPeriodSelectionOpen, setIsPeriodSelectionOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { t } = useTranslation(selectedLanguage as 'english' | 'spanish');
  
  // Budget period template management
  const { 
    template: periodTemplate, 
    templateRow: userPreferences,
    updateTemplate: updatePeriodTemplate,
    getDefaultTemplate 
  } = useBudgetPeriodTemplate(user?.id);


  // Budget period state - wait for template to initialize properly
  const [currentTargetYear, setCurrentTargetYear] = useState<number | null>(null);
  const [currentTargetMonth, setCurrentTargetMonth] = useState<number | null>(null);
  const [hasInitializedPeriod, setHasInitializedPeriod] = useState(false);
  
  // Initialize period to always show current period on page load
  useEffect(() => {
    // Wait for both user and preferences to be loaded, and ensure we haven't initialized yet
    if (!user?.id || hasInitializedPeriod) return;
    
    // Only initialize once we have the actual user preferences (not default template)
    // This prevents the race condition where default template initializes first
    if (!userPreferences && periodTemplate === null) {
      return;
    }
    
    // Use template if available, otherwise use default template
    const activeTemplate = periodTemplate || getDefaultTemplate();
    
    // Always calculate and show the current period
    const currentTarget = getCurrentTargetMonth(activeTemplate);
    
    setCurrentTargetYear(currentTarget.targetYear);
    setCurrentTargetMonth(currentTarget.targetMonth);
    setHasInitializedPeriod(true);
    
    // Verification: confirm the period was set correctly
    const periodDates = calculatePeriodDates(activeTemplate, currentTarget.targetYear, currentTarget.targetMonth);
    const today = new Date();
    const isCurrentPeriod = today >= periodDates.startDate && today <= periodDates.endDate;
    
    console.log('✅ Period initialized:', {
      period: `${periodDates.startDate.toISOString().split('T')[0]} to ${periodDates.endDate.toISOString().split('T')[0]}`,
      isCurrentPeriod
    });
  }, [periodTemplate, hasInitializedPeriod, user?.id, getDefaultTemplate, userPreferences]);



  // Navigation functions for target month/year
  const handlePreviousPeriod = () => {
    if (currentTargetYear !== null && currentTargetMonth !== null) {
      const previous = getPreviousPeriod(currentTargetYear, currentTargetMonth);
      setCurrentTargetYear(previous.targetYear);
      setCurrentTargetMonth(previous.targetMonth);
    }
  };

  const handleNextPeriod = () => {
    if (currentTargetYear !== null && currentTargetMonth !== null) {
      const next = getNextPeriod(currentTargetYear, currentTargetMonth);
      setCurrentTargetYear(next.targetYear);
      setCurrentTargetMonth(next.targetMonth);
    }
  };

  const handleGoToCurrent = () => {
    if (periodTemplate) {
      const currentTarget = getCurrentTargetMonth(periodTemplate);
      setCurrentTargetYear(currentTarget.targetYear);
      setCurrentTargetMonth(currentTarget.targetMonth);
    }
  };

  // Calculate current period for display
  const currentPeriodDisplay = React.useMemo(() => {
    if (currentTargetYear === null || currentTargetMonth === null) {
      return null; // Don't show anything until period is loaded
    }
    // Use template if available, otherwise use default template
    const activeTemplate = periodTemplate || getDefaultTemplate();
    return calculatePeriodDates(activeTemplate, currentTargetYear, currentTargetMonth);
  }, [periodTemplate, currentTargetYear, currentTargetMonth, getDefaultTemplate]);


  // Update language when user preference changes (from the hook)
  useEffect(() => {
    if (userPreferences) {
      setSelectedLanguage(userPreferences.language || 'spanish');
    }
  }, [userPreferences]);

  // Fetch budgets for current period 
  const { data: allBudgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets', user?.id, currentTargetYear, currentTargetMonth],
    queryFn: async () => {
      if (!currentTargetYear || !currentTargetMonth) return [];
      
      const response = await apiClient.getBudgets({
        year: currentTargetYear,
        month: currentTargetMonth
      });
      
      if (response.success && response.data) {
        return response.data as Budget[];
      }
      throw new Error(response.error || 'Failed to fetch budgets');
    },
    enabled: !!user && currentTargetYear !== null && currentTargetMonth !== null,
  });

  // Get previous period for comparison
  const previousPeriod = React.useMemo(() => {
    if (currentTargetYear === null || currentTargetMonth === null) return null;
    return getPreviousPeriod(currentTargetYear, currentTargetMonth);
  }, [currentTargetYear, currentTargetMonth]);

  // Fetch budgets for previous period to calculate missing budgets
  const { data: previousPeriodBudgets = [] } = useQuery({
    queryKey: ['budgets', user?.id, previousPeriod?.targetYear, previousPeriod?.targetMonth],
    queryFn: async () => {
      if (!previousPeriod) return [];
      
      const response = await apiClient.getBudgets({
        year: previousPeriod.targetYear,
        month: previousPeriod.targetMonth
      });
      
      if (response.success && response.data) {
        return response.data as Budget[];
      }
      return []; // Don't throw error for previous period, just return empty array
    },
    enabled: !!user && !!previousPeriod,
  });

  // Calculate budgets for the selected period (from period controls)
  const budgets: CalculatedBudget[] = React.useMemo(() => {
    if (!allBudgets.length || currentTargetYear === null || currentTargetMonth === null) return [];
    
    // Budgets are already filtered for current period from API
    // Convert to old format for now to maintain compatibility with calculations
    const compatibleBudgets = allBudgets.map(budget => ({
      ...budget,
      target_year: budget.targetYear,
      target_month: budget.targetMonth,
      budget_category_id: budget.categoryId,
      user_id: budget.userId,
      created_at: budget.createdAt.toString(),
      updated_at: budget.updatedAt.toString(),
      budget_categories: budget.category ? {
        ...budget.category,
        user_id: budget.category.userId,
        sort_order: budget.category.sortOrder,
        created_at: budget.category.createdAt.toString(),
        updated_at: budget.category.updatedAt.toString(),
      } : undefined
    }));
    
    // Use template if available, otherwise use default template
    const activeTemplate = periodTemplate || getDefaultTemplate();
    return addCalculatedPeriods(compatibleBudgets, activeTemplate);
  }, [allBudgets, periodTemplate, currentTargetYear, currentTargetMonth, getDefaultTemplate]);

  // Fetch transactions
  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID is required');
      
      const response = await apiClient.getTransactions();
      
      if (response.success && response.data && response.data.transactions) {
        // Convert to old format for compatibility
        return response.data.transactions.map(tx => ({
          ...tx,
          user_id: tx.userId,
          created_at: tx.createdAt.toString(),
          updated_at: tx.updatedAt.toString(),
          date: new Date(tx.date).toISOString().split('T')[0] // Convert to YYYY-MM-DD format
        })) as Transaction[];
      }
      throw new Error(response.error || 'Failed to fetch transactions');
    },
    enabled: !!user?.id,
  });

  // Log transaction errors for debugging
  if (transactionsError) {
    console.error('Transactions error:', transactionsError);
  }

  // Calculate missing budgets from previous period
  const missingBudgets: Budget[] = React.useMemo(() => {
    if (!previousPeriodBudgets.length || currentTargetYear === null || currentTargetMonth === null) return [];
    
    // If current period has no budgets, all previous period budgets are missing
    if (!allBudgets.length) {
      return previousPeriodBudgets;
    }
    
    // Get current period category names
    const currentCategoryNames = new Set(
      allBudgets.map(budget => budget.category?.name).filter(Boolean)
    );
    
    // Find budgets from previous period that don't exist in current period
    const missing = previousPeriodBudgets.filter(budget => 
      budget.category?.name && !currentCategoryNames.has(budget.category.name)
    );
    
    return missing;
  }, [previousPeriodBudgets, allBudgets, currentTargetYear, currentTargetMonth]);

  // Calculate previous period for display
  const previousPeriodDisplay = React.useMemo(() => {
    if (currentTargetYear === null || currentTargetMonth === null || !periodTemplate) return null;
    
    const previousPeriod = getPreviousPeriod(currentTargetYear, currentTargetMonth);
    const activeTemplate = periodTemplate || getDefaultTemplate();
    return calculatePeriodDates(activeTemplate, previousPeriod.targetYear, previousPeriod.targetMonth);
  }, [currentTargetYear, currentTargetMonth, periodTemplate, getDefaultTemplate]);

  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (expense: {
      amount: number;
      description: string;
      category: string | null;
      date: string;
      currency: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const response = await apiClient.createTransaction({
        amount: expense.amount,
        description: expense.description,
        category: expense.category || undefined,
        date: new Date(expense.date),
        type: 'expense',
        currency: expense.currency,
      });
      
      if (!response.success) {
        console.error('Add transaction error:', response.error);
        throw new Error(response.error || 'Failed to add transaction');
      }
      return response.data;
    },
    onSuccess: (newTransaction) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id, currentTargetYear, currentTargetMonth] });

      toast({
        title: t('expenseAdded'),
        description: `$${newTransaction.amount.toFixed(2)} ${t('spentOn')} ${newTransaction.category}`,
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('failedToAddExpense'),
        variant: "destructive",
      });
    },
  });

  // Add budget mutation
  const addBudgetMutation = useMutation({
    mutationFn: async ({ category, amount }: { 
      category: string; 
      amount: number;
    }) => {
      if (!user?.id || currentTargetYear === null || currentTargetMonth === null) {
        throw new Error('User not authenticated or period not selected');
      }
      
      // First, find or create the category
      let budgetCategory;
      const categoriesResponse = await apiClient.getCategories();
      if (!categoriesResponse.success) {
        throw new Error('Failed to fetch categories');
      }
      
      const existingCategory = categoriesResponse.data?.find(cat => cat.name === category);
      
      if (existingCategory) {
        budgetCategory = existingCategory;
      } else {
        // Create new category
        const newCategoryResponse = await apiClient.createCategory({ name: category });
        if (!newCategoryResponse.success || !newCategoryResponse.data) {
          throw new Error('Failed to create category');
        }
        budgetCategory = newCategoryResponse.data;
      }
      
      // Check if a budget already exists for this target month/year in this category
      const budgetsResponse = await apiClient.getBudgets({
        year: currentTargetYear!,
        month: currentTargetMonth!
      });
      
      if (budgetsResponse.success && budgetsResponse.data) {
        const existingBudget = budgetsResponse.data.find(b => b.categoryId === budgetCategory.id);
        if (existingBudget) {
          throw new Error(`A budget already exists for this period in the ${category} category`);
        }
      }
      
      // Create the budget with target month/year
      const response = await apiClient.createBudget({
        categoryId: budgetCategory.id,
        amount,
        currency: 'USD',
        targetYear: currentTargetYear!,
        targetMonth: currentTargetMonth!
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create budget');
      }
      
      return response.data;
    },
    onSuccess: (newBudget) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
      toast({
        title: t('budgetCreated'),
        description: `${t('budgetCreatedFor')} ${newBudget.category?.name} ($${newBudget.amount.toFixed(2)}) ${t('hasBeenAdded')}`,
      });
    },
    onError: (error: Error) => {
      const message = error.message?.includes('already exists for this period') 
        ? error.message
        : error.message?.includes('Budget periods cannot overlap')
        ? t('budgetExistsForPeriod')
        : t('failedToCreateBudget');
        
      toast({
        title: t('error'),
        description: message,
        variant: "destructive",
      });
    },
  });

  // Create missing budgets mutation
  const createMissingBudgetsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || currentTargetYear === null || currentTargetMonth === null) {
        throw new Error('User not authenticated or period not selected');
      }

      const response = await apiClient.createMissingBudgets({
        year: currentTargetYear,
        month: currentTargetMonth
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create missing budgets');
      }
      
      return response.data;
    },
    onSuccess: (newBudgets) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
      
      const count = newBudgets?.length || 0;
      toast({
        title: t('missingBudgetsCreated'),
        description: `${t('createdXMissingBudgets')} ${count} ${count === 1 ? t('budget') : t('budgets')}`,
      });
    },
    onError: (error: Error) => {
      console.error('Error creating missing budgets:', error);
      toast({
        title: t('error'),
        description: t('failedToCreateBudget'),
        variant: "destructive",
      });
    },
  });

  // Update budget mutation
  const updateBudgetMutation = useMutation({
    mutationFn: async ({ budgetId, amount }: { budgetId: string; amount: number }) => {
      const response = await apiClient.updateBudget(budgetId, { amount });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update budget');
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
    },
  });

  // Delete budget mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const budget = budgets?.find(b => b.id === budgetId);
      const categoryName = budget?.category?.name;
      
      const response = await apiClient.deleteBudget(budgetId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete budget');
      }
      
      return { budget, categoryName };
    },
    onSuccess: ({ budget, categoryName }) => {
      const relatedTransactions = transactions?.filter(t => t.category === categoryName) || [];
      
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });

      toast({
        title: t('budgetDeleted'),
        description: `${t('budgetCreatedFor')} ${categoryName}${relatedTransactions.length > 0 ? ` ${t('and')} ${relatedTransactions.length} ${relatedTransactions.length === 1 ? t('relatedTransactionsRemoved') : t('relatedTransactionsRemovedPlural')}` : ''} ${t('removed')}`,
      });
    },
  });

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const transaction = transactions?.find(t => t.id === transactionId);
      
      const response = await apiClient.deleteTransaction(transactionId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete transaction');
      }
      
      return transaction;
    },
    onSuccess: (transaction) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });

      toast({
        title: t('transactionDeleted'),
        description: `${t('transaction')} "${transaction?.description}" ${t('transactionRemoved')}`,
      });
    },
  });

  // Update transaction mutation
  const updateTransactionMutation = useMutation({
    mutationFn: async ({ transactionId, amount }: { transactionId: string; amount: number }) => {
      const response = await apiClient.updateTransaction(transactionId, { amount });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update transaction');
      }
      
      return response.data;
    },
    onSuccess: (updatedTransaction) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });

      toast({
        title: t('transactionUpdated'),
        description: `${t('amountUpdatedTo')} $${updatedTransaction.amount.toFixed(2)}`,
      });
    },
  });

  // Update transaction category mutation
  const updateTransactionCategoryMutation = useMutation({
    mutationFn: async ({ transactionId, category }: { transactionId: string; category: string | null }) => {
      const response = await apiClient.updateTransaction(transactionId, { category });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update transaction category');
      }
      
      return response.data;
    },
    onSuccess: (updatedTransaction) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });

      toast({
        title: t('categoryUpdated'),
        description: `${t('categoryUpdatedTo')} ${updatedTransaction.category}`,
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ budgetId, newCategory }: { budgetId: string; newCategory: string }) => {
      const budget = budgets?.find(b => b.id === budgetId);
      const categoryId = budget?.categoryId;
      
      if (!categoryId) {
        throw new Error('Category not found');
      }
      
      const response = await apiClient.updateCategory(categoryId, { name: newCategory });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update category');
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
    },
  });

  // Update budget order mutation
  const updateBudgetOrderMutation = useMutation({
    mutationFn: async (budgets: Budget[]) => {
      const categoryIds = budgets.map(budget => budget.categoryId);
      
      const response = await apiClient.reorderCategories(categoryIds);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to reorder categories');
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
    },
  });

  // Clear all transactions mutation
  const clearAllTransactionsMutation = useMutation({
    mutationFn: async () => {
      const transactionCount = transactions.length;
      
      // Delete all transactions one by one
      for (const transaction of transactions) {
        const response = await apiClient.deleteTransaction(transaction.id);
        if (!response.success) {
          throw new Error(response.error || `Failed to delete transaction ${transaction.id}`);
        }
      }
      
      return transactionCount;
    },
    onSuccess: (transactionCount) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });

      toast({
        title: t('allTransactionsCleared'),
        description: `${transactionCount} ${transactionCount === 1 ? t('transaction') : t('transactions')} ${t('transactionsRemoved')}`,
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('failedToClearTransactions'),
        variant: "destructive",
      });
    },
  });

  // Clear all budgets mutation
  const clearAllBudgetsMutation = useMutation({
    mutationFn: async () => {
      const budgetCount = budgets.length;
      
      // Delete all budgets one by one
      for (const budget of budgets) {
        const response = await apiClient.deleteBudget(budget.id);
        if (!response.success) {
          throw new Error(response.error || `Failed to delete budget ${budget.id}`);
        }
      }
      
      return budgetCount;
    },
    onSuccess: (budgetCount) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });

      toast({
        title: t('allBudgetsCleared'),
        description: `${budgetCount} ${budgetCount === 1 ? t('budget') : t('budgets')} ${t('budgetsRemoved')}`,
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('failedToClearBudgets'),
        variant: "destructive",
      });
    },
  });

  // Update language preference mutation
  const updateLanguagePreferenceMutation = useMutation({
    mutationFn: async (language: string) => {
      if (!user?.id) throw new Error('User not found');
      
      const response = await apiClient.updatePreferences({
        language: language as 'english' | 'spanish',
        periodType: userPreferences?.periodType || 'calendar_month',
        specificDay: userPreferences?.specificDay || 1,
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update language preference');
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences', user?.id] });
      toast({
        title: t('languageUpdated'),
        description: `${t('languageChangedTo')} ${selectedLanguage === 'english' ? t('english') : t('spanish')}`,
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('failedToSaveLanguagePreference'),
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Check if user is authenticated on page load
    const checkAuth = async () => {
      try {
        const response = await apiClient.getProfile();
        if (response.success && response.data) {
          console.log('User authenticated:', response.data.email);
          setUser(response.data);
          setIsAuthenticated(true);
        } else {
          console.log('User not authenticated');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.log('Auth check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    try {
      await apiClient.logout();
      setUser(null);
      setIsAuthenticated(false);
      toast({
        title: t('signedOut'),
        description: t('signedOutSuccess'),
      });
      navigate("/auth");
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToSignOut'),
        variant: "destructive",
      });
    }
  };

  if (loading || budgetsLoading || transactionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth page
  }

  // Calculate totals
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const remainingBudget = totalBudget - totalSpent;

  // Get primary currency from first budget or default to USD
  const primaryCurrency = budgets.length > 0 ? budgets[0].currency : 'USD';

  // Handle export data
  const handleExportData = () => {
    if (!user || (!allBudgets.length && !transactions.length)) {
      toast({
        title: "No data to export",
        description: "You don't have any financial data to export yet.",
        variant: "destructive"
      });
      return;
    }

    try {
      const exportData = exportAllFinancialData({
        user,
        allBudgets,
        transactions,
        currentTargetYear: currentTargetYear || new Date().getFullYear(),
        currentTargetMonth: currentTargetMonth || new Date().getMonth() + 1,
        periodTemplate,
        currentPeriodDisplay,
        selectedLanguage
      });

      downloadJSON(exportData);
      
      toast({
        title: "Export successful",
        description: `Your financial data has been exported successfully.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Action Bar */}
      <div className="bg-gradient-primary border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <ExchangeRateWidget language={selectedLanguage as 'english' | 'spanish'} />
              <ExchangeRateSync language={selectedLanguage as 'english' | 'spanish'} />
              
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-white border-white/20 hover:bg-white/10 w-9 h-9 p-0"
                  >
                    <Menu className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        onSelect={(e) => e.preventDefault()}
                        className="cursor-pointer"
                        disabled={transactions.length === 0}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('clearAllTransactions')}
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('clearAllTransactions')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('areYouSureTransactions')} {transactions.length} {transactions.length === 1 ? t('transaction') : t('transactions')}? {t('actionCannotBeUndone')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => clearAllTransactionsMutation.mutate()}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('clearAllTransactions')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        onSelect={(e) => e.preventDefault()}
                        className="cursor-pointer"
                        disabled={budgets.length === 0}
                      >
                        <Target className="w-4 h-4 mr-2" />
                        {t('clearAllBudgets')}
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('clearAllBudgets')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('areYouSureBudgets')} {budgets.length} {budgets.length === 1 ? t('budget') : t('budgets')}? {t('actionCannotBeUndoneSimple')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => clearAllBudgetsMutation.mutate()}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('clearAllBudgets')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={handleExportData}
                    className="cursor-pointer"
                    disabled={!allBudgets.length && !transactions.length}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export All Data
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />

                   <DropdownMenuItem 
                     onClick={() => setIsPeriodSelectionOpen(true)}
                     className="cursor-pointer"
                   >
                     <Settings className="w-4 h-4 mr-2" />
                     {t('periodSelection')}
                   </DropdownMenuItem>

                   <Dialog open={isTranslationOpen} onOpenChange={setIsTranslationOpen}>
                     <DialogTrigger asChild>
                       <DropdownMenuItem 
                         onSelect={(e) => e.preventDefault()}
                         className="cursor-pointer"
                       >
                         <Languages className="w-4 h-4 mr-2" />
                         {t('selectLanguage')}
                       </DropdownMenuItem>
                     </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>{t('selectLanguage')}</DialogTitle>
                        <DialogDescription>
                          {t('chooseLanguage')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t('selectALanguage')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="english">{t('english')}</SelectItem>
                            <SelectItem value="spanish">{t('spanish')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsTranslationOpen(false)}>
                          {t('cancel')}
                        </Button>
                        <Button onClick={() => {
                          updateLanguagePreferenceMutation.mutate(selectedLanguage);
                          setIsTranslationOpen(false);
                        }}>
                          {t('apply')}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Uncategorized Transactions */}
        <UncategorizedTransactions
          transactions={transactions}
          availableCategories={budgets.sort((a, b) => (a.category?.sortOrder || 0) - (b.category?.sortOrder || 0)).map(budget => budget.category?.name || '')}
          onUpdateTransactionCategory={(id, category) => updateTransactionCategoryMutation.mutate({ transactionId: id, category })}
          onDeleteTransaction={(id) => deleteTransactionMutation.mutate(id)}
          language={selectedLanguage as 'english' | 'spanish'}
        />

        {/* Budget Period Navigator */}
        {currentPeriodDisplay && (
          <div className="bg-gradient-card shadow-soft mb-6 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPeriod}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{t('previous')}</span>
              </Button>

              <div className="flex-1 text-center">
                <div className="font-semibold text-foreground">
                  {currentTargetYear && currentTargetMonth ? new Date(currentTargetYear, currentTargetMonth - 1).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  }) : 'Loading...'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentPeriodDisplay ? `${currentPeriodDisplay.startDate.toLocaleDateString()} - ${currentPeriodDisplay.endDate.toLocaleDateString()}` : 'Loading...'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoToCurrent}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('current')}</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPeriod}
                  className="flex items-center gap-2"
                >
                  <span className="hidden sm:inline">{t('next')}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Budget Summary */}
        <BudgetSummary 
          budgets={budgets} 
          transactions={transactions}
          language={selectedLanguage as 'english' | 'spanish'} 
          onAddBudget={(category, amount) => addBudgetMutation.mutate({ category, amount })}
          onDeleteBudget={(id) => deleteBudgetMutation.mutate(id)}
          onDeleteTransaction={(id) => deleteTransactionMutation.mutate(id)}
          onUpdateTransaction={(id, amount) => updateTransactionMutation.mutate({ transactionId: id, amount })}
          onUpdateTransactionCategory={(id, category) => updateTransactionCategoryMutation.mutate({ transactionId: id, category })}
          onUpdateBudgetCategory={(id, category) => updateCategoryMutation.mutate({ budgetId: id, newCategory: category })}
          onUpdateBudgetAmount={(id, amount) => updateBudgetMutation.mutate({ budgetId: id, amount })}
          onUpdateBudgetOrder={(budgets) => updateBudgetOrderMutation.mutate(budgets)}
          availableCategories={budgets.sort((a, b) => (a.category?.sortOrder || 0) - (b.category?.sortOrder || 0)).map(budget => budget.category?.name || '')}
          missingBudgets={missingBudgets}
          onCreateMissingBudgets={() => createMissingBudgetsMutation.mutate()}
          previousPeriod={previousPeriodDisplay ? {
            startDate: previousPeriodDisplay.startDate,
            endDate: previousPeriodDisplay.endDate,
            isCurrentPeriod: false
          } : undefined}
          isCreatingMissingBudgets={createMissingBudgetsMutation.isPending}
        />

        {/* Recent Transactions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t('recentTransactions')}
          </h2>
          <TransactionList 
            transactions={transactions}
            onDeleteTransaction={(id) => deleteTransactionMutation.mutate(id)}
            onUpdateTransaction={(id, amount) => updateTransactionMutation.mutate({ transactionId: id, amount })}
            onUpdateTransactionCategory={(id, category) => updateTransactionCategoryMutation.mutate({ transactionId: id, category: category || null })}
            onAddExpense={(expense) => addExpenseMutation.mutate(expense)}
            availableCategories={budgets.sort((a, b) => (a.category?.sortOrder || 0) - (b.category?.sortOrder || 0)).map(budget => budget.category?.name || '')}
            language={selectedLanguage as 'english' | 'spanish'}
          />
        </div>

        {/* Period Selection Modal */}
        {user && (
          <PeriodSelectionModal
            open={isPeriodSelectionOpen}
            onOpenChange={setIsPeriodSelectionOpen}
            userId={user.id}
            language={selectedLanguage as 'english' | 'spanish'}
          />
        )}

      </div>
    </div>
  );
};

export default Index;
