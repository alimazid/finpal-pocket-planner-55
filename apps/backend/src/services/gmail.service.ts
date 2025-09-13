import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { randomBytes } from 'crypto';

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

export class GmailService {
  private oauth2Client: OAuth2Client;
  private pennyApiUrl: string;
  private pennyApiKey: string;

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
  }

  // Generate OAuth authorization URL with state parameter
  generateAuthUrl(userId: string): { url: string; state: string } {
    const state = randomBytes(32).toString('hex');

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.labels',
      'https://www.googleapis.com/auth/gmail.modify',
      'email'
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

      // Use the Google OAuth2 API to get user info
      const userInfo = await axios.get(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
      );

      const gmailAddress = userInfo.data.email;
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

      // Register account with Penny
      const pennyResponse = await this.registerWithPenny({
        gmailAddress,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : undefined,
        externalUserId: userId,
        startMonitoring: true,
        metadata: {
          webhookUrl,
          userName: userInfo.data.name || gmailAddress
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
      console.error('OAuth callback error:', error);
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
      console.error('Penny registration error:', error);
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
      console.error('Get account status error:', error);
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
      console.error('Start monitoring error:', error);
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

      if (response.data.success) {
        await prisma.gmailAccount.update({
          where: { id: accountId },
          data: { monitoringActive: false }
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Stop monitoring error:', error);
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
      console.error('Remove account error:', error);
      return false;
    }
  }

  // Process webhook from Penny
  async processWebhook(payload: any): Promise<void> {
    const timestamp = new Date().toISOString();

    try {
      const { event, accountId: pennyAccountId, externalUserId, data, timestamp: eventTimestamp } = payload;

      console.log(`\n📧 GMAIL WEBHOOK RECEIVED [${timestamp}]`);
      console.log(`┌─────────────────────────────────────────────────────────┐`);
      console.log(`│ Event: ${event.padEnd(47)} │`);
      console.log(`│ Penny Account ID: ${pennyAccountId.substring(0, 35).padEnd(35)} │`);
      console.log(`│ User ID: ${externalUserId.substring(0, 43).padEnd(43)} │`);
      console.log(`│ Event Timestamp: ${(eventTimestamp || 'N/A').padEnd(36)} │`);
      console.log(`└─────────────────────────────────────────────────────────┘`);

      // Find the Gmail account
      const account = await prisma.gmailAccount.findFirst({
        where: {
          pennyAccountId,
          userId: externalUserId
        }
      });

      if (!account) {
        console.warn(`❌ WEBHOOK ERROR: Account not found`);
        console.warn(`   Penny Account ID: ${pennyAccountId}`);
        console.warn(`   User ID: ${externalUserId}`);
        console.warn(`   This account may have been removed or never registered.`);
        return;
      }

      console.log(`✅ Account Found: ${account.gmailAddress}`);

      // Update account status based on event
      switch (event) {
        case 'account.connected':
          console.log(`🔗 ACCOUNT CONNECTED`);
          console.log(`   Gmail: ${account.gmailAddress}`);
          console.log(`   Action: Marking account as connected`);

          await prisma.gmailAccount.update({
            where: { id: account.id },
            data: { isConnected: true }
          });

          console.log(`   ✅ Account status updated successfully`);
          break;

        case 'account.disconnected':
          console.log(`💔 ACCOUNT DISCONNECTED`);
          console.log(`   Gmail: ${account.gmailAddress}`);
          console.log(`   Reason: ${data?.reason || 'Authentication failure'}`);
          console.log(`   Action: Marking account as disconnected and stopping monitoring`);

          await prisma.gmailAccount.update({
            where: { id: account.id },
            data: {
              isConnected: false,
              monitoringActive: false
            }
          });

          console.log(`   ✅ Account status updated - user may need to reconnect`);
          break;

        case 'monitoring.started':
          console.log(`▶️  MONITORING STARTED`);
          console.log(`   Gmail: ${account.gmailAddress}`);
          console.log(`   Action: Email monitoring is now active`);

          await prisma.gmailAccount.update({
            where: { id: account.id },
            data: { monitoringActive: true }
          });

          console.log(`   ✅ Monitoring status updated`);
          break;

        case 'monitoring.stopped':
          console.log(`⏸️  MONITORING STOPPED`);
          console.log(`   Gmail: ${account.gmailAddress}`);
          console.log(`   Action: Email monitoring has been paused`);

          await prisma.gmailAccount.update({
            where: { id: account.id },
            data: { monitoringActive: false }
          });

          console.log(`   ✅ Monitoring status updated`);
          break;

        case 'email.received':
          console.log(`📨 NEW EMAIL RECEIVED`);
          console.log(`   Gmail: ${account.gmailAddress}`);
          console.log(`   Subject: ${data?.subject || 'N/A'}`);
          console.log(`   Sender: ${data?.sender || 'N/A'}`);
          console.log(`   Email ID: ${data?.emailId || 'N/A'}`);
          console.log(`   Action: Email detected and queued for processing`);

          await prisma.gmailAccount.update({
            where: { id: account.id },
            data: { lastSyncAt: new Date() }
          });

          console.log(`   ✅ Last sync timestamp updated`);
          break;

        case 'email.classified':
          console.log(`🏷️  EMAIL CLASSIFIED`);
          console.log(`   Gmail: ${account.gmailAddress}`);
          console.log(`   Subject: ${data?.subject || 'N/A'}`);
          console.log(`   Sender: ${data?.sender || 'N/A'}`);
          console.log(`   Classification: ${data?.classification || 'N/A'}`);
          console.log(`   Is Financial: ${data?.isFinancial ? '✅ YES' : '❌ NO'}`);

          await prisma.gmailAccount.update({
            where: { id: account.id },
            data: { lastSyncAt: new Date() }
          });

          console.log(`   ✅ Email classification processed`);
          break;

        case 'email.extracted':
          console.log(`💰 FINANCIAL DATA EXTRACTED`);
          console.log(`   Gmail: ${account.gmailAddress}`);
          console.log(`   Subject: ${data?.subject || 'N/A'}`);
          console.log(`   Sender: ${data?.sender || 'N/A'}`);

          if (data?.extractedData) {
            console.log(`   💵 Extracted Financial Data:`);
            console.log(`      Amount: ${data.extractedData.amount || 'N/A'}`);
            console.log(`      Currency: ${data.extractedData.currency || 'N/A'}`);
            console.log(`      Date: ${data.extractedData.transactionDate || 'N/A'}`);
            console.log(`      Merchant: ${data.extractedData.merchant || 'N/A'}`);
            console.log(`      Type: ${data.extractedData.type || 'N/A'}`);

            // TODO: Implement automatic transaction creation
            console.log(`   🔄 TODO: Create transaction from extracted data`);
            // await this.createTransactionFromExtractedData(account.userId, data.extractedData);
          }

          await prisma.gmailAccount.update({
            where: { id: account.id },
            data: { lastSyncAt: new Date() }
          });

          console.log(`   ✅ Financial data extraction processed`);
          break;

        case 'token.refreshed':
          console.log(`🔄 OAUTH TOKENS REFRESHED`);
          console.log(`   Gmail: ${account.gmailAddress}`);
          console.log(`   Action: Gmail OAuth tokens have been automatically refreshed`);
          console.log(`   New Expiry: ${data?.expiresAt || 'N/A'}`);

          await prisma.gmailAccount.update({
            where: { id: account.id },
            data: { lastSyncAt: new Date() }
          });

          console.log(`   ✅ Token refresh logged`);
          break;

        case 'error.occurred':
          console.log(`❌ PROCESSING ERROR`);
          console.log(`   Gmail: ${account.gmailAddress}`);
          console.log(`   Error Type: ${data?.errorType || 'Unknown'}`);
          console.log(`   Error Message: ${data?.message || 'N/A'}`);
          console.log(`   Error Code: ${data?.code || 'N/A'}`);
          console.log(`   Action: Logging error for investigation`);

          // Don't update lastSyncAt for errors
          console.log(`   ⚠️  Error logged - no database update performed`);
          break;

        default:
          console.log(`❓ UNHANDLED WEBHOOK EVENT`);
          console.log(`   Event Type: ${event}`);
          console.log(`   Gmail: ${account.gmailAddress}`);
          console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
          console.log(`   Action: Event logged but not processed`);
      }

      console.log(`📧 WEBHOOK PROCESSING COMPLETE [${new Date().toISOString()}]\n`);

    } catch (error) {
      console.error(`\n💥 WEBHOOK PROCESSING ERROR [${timestamp}]`);
      console.error(`┌─────────────────────────────────────────────────────────┐`);
      console.error(`│ Error occurred while processing webhook                 │`);
      console.error(`└─────────────────────────────────────────────────────────┘`);
      console.error(`Event: ${payload?.event || 'Unknown'}`);
      console.error(`Penny Account ID: ${payload?.accountId || 'Unknown'}`);
      console.error(`User ID: ${payload?.externalUserId || 'Unknown'}`);
      console.error(`Error Details:`, error);
      console.error(`Payload:`, JSON.stringify(payload, null, 2));
      console.error(`💥 WEBHOOK ERROR COMPLETE [${new Date().toISOString()}]\n`);
      throw error;
    }
  }

  // Validate OAuth state parameter
  async validateOAuthState(state: string, userId: string): Promise<boolean> {
    // In a production environment, you might want to store state temporarily
    // For now, we'll just check if it's a valid hex string
    return /^[a-f0-9]{64}$/.test(state);
  }
}