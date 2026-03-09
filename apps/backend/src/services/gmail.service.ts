import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { randomBytes } from 'crypto';
import { TransactionService } from './transaction.service.js';
import { CreateTransactionDto } from '../types/index.js';
import { encrypt, decrypt, isEncrypted } from '../utils/crypto.utils.js';

const prisma = new PrismaClient();

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

export interface PennyRegistrationResponse {
  success: boolean;
  accountId?: string;
  gmailAddress?: string;
  monitoringStatus?: string;
  message?: string;
  error?: string;
}

export interface WebhookResult {
  success: boolean;
  error?: string;
  errorCode?: 'ACCOUNT_NOT_FOUND' | 'MISSING_FIELDS' | 'INVALID_DATE' | 'INVALID_AMOUNT' | 'INTERNAL_ERROR';
}

export class GmailService {
  private oauth2Client: OAuth2Client;
  private pennyApiUrl: string;
  private pennyApiKey: string;
  private transactionService: TransactionService;

  constructor() {
    if (!process.env.PENNY_CLIENT_ID || !process.env.PENNY_CLIENT_SECRET) {
      throw new Error('Penny OAuth credentials not configured');
    }

    if (!process.env.PENNY_API_URL || !process.env.PENNY_API_KEY) {
      throw new Error('Penny API configuration not found');
    }

    this.oauth2Client = new OAuth2Client(
      process.env.PENNY_CLIENT_ID,
      process.env.PENNY_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URI
    );

    this.pennyApiUrl = process.env.PENNY_API_URL;
    this.pennyApiKey = process.env.PENNY_API_KEY;
    this.transactionService = new TransactionService();
  }

