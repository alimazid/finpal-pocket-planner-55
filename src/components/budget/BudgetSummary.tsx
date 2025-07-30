import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

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
  language: 'english' | 'spanish';
}

export function BudgetSummary({ budgets, language }: BudgetSummaryProps) {
  const { t } = useTranslation(language);
  const getProgressColor = (spent: number, amount: number) => {
    const spentNum = Number(spent) || 0;
    const amountNum = Number(amount) || 1;
    const percentage = (spentNum / amountNum) * 100;
    if (percentage >= 90) return 'hsl(0 84% 60%)'; // red for over-budget
    if (percentage >= 75) return 'hsl(24 95% 53%)'; // orange for warning
    return 'hsl(var(--primary))'; // default color
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
          <h2 className="text-xl font-semibold text-foreground">{t('budgetSummary')}</h2>
        </div>
        <Card className="bg-gradient-card shadow-soft">
          <CardContent className="p-6">
            <div className="text-center py-6 text-muted-foreground">
              <p>{t('noBudgetsCreated')}</p>
              <p className="text-sm">{t('createFirstBudget')}</p>
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
        <h2 className="text-xl font-semibold text-foreground">{t('budgetSummary')}</h2>
      </div>

      {/* Overall Progress Bar */}
      <Card className="bg-gradient-card shadow-soft mb-6">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{t('totalBudgetProgress')}</span>
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
              {totalPercentage.toFixed(0)}% {t('ofTotalBudgetUsed')}
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
                        className="w-3 h-3 rounded-full flex-shrink-0 bg-primary"
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
                        {percentage.toFixed(0)}% {t('used')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <Progress 
                    value={percentage} 
                    className="h-3"
                    style={{ 
                      '--progress-background': getProgressColor(budget.spent, budget.amount)
                    } as React.CSSProperties}
                  />
                  
                  {/* Over Budget Warning */}
                  {isOverBudget && (
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                      {t('overBudgetBy')} {formatCurrency(budget.spent - budget.amount)}
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