import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";


interface ExpenseFormProps {
  onAddExpense: (expense: {
    amount: number;
    description: string;
    category: string | null;
    date: string;
    currency: string;
  }) => void;
  availableCategories: string[];
  showCard?: boolean;
  language: 'english' | 'spanish';
  defaultCurrency?: string;
}

export function ExpenseForm({ onAddExpense, availableCategories, showCard = true, language, defaultCurrency }: ExpenseFormProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency || "DOP");
  const [date, setDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const { t } = useTranslation(language);

  const currencies = [
    { value: "USD", label: "USD - US Dollar" },
    { value: "DOP", label: "DOP - Dominican Peso" },
    { value: "RD", label: "RD - Peso Dominicano" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount && description) {
      onAddExpense({
        amount: parseFloat(amount),
        description,
        category: category || null,
        date: date.toISOString().split('T')[0],
        currency
      });
      setAmount("");
      setDescription("");
      setCategory("");
      setCurrency(defaultCurrency || "DOP");
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        />
      </div>
      <div>
        <Label htmlFor="description">{t('description')}</Label>
        <Input
          id="description"
          placeholder={t('whatDidYouSpendOn')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor="category">{t('category')} (Optional)</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder={availableCategories.length > 0 ? t('selectCategoryOptional') : t('noBudgetsAvailable')} />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            {availableCategories.map((cat) => (
              <SelectItem key={cat} value={cat} className="hover:bg-muted">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="currency">{t('currency')}</Label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="mt-1">
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
      <div>
        <Label htmlFor="date">{t('date')}</Label>
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal mt-1",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>{t('pickADate')}</span>}
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
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
      <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 transition-opacity">
        {t('addExpense')}
      </Button>
    </form>
  );

  if (!showCard) {
    return formContent;
  }

  return (
    <Card className="bg-gradient-card shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          {t('addExpense')}
        </CardTitle>
        <CardDescription>
          {t('trackSpending')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
}