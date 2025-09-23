import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryParams
} from '../types/index.js';
import { NotFoundError, ValidationError } from '../middleware/error.middleware.js';
import { BudgetService } from './budget.service.js';

export class TransactionService {
  private budgetService = new BudgetService();

  async getTransactions(userId: string, params: TransactionQueryParams) {
    const where: any = {
      userId,
      ...(params.type && { type: params.type }),
      ...(params.category && { category: params.category }),
      ...(params.startDate && params.endDate && {
        date: {
          gte: params.startDate,
          lte: params.endDate
        }
      })
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit
      }),
      prisma.transaction.count({ where })
    ]);

    return {
      transactions: transactions.map(t => ({
        ...t,
        amount: Number(t.amount)
      })),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        pages: Math.ceil(total / params.limit)
      }
    };
  }

  async getTransactionById(userId: string, transactionId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId }
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    return {
      ...transaction,
      amount: Number(transaction.amount)
    };
  }

  async createTransaction(userId: string, data: CreateTransactionDto) {
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount: data.amount,
        description: data.description,
        category: data.category,
        date: data.date,
        type: data.type,
        currency: data.currency
      }
    });

    // If transaction has a category and is an expense, recalculate budget spent amount
    if (data.category && data.type === 'expense') {
      try {
        const transactionDate = new Date(data.date);
        const targetYear = transactionDate.getFullYear();
        const targetMonth = transactionDate.getMonth() + 1;

        await this.budgetService.recalculateBudgetForCategory(
          userId,
          data.category,
          targetYear,
          targetMonth
        );
      } catch (error) {
        console.error('Failed to recalculate budget after creating transaction:', error);
        // Don't fail the transaction creation if budget recalculation fails
      }
    }

    return {
      ...transaction,
      amount: Number(transaction.amount)
    };
  }

  async updateTransaction(userId: string, transactionId: string, data: UpdateTransactionDto) {
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId }
    });

    if (!existingTransaction) {
      throw new NotFoundError('Transaction not found');
    }

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.date !== undefined && { date: data.date }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.currency !== undefined && { currency: data.currency }),
      }
    });

    // Recalculate budget spent amounts if category, amount, date, or type changed
    const shouldRecalculate = existingTransaction.type === 'expense' && (
      data.category !== undefined ||
      data.amount !== undefined ||
      data.date !== undefined ||
      data.type !== undefined
    );

    if (shouldRecalculate) {
      try {
        // Use the updated transaction date or existing date
        const transactionDate = new Date(data.date || existingTransaction.date);
        const targetYear = transactionDate.getFullYear();
        const targetMonth = transactionDate.getMonth() + 1;

        // If category changed, recalculate both old and new categories
        if (data.category !== undefined) {
          // Recalculate old category budget if it existed
          if (existingTransaction.category) {
            await this.budgetService.recalculateBudgetForCategory(
              userId,
              existingTransaction.category,
              targetYear,
              targetMonth
            );
          }

          // Recalculate new category budget if it exists
          if (data.category) {
            await this.budgetService.recalculateBudgetForCategory(
              userId,
              data.category,
              targetYear,
              targetMonth
            );
          }
        } else if (existingTransaction.category) {
          // If other fields changed but category stayed the same, recalculate current category
          await this.budgetService.recalculateBudgetForCategory(
            userId,
            existingTransaction.category,
            targetYear,
            targetMonth
          );
        }

        // If date changed, also recalculate for the old date period
        if (data.date && existingTransaction.category) {
          const oldDate = new Date(existingTransaction.date);
          const oldTargetYear = oldDate.getFullYear();
          const oldTargetMonth = oldDate.getMonth() + 1;

          if (oldTargetYear !== targetYear || oldTargetMonth !== targetMonth) {
            await this.budgetService.recalculateBudgetForCategory(
              userId,
              existingTransaction.category,
              oldTargetYear,
              oldTargetMonth
            );
          }
        }
      } catch (error) {
        console.error('Failed to recalculate budget after updating transaction:', error);
        // Don't fail the transaction update if budget recalculation fails
      }
    }

    return {
      ...transaction,
      amount: Number(transaction.amount)
    };
  }

  async deleteTransaction(userId: string, transactionId: string) {
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId }
    });

    if (!existingTransaction) {
      throw new NotFoundError('Transaction not found');
    }

    await prisma.transaction.delete({
      where: { id: transactionId }
    });

    // If the deleted transaction had a category and was an expense, recalculate budget
    if (existingTransaction.category && existingTransaction.type === 'expense') {
      try {
        const transactionDate = new Date(existingTransaction.date);
        const targetYear = transactionDate.getFullYear();
        const targetMonth = transactionDate.getMonth() + 1;

        await this.budgetService.recalculateBudgetForCategory(
          userId,
          existingTransaction.category,
          targetYear,
          targetMonth
        );
      } catch (error) {
        console.error('Failed to recalculate budget after deleting transaction:', error);
        // Don't fail the transaction deletion if budget recalculation fails
      }
    }

    return { success: true };
  }

  async getTransactionSummary(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      userId,
      ...(startDate && endDate && {
        date: {
          gte: startDate,
          lte: endDate
        }
      })
    };

    const [expenseSum, incomeSum] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, type: 'expense' },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: 'income' },
        _sum: { amount: true }
      })
    ]);

    const totalExpenses = Number(expenseSum._sum.amount || 0);
    const totalIncome = Number(incomeSum._sum.amount || 0);

    return {
      totalExpenses,
      totalIncome,
      netAmount: totalIncome - totalExpenses
    };
  }

  async getCategorySummary(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      userId,
      type: 'expense',
      category: { not: null },
      ...(startDate && endDate && {
        date: {
          gte: startDate,
          lte: endDate
        }
      })
    };

    const categorySpending = await prisma.transaction.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      orderBy: {
        _sum: {
          amount: 'desc'
        }
      }
    });

    return categorySpending.map(item => ({
      category: item.category!,
      amount: Number(item._sum.amount || 0)
    }));
  }

  async getUncategorizedTransactions(userId: string) {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        category: null
      },
      orderBy: { createdAt: 'desc' }
    });

    return transactions.map(t => ({
      ...t,
      amount: Number(t.amount)
    }));
  }
}