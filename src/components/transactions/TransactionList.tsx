import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, DollarSign, Trash2, Check, X, Plus } from "lucide-react";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
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

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction?: (id: string) => void;
  onUpdateTransaction?: (id: string, newAmount: number) => void;
  onUpdateTransactionCategory?: (id: string, newCategory: string) => void;
  onAddExpense?: (expense: {
    amount: number;
    description: string;
    category: string | null;
    date: string;
  }) => void;
  availableCategories?: string[];
  language: 'english' | 'spanish';
}

export function TransactionList({ transactions, onDeleteTransaction, onUpdateTransaction, onUpdateTransactionCategory, onAddExpense, availableCategories, language }: TransactionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { t } = useTranslation(language);
  
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const formatDate = (dateString: string) => {
    // Parse date as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  const handleAmountEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditAmount(transaction.amount.toString());
  };

  const handleAmountSave = (transactionId: string) => {
    const newAmount = parseFloat(editAmount);
    if (!isNaN(newAmount) && newAmount > 0 && onUpdateTransaction) {
      onUpdateTransaction(transactionId, newAmount);
    } else {
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction) {
        setEditAmount(transaction.amount.toString());
      }
    }
    setEditingId(null);
  };

  const handleAmountCancel = () => {
    setEditingId(null);
    setEditAmount("");
  };

  const handleCategoryEdit = (transactionId: string) => {
    setEditingCategoryId(transactionId);
  };

  const handleCategoryChange = (transactionId: string, newCategory: string) => {
    if (onUpdateTransactionCategory) {
      onUpdateTransactionCategory(transactionId, newCategory);
    }
    setEditingCategoryId(null);
  };

  const handleCategoryCancel = () => {
    setEditingCategoryId(null);
  };

  const handleAddExpense = (expense: {
    amount: number;
    description: string;
    category: string | null;
    date: string;
  }) => {
    if (onAddExpense) {
      onAddExpense(expense);
    }
    setIsAddDialogOpen(false);
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
                    onClick={() => onUpdateTransactionCategory && handleCategoryEdit(transaction.id)}
                  >
                    {t('noCategory')}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(transaction.date)}
              </p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              <div className="text-left sm:text-right">
                {editingId === transaction.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-24 h-8 text-right"
                      type="number"
                      step="0.01"
                      min="0"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAmountSave(transaction.id);
                        if (e.key === 'Escape') handleAmountCancel();
                      }}
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" onClick={() => handleAmountSave(transaction.id)} className="h-8 w-8 p-0">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleAmountCancel} className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p 
                    className={`font-semibold cursor-pointer hover:text-primary transition-colors ${
                      transaction.type === 'expense' ? 'text-destructive' : 'text-success'
                    }`}
                    onClick={() => onUpdateTransaction && handleAmountEdit(transaction)}
                  >
                    {transaction.type === 'expense' ? '-' : '+'}
                    RD${formatAmount(transaction.amount)}
                  </p>
                )}
              </div>
              {onDeleteTransaction && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive flex-shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('deleteTransaction')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('deleteTransactionConfirm')} "{transaction.description}" (RD${formatAmount(transaction.amount)})? {t('actionCannotBeUndoneSimple')}
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
        ))
      )}
      
      {/* Add Transaction Card */}
      {onAddExpense && availableCategories && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <div className="flex items-center justify-center p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 cursor-pointer transition-all duration-200 bg-gradient-card hover:bg-muted/30 min-h-[80px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <span className="text-base font-medium text-muted-foreground">{t('addTransaction')}</span>
              </div>
            </div>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t('addNewExpense')}</DialogTitle>
              <DialogDescription>
                {t('trackSpending')}
              </DialogDescription>
            </DialogHeader>
            
            <ExpenseForm onAddExpense={handleAddExpense} availableCategories={availableCategories} showCard={false} language={language} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}