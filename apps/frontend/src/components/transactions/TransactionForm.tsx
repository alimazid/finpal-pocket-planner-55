import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { getCurrencyOptions, DEFAULT_CURRENCY } from "@/config/currencies";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string | null;
  date: string;
  type: 'expense' | 'income';
  currency: string;
}

interface TransactionFormProps {
  mode: 'create' | 'edit';
  initialData?: Transaction | null;
  onSubmit?: (data: {
    amount: number;
    description: string;
    category: string | null;
    date: string;
    currency: string;
  }) => void;
  onSave?: (id: string, data: {
    amount?: number;
    description?: string;
    category?: string | null;
    date?: string;
    type?: 'expense' | 'income';
    currency?: string;
  }) => void;
  availableCategories: string[];
  language: 'english' | 'spanish';
  defaultCurrency?: string;
  onCancel?: () => void;
}

export function TransactionForm({
  mode,
  initialData,
  onSubmit,
  onSave,
  availableCategories,
  language,
  defaultCurrency,
  onCancel
}: TransactionFormProps) {
  const { t } = useTranslation(language);
  const currencies = getCurrencyOptions();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency || DEFAULT_CURRENCY);
  const [date, setDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Initialize form with transaction data in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setAmount(initialData.amount.toString());
      setDescription(initialData.description);
      setCategory(initialData.category || "");
      setCurrency(initialData.currency);

      // Parse date string to Date object
      const [year, month, day] = initialData.date.split('-').map(Number);
      setDate(new Date(year, month - 1, day));
    }
  }, [mode, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    if (!description.trim()) {
      return;
    }

    const formattedDate = date.toISOString().split('T')[0];

    if (mode === 'create' && onSubmit) {
      onSubmit({
        amount: parsedAmount,
        description: description.trim(),
        category: category || null,
        date: formattedDate,
        currency
      });

      // Reset form after successful create
      setAmount("");
      setDescription("");
      setCategory("");
      setCurrency(defaultCurrency || DEFAULT_CURRENCY);
      setDate(new Date());
    } else if (mode === 'edit' && onSave && initialData) {
      // Only send changed fields
      const updates: {
        amount?: number;
        description?: string;
        category?: string | null;
        date?: string;
        currency?: string;
      } = {};

      if (parsedAmount !== initialData.amount) {
        updates.amount = parsedAmount;
      }
      if (description.trim() !== initialData.description) {
        updates.description = description.trim();
      }
      if (category !== (initialData.category || "")) {
        updates.category = category || null;
      }
      if (formattedDate !== initialData.date) {
        updates.date = formattedDate;
      }
      if (currency !== initialData.currency) {
        updates.currency = currency;
      }

      onSave(initialData.id, updates);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="description">{t('description')}</Label>
        <Input
          id="description"
          placeholder={mode === 'create' ? t('whatDidYouSpendOn') : t('enterDescription')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">{t('amount')}</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1"
            required
            min="0.01"
          />
        </div>

        <div>
          <Label htmlFor="currency">{t('currency')}</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="currency" className="mt-1">
              <SelectValue placeholder={t('selectCurrency')} />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              {currencies.map((curr) => (
                <SelectItem key={curr.value} value={curr.value} className="hover:bg-muted">
                  {curr.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="category">{t('category')} {mode === 'create' && '(Optional)'}</Label>
        <Select
          value={category || "uncategorized"}
          onValueChange={(value) => setCategory(value === "uncategorized" ? "" : value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder={availableCategories.length > 0 ? t('selectCategoryOptional') : t('noBudgetsAvailable')} />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            <SelectItem value="uncategorized" className="hover:bg-muted">
              {t('noCategory')}
            </SelectItem>
            {availableCategories.map((cat) => (
              <SelectItem key={cat} value={cat} className="hover:bg-muted">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="date">{t('date')}</Label>
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal mt-1",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: language === 'spanish' ? es : undefined }) : <span>{t('pickADate')}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selectedDate) => {
                if (selectedDate) {
                  setDate(selectedDate);
                  setIsDatePickerOpen(false);
                }
              }}
              disabled={(date) => date > new Date()}
              initialFocus
              language={language}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      {mode === 'create' ? (
        <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 transition-opacity">
          {t('addExpense')}
        </Button>
      ) : (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button type="submit">
            {t('save')}
          </Button>
        </div>
      )}
    </form>
  );
}
