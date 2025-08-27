import type { Request } from 'express';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  id: string;
  userId: string;
  language: 'english' | 'spanish';
  periodType: 'calendar_month' | 'specific_day';
  specificDay?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetCategory {
  id: string;
  userId: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  spent: number;
  currency: string;
  targetYear: number;
  targetMonth: number;
  createdAt: Date;
  updatedAt: Date;
  category?: BudgetCategory;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  description: string;
  category?: string;
  date: Date;
  type: 'expense' | 'income';
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs (Data Transfer Objects)
export interface CreateUserDto {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateBudgetDto {
  categoryId: string;
  amount: number;
  currency: string;
  targetYear: number;
  targetMonth: number;
}

export interface UpdateBudgetDto {
  amount?: number;
  currency?: string;
  targetYear?: number;
  targetMonth?: number;
}

export interface CreateTransactionDto {
  amount: number;
  description: string;
  category?: string;
  date: Date;
  type: 'expense' | 'income';
  currency: string;
}

export interface UpdateTransactionDto {
  amount?: number;
  description?: string;
  category?: string;
  date?: Date;
  type?: 'expense' | 'income';
  currency?: string;
}

export interface CreateCategoryDto {
  name: string;
}

export interface UpdateCategoryDto {
  name?: string;
  sortOrder?: number;
}

export interface UpdatePreferencesDto {
  language?: 'english' | 'spanish';
  periodType?: 'calendar_month' | 'specific_day';
  specificDay?: number;
}

export interface TransactionQueryParams {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  type?: 'expense' | 'income';
  page: number;
  limit: number;
}

export interface BudgetQueryParams {
  year: number;
  month: number;
}

export interface PeriodTemplate {
  periodType: 'calendar_month' | 'specific_day';
  specificDay?: number;
}

export interface CalculatedPeriod {
  startDate: Date;
  endDate: Date;
  targetYear: number;
  targetMonth: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ExchangeRateResponse {
  success: boolean;
  rate?: number;
  error?: string;
}

// Express Request extensions
export interface AuthenticatedRequest extends Request {
  user?: User;
  userId?: string;
}