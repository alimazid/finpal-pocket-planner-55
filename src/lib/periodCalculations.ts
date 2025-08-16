import { addMonths, startOfMonth, endOfMonth } from 'date-fns';

export interface BudgetPeriodTemplate {
  period_type: 'calendar_month' | 'specific_day';
  specific_day: number;
}

export interface BudgetPeriod {
  startDate: Date;
  endDate: Date;
  targetYear: number;
  targetMonth: number;
}

export interface CalculatedBudget {
  id: string;
  budget_category_id: string;
  amount: number;
  spent: number;
  currency: string;
  target_year: number;
  target_month: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  // Calculated fields
  period_start: string;
  period_end: string;
  budget_categories?: {
    id: string;
    name: string;
    sort_order: number;
  };
}

/**
 * Calculate period dates for a specific target month/year
 */
export function calculatePeriodDates(
  template: BudgetPeriodTemplate,
  targetYear: number,
  targetMonth: number
): BudgetPeriod {
  if (template.period_type === 'calendar_month') {
    // Calendar month periods: from 1st to last day of target month
    const periodStart = new Date(targetYear, targetMonth - 1, 1);
    const periodEnd = endOfMonth(periodStart);
    
    return {
      startDate: periodStart,
      endDate: periodEnd,
      targetYear,
      targetMonth
    };
  } else {
    // Specific day periods: target month is the END month
    // So we need to work backwards to find the start date
    const specificDay = Math.min(Math.max(1, template.specific_day), 31);
    
    // Target month is where period ENDS, so period ends on (specificDay - 1) of target month
    const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
    const adjustedEndDay = Math.min(specificDay - 1, daysInTargetMonth);
    const periodEnd = new Date(targetYear, targetMonth - 1, adjustedEndDay);
    
    // Period starts one month before, on the specific day
    const startMonth = addMonths(periodEnd, -1);
    const startYear = startMonth.getFullYear();
    const startMonthNum = startMonth.getMonth();
    const daysInStartMonth = new Date(startYear, startMonthNum + 1, 0).getDate();
    const adjustedStartDay = Math.min(specificDay, daysInStartMonth);
    const periodStart = new Date(startYear, startMonthNum, adjustedStartDay);
    
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
  if (template.period_type === 'calendar_month') {
    return {
      targetYear: currentDate.getFullYear(),
      targetMonth: currentDate.getMonth() + 1
    };
  } else {
    // Specific day periods - target month is where period ENDS
    const specificDay = Math.min(Math.max(1, template.specific_day), 31);
    const currentDay = currentDate.getDate();
    
    if (currentDay < specificDay) {
      // We're in a period that ends in the current month
      return {
        targetYear: currentDate.getFullYear(),
        targetMonth: currentDate.getMonth() + 1
      };
    } else {
      // We're in a period that ends in the next month
      const nextMonth = addMonths(currentDate, 1);
      return {
        targetYear: nextMonth.getFullYear(),
        targetMonth: nextMonth.getMonth() + 1
      };
    }
  }
}

/**
 * Add calculated period dates to budget objects
 */
export function addCalculatedPeriods<T extends {
  target_year: number;
  target_month: number;
}>(
  budgets: T[],
  template: BudgetPeriodTemplate
): (T & { period_start: string; period_end: string })[] {
  return budgets.map(budget => {
    const period = calculatePeriodDates(template, budget.target_year, budget.target_month);
    
    return {
      ...budget,
      period_start: period.startDate.toISOString().split('T')[0],
      period_end: period.endDate.toISOString().split('T')[0]
    };
  });
}

/**
 * Filter transactions by calculated period dates
 */
export function filterTransactionsByPeriod<T extends { date: string }>(
  transactions: T[],
  periodStart: string,
  periodEnd: string
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