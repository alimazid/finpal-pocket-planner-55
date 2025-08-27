import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GitMerge, Calendar } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";
import { formatCurrency } from "@/lib/utils";

interface BudgetCategory {
  id: string;
  userId: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  spent: number;
  currency: string;
  targetYear: number;
  targetMonth: number;
  createdAt: Date;
  updatedAt: Date;
  category?: BudgetCategory;
}

interface BudgetPeriod {
  startDate: Date;
  endDate: Date;
  isCurrentPeriod: boolean;
}

interface CreateMissingBudgetsCardProps {
  missingBudgets: Budget[];
  onCreateMissingBudgets: () => void;
  previousPeriod?: BudgetPeriod;
  language: 'english' | 'spanish';
  isCreating?: boolean;
}

export function CreateMissingBudgetsCard({ 
  missingBudgets, 
  onCreateMissingBudgets, 
  previousPeriod, 
  language,
  isCreating = false
}: CreateMissingBudgetsCardProps) {
  const { t } = useTranslation(language);
  const [isOpen, setIsOpen] = useState(false);

  const handleCreate = () => {
    onCreateMissingBudgets();
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const getPreviousPeriodDisplay = () => {
    if (!previousPeriod) return "";
    return `${format(previousPeriod.startDate, 'MMM dd')} - ${format(previousPeriod.endDate, 'MMM dd, yyyy')}`;
  };

  const totalAmount = missingBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  const primaryCurrency = missingBudgets.length > 0 ? missingBudgets[0].currency : 'DOP';
  const missingCount = missingBudgets.length;

  if (missingCount === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-200 cursor-pointer border-2 border-dashed border-muted-foreground/30 hover:border-primary/50">
          <CardContent className="flex items-center justify-center p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <GitMerge className="h-5 w-5 text-primary" />
              </div>
              <div className="text-center">
                <span className="text-lg font-medium text-muted-foreground block">
                  {t('createMissingFromLastPeriod')}
                </span>
                <span className="text-sm text-muted-foreground">
                  {missingCount} {missingCount === 1 ? t('missingBudgetCategory') : t('missingBudgetCategories')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('createMissingBudgets')}</DialogTitle>
          <DialogDescription>
            {t('confirmCreateMissing')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Previous period info */}
          {previousPeriod && (
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t('fromPreviousPeriod')}: <strong>{getPreviousPeriodDisplay()}</strong>
              </span>
            </div>
          )}

          {/* Missing budgets list */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {missingBudgets.map((budget) => (
              <div key={budget.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <span className="font-medium text-foreground">
                  {budget.category?.name}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {formatCurrency(budget.amount, budget.currency)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-md border">
            <span className="font-semibold text-foreground">
              {t('total')}:
            </span>
            <span className="font-semibold text-foreground">
              {formatCurrency(totalAmount, primaryCurrency)}
            </span>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            {t('cancel')}
          </Button>
          <Button 
            type="button" 
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? t('loading') : t('createMissingBudgets')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}