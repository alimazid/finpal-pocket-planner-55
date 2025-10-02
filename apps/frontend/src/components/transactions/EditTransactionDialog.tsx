import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";

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
  availableCurrencies?: string[];
  language: 'english' | 'spanish';
}

export function EditTransactionDialog({
  isOpen,
  onOpenChange,
  transaction,
  onSave,
  availableCategories = [],
  availableCurrencies = ['USD', 'EUR', 'GBP'],
  language
}: EditTransactionDialogProps) {
  const { t } = useTranslation(language);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setDescription(transaction.description);
      setCategory(transaction.category || "");
      setDate(transaction.date);
      setType(transaction.type);
      setCurrency(transaction.currency);
    }
  }, [transaction]);

  const handleSave = () => {
    if (!transaction) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const updates: {
      amount?: number;
      description?: string;
      category?: string | null;
      date?: string;
      type?: 'expense' | 'income';
      currency?: string;
    } = {};

    if (parsedAmount !== transaction.amount) {
      updates.amount = parsedAmount;
    }
    if (description !== transaction.description) {
      updates.description = description;
    }
    if (category !== (transaction.category || "")) {
      updates.category = category || null;
    }
    if (date !== transaction.date) {
      updates.date = date;
    }
    if (type !== transaction.type) {
      updates.type = type;
    }
    if (currency !== transaction.currency) {
      updates.currency = currency;
    }

    onSave(transaction.id, updates);
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
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description">{t('description')}</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('enterDescription')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t('amount')}</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t('currency')}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map((curr) => (
                    <SelectItem key={curr} value={curr}>
                      {curr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">{t('type')}</Label>
            <Select value={type} onValueChange={(value: 'expense' | 'income') => setType(value)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">{t('expense')}</SelectItem>
                <SelectItem value="income">{t('income')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{t('category')}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder={t('selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('noCategory')}</SelectItem>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">{t('date')}</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave}>
            {t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
