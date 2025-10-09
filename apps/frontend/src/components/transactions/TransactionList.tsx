import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, DollarSign, Trash2, Plus, Edit, X } from "lucide-react";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { NewBudgetModal } from "@/components/budget/NewBudgetModal";
import { EditTransactionDialog } from "@/components/transactions/EditTransactionDialog";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string | null;
  date: string;
  type: 'expense' | 'income';
  currency: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction?: (id: string) => void;
  onUpdateTransactionCategory?: (id: string, newCategory: string) => void;
  onEditTransaction?: (id: string, data: {
    amount?: number;
    description?: string;
    category?: string;
    date?: string;
    type?: 'expense' | 'income';
    currency?: string;
  }) => void;
  onCreateBudgetAndAssign?: (transactionId: string, budgetData: {
    category: string;
    amount: number;
    currency: string;
  }) => void;
  availableCategories?: string[];
  language: 'english' | 'spanish';
  defaultCurrency?: string;
}

export function TransactionList({ transactions, onDeleteTransaction, onUpdateTransactionCategory, onEditTransaction, onCreateBudgetAndAssign, availableCategories, language, defaultCurrency }: TransactionListProps) {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isNewBudgetModalOpen, setIsNewBudgetModalOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const { t, formatDate: formatTranslatedDate } = useTranslation(language);

  const formatDate = (dateString: string) => {
    // Parse date as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return formatTranslatedDate(date, { useAbbreviation: true });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Food & Dining': 'bg-orange-100 text-orange-800',
      'Transportation': 'bg-blue-100 text-blue-800',
      'Shopping': 'bg-purple-100 text-purple-800',
      'Entertainment': 'bg-pink-100 text-pink-800',
      'Bills & Utilities': 'bg-red-100 text-red-800',
      'Healthcare': 'bg-green-100 text-green-800',
      'Education': 'bg-indigo-100 text-indigo-800',
      'Travel': 'bg-teal-100 text-teal-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };


  const handleCategoryEdit = (transactionId: string) => {
    setEditingCategoryId(transactionId);
  };

  const handleCategoryChange = (transactionId: string, newCategory: string) => {
    if (newCategory === '__new_category__') {
      // Special value for "New Category" option
      if (onCreateBudgetAndAssign) {
        setSelectedTransactionId(transactionId);
        setIsNewBudgetModalOpen(true);
      }
      setEditingCategoryId(null);
    } else {
      if (onUpdateTransactionCategory) {
        onUpdateTransactionCategory(transactionId, newCategory);
      }
      setEditingCategoryId(null);
    }
  };

  const handleCategoryCancel = () => {
    setEditingCategoryId(null);
  };

  const handleNoCategory = (transactionId: string) => {
    if (availableCategories && availableCategories.length === 0) {
      // If no categories exist, open the modal directly
      if (onCreateBudgetAndAssign) {
        setSelectedTransactionId(transactionId);
        setIsNewBudgetModalOpen(true);
      }
    } else {
      // If categories exist, show the dropdown with category edit
      handleCategoryEdit(transactionId);
    }
  };

  const handleCreateBudget = (budgetData: {
    category: string;
    amount: number;
    currency: string;
  }) => {
    if (selectedTransactionId && onCreateBudgetAndAssign) {
      onCreateBudgetAndAssign(selectedTransactionId, budgetData);
      setIsNewBudgetModalOpen(false);
      setSelectedTransactionId(null);
    }
  };

  const handleEditClick = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = (id: string, data: {
    amount?: number;
    description?: string;
    category?: string;
    date?: string;
    type?: 'expense' | 'income';
    currency?: string;
  }) => {
    if (onEditTransaction) {
      onEditTransaction(id, data);
    }
  };

  return (
    <div className="space-y-2">
      {transactions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-gradient-card rounded-lg">
          <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>{t('noTransactionsYet')}</p>
          <p className="text-sm">{t('addFirstExpense')}</p>
        </div>
      ) : (
        transactions.map((transaction) => (
          <div
            key={transaction.id}
            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border transition-colors gap-2 ${
              !transaction.category 
                ? 'bg-red-50 border-red-200 hover:bg-red-100/50 dark:bg-red-950/20 dark:border-red-800/50 dark:hover:bg-red-900/30' 
                : 'bg-gradient-card hover:bg-muted/30'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="font-medium text-foreground truncate">
                  {transaction.description}
                </p>
                {editingCategoryId === transaction.id && availableCategories ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={transaction.category || ""}
                      onValueChange={(value) => handleCategoryChange(transaction.id, value)}
                      onOpenChange={(open) => {
                        if (!open) handleCategoryCancel();
                      }}
                      defaultOpen={true}
                    >
                      <SelectTrigger className="w-32 h-8 text-xs bg-background border">
                        <SelectValue placeholder={t('selectCategory')} />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {availableCategories.map((category) => (
                          <SelectItem key={category} value={category} className="hover:bg-muted">
                            {category}
                          </SelectItem>
                        ))}
                        {availableCategories && availableCategories.length > 0 && (
                          <SelectItem value="__new_category__" className="hover:bg-muted border-t mt-1 pt-2">
                            <div className="flex items-center gap-2">
                              <Plus className="h-3 w-3" />
                              {t('newCategory')}
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" onClick={handleCategoryCancel} className="h-8 w-8 p-0">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : transaction.category ? (
                  <Badge 
                    variant="secondary" 
                    className={`${getCategoryColor(transaction.category)} ${
                      onUpdateTransactionCategory ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
                    } flex-shrink-0`}
                    onClick={() => onUpdateTransactionCategory && handleCategoryEdit(transaction.id)}
                  >
                    {transaction.category}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-red-300 text-red-600 bg-red-50 cursor-pointer hover:bg-red-100 transition-colors dark:border-red-700 dark:text-red-400 dark:bg-red-950/20 dark:hover:bg-red-900/30 flex-shrink-0"
                    onClick={() => handleNoCategory(transaction.id)}
                  >
                    {t('noCategory')}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(transaction.date)}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
              <div className="text-left sm:text-right flex-1 sm:flex-initial">
                <p
                  className={`font-semibold ${
                    transaction.type === 'expense' ? 'text-destructive' : 'text-success'
                  }`}
                >
                  {transaction.type === 'expense' ? '-' : '+'}
                  {formatCurrency(transaction.amount, transaction.currency)}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {onEditTransaction && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => handleEditClick(transaction)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDeleteTransaction && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('deleteTransaction')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('deleteTransactionConfirm')} "{transaction.description}" ({formatCurrency(transaction.amount, transaction.currency)})? {t('actionCannotBeUndoneSimple')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteTransaction(transaction.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {/* New Budget Modal */}
      <NewBudgetModal
        isOpen={isNewBudgetModalOpen}
        onOpenChange={setIsNewBudgetModalOpen}
        onCreateBudget={handleCreateBudget}
        existingCategories={availableCategories || []}
        language={language}
        defaultCurrency={defaultCurrency}
      />

      {/* Edit Transaction Dialog */}
      <EditTransactionDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        transaction={transactionToEdit}
        onSave={handleEditSave}
        availableCategories={availableCategories}
        language={language}
      />
    </div>
  );
}