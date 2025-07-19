import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { useState } from "react";

interface AddTransactionCardProps {
  onAddExpense: (expense: {
    amount: number;
    description: string;
    category: string;
    date: string;
  }) => void;
  availableCategories: string[];
}

export function AddTransactionCard({ onAddExpense, availableCategories }: AddTransactionCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAddExpense = (expense: {
    amount: number;
    description: string;
    category: string;
    date: string;
  }) => {
    onAddExpense(expense);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-200 cursor-pointer border-2 border-dashed border-muted-foreground/30 hover:border-primary/50">
          <CardContent className="flex flex-col items-center justify-center h-full p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <span className="text-lg font-medium text-muted-foreground">Add Transaction</span>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Track your spending by adding a new expense.
          </DialogDescription>
        </DialogHeader>
        
        <ExpenseForm onAddExpense={handleAddExpense} availableCategories={availableCategories} showCard={false} />
      </DialogContent>
    </Dialog>
  );
}