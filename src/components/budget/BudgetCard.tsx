import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
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
    <Card className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-200 aspect-square">
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
      <CardContent className="flex flex-col items-center justify-center space-y-6 h-full p-4">
        <CircularProgress 
          value={Math.min(percentage, 100)}
          size={140}
          strokeWidth={12}
        />
        <div className="text-center space-y-3 w-full">
          <div className="flex justify-between text-base w-full">
            <span className="text-muted-foreground">Spent:</span>
            <span className={`font-semibold ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
              ${spent.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-base w-full">
            <span className="text-muted-foreground">Budget:</span>
            <span className="font-semibold">${budget.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base w-full">
            <span className="text-muted-foreground">
              {remaining >= 0 ? 'Remaining:' : 'Over:'}
            </span>
            <span className={`font-semibold ${remaining >= 0 ? 'text-success' : 'text-destructive'}`}>
              ${Math.abs(remaining).toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}