import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, DollarSign, Trash2, Check, X, Plus } from "lucide-react";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { useState } from "react";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: 'expense' | 'income';
}

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction?: (id: string) => void;
  onUpdateTransaction?: (id: string, newAmount: number) => void;
  onAddExpense?: (expense: {
    amount: number;
    description: string;
    category: string;
    date: string;
  }) => void;
  availableCategories?: string[];
}

export function TransactionList({ transactions, onDeleteTransaction, onUpdateTransaction, onAddExpense, availableCategories }: TransactionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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

  const handleAddExpense = (expense: {
    amount: number;
    description: string;
    category: string;
    date: string;
  }) => {
    if (onAddExpense) {
      onAddExpense(expense);
    }
    setIsAddDialogOpen(false);
  };

  return (
    <Card className="bg-gradient-card shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No transactions yet</p>
                <p className="text-sm">Add your first expense to get started</p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">
                        {transaction.description}
                      </p>
                      <Badge variant="secondary" className={getCategoryColor(transaction.category)}>
                        {transaction.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      {editingId === transaction.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-20 h-8 text-right"
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
                          ${transaction.amount.toFixed(2)}
                        </p>
                      )}
                    </div>
                    {onDeleteTransaction && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this transaction for "{transaction.description}" (${transaction.amount.toFixed(2)})? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => onDeleteTransaction(transaction.id)} 
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
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
                  <div className="flex items-center justify-center p-3 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 cursor-pointer transition-all duration-200 bg-gradient-card hover:bg-muted/30 min-h-[72px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plus className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-base font-medium text-muted-foreground">Add Transaction</span>
                    </div>
                  </div>
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
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}