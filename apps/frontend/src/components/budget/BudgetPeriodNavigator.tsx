import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Home } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { addMonths, subMonths, startOfMonth, endOfMonth, isSameMonth } from "date-fns";

interface BudgetPeriod {
  startDate: Date;
  endDate: Date;
  isCurrentPeriod: boolean;
}

interface BudgetPeriodNavigatorProps {
  currentPeriod: BudgetPeriod;
  onPeriodChange: (period: BudgetPeriod) => void;
  language: 'english' | 'spanish';
  periodType?: 'calendar_month' | 'specific_day';
  cutoffDay?: number; // Day of month when budget resets (1-31)
}

export function BudgetPeriodNavigator({ 
  currentPeriod, 
  onPeriodChange, 
  language,
  periodType = 'calendar_month',
  cutoffDay = 1 
}: BudgetPeriodNavigatorProps) {
  const { t, getMonthAbbreviation } = useTranslation(language);

  const calculatePeriodDates = (baseDate: Date) => {
    if (periodType === 'calendar_month') {
      // Calendar month: first day to last day of the month
      const startDate = startOfMonth(baseDate);
      const endDate = endOfMonth(baseDate);
      return { startDate, endDate };
    } else {
      // Specific day: cutoff day to day before next cutoff
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();
      
      // Start date is the cutoff day of the current month
      let startDate = new Date(year, month, cutoffDay);
      
      // If we're before the cutoff day, the period started last month
      if (baseDate.getDate() < cutoffDay) {
        startDate = new Date(year, month - 1, cutoffDay);
      }
      
      // End date is the day before the next cutoff
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(endDate.getDate() - 1);
      
      return { startDate, endDate };
    }
  };

  const getCurrentPeriod = (): BudgetPeriod => {
    const now = new Date();
    const { startDate, endDate } = calculatePeriodDates(now);
    
    return {
      startDate,
      endDate,
      isCurrentPeriod: true
    };
  };

  const getPreviousPeriod = (period: BudgetPeriod): BudgetPeriod => {
    const previousMonth = subMonths(period.startDate, 1);
    const { startDate, endDate } = calculatePeriodDates(previousMonth);
    
    return {
      startDate,
      endDate,
      isCurrentPeriod: false
    };
  };

  const getNextPeriod = (period: BudgetPeriod): BudgetPeriod => {
    const nextMonth = addMonths(period.startDate, 1);
    const { startDate, endDate } = calculatePeriodDates(nextMonth);
    const now = new Date();
    
    return {
      startDate,
      endDate,
      isCurrentPeriod: now >= startDate && now <= endDate
    };
  };

  const handlePreviousPeriod = () => {
    const previousPeriod = getPreviousPeriod(currentPeriod);
    onPeriodChange(previousPeriod);
  };

  const handleNextPeriod = () => {
    const nextPeriod = getNextPeriod(currentPeriod);
    onPeriodChange(nextPeriod);
  };

  const handleGoToCurrent = () => {
    const currentPeriod = getCurrentPeriod();
    onPeriodChange(currentPeriod);
  };

  // Check if we can go to next period (not beyond current period)
  const canGoNext = () => {
    const nextPeriod = getNextPeriod(currentPeriod);
    const now = new Date();
    return nextPeriod.startDate <= now;
  };

  const formatPeriodDisplay = (period: BudgetPeriod) => {
    const startMonth = getMonthAbbreviation(period.startDate.getMonth());
    const endMonth = getMonthAbbreviation(period.endDate.getMonth());
    const year = period.startDate.getFullYear();

    if (isSameMonth(period.startDate, period.endDate)) {
      return `${startMonth} ${year}`;
    } else {
      return `${startMonth} - ${endMonth} ${year}`;
    }
  };

  const getDaysInPeriod = (period: BudgetPeriod) => {
    const diffTime = Math.abs(period.endDate.getTime() - period.startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getDaysRemaining = (period: BudgetPeriod) => {
    if (!period.isCurrentPeriod) return null;
    
    const now = new Date();
    const diffTime = period.endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysRemaining = getDaysRemaining(currentPeriod);

  return (
    <Card className="bg-gradient-card shadow-soft mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Previous Period Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPeriod}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t('previous')}</span>
          </Button>

          {/* Current Period Display */}
          <div className="flex-1 text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">
                {formatPeriodDisplay(currentPeriod)}
              </span>
              {currentPeriod.isCurrentPeriod && (
                <Badge variant="default" className="text-xs">
                  {t('current')}
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <div>
                {format(currentPeriod.startDate, 'MMM d')} - {format(currentPeriod.endDate, 'MMM d, yyyy')}
              </div>
              {currentPeriod.isCurrentPeriod && daysRemaining !== null && (
                <div className="text-xs">
                  {daysRemaining > 0 ? (
                    <span className="text-primary">
                      {daysRemaining} {daysRemaining === 1 ? t('dayRemaining') : t('daysRemaining')}
                    </span>
                  ) : (
                    <span className="text-warning">
                      {t('periodEndsToday')}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Next Period / Current Period Buttons */}
          <div className="flex items-center gap-2">
            {!currentPeriod.isCurrentPeriod && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoToCurrent}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">{t('current')}</span>
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPeriod}
              disabled={!canGoNext()}
              className="flex items-center gap-2"
            >
              <span className="hidden sm:inline">{t('next')}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}