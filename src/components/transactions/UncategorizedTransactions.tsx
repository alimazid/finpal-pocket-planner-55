import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Check } from "lucide-react";
import { useState } from "react";

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
}

export function UncategorizedTransactions({ 
  transactions, 
  availableCategories, 
  onUpdateTransactionCategory 
}: UncategorizedTransactionsProps) {
  const [selectedCategories, setSelectedCategories] = useState<Record<string, string>>({});

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

  const handleCategorySelect = (transactionId: string, category: string) => {
    setSelectedCategories(prev => ({
      ...prev,
      [transactionId]: category
    }));
  };

  const handleApplyCategory = (transactionId: string) => {
    const category = selectedCategories[transactionId];
    if (category) {
      onUpdateTransactionCategory(transactionId, category);
      // Remove from local state after applying
      setSelectedCategories(prev => {
        const updated = { ...prev };
        delete updated[transactionId];
        return updated;
      });
    }
  };

  const handleCategorizeAll = () => {
    Object.entries(selectedCategories).forEach(([transactionId, category]) => {
      if (category) {
        onUpdateTransactionCategory(transactionId, category);
      }
    });
    setSelectedCategories({});
  };

  const hasSelectedCategories = Object.keys(selectedCategories).length > 0;

  return (
    <Card className="bg-gradient-card shadow-soft border-orange-200 dark:border-orange-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <AlertTriangle className="h-5 w-5" />
          Uncategorized Transactions
          <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
            {uncategorizedTransactions.length}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          These transactions don't have a category assigned. Categorize them to track your budget properly.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {uncategorizedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-orange-50/50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800/50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground truncate">
                    {transaction.description}
                  </p>
                  <Badge variant="outline" className="border-orange-300 text-orange-600 bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:bg-orange-950/20 flex-shrink-0">
                    No Category
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{formatDate(transaction.date)}</span>
                  <span className="font-semibold text-destructive">
                    -{formatCurrency(transaction.amount)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Select
                  value={selectedCategories[transaction.id] || ""}
                  onValueChange={(value) => handleCategorySelect(transaction.id, value)}
                >
                  <SelectTrigger className="w-40 h-9 bg-background border">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {availableCategories.map((category) => (
                      <SelectItem key={category} value={category} className="hover:bg-muted">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApplyCategory(transaction.id)}
                  disabled={!selectedCategories[transaction.id]}
                  className="h-9 px-3"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {hasSelectedCategories && (
            <div className="pt-3 border-t">
              <Button
                onClick={handleCategorizeAll}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                Categorize All Selected ({Object.keys(selectedCategories).length})
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}