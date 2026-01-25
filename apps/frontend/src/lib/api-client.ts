import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
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

export interface BudgetCategory {
  id: string;
  userId: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
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

export interface UserPreferences {
  id: string;
  userId: string;
  language: 'english' | 'spanish';
  periodType: 'calendar_month' | 'specific_day';
  specificDay?: number;
  defaultCurrency: string;
  createdAt: Date;
  updatedAt: Date;
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

export interface TransactionQueryParams {
  startDate?: string;
  endDate?: string;
  category?: string;
  type?: 'expense' | 'income';
  page?: number;
  limit?: number;
  searchQuery?: string;
}

export interface BudgetQueryParams {
  year: number;
  month: number;
}

export interface GmailAccount {
  id: string;
  userId: string;
  gmailAddress: string;
  pennyAccountId: string;
  isConnected: boolean;
  monitoringActive: boolean;
  lastSyncAt: Date | null;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PennyAccountStatus {
  accountId: string;
  gmailAddress: string;
  isConnected: boolean;
  monitoringActive: boolean;
  lastSyncAt: string | null;
  registeredAt: string;
  externalUserId: string;
  statistics: {
    totalEmails: number;
    financialEmails: number;
    extractedData: number;
  };
}

export interface GmailAuthResponse {
  authUrl: string;
  state: string;
  webhookUrl?: string;
}

export interface GmailCallbackDto {
  code: string;
  state: string;
  webhookUrl?: string;
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string = import.meta.env.VITE_API_URL!) {
    if (!baseURL) {
      throw new Error('VITE_API_URL environment variable is required');
    }
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
        }
        return Promise.reject(error);
      }
    );

    // Load token from localStorage
    this.loadToken();
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('api_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('api_token');
  }

  private loadToken() {
    const token = localStorage.getItem('api_token');
    if (token) {
      this.token = token;
    }
  }

