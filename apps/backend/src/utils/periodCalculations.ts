export interface BudgetPeriodTemplate {
  periodType: 'calendar_month' | 'specific_day';
  specificDay?: number;
}

export interface BudgetPeriod {
  startDate: Date;
  endDate: Date;
  targetYear: number;
  targetMonth: number;
}

/**
 * Calculate period dates for a specific target month/year
 */
export function calculatePeriodDates(
  template: BudgetPeriodTemplate,
  targetYear: number,
  targetMonth: number
): BudgetPeriod {
  if (template.periodType === 'calendar_month') {
    // Calendar month periods: from 1st to last day of target month
    const periodStart = new Date(targetYear, targetMonth - 1, 1);
    const periodEnd = new Date(targetYear, targetMonth, 0); // Last day of target month
    
    return {
      startDate: periodStart,
      endDate: periodEnd,
      targetYear,
      targetMonth
    };
  } else {
    // Specific day periods: target month is the END month
    // So we need to work backwards to find the start date
    const specificDay = Math.min(Math.max(1, template.specificDay || 1), 31);
    
    // Target month is where period ENDS, so period ends on (specificDay - 1) of target month
    const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
    const adjustedEndDay = Math.min(specificDay - 1, daysInTargetMonth);
    const periodEnd = new Date(targetYear, targetMonth - 1, adjustedEndDay);
    
    // Period starts one month before, on the specific day
    const startDate = new Date(periodEnd);
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setDate(specificDay);
    
    // Adjust if the specific day doesn't exist in the start month
    const startMonth = new Date(targetYear, targetMonth - 2, 1); // Month before target
    const daysInStartMonth = new Date(startMonth.getFullYear(), startMonth.getMonth() + 1, 0).getDate();
    const adjustedStartDay = Math.min(specificDay, daysInStartMonth);
    
    const periodStart = new Date(startMonth.getFullYear(), startMonth.getMonth(), adjustedStartDay);
    
    return {
      startDate: periodStart,
      endDate: periodEnd,
      targetYear,
      targetMonth
    };
  }
}

/**
 * Get the current target month/year for a given date
 */
export function getCurrentTargetMonth(
  template: BudgetPeriodTemplate,
  currentDate: Date = new Date()
): { targetYear: number; targetMonth: number } {
  if (template.periodType === 'calendar_month') {
    return {
      targetYear: currentDate.getFullYear(),
      targetMonth: currentDate.getMonth() + 1
    };
  } else {
    // Specific day periods - target month is where period ENDS
    const specificDay = Math.min(Math.max(1, template.specificDay || 1), 31);
    const currentDay = currentDate.getDate();
    
    if (currentDay >= specificDay) {
      // We're in a period that ends in the next month (period starts today or already started)
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return {
        targetYear: nextMonth.getFullYear(),
        targetMonth: nextMonth.getMonth() + 1
      };
    } else {
      // We're in a period that ends in the current month (period hasn't started yet)
      return {
        targetYear: currentDate.getFullYear(),
        targetMonth: currentDate.getMonth() + 1
      };
    }
  }
}

/**
 * Filter transactions by calculated period dates
 */
export function filterTransactionsByPeriod<T extends { date: Date }>(
  transactions: T[],
  periodStart: Date,
  periodEnd: Date
): T[] {
  return transactions.filter(transaction => 
    transaction.date >= periodStart && transaction.date <= periodEnd
  );
}

/**
 * Navigate to next period from current target month/year
 */
export function getNextPeriod(targetYear: number, targetMonth: number): { targetYear: number; targetMonth: number } {
  if (targetMonth === 12) {
    return { targetYear: targetYear + 1, targetMonth: 1 };
  }
  return { targetYear, targetMonth: targetMonth + 1 };
}

/**
 * Navigate to previous period from current target month/year
 */
export function getPreviousPeriod(targetYear: number, targetMonth: number): { targetYear: number; targetMonth: number } {
  if (targetMonth === 1) {
    return { targetYear: targetYear - 1, targetMonth: 12 };
  }
  return { targetYear, targetMonth: targetMonth - 1 };
}

/**
 * Check if a date falls within a specific period
 */
export function isDateInPeriod(
  date: Date,
  template: BudgetPeriodTemplate,
  targetYear: number,
  targetMonth: number
): boolean {
  const period = calculatePeriodDates(template, targetYear, targetMonth);
  return date >= period.startDate && date <= period.endDate;
}