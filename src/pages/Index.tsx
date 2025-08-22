import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
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

import { DollarSign, TrendingUp, Target, CreditCard, Calendar, AlertTriangle, Menu, LogOut, Trash2, Languages, Settings, ChevronLeft, ChevronRight, Home } from "lucide-react";
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

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category: string | null;
  date: string;
  type: 'expense' | 'income';
  currency: string;
  created_at: string;
  updated_at: string;
}

interface BudgetCategory {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface Budget {
  id: string;
  user_id: string;
  budget_category_id: string;
  amount: number;
  spent: number;
  currency: string;
  created_at: string;
  updated_at: string;
  target_year: number;
  target_month: number;
  budget_categories?: BudgetCategory;
}

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
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

  // Budget period state - using target month/year approach
  const [currentTargetYear, setCurrentTargetYear] = useState(new Date().getFullYear());
  const [currentTargetMonth, setCurrentTargetMonth] = useState(new Date().getMonth() + 1);
  const [hasInitializedPeriod, setHasInitializedPeriod] = useState(false);
  
  // Initialize target month/year based on current period template (only once)
  useEffect(() => {
    if (periodTemplate && !hasInitializedPeriod) {
      const currentTarget = getCurrentTargetMonth(periodTemplate);
      setCurrentTargetYear(currentTarget.targetYear);
      setCurrentTargetMonth(currentTarget.targetMonth);
      setHasInitializedPeriod(true);
    } else if (!periodTemplate && !hasInitializedPeriod) {
      // Fallback to current month if template not loaded yet
      const now = new Date();
      setCurrentTargetYear(now.getFullYear());
      setCurrentTargetMonth(now.getMonth() + 1);
      setHasInitializedPeriod(true);
    }
  }, [periodTemplate, hasInitializedPeriod]);

  // Navigation functions for target month/year
  const handlePreviousPeriod = () => {
    const previous = getPreviousPeriod(currentTargetYear, currentTargetMonth);
    console.log('Navigating to previous period:', previous);
    setCurrentTargetYear(previous.targetYear);
    setCurrentTargetMonth(previous.targetMonth);
  };

