import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { 
  Transaction, 
  CreateTransactionDto, 
  UpdateTransactionDto, 
  TransactionQueryParams 
} from '../types/index.js';
import { NotFoundError, ValidationError } from '../middleware/error.middleware.js';

export class TransactionService {

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