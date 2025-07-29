import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      '#ef4444', // red
      '#f97316', // orange
      '#eab308', // yellow
      '#22c55e', // green
      '#3b82f6', // blue
      '#8b5cf6', // violet
      '#ec4899', // pink
    ];
    return colors[index % colors.length];
  };

  const getProgressColor = (spent: number, amount: number, index: number) => {
    const percentage = (spent / amount) * 100;
    if (percentage >= 90) return '#ef4444'; // red for over-budget
    if (percentage >= 75) return '#f97316'; // orange for warning
    return getCategoryColor('', index); // default color
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getSpentPercentage = (spent: number, amount: number) => {
    return Math.min((spent / amount) * 100, 100);
  };

  if (budgets.length === 0) {
    return (
      <Card className="bg-gradient-card shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Budget Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p>No budgets created yet</p>
            <p className="text-sm">Create your first budget to see progress here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Budget Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {budgets.map((budget, index) => {
            const percentage = getSpentPercentage(budget.spent, budget.amount);
            const isOverBudget = budget.spent > budget.amount;
            
            return (
              <div key={budget.id} className="space-y-2">
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
                
                <div className="relative">
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className="h-3 bg-muted"
                    style={{
                      '--progress-background': getProgressColor(budget.spent, budget.amount, index)
                    } as React.CSSProperties}
                  />
                  {isOverBudget && (
                    <div 
                      className="absolute top-0 left-0 h-3 bg-red-500/30 rounded-full animate-pulse"
                      style={{ width: `${Math.min((budget.spent / budget.amount) * 100, 150)}%` }}
                    />
                  )}
                </div>
                
                {isOverBudget && (
                  <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Over budget by {formatCurrency(budget.spent - budget.amount)}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Total Summary */}
          <div className="border-t pt-4 mt-6">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <div className="text-right">
                <div className="font-semibold">
                  {formatCurrency(budgets.reduce((sum, budget) => sum + budget.spent, 0))}
                  <span className="text-muted-foreground font-normal"> / {formatCurrency(budgets.reduce((sum, budget) => sum + budget.amount, 0))}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {((budgets.reduce((sum, budget) => sum + budget.spent, 0) / budgets.reduce((sum, budget) => sum + budget.amount, 0)) * 100).toFixed(0)}% of total budget
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}