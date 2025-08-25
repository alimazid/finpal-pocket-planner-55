import { CalculatedBudget } from './periodCalculations';

export interface ExportedBudget {
  id: string;
  category: string;
  categoryId: string;
  amount: number;
  spent: number;
  remaining: number;
  currency: string;
  targetMonth: number;
  targetYear: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExportedTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string | null;
  type: 'expense' | 'income';
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExportedCategory {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PeriodSummary {
  income: number;
  expenses: number;
  netSavings: number;
  transactionCount: number;
}

export interface BudgetPeriod {
  period: string;
  year: number;
  month: number;
  isCurrentPeriod: boolean;
  budgets: ExportedBudget[];
  totals: {
    budgeted: number;
    spent: number;
    remaining: number;
  };
}

export interface TransactionPeriod {
  period: string;
  year: number;
  month: number;
  isCurrentPeriod: boolean;
  summary: PeriodSummary;
  transactions: ExportedTransaction[];
}

export interface FinancialDataExport {
  metadata: {
    exportDate: string;
    userId: string;
    userEmail: string | undefined;
    version: string;
  };
  currentPeriod: {
    year: number;
    month: number;
    type: 'calendar_month' | 'specific_day';
    specificDay: number | null;
    startDate: string | null;
    endDate: string | null;
  };
  preferences: {
    language: string;
    periodType: 'calendar_month' | 'specific_day';
    specificDay: number | null;
  };
  summary: {
    totalBudgetEntries: number;
    totalTransactions: number;
    totalCategories: number;
    dateRange: {
      earliest: string | null;
      latest: string | null;
    };
    lifetimeStats: {
      totalIncome: number;
      totalExpenses: number;
      netSavings: number;
    };
  };
  categories: ExportedCategory[];
  budgetsByPeriod: BudgetPeriod[];
  allTransactions: ExportedTransaction[];
  transactionsByPeriod: TransactionPeriod[];
}

interface ExportDataParams {
  user: {
    id: string;
    email?: string;
  } | null;
  allBudgets: Array<{
    id: string;
    user_id: string;
    budget_category_id: string;
    amount: number;
    spent: number;
    currency: string;
    target_month: number;
    target_year: number;
    created_at: string;
    updated_at: string;
    budget_categories?: {
      id: string;
      name: string;
      sort_order: number;
    };
  }>;
  transactions: Array<{
    id: string;
    user_id: string;
    amount: number;
    description: string;
    category: string | null;
    date: string;
    type: string;
    currency: string;
    created_at: string;
    updated_at: string;
  }>;
  currentTargetYear: number;
  currentTargetMonth: number;
  periodTemplate: {
    period_type: 'calendar_month' | 'specific_day';
    specific_day: number | null;
  } | null;
  currentPeriodDisplay: {
    startDate: Date;
    endDate: Date;
  } | null;
  selectedLanguage: string;
}

export function exportAllFinancialData(params: ExportDataParams): FinancialDataExport {
  const {
    user,
    allBudgets,
    transactions,
    currentTargetYear,
    currentTargetMonth,
    periodTemplate,
    currentPeriodDisplay,
    selectedLanguage
  } = params;

  // Extract unique categories from budgets
  const categoriesMap = new Map<string, ExportedCategory>();
  allBudgets.forEach(budget => {
    if (budget.budget_categories && !categoriesMap.has(budget.budget_categories.id)) {
      categoriesMap.set(budget.budget_categories.id, {
        id: budget.budget_categories.id,
        name: budget.budget_categories.name,
        sortOrder: budget.budget_categories.sort_order,
        createdAt: budget.created_at,
        updatedAt: budget.updated_at
      });
    }
  });
  const categories = Array.from(categoriesMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);

  // Group budgets by period
  const budgetsByPeriodMap = new Map<string, any[]>();
  allBudgets.forEach(budget => {
    const periodKey = `${budget.target_year}-${String(budget.target_month).padStart(2, '0')}`;
    if (!budgetsByPeriodMap.has(periodKey)) {
      budgetsByPeriodMap.set(periodKey, []);
    }
    budgetsByPeriodMap.get(periodKey)!.push(budget);
  });

  // Convert to sorted array of budget periods
  const budgetsByPeriod: BudgetPeriod[] = Array.from(budgetsByPeriodMap.entries())
    .map(([period, budgets]) => {
      const [year, month] = period.split('-').map(Number);
      const periodBudgets: ExportedBudget[] = budgets.map(b => ({
        id: b.id,
        category: b.budget_categories?.name || 'Unknown',
        categoryId: b.budget_category_id,
        amount: b.amount,
        spent: b.spent,
        remaining: b.amount - b.spent,
        currency: b.currency,
        targetMonth: b.target_month,
        targetYear: b.target_year,
        createdAt: b.created_at,
        updatedAt: b.updated_at
      }));

      const totals = periodBudgets.reduce((acc, b) => ({
        budgeted: acc.budgeted + b.amount,
        spent: acc.spent + b.spent,
        remaining: acc.remaining + b.remaining
      }), { budgeted: 0, spent: 0, remaining: 0 });

      return {
        period,
        year,
        month,
        isCurrentPeriod: year === currentTargetYear && month === currentTargetMonth,
        budgets: periodBudgets,
        totals
      };
    })
    .sort((a, b) => b.period.localeCompare(a.period)); // Sort by period descending (newest first)

  // Format all transactions
  const allTransactions: ExportedTransaction[] = transactions.map(t => ({
    id: t.id,
    date: t.date,
    amount: t.amount,
    description: t.description,
    category: t.category,
    type: t.type as 'expense' | 'income',
    currency: t.currency,
    createdAt: t.created_at,
    updatedAt: t.updated_at
  }));

  // Group transactions by period
  const transactionsByPeriodMap = new Map<string, any[]>();
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!transactionsByPeriodMap.has(periodKey)) {
      transactionsByPeriodMap.set(periodKey, []);
    }
    transactionsByPeriodMap.get(periodKey)!.push(transaction);
  });

  // Convert to sorted array of transaction periods
  const transactionsByPeriod: TransactionPeriod[] = Array.from(transactionsByPeriodMap.entries())
    .map(([period, periodTransactions]) => {
      const [year, month] = period.split('-').map(Number);
      
      const income = periodTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = periodTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const formattedTransactions: ExportedTransaction[] = periodTransactions.map(t => ({
        id: t.id,
        date: t.date,
        amount: t.amount,
        description: t.description,
        category: t.category,
        type: t.type as 'expense' | 'income',
        currency: t.currency,
        createdAt: t.created_at,
        updatedAt: t.updated_at
      }));

      return {
        period,
        year,
        month,
        isCurrentPeriod: year === currentTargetYear && month === currentTargetMonth,
        summary: {
          income: Math.round(income * 100) / 100,
          expenses: Math.round(expenses * 100) / 100,
          netSavings: Math.round((income - expenses) * 100) / 100,
          transactionCount: periodTransactions.length
        },
        transactions: formattedTransactions
      };
    })
    .sort((a, b) => b.period.localeCompare(a.period)); // Sort by period descending

  // Calculate lifetime stats
  const lifetimeIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const lifetimeExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Get date range
  const transactionDates = transactions.map(t => new Date(t.date));
  const earliestDate = transactionDates.length > 0 
    ? new Date(Math.min(...transactionDates.map(d => d.getTime())))
    : null;
  const latestDate = transactionDates.length > 0 
    ? new Date(Math.max(...transactionDates.map(d => d.getTime())))
    : null;

  // Build the export object
  const exportData: FinancialDataExport = {
    metadata: {
      exportDate: new Date().toISOString(),
      userId: user?.id || 'unknown',
      userEmail: user?.email,
      version: '1.0'
    },
    currentPeriod: {
      year: currentTargetYear,
      month: currentTargetMonth,
      type: periodTemplate?.period_type || 'calendar_month',
      specificDay: periodTemplate?.specific_day || null,
      startDate: currentPeriodDisplay?.startDate ? 
        currentPeriodDisplay.startDate.toISOString().split('T')[0] : null,
      endDate: currentPeriodDisplay?.endDate ? 
        currentPeriodDisplay.endDate.toISOString().split('T')[0] : null
    },
    preferences: {
      language: selectedLanguage,
      periodType: periodTemplate?.period_type || 'calendar_month',
      specificDay: periodTemplate?.specific_day || null
    },
    summary: {
      totalBudgetEntries: allBudgets.length,
      totalTransactions: transactions.length,
      totalCategories: categories.length,
      dateRange: {
        earliest: earliestDate ? earliestDate.toISOString().split('T')[0] : null,
        latest: latestDate ? latestDate.toISOString().split('T')[0] : null
      },
      lifetimeStats: {
        totalIncome: Math.round(lifetimeIncome * 100) / 100,
        totalExpenses: Math.round(lifetimeExpenses * 100) / 100,
        netSavings: Math.round((lifetimeIncome - lifetimeExpenses) * 100) / 100
      }
    },
    categories,
    budgetsByPeriod,
    allTransactions,
    transactionsByPeriod
  };

  return exportData;
}

export function downloadJSON(data: FinancialDataExport, filename?: string) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `finpal-export-${new Date().toISOString().split('T')[0]}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}