  const handleNextPeriod = () => {
    const next = getNextPeriod(currentTargetYear, currentTargetMonth);
    console.log('Navigating to next period:', next);
    setCurrentTargetYear(next.targetYear);
    setCurrentTargetMonth(next.targetMonth);
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
    if (!periodTemplate) {
      // Fallback to calendar month if template not loaded
      const startDate = new Date(currentTargetYear, currentTargetMonth - 1, 1);
      const endDate = new Date(currentTargetYear, currentTargetMonth, 0);
      return {
        startDate,
        endDate,
        targetYear: currentTargetYear,
        targetMonth: currentTargetMonth
      };
    }
    return calculatePeriodDates(periodTemplate, currentTargetYear, currentTargetMonth);
  }, [periodTemplate, currentTargetYear, currentTargetMonth]);

  // Update language when user preference changes (from the hook)
  useEffect(() => {
    if (userPreferences) {
      setSelectedLanguage(userPreferences.language || 'spanish');
    }
  }, [userPreferences]);

  // Fetch all budgets and calculate current period budgets
  const { data: allBudgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          budget_categories (
            id,
            name,
            sort_order
          )
        `)
        .eq('user_id', user!.id)
        .order('budget_categories(sort_order)', { ascending: true });
      
      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!user,
  });

  // Calculate budgets for the selected period (from period controls)
  const budgets: CalculatedBudget[] = React.useMemo(() => {
    if (!allBudgets.length) return [];
    
    // Filter budgets for the current target month/year
    const selectedPeriodBudgets = allBudgets.filter(budget => 
      budget.target_year === currentTargetYear && budget.target_month === currentTargetMonth
    );
    
    // Add calculated periods to the filtered budgets if template is available
    if (periodTemplate) {
      return addCalculatedPeriods(selectedPeriodBudgets, periodTemplate);
    }
    
    // Return budgets without calculated periods if template not loaded yet
    return selectedPeriodBudgets.map(budget => ({
      ...budget,
      period_start: new Date(budget.target_year, budget.target_month - 1, 1).toISOString().split('T')[0],
      period_end: new Date(budget.target_year, budget.target_month, 0).toISOString().split('T')[0]
    }));
  }, [allBudgets, periodTemplate, currentTargetYear, currentTargetMonth]);

  // Fetch transactions
  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID is required');
      
      const { data, error } = await supabase
        .from('transactions')
        .select('id, user_id, amount, description, category, date, type, currency, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Transactions query error:', error);
        throw error;
      }
      return data as Transaction[];
    },
    enabled: !!user?.id,
  });

  // Log transaction errors for debugging
  if (transactionsError) {
    console.error('Transactions error:', transactionsError);
  }

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
      
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          amount: expense.amount,
          description: expense.description,
          category: expense.category,
          date: expense.date,
          type: 'expense',
          currency: expense.currency,
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Add transaction error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (newTransaction) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });

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
      // First, create or get the budget category
      let budgetCategory;
      const { data: existingCategory, error: categorySelectError } = await supabase
        .from('budget_categories')
        .select('*')
        .eq('user_id', user!.id)
        .eq('name', category)
        .single();

      if (categorySelectError && categorySelectError.code !== 'PGRST116') {
        throw categorySelectError;
      }

      if (existingCategory) {
        budgetCategory = existingCategory;
      } else {
        // Get the highest sort_order for this user to append new category at the end
        const { data: maxSortOrder } = await supabase
          .from('budget_categories')
          .select('sort_order')
          .eq('user_id', user!.id)
          .order('sort_order', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        const nextSortOrder = (maxSortOrder?.sort_order || 0) + 1;
        
        const { data: newCategory, error: categoryInsertError } = await supabase
          .from('budget_categories')
          .insert([{
            user_id: user!.id,
            name: category,
            sort_order: nextSortOrder,
          }])
          .select()
          .single();
        
        if (categoryInsertError) throw categoryInsertError;
        budgetCategory = newCategory;
      }
      
      // Check if a budget already exists for this target month/year in this category
      const { data: existingBudget } = await supabase
        .from('budgets')
        .select('id')
        .eq('budget_category_id', budgetCategory.id)
        .eq('target_year', currentTargetYear)
        .eq('target_month', currentTargetMonth)
        .maybeSingle();
        
      if (existingBudget) {
        throw new Error(`A budget already exists for this period in the ${category} category`);
      }
      
      // Create the budget with target month/year
      const { data, error } = await supabase
        .from('budgets')
        .insert([{
          user_id: user!.id,
          budget_category_id: budgetCategory.id,
          amount,
          spent: 0,
          target_year: currentTargetYear,
          target_month: currentTargetMonth,
        }])
        .select(`
          *,
          budget_categories (
            id,
            name,
            sort_order
          )
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newBudget) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
      toast({
        title: t('budgetCreated'),
        description: `${t('budgetCreatedFor')} ${newBudget.budget_categories?.name} ($${newBudget.amount.toFixed(2)}) ${t('hasBeenAdded')}`,
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

  // Update budget mutation
  const updateBudgetMutation = useMutation({
    mutationFn: async ({ budgetId, amount }: { budgetId: string; amount: number }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update({ amount })
        .eq('id', budgetId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
    },
  });

  // Delete budget mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const budget = budgets?.find(b => b.id === budgetId);
      const categoryName = budget?.budget_categories?.name;
      
      // Delete related transactions first
      await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user!.id)
        .eq('category', categoryName);

      // Delete budget
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);
      
      if (error) throw error;
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
      
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);
      
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('transactions')
        .update({ amount })
        .eq('id', transactionId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from('transactions')
        .update({ category })
        .eq('id', transactionId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
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
      const oldCategoryName = budget?.budget_categories?.name;
      
      // Update the budget category name
      const { data, error } = await supabase
        .from('budget_categories')
        .update({ name: newCategory })
        .eq('id', budget!.budget_category_id)
        .select()
        .single();
      
      if (error) throw error;

      // Update related transactions
      await supabase
        .from('transactions')
        .update({ category: newCategory })
        .eq('user_id', user!.id)
        .eq('category', oldCategoryName);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
    },
  });

  // Update budget order mutation
  const updateBudgetOrderMutation = useMutation({
    mutationFn: async (budgets: Budget[]) => {
      const updates = budgets.map((budget, index) => ({
        id: budget.budget_category_id,
        sort_order: index
      }));

      // Update all budget categories with new sort order
      for (const update of updates) {
        const { error } = await supabase
          .from('budget_categories')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
    },
  });

  // Clear all transactions mutation
  const clearAllTransactionsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user!.id);
      
      if (error) throw error;
      return transactions.length;
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
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('user_id', user!.id);
      
      if (error) throw error;
      return budgets.length;
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
      
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          language,
          period_type: userPreferences?.period_type || 'calendar_month',
          specific_day: userPreferences?.specific_day || 1,
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: t('error'),
        description: t('failedToSignOut'),
        variant: "destructive",
      });
    } else {
      toast({
        title: t('signedOut'),
        description: t('signedOutSuccess'),
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
          availableCategories={budgets.sort((a, b) => (a.budget_categories?.sort_order || 0) - (b.budget_categories?.sort_order || 0)).map(budget => budget.budget_categories?.name || '')}
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
                  {new Date(currentTargetYear, currentTargetMonth - 1).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentPeriodDisplay.startDate.toLocaleDateString()} - {currentPeriodDisplay.endDate.toLocaleDateString()}
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
          availableCategories={budgets.sort((a, b) => (a.budget_categories?.sort_order || 0) - (b.budget_categories?.sort_order || 0)).map(budget => budget.budget_categories?.name || '')}
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
            availableCategories={budgets.sort((a, b) => (a.budget_categories?.sort_order || 0) - (b.budget_categories?.sort_order || 0)).map(budget => budget.budget_categories?.name || '')}
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
