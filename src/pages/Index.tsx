import { useState } from "react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { BudgetCard } from "@/components/budget/BudgetCard";
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
  const [budgets, setBudgets] = useState<Budget[]>([
    { category: "Food & Dining", amount: 500, spent: 0 },
    { category: "Transportation", amount: 200, spent: 0 },
    { category: "Shopping", amount: 300, spent: 0 },
    { category: "Entertainment", amount: 150, spent: 0 },
  ]);

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
    setBudgets(prev => prev.filter(budget => budget.category !== category));
    
    toast({
      title: "Budget Deleted",
      description: `Budget for ${category} has been removed`,
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Add Expense */}
          <div className="space-y-6">
            <ExpenseForm onAddExpense={handleAddExpense} />
          </div>

          {/* Middle Column - Budgets */}
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
            </div>
          </div>

          {/* Right Column - Recent Transactions */}
          <div>
            <TransactionList transactions={transactions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
