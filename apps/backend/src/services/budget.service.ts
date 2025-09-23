import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { calculatePeriodDates, BudgetPeriodTemplate } from '../utils/periodCalculations.js';
import { 
  Budget, 
  BudgetCategory, 
  CreateBudgetDto, 
  UpdateBudgetDto, 
  BudgetQueryParams 
} from '../types/index.js';
import { NotFoundError, ValidationError } from '../middleware/error.middleware.js';
import { CurrencyService } from './currency.service.js';

export class BudgetService {
  private currencyService = new CurrencyService();

  async getBudgetsForPeriod(userId: string, params: BudgetQueryParams) {
    const budgets = await prisma.budget.findMany({
      where: { 
        userId, 
        targetYear: params.year, 
        targetMonth: params.month 
      },
      include: { 
        category: true 
      },
      orderBy: {
        category: {
          sortOrder: 'asc'
        }
      }
    });

    // Recalculate spent amounts for each budget
    const budgetsWithCalculatedSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await this.calculateSpent(
          userId, 
          budget.categoryId, 
          budget.targetYear, 
          budget.targetMonth
        );

        // Update the spent amount in database
        await prisma.budget.update({
          where: { id: budget.id },
          data: { spent }
        });

        return {
          ...budget,
          spent: Number(spent),
          amount: Number(budget.amount)
        };
      })
    );

    return budgetsWithCalculatedSpent;
  }

  async getBudgetById(userId: string, budgetId: string) {
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
      include: { category: true }
    });

    if (!budget) {
      throw new NotFoundError('Budget not found');
    }

    return {
      ...budget,
      amount: Number(budget.amount),
      spent: Number(budget.spent)
    };
  }

  async createBudget(userId: string, data: CreateBudgetDto) {
    // Verify category belongs to user
    const category = await prisma.budgetCategory.findFirst({
      where: { id: data.categoryId, userId }
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Check if budget already exists for this period and category
    const existingBudget = await prisma.budget.findUnique({
      where: {
        userId_categoryId_targetYear_targetMonth: {
          userId,
          categoryId: data.categoryId,
          targetYear: data.targetYear,
          targetMonth: data.targetMonth
        }
      }
    });

    if (existingBudget) {
      throw new ValidationError('Budget already exists for this category and period');
    }

    // Create budget
    const budget = await prisma.budget.create({
      data: {
        userId,
        categoryId: data.categoryId,
        amount: data.amount,
        currency: data.currency,
        targetYear: data.targetYear,
        targetMonth: data.targetMonth,
      },
      include: { category: true }
    });

    // Calculate initial spent amount
    const spent = await this.calculateSpent(
      userId, 
      budget.categoryId, 
      budget.targetYear, 
      budget.targetMonth
    );

    // Update with calculated spent amount
    const updatedBudget = await prisma.budget.update({
      where: { id: budget.id },
      data: { spent },
      include: { category: true }
    });

    return {
      ...updatedBudget,
      amount: Number(updatedBudget.amount),
      spent: Number(spent)
    };
  }

  async updateBudget(userId: string, budgetId: string, data: UpdateBudgetDto) {
    // Verify budget exists and belongs to user
    const existingBudget = await prisma.budget.findFirst({
      where: { id: budgetId, userId }
    });

    if (!existingBudget) {
      throw new NotFoundError('Budget not found');
    }

    const budget = await prisma.budget.update({
      where: { id: budgetId },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.targetYear !== undefined && { targetYear: data.targetYear }),
        ...(data.targetMonth !== undefined && { targetMonth: data.targetMonth }),
      },
      include: { category: true }
    });

    // Recalculate spent amount
    const spent = await this.calculateSpent(
      userId, 
      budget.categoryId, 
      budget.targetYear, 
      budget.targetMonth
    );

    const updatedBudget = await prisma.budget.update({
      where: { id: budgetId },
      data: { spent },
      include: { category: true }
    });

    return {
      ...updatedBudget,
      amount: Number(updatedBudget.amount),
      spent: Number(spent)
    };
  }

  async deleteBudget(userId: string, budgetId: string) {
    // Verify budget exists and belongs to user
    const existingBudget = await prisma.budget.findFirst({
      where: { id: budgetId, userId }
    });

    if (!existingBudget) {
      throw new NotFoundError('Budget not found');
    }

    await prisma.budget.delete({
      where: { id: budgetId }
    });

    return { success: true };
  }

  async createMissingBudgets(userId: string, targetYear: number, targetMonth: number) {
    // Import getPreviousPeriod
    const { getPreviousPeriod } = await import('../utils/periodCalculations');
    
    // Get previous period
    const previousPeriod = getPreviousPeriod(targetYear, targetMonth);
    
    // Get existing budgets for current period
    const existingBudgets = await prisma.budget.findMany({
      where: { userId, targetYear, targetMonth }
    });

    // Get budgets from previous period
    const previousPeriodBudgets = await prisma.budget.findMany({
      where: { 
        userId, 
        targetYear: previousPeriod.targetYear, 
        targetMonth: previousPeriod.targetMonth 
      },
      include: { category: true }
    });

    const existingCategoryIds = existingBudgets.map(b => b.categoryId);

    // Find budgets from previous period that don't exist in current period
    const missingBudgets = previousPeriodBudgets.filter(
      budget => !existingCategoryIds.includes(budget.categoryId)
    );

    if (missingBudgets.length === 0) {
      return [];
    }

    // Create budgets for missing categories, copying amounts from previous period
    const newBudgets = await Promise.all(
      missingBudgets.map(previousBudget =>
        prisma.budget.create({
          data: {
            userId,
            categoryId: previousBudget.categoryId,
            amount: previousBudget.amount, // Copy amount from previous period
            currency: previousBudget.currency,
            targetYear,
            targetMonth,
          },
          include: { category: true }
        })
      )
    );

    return newBudgets.map(budget => ({
      ...budget,
      amount: Number(budget.amount),
      spent: Number(budget.spent)
    }));
  }

  async calculateSpent(userId: string, categoryId: string, targetYear: number, targetMonth: number): Promise<number> {
    // Get user preferences for period calculation
    const preferences = await prisma.userPreference.findUnique({
      where: { userId }
    });

    const template: BudgetPeriodTemplate = {
      periodType: (preferences?.periodType as 'calendar_month' | 'specific_day') || 'calendar_month',
      specificDay: preferences?.specificDay || 1
    };

    // Calculate period dates
    const period = calculatePeriodDates(template, targetYear, targetMonth);

    // Get category name
    const category = await prisma.budgetCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return 0;
    }

    // Get the budget for this category and period to determine target currency
    const budget = await prisma.budget.findUnique({
      where: {
        userId_categoryId_targetYear_targetMonth: {
          userId,
          categoryId,
          targetYear,
          targetMonth
        }
      }
    });

    if (!budget) {
      return 0;
    }

    const budgetCurrency = budget.currency;

    // Get all transactions for this period and category (not aggregated)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        category: category.name,
        type: 'expense',
        date: {
          gte: period.startDate,
          lte: period.endDate
        }
      },
      select: {
        amount: true,
        currency: true
      }
    });

    // Convert all transaction amounts to budget currency and sum them
    let totalSpent = 0;

    for (const transaction of transactions) {
      const transactionAmount = Number(transaction.amount);
      const transactionCurrency = transaction.currency;

      if (transactionCurrency === budgetCurrency) {
        // Same currency, no conversion needed
        totalSpent += transactionAmount;
      } else {
        // Convert transaction currency to budget currency
        try {
          const convertedAmount = await this.currencyService.convertAmount(
            transactionAmount,
            transactionCurrency,
            budgetCurrency
          );
          totalSpent += convertedAmount;
        } catch (error) {
          // If conversion fails, log error but continue with other transactions
          console.error(`Failed to convert ${transactionAmount} ${transactionCurrency} to ${budgetCurrency}:`, error);
          // Optionally, you could add the transaction amount as-is or skip it
          // For now, we'll skip transactions that can't be converted
        }
      }
    }

    return totalSpent;
  }

  async recalculateAllSpentAmounts(userId: string) {
    // Get all budgets for the user
    const budgets = await prisma.budget.findMany({
      where: { userId }
    });

    // Recalculate spent amounts for each budget
    await Promise.all(
      budgets.map(async (budget) => {
        const spent = await this.calculateSpent(
          userId,
          budget.categoryId,
          budget.targetYear,
          budget.targetMonth
        );

        await prisma.budget.update({
          where: { id: budget.id },
          data: { spent }
        });
      })
    );

    return { success: true, recalculated: budgets.length };
  }

  async recalculateBudgetForCategory(userId: string, categoryName: string, targetYear: number, targetMonth: number) {
    // Find the category by name
    const category = await prisma.budgetCategory.findFirst({
      where: { userId, name: categoryName }
    });

    if (!category) {
      // Category doesn't exist, nothing to recalculate
      return null;
    }

    // Find the budget for this category and period
    const budget = await prisma.budget.findUnique({
      where: {
        userId_categoryId_targetYear_targetMonth: {
          userId,
          categoryId: category.id,
          targetYear,
          targetMonth
        }
      }
    });

    if (!budget) {
      // No budget exists for this category and period
      return null;
    }

    // Recalculate spent amount
    const spent = await this.calculateSpent(
      userId,
      category.id,
      targetYear,
      targetMonth
    );

    // Update the budget with the new spent amount
    const updatedBudget = await prisma.budget.update({
      where: { id: budget.id },
      data: { spent },
      include: { category: true }
    });

    return {
      ...updatedBudget,
      amount: Number(updatedBudget.amount),
      spent: Number(spent)
    };
  }
}