  // Generate OAuth authorization URL with state parameter stored in DB
  async generateAuthUrl(userId: string): Promise<{ url: string; state: string }> {
    const state = randomBytes(32).toString('hex');

    // Store state in database with 10-minute expiry
    await prisma.oAuthState.create({
      data: {
        state,
        userId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      }
    });

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly'
    ];

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state,
      prompt: 'consent'
    });

    return { url: authUrl, state };
  }

  // Exchange authorization code for tokens and register with Penny
  async handleOAuthCallback(
    authorizationCode: string,
    state: string,
    userId: string,
    webhookUrl?: string
  ): Promise<GmailAccount> {
    try {
      // Exchange authorization code for tokens
      const { tokens } = await this.oauth2Client.getToken(authorizationCode);

      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Failed to obtain required tokens from Google');
      }

      // Get user's Gmail address
      this.oauth2Client.setCredentials(tokens);
      const oauth2 = new OAuth2Client();
      oauth2.setCredentials(tokens);

      // Use Gmail API to get user profile (email address)
      const gmail = google.gmail({ version: 'v1', auth: oauth2 });
      const profile = await gmail.users.getProfile({ userId: 'me' });

      const gmailAddress = profile.data.emailAddress;
      if (!gmailAddress) {
        throw new Error('Failed to retrieve Gmail address');
      }

      // Check if account already exists
      const existingAccount = await prisma.gmailAccount.findUnique({
        where: {
          userId_gmailAddress: {
            userId,
            gmailAddress
          }
        }
      });

      if (existingAccount) {
        throw new Error(`Gmail account ${gmailAddress} is already connected`);
      }

      // Encrypt tokens before storing in Account table (if applicable)
      const encryptedAccessToken = encrypt(tokens.access_token);
      const encryptedRefreshToken = encrypt(tokens.refresh_token);

      // Register account with Penny using plaintext tokens (Penny needs them to access Gmail)
      const pennyResponse = await this.registerWithPenny({
        gmailAddress,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : undefined,
        externalUserId: userId,
        startMonitoring: true,
        metadata: {
          webhookUrl,
          userName: gmailAddress
        }
      });

      if (!pennyResponse.success || !pennyResponse.accountId) {
        throw new Error(`Failed to register with Penny: ${pennyResponse.error || 'Unknown error'}`);
      }

      // Store account in database
      const gmailAccount = await prisma.gmailAccount.create({
        data: {
          userId,
          gmailAddress,
          pennyAccountId: pennyResponse.accountId,
          isConnected: true,
          monitoringActive: pennyResponse.monitoringStatus === 'active',
          webhookUrl,
          oauthState: state
        }
      });

      return gmailAccount;
    } catch (error) {
      console.error('OAuth callback error:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  // Register account with Penny API
  private async registerWithPenny(data: {
    gmailAddress: string;
    accessToken: string;
    refreshToken: string;
    tokenExpiresAt?: string;
    externalUserId: string;
    startMonitoring: boolean;
    metadata?: {
      webhookUrl?: string;
      userName?: string;
      customData?: any;
    };
  }): Promise<PennyRegistrationResponse> {
    try {
      const response = await axios.post(
        `${this.pennyApiUrl}/api/external/register-account`,
        data,
        {
          headers: {
            'X-API-Key': this.pennyApiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Penny registration error:', error instanceof Error ? error.message : 'Unknown error');
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.message || error.message
        };
      }
      return {
        success: false,
        error: 'Failed to register with Penny'
      };
    }
  }

  // Get user's Gmail accounts
  async getUserGmailAccounts(userId: string): Promise<GmailAccount[]> {
    return await prisma.gmailAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Get account status from Penny
  async getAccountStatus(accountId: string, userId: string): Promise<PennyAccountStatus | null> {
    try {
      const account = await prisma.gmailAccount.findFirst({
        where: {
          id: accountId,
          userId
        }
      });

      if (!account) {
        throw new Error('Account not found');
      }

      const response = await axios.get(
        `${this.pennyApiUrl}/api/external/accounts/${account.pennyAccountId}`,
        {
          headers: {
            'X-API-Key': this.pennyApiKey
          },
          timeout: 10000
        }
      );

      // Update local database with latest status
      await prisma.gmailAccount.update({
        where: { id: accountId },
        data: {
          isConnected: response.data.isConnected,
          monitoringActive: response.data.monitoringActive,
          lastSyncAt: response.data.lastSyncAt ? new Date(response.data.lastSyncAt) : null
        }
      });

      return response.data;
    } catch (error) {
      console.error('Account status error:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  // Start monitoring for an account
  async startMonitoring(accountId: string, userId: string): Promise<boolean> {
    try {
      const account = await prisma.gmailAccount.findFirst({
        where: {
          id: accountId,
          userId
        }
      });

      if (!account) {
        throw new Error('Account not found');
      }

      const response = await axios.post(
        `${this.pennyApiUrl}/api/external/accounts/${account.pennyAccountId}/start-monitoring`,
        {},
        {
          headers: {
            'X-API-Key': this.pennyApiKey
          },
          timeout: 10000
        }
      );

      if (response.data.success) {
        await prisma.gmailAccount.update({
          where: { id: accountId },
          data: { monitoringActive: true }
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Monitoring start error:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  // Stop monitoring for an account
  async stopMonitoring(accountId: string, userId: string): Promise<boolean> {
    try {
      const account = await prisma.gmailAccount.findFirst({
        where: {
          id: accountId,
          userId
        }
      });

      if (!account) {
        throw new Error('Account not found');
      }

      const response = await axios.post(
        `${this.pennyApiUrl}/api/external/accounts/${account.pennyAccountId}/stop-monitoring`,
        {},
        {
          headers: {
            'X-API-Key': this.pennyApiKey
          },
          timeout: 10000
        }
      );

      // Update local state regardless — if Penny says it's not monitoring, we should reflect that
      await prisma.gmailAccount.update({
        where: { id: accountId },
        data: { monitoringActive: false }
      });
      return true;
    } catch (error) {
      console.error('Stop monitoring error:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  // Remove account from both local database and Penny
  async removeAccount(accountId: string, userId: string): Promise<boolean> {
    try {
      const account = await prisma.gmailAccount.findFirst({
        where: {
          id: accountId,
          userId
        }
      });

      if (!account) {
        throw new Error('Account not found');
      }

      // Remove from Penny
      await axios.delete(
        `${this.pennyApiUrl}/api/external/accounts/${account.pennyAccountId}`,
        {
          headers: {
            'X-API-Key': this.pennyApiKey
          },
          timeout: 10000
        }
      );

      // Remove from local database
      await prisma.gmailAccount.delete({
        where: { id: accountId }
      });

      return true;
    } catch (error) {
      console.error('Account removal error:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  // Map Penny transaction types to Planner transaction types (R8 fix)
  private mapTransactionType(type: string): 'income' | 'expense' {
    switch (type) {
      case 'credit':
      case 'income':
        return 'income';
      case 'debit':
      case 'payment':
      case 'transfer':
      case 'fee':
      case 'interest':
      case 'expense':
      default:
        return 'expense';
    }
  }

  // Get user's preferred currency instead of hardcoding USD (R9 fix)
  private async getUserDefaultCurrency(userId: string): Promise<string> {
    const pref = await prisma.userPreference.findUnique({
      where: { userId },
      select: { defaultCurrency: true }
    });
    return pref?.defaultCurrency || 'USD';
  }

  // Create transaction from extracted email data (R1, R3, R4 fixes)
  private async createTransactionFromExtractedData(userId: string, extractedData: any): Promise<WebhookResult> {
    try {
      if (!extractedData) {
        return { success: false, error: 'No extracted data provided', errorCode: 'MISSING_FIELDS' };
      }

      const { type, amount, currency, transactionDate, description, merchant } = extractedData;
      const transactionDescription = merchant || description;

      if (!amount || !transactionDescription || !transactionDate || !type) {
        const missing = [
          !amount && 'amount',
          !transactionDescription && 'description/merchant',
          !transactionDate && 'transactionDate',
          !type && 'type'
        ].filter(Boolean).join(', ');
        console.log('Webhook: missing required fields for transaction:', missing);
        return { success: false, error: `Missing required fields: ${missing}`, errorCode: 'MISSING_FIELDS' };
      }

      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        console.log('Webhook: invalid amount:', amount);
        return { success: false, error: `Invalid amount: ${amount} (must be positive)`, errorCode: 'INVALID_AMOUNT' };
      }

      let parsedDate: Date;
      try {
        parsedDate = new Date(transactionDate);
        if (isNaN(parsedDate.getTime())) throw new Error('Invalid date');
      } catch (error) {
        console.log('Webhook: invalid date format:', transactionDate);
        return { success: false, error: `Invalid date format: ${transactionDate}`, errorCode: 'INVALID_DATE' };
      }

      const defaultCurrency = await this.getUserDefaultCurrency(userId);

      const transactionDto: CreateTransactionDto = {
        amount: numericAmount,
        description: String(transactionDescription),
        category: null,
        date: parsedDate,
        type: this.mapTransactionType(type),
        currency: currency || defaultCurrency
      };

      await this.transactionService.createTransaction(userId, transactionDto);
      console.log('Webhook: transaction created');
      return { success: true };

    } catch (error) {
      console.error('Webhook: failed to create transaction:', error instanceof Error ? error.message : 'Unknown error');
      return { success: false, error: 'Internal error creating transaction', errorCode: 'INTERNAL_ERROR' };
    }
  }

  // Process webhook from Penny (R2 fix: returns WebhookResult instead of void)
  async processWebhook(payload: any): Promise<WebhookResult> {
    try {
      const { event, accountId: pennyAccountId, externalUserId, data } = payload;

      console.log('Webhook received:', JSON.stringify({ event: String(event).replace(/[\n\r\t]/g, '') }));

      // Try matching by pennyAccountId + externalUserId first, then fallback to pennyAccountId only
      let account = await prisma.gmailAccount.findFirst({
        where: {
          pennyAccountId,
          userId: externalUserId
        }
      });

      if (!account) {
        account = await prisma.gmailAccount.findFirst({
          where: { pennyAccountId }
        });
      }

      if (!account) {
        console.warn('Webhook: account not found', JSON.stringify({ pennyAccountId, externalUserId }));
        return { success: false, error: 'Account not found for pennyAccountId', errorCode: 'ACCOUNT_NOT_FOUND' };
      }

      switch (event) {
        case 'account.connected':
          await prisma.gmailAccount.update({
            where: { id: account.id },
            data: { isConnected: true }
          });
          break;

        case 'account.disconnected':
          await prisma.gmailAccount.update({
            where: { id: account.id },
            data: {
              isConnected: false,
              monitoringActive: false
            }
          });
          break;

        case 'monitoring.started':
          await prisma.gmailAccount.update({
            where: { id: account.id },
            data: { monitoringActive: true }
          });
          break;

        case 'monitoring.stopped':
          await prisma.gmailAccount.update({
            where: { id: account.id },
            data: { monitoringActive: false }
          });
          break;

        case 'email.received':
          await prisma.gmailAccount.update({
            where: { id: account.id },
            data: { lastSyncAt: new Date() }
          });
          break;

        case 'email.classified':
          await prisma.gmailAccount.update({
            where: { id: account.id },
            data: { lastSyncAt: new Date() }
          });
          break;

        case 'email.extracted':
          if (data?.extractedData) {
            const result = await this.createTransactionFromExtractedData(account.userId, data.extractedData);
            // Update lastSyncAt regardless of transaction creation result
            await prisma.gmailAccount.update({
              where: { id: account.id },
              data: { lastSyncAt: new Date() }
            });
            if (!result.success) {
              return result;
            }
          } else {
            await prisma.gmailAccount.update({
              where: { id: account.id },
              data: { lastSyncAt: new Date() }
            });
          }
          break;

        case 'token.refreshed':
          await prisma.gmailAccount.update({
            where: { id: account.id },
            data: { lastSyncAt: new Date() }
          });
          break;

        case 'error.occurred':
          console.warn('Webhook: error event received');
          break;

        default:
          console.log('Webhook: unhandled event type');
      }

      return { success: true };

    } catch (error) {
      console.error('Webhook processing error:', error instanceof Error ? error.message : 'Unknown error');
      return { success: false, error: 'Internal webhook processing error', errorCode: 'INTERNAL_ERROR' };
    }
  }

  // Check account health by comparing local and remote (Penny) state
  async checkAccountHealth(accountId: string, userId: string): Promise<{
    healthy: boolean;
    localState: { isConnected: boolean; monitoringActive: boolean };
    remoteState: { isConnected: boolean; monitoringActive: boolean } | null;
    mismatches: string[];
  }> {
    // Get local GmailAccount state
    const account = await prisma.gmailAccount.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const localState = {
      isConnected: account.isConnected,
      monitoringActive: account.monitoringActive,
    };

    // Call Penny's health endpoint
    let remoteState: { isConnected: boolean; monitoringActive: boolean } | null = null;
    const mismatches: string[] = [];

    try {
      const response = await axios.get(
        `${this.pennyApiUrl}/api/external/accounts/${account.pennyAccountId}/health`,
        {
          headers: {
            'X-API-Key': this.pennyApiKey,
          },
          timeout: 10000,
        }
      );

      remoteState = {
        isConnected: response.data.isConnected,
        monitoringActive: response.data.monitoringActive,
      };

      // Compare states and detect mismatches
      if (localState.isConnected && !remoteState.isConnected) {
        mismatches.push('Planner shows connected but Penny shows disconnected');
      }
      if (!localState.isConnected && remoteState.isConnected) {
        mismatches.push('Planner shows disconnected but Penny shows connected');
      }
      if (localState.monitoringActive && !remoteState.monitoringActive) {
        mismatches.push('Planner shows monitoring active but Penny shows monitoring inactive');
      }
      if (!localState.monitoringActive && remoteState.monitoringActive) {
        mismatches.push('Planner shows monitoring inactive but Penny shows monitoring active');
      }
    } catch (error) {
      console.error('Health check error: failed to reach Penny:', error instanceof Error ? error.message : 'Unknown error');
      mismatches.push('Unable to reach Penny API for health check');
    }

    return {
      healthy: mismatches.length === 0 && remoteState !== null,
      localState,
      remoteState,
      mismatches,
    };
  }

  // Validate OAuth state parameter
  async validateOAuthState(state: string, userId: string): Promise<boolean> {
    const oauthState = await prisma.oAuthState.findUnique({
      where: { state }
    });

    if (!oauthState) {
      return false;
    }

    // Delete after use (one-time use)
    await prisma.oAuthState.delete({ where: { id: oauthState.id } });

    // Verify userId matches and not expired
    if (oauthState.userId !== userId) {
      return false;
    }
    if (oauthState.expiresAt < new Date()) {
      return false;
    }

    return true;
  }
}
