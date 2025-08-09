import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

import { BudgetCard } from "@/components/budget/BudgetCard";
import { BudgetSummary } from "@/components/budget/BudgetSummary";
import { BudgetPeriodNavigator } from "@/components/budget/BudgetPeriodNavigator";
import { AddBudgetCard } from "@/components/budget/AddBudgetCard";
import { TransactionList } from "@/components/transactions/TransactionList";
import { UncategorizedTransactions } from "@/components/transactions/UncategorizedTransactions";
import ExchangeRateWidget from "@/components/exchange/ExchangeRateWidget";
import { ExchangeRateSync } from "@/components/exchange/ExchangeRateSync";

import { DollarSign, TrendingUp, Target, CreditCard, Calendar, AlertTriangle, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LogOut, Trash2, Languages } from "lucide-react";
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
  created_at: string;
  updated_at: string;
}

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("spanish");
  const [isTranslationOpen, setIsTranslationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Budget period state
  interface BudgetPeriod {
    startDate: Date;
    endDate: Date;
    isCurrentPeriod: boolean;
  }
  
  const getCurrentPeriod = (cutoffDay: number = 1): BudgetPeriod => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
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
  };
  
  const [currentBudgetPeriod, setCurrentBudgetPeriod] = useState<BudgetPeriod>(getCurrentPeriod());
  const { t } = useTranslation(selectedLanguage as 'english' | 'spanish');

  // Fetch budgets
  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
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
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });

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
    mutationFn: async ({ category, amount }: { category: string; amount: number }) => {
      const { data, error } = await supabase
        .from('budgets')
        .insert([{
          user_id: user!.id,
          category,
          amount,
          spent: 0,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newBudget) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
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
      
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });

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
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });

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
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });

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
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
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
        {/* Budget Period Navigator */}
        <BudgetPeriodNavigator
          currentPeriod={currentBudgetPeriod}
          onPeriodChange={setCurrentBudgetPeriod}
          language={selectedLanguage as 'english' | 'spanish'}
          cutoffDay={1}
        />

        {/* Budget Summary */}
        <BudgetSummary 
          budgets={budgets} 
          language={selectedLanguage as 'english' | 'spanish'} 
          onAddBudget={(category, amount) => addBudgetMutation.mutate({ category, amount })}
          currentPeriod={currentBudgetPeriod}
          onPeriodChange={setCurrentBudgetPeriod}
          cutoffDay={1}
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
            availableCategories={budgets.map(budget => budget.category)}
            language={selectedLanguage as 'english' | 'spanish'}
          />
        </div>

        {/* Budget Overview */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">{t('budgetDetails')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                category={budget.category}
                spent={budget.spent}
                budget={budget.amount}
                currency={budget.currency}
                transactions={transactions.filter(t => t.category === budget.category && t.type === 'expense')}
                onBudgetUpdate={(newBudget) => updateBudgetMutation.mutate({ budgetId: budget.id, amount: newBudget })}
                onCategoryUpdate={(newCategory) => updateCategoryMutation.mutate({ budgetId: budget.id, newCategory })}
                onDelete={() => deleteBudgetMutation.mutate(budget.id)}
              />
            ))}
            <AddBudgetCard onAddBudget={(category, amount) => addBudgetMutation.mutate({ category, amount })} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Index;
