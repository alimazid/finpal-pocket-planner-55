import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Target, Check, X, Trash2 } from "lucide-react";
import { useState } from "react";

interface BudgetCardProps {
  category: string;
  spent: number;
  budget: number;
  onEdit?: () => void;
  onBudgetUpdate?: (newBudget: number) => void;
  onCategoryUpdate?: (newCategory: string) => void;
  onDelete?: () => void;
}

export function BudgetCard({ category, spent, budget, onEdit, onBudgetUpdate, onCategoryUpdate, onDelete }: BudgetCardProps) {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [editBudget, setEditBudget] = useState(budget.toString());
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editCategory, setEditCategory] = useState(category);
  
  const percentage = (spent / budget) * 100;
  const isOverBudget = spent > budget;
  const remaining = budget - spent;

  const handleBudgetSave = () => {
    const newBudget = parseFloat(editBudget);
    if (!isNaN(newBudget) && newBudget > 0 && onBudgetUpdate) {
      onBudgetUpdate(newBudget);
    } else {
      setEditBudget(budget.toString());
    }
    setIsEditingBudget(false);
  };

  const handleBudgetCancel = () => {
    setEditBudget(budget.toString());
    setIsEditingBudget(false);
  };

  const handleCategorySave = () => {
    if (editCategory.trim() && onCategoryUpdate) {
      onCategoryUpdate(editCategory.trim());
    } else {
      setEditCategory(category);
    }
    setIsEditingCategory(false);
  };

  const handleCategoryCancel = () => {
    setEditCategory(category);
    setIsEditingCategory(false);
  };

  return (
    <Card className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-200 aspect-square">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          {isEditingCategory ? (
            <div className="flex items-center gap-2">
              <Input
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="h-8 text-base font-semibold"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCategorySave();
                  if (e.key === 'Escape') handleCategoryCancel();
                }}
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={handleCategorySave} className="h-8 w-8 p-0">
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCategoryCancel} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <span 
              className="cursor-pointer hover:text-primary transition-colors"
              onClick={() => setIsEditingCategory(true)}
            >
              {category}
            </span>
          )}
        </CardTitle>
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Budget</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the budget for "{category}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
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
          <div className="flex justify-between text-base w-full items-center">
            <span className="text-muted-foreground">Budget:</span>
            {isEditingBudget ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                  className="w-20 h-8 text-right"
                  type="number"
                  step="0.01"
                  min="0"
                />
                <Button size="sm" variant="ghost" onClick={handleBudgetSave} className="h-8 w-8 p-0">
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleBudgetCancel} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <span 
                className="font-semibold cursor-pointer hover:text-primary transition-colors"
                onClick={() => setIsEditingBudget(true)}
              >
                ${budget.toFixed(2)}
              </span>
            )}
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