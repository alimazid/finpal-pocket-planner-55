import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addMonths, subMonths, isSameMonth } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "@/hooks/useTranslation";

interface BudgetPeriodNavigationProps {
  currentPeriod: Date;
  onPeriodChange: (newPeriod: Date) => void;
  language: 'english' | 'spanish';
  cutoffDay?: number; // Day of month when period resets (1-31)
}

export function BudgetPeriodNavigation({ 
  currentPeriod, 
  onPeriodChange, 
  language,
  cutoffDay = 1 
}: BudgetPeriodNavigationProps) {
  const { t } = useTranslation(language);
  const today = new Date();
  
  // Calculate period start and end based on cutoff day
  const getPeriodDates = (period: Date) => {
    const year = period.getFullYear();
    const month = period.getMonth();
    
    // Start date is cutoff day of current month
    const startDate = new Date(year, month, cutoffDay);
    
    // End date is day before cutoff day of next month
    const endDate = new Date(year, month + 1, cutoffDay - 1);
    
    return { startDate, endDate };
  };
  
  const { startDate, endDate } = getPeriodDates(currentPeriod);
  
  const goToPreviousPeriod = () => {
    const previousPeriod = subMonths(currentPeriod, 1);
    onPeriodChange(previousPeriod);
  };
  
  const goToNextPeriod = () => {
    const nextPeriod = addMonths(currentPeriod, 1);
    onPeriodChange(nextPeriod);
  };
  
  const goToCurrentPeriod = () => {
    onPeriodChange(today);
  };
  
  const isCurrentPeriod = isSameMonth(currentPeriod, today);
  const formatPeriodDate = (date: Date) => {
    return format(date, language === 'spanish' ? "d 'de' MMM" : "MMM d", {
      locale: language === 'spanish' ? es : enUS
    });
  };
  
  return (
    <Card className="bg-gradient-card shadow-soft mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">
                {t('budgetPeriod')}: {format(currentPeriod, 'MMMM yyyy', {
                  locale: language === 'spanish' ? es : enUS
                })}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formatPeriodDate(startDate)} - {formatPeriodDate(endDate)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPeriod}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {!isCurrentPeriod && (
              <Button
                variant="default"
                size="sm"
                onClick={goToCurrentPeriod}
                className="h-8 px-3 text-xs"
              >
                {t('current')}
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPeriod}
              disabled={isCurrentPeriod}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}