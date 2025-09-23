import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/hooks/useTranslation';
import { DEFAULT_BUDGET_CATEGORIES, getCategoryName } from '@/lib/budgetTemplates';
import { SUPPORTED_CURRENCIES } from '@/config/currencies';

interface NewBudgetModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBudget: (data: {
    category: string;
    amount: number;
    currency: string;
  }) => void;
  existingCategories: string[];
  language: 'english' | 'spanish';
  defaultCurrency?: string;
}

export function NewBudgetModal({
  isOpen,
  onOpenChange,
  onCreateBudget,
  existingCategories,
  language,
  defaultCurrency
}: NewBudgetModalProps) {
  const { t } = useTranslation(language);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency || 'USD');

  // Get all available categories (predefined + existing user categories)
  const predefinedCategories = DEFAULT_BUDGET_CATEGORIES.map(cat => getCategoryName(cat, language));
  const allCategories = [...new Set([...predefinedCategories, ...existingCategories])];

  // Filter out categories that already exist in user's budgets
  const availableCategories = predefinedCategories.filter(
    category => !existingCategories.includes(category)
  );

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCustomCategory('');
  };

  const handleCustomCategoryChange = (value: string) => {
    setCustomCategory(value);
    setSelectedCategory('');
  };

  const handleSubmit = () => {
    const categoryName = selectedCategory || customCategory;
    const budgetAmount = parseFloat(amount);

    if (!categoryName.trim() || !budgetAmount || budgetAmount <= 0) {
      return;
    }

    onCreateBudget({
      category: categoryName.trim(),
      amount: budgetAmount,
      currency
    });

    // Reset form
    setSelectedCategory('');
    setCustomCategory('');
    setAmount('');
    setCurrency(defaultCurrency || 'USD');
  };

  const isValid = () => {
    const categoryName = selectedCategory || customCategory;
    const budgetAmount = parseFloat(amount);
    return categoryName.trim() && budgetAmount > 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('newBudget')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-3">
            <Label>{t('category')}</Label>

            {/* Predefined Categories */}
            {availableCategories.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">{t('suggestedCategories')}</p>
                <ScrollArea className="h-24">
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map((category) => {
                      const categoryData = DEFAULT_BUDGET_CATEGORIES.find(c => getCategoryName(c, language) === category);
                      return (
                        <Badge
                          key={category}
                          variant={selectedCategory === category ? "default" : "outline"}
                          className="cursor-pointer hover:bg-primary/20 transition-colors"
                          onClick={() => handleCategorySelect(category)}
                        >
                          {categoryData?.icon} {category}
                        </Badge>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Custom Category Input */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">{t('orCreateCustomCategory')}</p>
              <Input
                placeholder={t('enterCustomCategory')}
                value={customCategory}
                onChange={(e) => handleCustomCategoryChange(e.target.value)}
              />
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label>{t('monthlyBudgetAmount')}</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                className="flex-1"
              />
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-24">
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
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid()}>
              {t('createBudget')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}