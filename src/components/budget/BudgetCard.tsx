import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Edit, Target, Check, X, Trash2, Receipt } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string | null;
  date: string;
  type: 'expense' | 'income';
}

interface BudgetCardProps {
  category: string;
  spent: number;
  budget: number;
  transactions: Transaction[];
  onEdit?: () => void;
  onBudgetUpdate?: (newBudget: number) => void;
  onCategoryUpdate?: (newCategory: string) => void;
  onDelete?: () => void;
}

export function BudgetCard({ category, spent, budget, transactions, onEdit, onBudgetUpdate, onCategoryUpdate, onDelete }: BudgetCardProps) {
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
    <Card className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-200 h-[500px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 flex-shrink-0">
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
      <CardContent className="flex flex-col space-y-4 p-4 flex-1 min-h-0">
        {/* Budget Summary */}
        <div className="flex flex-col items-center space-y-4 flex-shrink-0">
          <CircularProgress 
            value={Math.min(percentage, 100)}
            size={100}
            strokeWidth={8}
          />
          <div className="text-center space-y-2 w-full">
            <div className="flex justify-between text-sm w-full">
              <span className="text-muted-foreground">Spent:</span>
              <span className={`font-semibold ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
                ${spent.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm w-full items-center">
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
            <div className="flex justify-between text-sm w-full">
              <span className="text-muted-foreground">
                {remaining >= 0 ? 'Remaining:' : 'Over:'}
              </span>
              <span className={`font-semibold ${remaining >= 0 ? 'text-success' : 'text-destructive'}`}>
                ${Math.abs(remaining).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Transactions List */}
        <div className="flex-1 min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-sm">Transactions ({transactions.length})</h4>
          </div>
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No transactions in this category
                </p>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm gap-2">
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="font-medium truncate text-xs">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 min-w-0">
                      <span className={`font-medium text-xs ${transaction.type === 'expense' ? 'text-destructive' : 'text-success'}`}>
                        {transaction.type === 'expense' ? '-' : '+'}${transaction.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}