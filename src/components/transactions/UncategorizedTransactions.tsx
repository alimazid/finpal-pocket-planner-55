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
    <Card className="bg-gradient-card shadow-soft border-warning/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-warning">
          <AlertTriangle className="h-5 w-5" />
          Uncategorized Transactions
          <Badge variant="secondary" className="ml-auto bg-warning/10 text-warning border-warning/20">
            {uncategorizedTransactions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {uncategorizedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card border-border hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground truncate">
                    {transaction.description}
                  </p>
                  <Badge variant="outline" className="border-warning/50 text-warning bg-warning/5 flex-shrink-0">
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
                  <SelectTrigger className="w-40 h-9 bg-background border-border">
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
            <div className="pt-3 border-t border-border">
              <Button
                onClick={handleCategorizeAll}
                className="w-full bg-warning hover:bg-warning/90 text-warning-foreground"
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