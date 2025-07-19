import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Edit, Target } from "lucide-react";

interface BudgetCardProps {
  category: string;
  spent: number;
  budget: number;
  onEdit?: () => void;
}

export function BudgetCard({ category, spent, budget, onEdit }: BudgetCardProps) {
  const percentage = (spent / budget) * 100;
  const isOverBudget = spent > budget;
  const remaining = budget - spent;

  return (
    <Card className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          {category}
        </CardTitle>
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Spent</span>
          <span className={`font-medium ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
            ${spent.toFixed(2)}
          </span>
        </div>
        <Progress 
          value={Math.min(percentage, 100)} 
          className="h-2"
        />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Budget</span>
          <span className="font-medium">${budget.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {remaining >= 0 ? 'Remaining' : 'Over budget'}
          </span>
          <span className={`font-medium ${remaining >= 0 ? 'text-success' : 'text-destructive'}`}>
            ${Math.abs(remaining).toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}