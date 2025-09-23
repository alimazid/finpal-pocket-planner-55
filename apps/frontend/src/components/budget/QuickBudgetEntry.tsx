import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Target } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { formatCurrency } from "@/lib/utils";
import { DEFAULT_BUDGET_CATEGORIES, getCategoryName } from "@/lib/budgetTemplates";
import { SUPPORTED_CURRENCIES } from "@/config/currencies";

interface BudgetEntry {
  id: string;
  name: string;
  amount: number;
  currency: string;
}

interface QuickBudgetEntryProps {
  onCreateBudgets: (budgets: { category: string; amount: number; currency: string }[]) => void;
  onValidationChange?: (hasValidBudgets: boolean, validBudgets: { category: string; amount: number; currency: string }[]) => void;
  language: 'english' | 'spanish';
  defaultCurrency?: string;
}

export function QuickBudgetEntry({
  onCreateBudgets,
  onValidationChange,
  language,
  defaultCurrency = 'USD'
}: QuickBudgetEntryProps) {
  const { t } = useTranslation(language);
  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Initialize with default categories
  useEffect(() => {
    const initialBudgets: BudgetEntry[] = DEFAULT_BUDGET_CATEGORIES.map((category, index) => ({
      id: `default-${index}`,
      name: getCategoryName(category, language),
      amount: 0,
      currency: defaultCurrency
    }));
    setBudgets(initialBudgets);
  }, [defaultCurrency, language]);

  const updateBudgetAmount = (id: string, amount: number) => {
    setBudgets(prev => prev.map(budget =>
      budget.id === id ? { ...budget, amount } : budget
    ));
  };

  const updateBudgetCurrency = (id: string, currency: string) => {
    setBudgets(prev => prev.map(budget =>
      budget.id === id ? { ...budget, currency } : budget
    ));
  };

  const removeBudget = (id: string) => {
    setBudgets(prev => prev.filter(budget => budget.id !== id));
  };

  const addCustomCategory = () => {
    if (newCategoryName.trim()) {
      const newBudget: BudgetEntry = {
        id: `custom-${Date.now()}`,
        name: newCategoryName.trim(),
        amount: 0,
        currency: defaultCurrency
      };
      setBudgets(prev => [...prev, newBudget]);
      setNewCategoryName('');
    }
  };

  const getTotalAmount = () => {
    // Group by currency and calculate totals
    const totals: Record<string, number> = {};
    budgets.forEach(budget => {
      if (budget.amount > 0) {
        totals[budget.currency] = (totals[budget.currency] || 0) + budget.amount;
      }
    });
    return totals;
  };

  // Notify parent of validation state changes
  useEffect(() => {
    const validBudgets = budgets.filter(budget => budget.amount > 0);
    const hasValidBudgets = validBudgets.length > 0;
    const budgetsToCreate = validBudgets.map(budget => ({
      category: budget.name,
      amount: budget.amount,
      currency: budget.currency
    }));
    onValidationChange?.(hasValidBudgets, budgetsToCreate);
  }, [budgets, onValidationChange]);

  const totals = getTotalAmount();

  return (
    <div className="text-center space-y-6 py-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('enterBudgetAmounts')}</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t('quickSetupDescription')}
        </p>
      </div>

      {/* Budget Entries */}
      <Card>
        <CardContent className="p-3 space-y-2">
          {budgets.map((budget) => (
            <div key={budget.id} className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-medium">{budget.name}</Label>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={budget.amount || ''}
                  onChange={(e) => updateBudgetAmount(budget.id, parseFloat(e.target.value) || 0)}
                  className="w-24 h-8 text-right"
                  step="0.01"
                  min="0"
                />
                <Select
                  value={budget.currency}
                  onValueChange={(value) => updateBudgetCurrency(budget.id, value)}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBudget(budget.id)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}

          <Separator />

          {/* Add Custom Category */}
          <div className="flex items-center gap-1">
            <Input
              placeholder={t('enterCustomCategory')}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addCustomCategory();
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={addCustomCategory}
              disabled={!newCategoryName.trim()}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Total Summary */}
      {Object.keys(totals).length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('totalBudget')}</Label>
              {Object.entries(totals).map(([currency, amount]) => (
                <div key={currency} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{currency}:</span>
                  <span className="font-semibold">{formatCurrency(amount, currency)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}