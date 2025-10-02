import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { TransactionForm } from "@/components/transactions/TransactionForm";

interface AddTransactionButtonProps {
  onAddExpense: (expense: {
    amount: number;
    description: string;
    category: string | null;
    date: string;
    currency: string;
  }) => void;
  availableCategories: string[];
  language: 'english' | 'spanish';
  defaultCurrency?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showText?: boolean;
}

export function AddTransactionButton({
  onAddExpense,
  availableCategories,
  language,
  defaultCurrency,
  variant = "outline",
  size = "sm",
  showText = true
}: AddTransactionButtonProps) {
  const { t } = useTranslation(language);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddExpense = (expense: {
    amount: number;
    description: string;
    category: string | null;
    date: string;
    currency: string;
  }) => {
    onAddExpense(expense);
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {showText && <span className="hidden sm:inline">{t('addTransaction')}</span>}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('addNewExpense')}</DialogTitle>
          <DialogDescription>
            {t('trackSpending')}
          </DialogDescription>
        </DialogHeader>

        <TransactionForm
          mode="create"
          onSubmit={handleAddExpense}
          availableCategories={availableCategories}
          language={language}
          defaultCurrency={defaultCurrency}
        />
      </DialogContent>
    </Dialog>
  );
}