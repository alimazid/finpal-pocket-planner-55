import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

// Supported currencies
const SUPPORTED_CURRENCIES = ['DOP', 'USD', 'EUR'] as const;

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Common validation schemas
export const schemas = {
  id: z.object({
    id: z.string().cuid()
  }),
  
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20)
  }),

  createUser: z.object({
    email: z.string().email(),
    password: z.string().min(12, 'Password must be at least 12 characters').max(128, 'Password must be at most 128 characters'),
    name: z.string().optional()
  }),

  login: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  }),

  createBudget: z.object({
    categoryId: z.string().cuid(),
    amount: z.number().positive(),
    currency: z.enum(SUPPORTED_CURRENCIES).default('DOP'),
    targetYear: z.number().int().min(2020),
    targetMonth: z.number().int().min(1).max(12)
  }),

  updateBudget: z.object({
    amount: z.number().positive().optional(),
    currency: z.enum(SUPPORTED_CURRENCIES).optional(),
    targetYear: z.number().int().min(2020).optional(),
    targetMonth: z.number().int().min(1).max(12).optional()
  }),

  createTransaction: z.object({
    amount: z.number().positive(),
    description: z.string().min(1),
    category: z.string().optional().nullable(),
    date: z.coerce.date(),
    type: z.enum(['expense', 'income']),
    currency: z.enum(SUPPORTED_CURRENCIES).default('DOP')
  }),

  updateTransaction: z.object({
    amount: z.number().positive().optional(),
    description: z.string().min(1).optional(),
    category: z.string().optional().nullable(),
    date: z.coerce.date().optional(),
    type: z.enum(['expense', 'income']).optional(),
    currency: z.enum(SUPPORTED_CURRENCIES).optional()
  }),

  createCategory: z.object({
    name: z.string().min(1).max(100)
  }),

  updateCategory: z.object({
    name: z.string().min(1).max(100).optional(),
    sortOrder: z.number().int().min(0).optional()
  }),

  updatePreferences: z.object({
    language: z.enum(['english', 'spanish']).optional(),
    periodType: z.enum(['calendar_month', 'specific_day']).optional(),
    specificDay: z.number().int().min(1).max(31).optional(),
    defaultCurrency: z.enum(SUPPORTED_CURRENCIES).optional()
  }),

  budgetQuery: z.object({
    year: z.coerce.number().int().min(2020),
    month: z.coerce.number().int().min(1).max(12)
  }),

  transactionQuery: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    category: z.string().optional(),
    type: z.enum(['expense', 'income']).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(1000).default(20)
  })
};