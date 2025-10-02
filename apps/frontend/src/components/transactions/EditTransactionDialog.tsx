import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { TransactionForm } from "@/components/transactions/TransactionForm";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string | null;
  date: string;
  type: 'expense' | 'income';
  currency: string;
}

interface EditTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onSave: (id: string, data: {
    amount?: number;
    description?: string;
    category?: string;
    date?: string;
    type?: 'expense' | 'income';
    currency?: string;
  }) => void;
  availableCategories?: string[];
  language: 'english' | 'spanish';
}

export function EditTransactionDialog({
  isOpen,
  onOpenChange,
  transaction,
  onSave,
  availableCategories = [],
  language
}: EditTransactionDialogProps) {
  const { t } = useTranslation(language);

  const handleSave = (id: string, updates: {
    amount?: number;
    description?: string;
    category?: string | null;
    date?: string;
    type?: 'expense' | 'income';
    currency?: string;
  }) => {
    onSave(id, updates);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('editTransaction')}</DialogTitle>
          <DialogDescription>
            {t('editTransactionDescription')}
          </DialogDescription>
        </DialogHeader>

        <TransactionForm
          mode="edit"
          initialData={transaction}
          onSave={handleSave}
          availableCategories={availableCategories}
          language={language}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
