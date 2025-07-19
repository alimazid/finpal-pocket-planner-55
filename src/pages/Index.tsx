import { useState } from "react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

import { BudgetCard } from "@/components/budget/BudgetCard";
import { AddBudgetCard } from "@/components/budget/AddBudgetCard";
import { TransactionList } from "@/components/transactions/TransactionList";
import { DollarSign, TrendingUp, Target, CreditCard } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: 'expense' | 'income';
}

interface Budget {
  category: string;
  amount: number;
  spent: number;
}

const Index = () => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const handleAddExpense = (expense: {
    amount: number;
    description: string;
    category: string;
    date: string;
  }) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      ...expense,
      type: 'expense'
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    
    // Update budget spent amount
    setBudgets(prev => prev.map(budget => 
      budget.category === expense.category
        ? { ...budget, spent: budget.spent + expense.amount }
        : budget
    ));

    toast({
      title: "Expense Added",
      description: `$${expense.amount.toFixed(2)} spent on ${expense.category}`,
    });
  };

  const handleBudgetUpdate = (category: string, newBudget: number) => {
    setBudgets(prev => prev.map(budget => 
      budget.category === category
        ? { ...budget, amount: newBudget }
        : budget
    ));
  };

  const handleCategoryUpdate = (oldCategory: string, newCategory: string) => {
    setBudgets(prev => prev.map(budget => 
      budget.category === oldCategory
        ? { ...budget, category: newCategory }
        : budget
    ));
    
    // Update transactions with the new category name
    setTransactions(prev => prev.map(transaction => 
      transaction.category === oldCategory
        ? { ...transaction, category: newCategory }
        : transaction
    ));
  };

  const handleBudgetDelete = (category: string) => {
    // Count how many transactions will be deleted
    const relatedTransactions = transactions.filter(t => t.category === category);
    const transactionCount = relatedTransactions.length;
    
    setBudgets(prev => prev.filter(budget => budget.category !== category));
    setTransactions(prev => prev.filter(transaction => transaction.category !== category));
    
    toast({
      title: "Budget Deleted",
      description: `Budget for ${category}${transactionCount > 0 ? ` and ${transactionCount} related transaction${transactionCount === 1 ? '' : 's'}` : ''} removed`,
    });
  };

  const handleAddBudget = (category: string, amount: number) => {
    // Check if category already exists
    const existingBudget = budgets.find(budget => budget.category.toLowerCase() === category.toLowerCase());
    
    if (existingBudget) {
      toast({
        title: "Category Exists",
        description: `A budget for "${category}" already exists`,
        variant: "destructive",
      });
      return;
    }

    const newBudget: Budget = {
      category,
      amount,
      spent: 0
    };

    setBudgets(prev => [...prev, newBudget]);
    
    toast({
      title: "Budget Created",
      description: `Budget for ${category} ($${amount.toFixed(2)}) has been added`,
    });
  };

  const handleTransactionDelete = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    
    if (transaction && transaction.type === 'expense') {
      // Update budget spent amount (reduce it)
      setBudgets(prev => prev.map(budget => 
        budget.category === transaction.category
          ? { ...budget, spent: budget.spent - transaction.amount }
          : budget
      ));
    }
    
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    
    toast({
      title: "Transaction Deleted",
      description: `Transaction "${transaction?.description}" has been removed`,
    });
  };

  const handleTransactionUpdate = (transactionId: string, newAmount: number) => {
    const transaction = transactions.find(t => t.id === transactionId);
    
    if (transaction && transaction.type === 'expense') {
      const oldAmount = transaction.amount;
      const amountDifference = newAmount - oldAmount;
      
      // Update budget spent amount
      setBudgets(prev => prev.map(budget => 
        budget.category === transaction.category
          ? { ...budget, spent: budget.spent + amountDifference }
          : budget
      ));
    }
    
    // Update the transaction
    setTransactions(prev => prev.map(t => 
      t.id === transactionId
        ? { ...t, amount: newAmount }
        : t
    ));
    
    toast({
      title: "Transaction Updated",
      description: `Amount updated to $${newAmount.toFixed(2)}`,
    });
  };

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
          <ThemeToggle />
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Budgets */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Budget Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {budgets.map((budget) => (
                <BudgetCard
                  key={budget.category}
                  category={budget.category}
                  spent={budget.spent}
                  budget={budget.amount}
                  onBudgetUpdate={(newBudget) => handleBudgetUpdate(budget.category, newBudget)}
                  onCategoryUpdate={(newCategory) => handleCategoryUpdate(budget.category, newCategory)}
                  onDelete={() => handleBudgetDelete(budget.category)}
                />
              ))}
              <AddBudgetCard onAddBudget={handleAddBudget} />
            </div>
          </div>

          {/* Right Column - Recent Transactions */}
          <div>
            <TransactionList 
              transactions={transactions}
              onDeleteTransaction={handleTransactionDelete}
              onUpdateTransaction={handleTransactionUpdate}
              onAddExpense={handleAddExpense}
              availableCategories={budgets.map(budget => budget.category)}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Index;