  // Auth endpoints
  async register(data: { email: string; password: string; name?: string }) {
    const response = await this.client.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data);
    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token);
    }
    return response.data;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.client.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data);
    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token);
    }
    return response.data;
  }

  async logout() {
    this.clearToken();
  }

  async getProfile() {
    const response = await this.client.get<ApiResponse<User>>('/auth/profile');
    return response.data;
  }

  async updateProfile(data: { name?: string; email?: string; password?: string }) {
    const response = await this.client.put<ApiResponse<User>>('/auth/profile', data);
    return response.data;
  }

  async loginWithGoogle(idToken: string) {
    const response = await this.client.post<ApiResponse<{ user: User; token: string; isNewUser: boolean }>>('/auth/google', { idToken });
    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token);
    }
    return response.data;
  }

  async getGoogleAuthUrl(state?: string) {
    const response = await this.client.get<ApiResponse<{ authUrl: string }>>('/auth/google/url', { params: { state } });
    return response.data;
  }

  // Budget endpoints
  async getBudgets(params: BudgetQueryParams) {
    const response = await this.client.get<ApiResponse<Budget[]>>('/budgets', { params });
    return response.data;
  }

  async getBudget(id: string) {
    const response = await this.client.get<ApiResponse<Budget>>(`/budgets/${id}`);
    return response.data;
  }

  async createBudget(data: CreateBudgetDto) {
    const response = await this.client.post<ApiResponse<Budget>>('/budgets', data);
    return response.data;
  }

  async updateBudget(id: string, data: UpdateBudgetDto) {
    const response = await this.client.put<ApiResponse<Budget>>(`/budgets/${id}`, data);
    return response.data;
  }

  async deleteBudget(id: string) {
    const response = await this.client.delete<ApiResponse<{ success: boolean }>>(`/budgets/${id}`);
    return response.data;
  }

  async createMissingBudgets(params: BudgetQueryParams) {
    const response = await this.client.post<ApiResponse<Budget[]>>('/budgets/create-missing', params);
    return response.data;
  }

  async recalculateSpentAmounts() {
    const response = await this.client.post<ApiResponse<{ success: boolean; recalculated: number }>>('/budgets/recalculate-spent');
    return response.data;
  }

  // Transaction endpoints
  async getTransactions(params: TransactionQueryParams = {}) {
    const response = await this.client.get<PaginatedResponse<Transaction>>('/transactions', { params });
    return response.data;
  }

  async getTransaction(id: string) {
    const response = await this.client.get<ApiResponse<Transaction>>(`/transactions/${id}`);
    return response.data;
  }

  async createTransaction(data: CreateTransactionDto) {
    const response = await this.client.post<ApiResponse<Transaction>>('/transactions', data);
    return response.data;
  }

  async updateTransaction(id: string, data: UpdateTransactionDto) {
    const response = await this.client.put<ApiResponse<Transaction>>(`/transactions/${id}`, data);
    return response.data;
  }

  async deleteTransaction(id: string) {
    const response = await this.client.delete<ApiResponse<{ success: boolean }>>(`/transactions/${id}`);
    return response.data;
  }

  async getTransactionSummary(startDate?: string, endDate?: string) {
    const params = { startDate, endDate };
    const response = await this.client.get<ApiResponse<{ totalExpenses: number; totalIncome: number; netAmount: number }>>('/transactions/summary', { params });
    return response.data;
  }

  async getCategorySummary(startDate?: string, endDate?: string) {
    const params = { startDate, endDate };
    const response = await this.client.get<ApiResponse<Array<{ category: string; amount: number }>>>('/transactions/category-summary', { params });
    return response.data;
  }

  async getUncategorizedTransactions() {
    const response = await this.client.get<ApiResponse<Transaction[]>>('/transactions/uncategorized');
    return response.data;
  }

  // Category endpoints
  async getCategories() {
    const response = await this.client.get<ApiResponse<BudgetCategory[]>>('/categories');
    return response.data;
  }

  async getCategory(id: string) {
    const response = await this.client.get<ApiResponse<BudgetCategory>>(`/categories/${id}`);
    return response.data;
  }

  async createCategory(data: CreateCategoryDto) {
    const response = await this.client.post<ApiResponse<BudgetCategory>>('/categories', data);
    return response.data;
  }

  async updateCategory(id: string, data: UpdateCategoryDto) {
    const response = await this.client.put<ApiResponse<BudgetCategory>>(`/categories/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: string) {
    const response = await this.client.delete<ApiResponse<{ success: boolean }>>(`/categories/${id}`);
    return response.data;
  }

  async reorderCategories(categoryIds: string[]) {
    const response = await this.client.post<ApiResponse<{ success: boolean }>>('/categories/reorder', { categoryIds });
    return response.data;
  }

  async getCategoryWithBudgets(id: string, year: number, month: number) {
    const params = { year, month };
    const response = await this.client.get<ApiResponse<BudgetCategory & { budgets: Budget[] }>>(`/categories/${id}/budgets`, { params });
    return response.data;
  }

  async getCategoryUsage() {
    const response = await this.client.get<ApiResponse<Array<BudgetCategory & { budgetCount: number }>>>('/categories/usage');
    return response.data;
  }

  // Preferences endpoints
  async getPreferences() {
    const response = await this.client.get<ApiResponse<UserPreferences>>('/preferences');
    return response.data;
  }

  async updatePreferences(data: { language?: 'english' | 'spanish'; periodType?: 'calendar_month' | 'specific_day'; specificDay?: number; defaultCurrency?: string }) {
    const response = await this.client.put<ApiResponse<UserPreferences>>('/preferences', data);
    return response.data;
  }

  // Currency conversion methods
  async getExchangeRate(fromCurrency: string, toCurrency: string) {
    const response = await this.client.get<ApiResponse<{
      fromCurrency: string;
      toCurrency: string;
      rate: number;
      timestamp: string;
    }>>(`/currencies/${fromCurrency}/${toCurrency}/rate`);
    return response.data;
  }

  async convertAmount(amount: number, fromCurrency: string, toCurrency: string) {
    const response = await this.client.post<ApiResponse<{
      originalAmount: number;
      fromCurrency: string;
      toCurrency: string;
      convertedAmount: number;
      timestamp: string;
    }>>(`/currencies/${fromCurrency}/${toCurrency}/convert`, { amount });
    return response.data;
  }

  async getSupportedCurrencies() {
    const response = await this.client.get<ApiResponse<{
      id: string;
      code: string;
      displayAlias: string;
      name: string;
      sortOrder: number;
      isActive: boolean;
    }[]>>('/currencies');
    return response.data;
  }

  async getExchangeRatesForCurrency(baseCurrency: string) {
    const response = await this.client.get<ApiResponse<{
      id: string;
      fromCurrency: string;
      toCurrency: string;
      rate: number;
      isActive: boolean;
      updatedAt: Date;
    }[]>>(`/currencies/${baseCurrency}/rates`);
    return response.data;
  }

  // Gmail endpoints
  async generateGmailAuthUrl(webhookUrl?: string) {
    const params = webhookUrl ? { webhookUrl } : {};
    const response = await this.client.get<ApiResponse<GmailAuthResponse>>('/gmail/auth', { params });
    return response.data;
  }

  async handleGmailCallback(data: GmailCallbackDto) {
    const response = await this.client.post<ApiResponse<GmailAccount>>('/gmail/callback', data);
    return response.data;
  }

  async getGmailAccounts() {
    const response = await this.client.get<ApiResponse<GmailAccount[]>>('/gmail/accounts');
    return response.data;
  }

  async getGmailAccountStatus(accountId: string) {
    const response = await this.client.get<ApiResponse<PennyAccountStatus>>(`/gmail/accounts/${accountId}/status`);
    return response.data;
  }

  async startGmailMonitoring(accountId: string) {
    const response = await this.client.post<ApiResponse<{ success: boolean }>>(`/gmail/accounts/${accountId}/start-monitoring`);
    return response.data;
  }

  async stopGmailMonitoring(accountId: string) {
    const response = await this.client.post<ApiResponse<{ success: boolean }>>(`/gmail/accounts/${accountId}/stop-monitoring`);
    return response.data;
  }

  async removeGmailAccount(accountId: string) {
    const response = await this.client.delete<ApiResponse<{ success: boolean }>>(`/gmail/accounts/${accountId}`);
    return response.data;
  }

  // Feature flag endpoints
  async getFeatureFlags() {
    const response = await this.client.get<ApiResponse<Record<string, boolean>>>('/feature-flags');
    return response.data;
  }

  async getAllFeatureFlags() {
    const response = await this.client.get<ApiResponse<Array<{
      key: string;
      name: string;
      description?: string;
      isEnabled: boolean;
    }>>>('/feature-flags/admin');
    return response.data;
  }

  async updateFeatureFlag(key: string, isEnabled: boolean) {
    const response = await this.client.put<ApiResponse<{
      key: string;
      name: string;
      description?: string;
      isEnabled: boolean;
    }>>(`/feature-flags/${key}`, { isEnabled });
    return response.data;
  }

  async bulkUpdateFeatureFlags(updates: Array<{ key: string; isEnabled: boolean }>) {
    const response = await this.client.post<ApiResponse<Array<{
      key: string;
      name: string;
      isEnabled: boolean;
    }>>>('/feature-flags/bulk', { updates });
    return response.data;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;