import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

import { BudgetCard } from "@/components/budget/BudgetCard";
import { BudgetSummary } from "@/components/budget/BudgetSummary";
import { AddBudgetCard } from "@/components/budget/AddBudgetCard";
import { TransactionList } from "@/components/transactions/TransactionList";
import { UncategorizedTransactions } from "@/components/transactions/UncategorizedTransactions";
import { DollarSign, TrendingUp, Target, CreditCard } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category: string | null;
  date: string;
  type: 'expense' | 'income';
  created_at: string;
  updated_at: string;
}

interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  spent: number;
  created_at: string;
  updated_at: string;
}

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
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

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const remainingBudget = totalBudget - totalSpent;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-white p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Financial Dashboard</h1>
            <p className="text-primary-foreground/80">Track your expenses, manage budgets, and stay on top of your finances</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleSignOut} className="text-white border-white/20 hover:bg-white/10">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard
            title="Total Expenses"
            value={`$${totalExpenses.toFixed(2)}`}
            icon={DollarSign}
            trend={{ value: "12%", isPositive: false }}
          />
          <StatsCard
            title="Monthly Budget"
            value={`$${totalBudget.toFixed(2)}`}
            icon={Target}
          />
          <StatsCard
            title="Remaining Budget"
            value={`$${remainingBudget.toFixed(2)}`}
            icon={TrendingUp}
            trend={{ value: remainingBudget >= 0 ? "On track" : "Over budget", isPositive: remainingBudget >= 0 }}
          />
          <StatsCard
            title="Transactions"
            value={transactions.length.toString()}
            icon={CreditCard}
          />
        </div>

        {/* Uncategorized Transactions */}
        <UncategorizedTransactions 
          transactions={transactions}
          availableCategories={budgets.map(budget => budget.category)}
          onUpdateTransactionCategory={(id, category) => updateTransactionCategoryMutation.mutate({ transactionId: id, category })}
        />

        {/* Budget Summary */}
        <BudgetSummary budgets={budgets} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Budgets */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Budget Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {budgets.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  category={budget.category}
                  spent={budget.spent}
                  budget={budget.amount}
                  onBudgetUpdate={(newBudget) => updateBudgetMutation.mutate({ budgetId: budget.id, amount: newBudget })}
                  onCategoryUpdate={(newCategory) => updateCategoryMutation.mutate({ budgetId: budget.id, newCategory })}
                  onDelete={() => deleteBudgetMutation.mutate(budget.id)}
                />
              ))}
              <AddBudgetCard onAddBudget={(category, amount) => addBudgetMutation.mutate({ category, amount })} />
            </div>
          </div>

          {/* Right Column - Recent Transactions */}
          <div>
            <TransactionList 
              transactions={transactions}
              onDeleteTransaction={(id) => deleteTransactionMutation.mutate(id)}
              onUpdateTransaction={(id, amount) => updateTransactionMutation.mutate({ transactionId: id, amount })}
              onUpdateTransactionCategory={(id, category) => updateTransactionCategoryMutation.mutate({ transactionId: id, category: category || null })}
              onAddExpense={(expense) => addExpenseMutation.mutate(expense)}
              availableCategories={budgets.map(budget => budget.category)}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Index;
