import { useState, useEffect } from "react";
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

import { DollarSign, TrendingUp, Target, CreditCard, Calendar, AlertTriangle, Menu, LogOut, Trash2, Languages, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

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

interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  spent: number;
  currency: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  period_start: string;
  period_end: string;
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
  
  // Budget period state
  interface BudgetPeriod {
    startDate: Date;
    endDate: Date;
    isCurrentPeriod: boolean;
  }
  
  const getCurrentPeriod = (cutoffDay: number = 1, periodType: 'calendar_month' | 'specific_day' = 'calendar_month'): BudgetPeriod => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    if (periodType === 'calendar_month') {
      // Standard calendar month
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0); // Last day of current month
      
      return {
        startDate,
        endDate,
        isCurrentPeriod: true
      };
    } else {
      // Specific day periods
      let startDate = new Date(year, month, cutoffDay);
      if (now.getDate() < cutoffDay) {
        startDate = new Date(year, month - 1, cutoffDay);
      }
      
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(endDate.getDate() - 1);
      
      return {
        startDate,
        endDate,
        isCurrentPeriod: true
      };
    }
  };
  
  const [currentBudgetPeriod, setCurrentBudgetPeriod] = useState<BudgetPeriod>(getCurrentPeriod());
  const [userCutoffDay, setUserCutoffDay] = useState<number>(1);
  const [userPeriodType, setUserPeriodType] = useState<'calendar_month' | 'specific_day'>('calendar_month');
  const { t } = useTranslation(selectedLanguage as 'english' | 'spanish');

  // Fetch user preferences
  const { data: userPreference } = useQuery({
    queryKey: ['user-preference', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  // Update period calculations when user preference changes
  useEffect(() => {
    if (userPreference) {
      setUserCutoffDay(userPreference.specific_day);
      setUserPeriodType(userPreference.period_type as 'calendar_month' | 'specific_day');
      setCurrentBudgetPeriod(getCurrentPeriod(userPreference.specific_day, userPreference.period_type as 'calendar_month' | 'specific_day'));
    }
  }, [userPreference]);

  const handlePreferenceChange = (preference: { period_type: 'calendar_month' | 'specific_day'; specific_day: number }) => {
    setUserCutoffDay(preference.specific_day);
    setUserPeriodType(preference.period_type);
    setCurrentBudgetPeriod(getCurrentPeriod(preference.specific_day, preference.period_type));
  };

  // Fetch budgets filtered by current period
  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets', user?.id, currentBudgetPeriod.startDate.toISOString(), currentBudgetPeriod.endDate.toISOString()],
    queryFn: async () => {
      const startDateStr = currentBudgetPeriod.startDate.toISOString().split('T')[0];
      const endDateStr = currentBudgetPeriod.endDate.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user!.id)
        .eq('period_start', startDateStr)
        .eq('period_end', endDateStr)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!user,
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });

  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (expense: {
      amount: number;
      description: string;
      category: string | null;
      date: string;
      currency: string;
    }) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user!.id,
          amount: expense.amount,
          description: expense.description,
          category: expense.category,
          date: expense.date,
          type: 'expense',
          currency: expense.currency,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newTransaction) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id, currentBudgetPeriod.startDate.toISOString(), currentBudgetPeriod.endDate.toISOString()] });

      toast({
        title: "Expense Added",
        description: `$${newTransaction.amount.toFixed(2)} spent on ${newTransaction.category}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      });
    },
  });

  // Add budget mutation
  const addBudgetMutation = useMutation({
    mutationFn: async ({ category, amount, periodStart, periodEnd }: { 
      category: string; 
      amount: number; 
      periodStart?: string;
      periodEnd?: string;
    }) => {
      const startDate = periodStart || currentBudgetPeriod.startDate.toISOString().split('T')[0];
      const endDate = periodEnd || currentBudgetPeriod.endDate.toISOString().split('T')[0];
      
      // Get the highest sort_order for this user and period to append new budget at the end
      const { data: maxSortOrder } = await supabase
        .from('budgets')
        .select('sort_order')
        .eq('user_id', user!.id)
        .eq('period_start', startDate)
        .eq('period_end', endDate)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();
      
      const nextSortOrder = ((maxSortOrder as any)?.sort_order || 0) + 1;
      
      const { data, error } = await supabase
        .from('budgets')
        .insert([{
          user_id: user!.id,
          category,
          amount,
          spent: 0,
          sort_order: nextSortOrder,
          period_start: startDate,
          period_end: endDate,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newBudget) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id, currentBudgetPeriod.startDate.toISOString(), currentBudgetPeriod.endDate.toISOString()] });
      toast({
        title: "Budget Created",
        description: `Budget for ${newBudget.category} ($${newBudget.amount.toFixed(2)}) has been added`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message?.includes('unique_user_category') 
          ? "A budget for this category already exists"
          : "Failed to create budget",
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
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id, currentBudgetPeriod.startDate.toISOString(), currentBudgetPeriod.endDate.toISOString()] });
    },
  });

  // Delete budget mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const budget = budgets?.find(b => b.id === budgetId);
      
      // Delete related transactions first
      await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user!.id)
        .eq('category', budget!.category);

      // Delete budget
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);
      
      if (error) throw error;
      return { budget };
    },
    onSuccess: ({ budget }) => {
      const relatedTransactions = transactions?.filter(t => t.category === budget.category) || [];
      
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id, currentBudgetPeriod.startDate.toISOString(), currentBudgetPeriod.endDate.toISOString()] });
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });

      toast({
        title: "Budget Deleted",
        description: `Budget for ${budget.category}${relatedTransactions.length > 0 ? ` and ${relatedTransactions.length} related transaction${relatedTransactions.length === 1 ? '' : 's'}` : ''} removed`,
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
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id, currentBudgetPeriod.startDate.toISOString(), currentBudgetPeriod.endDate.toISOString()] });

      toast({
        title: "Transaction Deleted",
        description: `Transaction "${transaction?.description}" has been removed`,
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
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id, currentBudgetPeriod.startDate.toISOString(), currentBudgetPeriod.endDate.toISOString()] });

      toast({
        title: "Transaction Updated",
        description: `Amount updated to $${updatedTransaction.amount.toFixed(2)}`,
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
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id, currentBudgetPeriod.startDate.toISOString(), currentBudgetPeriod.endDate.toISOString()] });

      toast({
        title: "Category Updated",
        description: `Category updated to ${updatedTransaction.category}`,
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ budgetId, newCategory }: { budgetId: string; newCategory: string }) => {
      const budget = budgets?.find(b => b.id === budgetId);
      
      // Update budget category
      const { data, error } = await supabase
        .from('budgets')
        .update({ category: newCategory })
        .eq('id', budgetId)
        .select()
        .single();
      
      if (error) throw error;

      // Update related transactions
      await supabase
        .from('transactions')
        .update({ category: newCategory })
        .eq('user_id', user!.id)
        .eq('category', budget!.category);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id, currentBudgetPeriod.startDate.toISOString(), currentBudgetPeriod.endDate.toISOString()] });
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
    },
  });

  // Update budget order mutation
  const updateBudgetOrderMutation = useMutation({
    mutationFn: async (budgets: Budget[]) => {
      const updates = budgets.map(budget => ({
        id: budget.id,
        sort_order: budget.sort_order
      }));

      // Update all budgets with new sort order
      for (const update of updates) {
        const { error } = await supabase
          .from('budgets')
          .update({ sort_order: update.sort_order } as any)
          .eq('id', update.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id, currentBudgetPeriod.startDate.toISOString(), currentBudgetPeriod.endDate.toISOString()] });
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
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id, currentBudgetPeriod.startDate.toISOString(), currentBudgetPeriod.endDate.toISOString()] });

      toast({
        title: "All Transactions Cleared",
        description: `${transactionCount} transaction${transactionCount === 1 ? '' : 's'} have been removed`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to clear transactions",
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
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id, currentBudgetPeriod.startDate.toISOString(), currentBudgetPeriod.endDate.toISOString()] });
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });

      toast({
        title: "All Budgets Cleared",
        description: `${budgetCount} budget${budgetCount === 1 ? '' : 's'} have been removed`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to clear budgets",
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
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You've been successfully signed out",
      });
    }
  };

  if (loading || budgetsLoading || transactionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
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
              <ExchangeRateWidget />
              <ExchangeRateSync />
              
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
                     Period Selection
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
                            <SelectValue placeholder="Select a language" />
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
                          toast({
                            title: t('languageUpdated'),
                            description: `${t('languageChangedTo')} ${selectedLanguage === 'english' ? t('english') : t('spanish')}`,
                          });
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
                    Sign Out
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
          availableCategories={budgets.sort((a, b) => a.sort_order - b.sort_order).map(budget => budget.category)}
          onUpdateTransactionCategory={(id, category) => updateTransactionCategoryMutation.mutate({ transactionId: id, category })}
          onDeleteTransaction={(id) => deleteTransactionMutation.mutate(id)}
          language={selectedLanguage as 'english' | 'spanish'}
        />

        {/* Budget Period Navigator */}
        <BudgetPeriodNavigator
          currentPeriod={currentBudgetPeriod}
          onPeriodChange={setCurrentBudgetPeriod}
          language={selectedLanguage as 'english' | 'spanish'}
          periodType={(userPreference?.period_type as 'calendar_month' | 'specific_day') || 'calendar_month'}
          cutoffDay={userCutoffDay}
        />

        {/* Budget Summary */}
        <BudgetSummary 
          budgets={budgets} 
          transactions={transactions}
          language={selectedLanguage as 'english' | 'spanish'} 
          onAddBudget={(category, amount, periodStart, periodEnd) => addBudgetMutation.mutate({ category, amount, periodStart, periodEnd })}
          onDeleteBudget={(id) => deleteBudgetMutation.mutate(id)}
          onDeleteTransaction={(id) => deleteTransactionMutation.mutate(id)}
          onUpdateTransaction={(id, amount) => updateTransactionMutation.mutate({ transactionId: id, amount })}
          onUpdateTransactionCategory={(id, category) => updateTransactionCategoryMutation.mutate({ transactionId: id, category })}
          onUpdateBudgetCategory={(id, category) => updateCategoryMutation.mutate({ budgetId: id, newCategory: category })}
          onUpdateBudgetAmount={(id, amount) => updateBudgetMutation.mutate({ budgetId: id, amount })}
          onUpdateBudgetOrder={(budgets) => updateBudgetOrderMutation.mutate(budgets)}
          availableCategories={budgets.sort((a, b) => a.sort_order - b.sort_order).map(budget => budget.category)}
          currentPeriod={currentBudgetPeriod}
          onPeriodChange={setCurrentBudgetPeriod}
          cutoffDay={userCutoffDay}
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
            availableCategories={budgets.sort((a, b) => a.sort_order - b.sort_order).map(budget => budget.category)}
            language={selectedLanguage as 'english' | 'spanish'}
          />
        </div>

        {/* Period Selection Modal */}
        {user && (
          <PeriodSelectionModal
            open={isPeriodSelectionOpen}
            onOpenChange={setIsPeriodSelectionOpen}
            userId={user.id}
            onPreferenceChange={handlePreferenceChange}
          />
        )}

      </div>
    </div>
  );
};

export default Index;
