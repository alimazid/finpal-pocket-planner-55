import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string | null;
  date: string;
  type: 'expense' | 'income';
}

interface UncategorizedTransactionsProps {
  transactions: Transaction[];
  availableCategories: string[];
  onUpdateTransactionCategory: (id: string, category: string) => void;
  language: 'english' | 'spanish';
}

export function UncategorizedTransactions({ 
  transactions, 
  availableCategories, 
  onUpdateTransactionCategory,
  language 
}: UncategorizedTransactionsProps) {
  const [openSelects, setOpenSelects] = useState<Record<string, boolean>>({});
  const { t } = useTranslation(language);

  // Filter to only show uncategorized transactions
  const uncategorizedTransactions = transactions.filter(t => !t.category);

  // Don't render if no uncategorized transactions
  if (uncategorizedTransactions.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleBadgeClick = (transactionId: string) => {
    setOpenSelects(prev => ({
      ...prev,
      [transactionId]: !prev[transactionId]
    }));
  };

  const handleCategorySelect = (transactionId: string, category: string) => {
    console.log('Category selected:', { transactionId, category });
    onUpdateTransactionCategory(transactionId, category);
    setOpenSelects(prev => ({
      ...prev,
      [transactionId]: false
    }));
  };

  return (
    <div className="space-y-2">
      {uncategorizedTransactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border bg-red-50 border-red-200 hover:bg-red-100/50 dark:bg-red-950/20 dark:border-red-800/50 dark:hover:bg-red-900/30 transition-colors gap-2"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="font-medium text-foreground truncate">
                {transaction.description}
              </p>
              {openSelects[transaction.id] ? (
                <Select
                  value=""
                  onValueChange={(value) => handleCategorySelect(transaction.id, value)}
                  open={openSelects[transaction.id]}
                  onOpenChange={(open) => {
                    setOpenSelects(prev => ({ ...prev, [transaction.id]: open }));
                  }}
                >
                  <SelectTrigger className="w-40 h-8 bg-background border-border">
                    <SelectValue placeholder={t('selectCategory')} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {availableCategories.map((category) => (
                      <SelectItem key={category} value={category} className="hover:bg-muted">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge 
                  variant="outline" 
                  className="border-red-300 text-red-600 bg-red-50 cursor-pointer hover:bg-red-100 transition-colors dark:border-red-700 dark:text-red-400 dark:bg-red-950/20 dark:hover:bg-red-900/30 flex-shrink-0"
                  onClick={() => handleBadgeClick(transaction.id)}
                >
                  {t('noCategory')}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span>{formatDate(transaction.date)}</span>
              <span className="font-semibold text-destructive">
                -{formatCurrency(transaction.amount)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}