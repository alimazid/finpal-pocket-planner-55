import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Calendar } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";

interface BudgetPeriod {
  startDate: Date;
  endDate: Date;
  isCurrentPeriod: boolean;
}

interface AddBudgetCardProps {
  onAddBudget: (category: string, amount: number) => void;
  currentPeriod?: BudgetPeriod;
  language: 'english' | 'spanish';
}

export function AddBudgetCard({ onAddBudget, currentPeriod, language }: AddBudgetCardProps) {
  const { t } = useTranslation(language);
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (category.trim() && amount && parseFloat(amount) > 0) {
      onAddBudget(category.trim(), parseFloat(amount));
      setCategory("");
      setAmount("");
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setCategory("");
    setAmount("");
    setIsOpen(false);
  };

  const getCurrentPeriodDisplay = () => {
    if (!currentPeriod) return "";
    return `${format(currentPeriod.startDate, 'MMM dd')} - ${format(currentPeriod.endDate, 'MMM dd, yyyy')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-200 cursor-pointer border-2 border-dashed border-muted-foreground/30 hover:border-primary/50">
          <CardContent className="flex items-center justify-center p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-medium text-muted-foreground">{t('addBudget')}</span>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('addNewBudget')}</DialogTitle>
          <DialogDescription>
            {t('createBudgetCategory')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">{t('budgetName')}</Label>
            <Input
              id="category"
              placeholder={t('budgetNamePlaceholder')}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">{t('budgetAmount')}</Label>
            <Input
              id="amount"
              type="number"
              placeholder={t('budgetAmountPlaceholder')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
              required
            />
          </div>

          {/* Show selected period */}
          {currentPeriod && (
            <div className="space-y-2">
              <Label>{t('budgetPeriod')}</Label>
              <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {t('thisBudgetWillBeCreatedFor')} <strong>{getCurrentPeriodDisplay()}</strong>
                </span>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              {t('cancel')}
            </Button>
            <Button type="submit">{t('addBudget')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}