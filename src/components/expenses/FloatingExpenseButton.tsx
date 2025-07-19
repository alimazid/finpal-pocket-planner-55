import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { useState } from "react";

interface FloatingExpenseButtonProps {
  onAddExpense: (expense: {
    amount: number;
    description: string;
    category: string;
    date: string;
  }) => void;
  availableCategories: string[];
}

export function FloatingExpenseButton({ onAddExpense, availableCategories }: FloatingExpenseButtonProps) {
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
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 bg-primary hover:bg-primary/90"
          size="icon"
        >
          <DollarSign className="h-6 w-6" />
        </Button>
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