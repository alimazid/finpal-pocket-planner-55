import { addMonths, startOfMonth, endOfMonth } from 'date-fns';

export interface BudgetPeriodTemplate {
  period_type: 'calendar_month' | 'specific_day';
  specific_day: number;
}

export interface BudgetPeriod {
  startDate: Date;
  endDate: Date;
  sequence: number;
}

export interface CalculatedBudget {
  id: string;
  budget_category_id: string;
  amount: number;
  spent: number;
  currency: string;
  period_sequence: number;
  category_start_date: string;
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
 * Calculate period dates for a specific sequence number
 */
export function calculatePeriodDates(
  template: BudgetPeriodTemplate,
  categoryStartDate: Date,
  sequenceNumber: number
): BudgetPeriod {
  const sequence = Math.max(0, sequenceNumber); // Ensure non-negative
  
  if (template.period_type === 'calendar_month') {
    // Calendar month periods
    const periodStart = startOfMonth(addMonths(categoryStartDate, sequence));
    const periodEnd = endOfMonth(periodStart);
    
    return {
      startDate: periodStart,
      endDate: periodEnd,
      sequence
    };
  } else {
    // Specific day periods
    const specificDay = Math.min(Math.max(1, template.specific_day), 31);
    
    // Calculate the start date for this sequence
    let periodStart = new Date(categoryStartDate);
    periodStart.setDate(specificDay);
    
    // Add the sequence number of months
    periodStart = addMonths(periodStart, sequence);
    
    // Calculate end date (day before next period starts)
    const periodEnd = new Date(addMonths(periodStart, 1));
    periodEnd.setDate(periodEnd.getDate() - 1);
    
    return {
      startDate: periodStart,
      endDate: periodEnd,
      sequence
    };
  }
}

/**
 * Get the current period sequence for a given date
 */
export function getCurrentPeriodSequence(
  template: BudgetPeriodTemplate,
  categoryStartDate: Date,
  currentDate: Date = new Date()
): number {
  if (template.period_type === 'calendar_month') {
    const startMonth = categoryStartDate.getFullYear() * 12 + categoryStartDate.getMonth();
    const currentMonth = currentDate.getFullYear() * 12 + currentDate.getMonth();
    return Math.max(0, currentMonth - startMonth);
  } else {
    // Specific day periods - calculate how many periods have passed
    const specificDay = Math.min(Math.max(1, template.specific_day), 31);
    
    let sequence = 0;
    let periodStart = new Date(categoryStartDate);
    periodStart.setDate(specificDay);
    
    // Count periods until we reach or pass the current date
    while (periodStart <= currentDate) {
      const nextPeriodStart = addMonths(periodStart, 1);
      if (nextPeriodStart > currentDate) {
        break;
      }
      sequence++;
      periodStart = nextPeriodStart;
    }
    
    return sequence;
  }
}

/**
 * Add calculated period dates to budget objects
 */
export function addCalculatedPeriods<T extends {
  period_sequence: number;
  category_start_date: string;
}>(
  budgets: T[],
  template: BudgetPeriodTemplate
): (T & { period_start: string; period_end: string })[] {
  return budgets.map(budget => {
    const categoryStartDate = new Date(budget.category_start_date);
    const period = calculatePeriodDates(template, categoryStartDate, budget.period_sequence);
    
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
 * Get the next sequence number for a new budget in a category
 */
export function getNextSequenceNumber(existingBudgets: { period_sequence: number }[]): number {
  if (existingBudgets.length === 0) {
    return 0;
  }
  return Math.max(...existingBudgets.map(b => b.period_sequence)) + 1;
}

/**
 * Calculate the category start date for the first budget in a category
 */
export function calculateCategoryStartDate(
  template: BudgetPeriodTemplate,
  budgetCreatedAt: Date
): Date {
  if (template.period_type === 'calendar_month') {
    // Start of the month when budget was created
    return startOfMonth(budgetCreatedAt);
  } else {
    // Calculate which specific day period the budget belongs to
    const specificDay = Math.min(Math.max(1, template.specific_day), 31);
    const year = budgetCreatedAt.getFullYear();
    const month = budgetCreatedAt.getMonth();
    
    let periodStart = new Date(year, month, specificDay);
    
    // If budget was created before the cutoff day, it belongs to previous period
    if (budgetCreatedAt.getDate() < specificDay) {
      periodStart = new Date(year, month - 1, specificDay);
    }
    
    return periodStart;
  }
}