import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface FloatingExpenseButtonProps {
  onAddExpense: (expense: {
    amount: number;
    description: string;
    category: string;
    date: string;
    currency: string;
  }) => void;
  availableCategories: string[];
  language: 'english' | 'spanish';
  defaultCurrency?: string;
}

export function FloatingExpenseButton({ onAddExpense, availableCategories, language, defaultCurrency }: FloatingExpenseButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation(language);

  const handleAddExpense = (expense: {
    amount: number;
    description: string;
    category: string;
    date: string;
    currency: string;
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
          <DialogTitle>{t('addNewExpense')}</DialogTitle>
          <DialogDescription>
            {t('trackSpending')}
          </DialogDescription>
        </DialogHeader>
        
        <ExpenseForm onAddExpense={handleAddExpense} availableCategories={availableCategories} showCard={false} language={language} defaultCurrency={defaultCurrency} />
      </DialogContent>
    </Dialog>
  );
}