import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3 } from "lucide-react";

interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  spent: number;
  created_at: string;
  updated_at: string;
}

interface BudgetSummaryProps {
  budgets: Budget[];
}

export function BudgetSummary({ budgets }: BudgetSummaryProps) {
  const getCategoryColor = (category: string, index: number) => {
    const colors = [
      'hsl(var(--primary))',
      'hsl(var(--secondary))',
      'hsl(var(--accent))',
      'hsl(0 84% 60%)', // red
      'hsl(24 95% 53%)', // orange
      'hsl(45 93% 47%)', // yellow
      'hsl(142 71% 45%)', // green
      'hsl(217 91% 60%)', // blue
      'hsl(262 83% 58%)', // violet
      'hsl(330 81% 60%)', // pink
    ];
    return colors[index % colors.length];
  };

  const getProgressColor = (spent: number, amount: number, index: number) => {
    const spentNum = Number(spent) || 0;
    const amountNum = Number(amount) || 1;
    const percentage = (spentNum / amountNum) * 100;
    if (percentage >= 90) return 'hsl(0 84% 60%)'; // red for over-budget
    if (percentage >= 75) return 'hsl(24 95% 53%)'; // orange for warning
    return getCategoryColor('', index); // default color
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getSpentPercentage = (spent: number, amount: number) => {
    const spentNum = Number(spent) || 0;
    const amountNum = Number(amount) || 1;
    return Math.min((spentNum / amountNum) * 100, 100);
  };

  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  if (budgets.length === 0) {
    return (
      <>
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Budget Summary</h2>
        </div>
        <Card className="bg-gradient-card shadow-soft">
          <CardContent className="p-6">
            <div className="text-center py-6 text-muted-foreground">
              <p>No budgets created yet</p>
              <p className="text-sm">Create your first budget to see progress here</p>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      {/* Independent Title */}
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Budget Summary</h2>
      </div>

      {/* Overall Progress Bar */}
      <Card className="bg-gradient-card shadow-soft mb-6">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Budget Progress</span>
              <span className="text-sm font-medium text-foreground">
                {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
              </span>
            </div>
            <Progress 
              value={totalPercentage} 
              className="h-3"
              style={{ 
                '--progress-background': totalPercentage >= 90 ? 'hsl(0 84% 60%)' : 
                                        totalPercentage >= 75 ? 'hsl(24 95% 53%)' : 
                                        'hsl(var(--primary))'
              } as React.CSSProperties}
            />
            <div className="text-xs text-muted-foreground text-right">
              {totalPercentage.toFixed(0)}% of total budget used
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Budget Cards */}
      <div className="space-y-4">
        {budgets.map((budget, index) => {
          const percentage = getSpentPercentage(budget.spent, budget.amount);
          const isOverBudget = budget.spent > budget.amount;
          
          return (
            <Card key={budget.id} className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getCategoryColor(budget.category, index) }}
                      />
                      <span className="font-medium text-foreground">{budget.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        <span className={isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-foreground'}>
                          {formatCurrency(budget.spent)}
                        </span>
                        <span className="text-muted-foreground"> / {formatCurrency(budget.amount)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {percentage.toFixed(0)}% used
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <Progress 
                    value={percentage} 
                    className="h-3"
                    style={{ 
                      '--progress-background': getProgressColor(budget.spent, budget.amount, index)
                    } as React.CSSProperties}
                  />
                  
                  {/* Over Budget Warning */}
                  {isOverBudget && (
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                      Over budget by {formatCurrency(budget.spent - budget.amount)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}