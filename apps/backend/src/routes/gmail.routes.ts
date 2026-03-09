import { Router } from 'express';
import { GmailService } from '../services/gmail.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateBody, validateParams } from '../middleware/validation.middleware.js';
import { schemas } from '../middleware/validation.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';
import { z } from 'zod';
import crypto from 'crypto';
import { securityAudit } from '../services/securityAudit.service.js';
import { prisma } from '../config/database.js';

const router = Router();
const gmailService = new GmailService();

// Clean up webhook logs older than 30 days periodically (every hour)
setInterval(async () => {
  try {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { count } = await prisma.webhookLog.deleteMany({
      where: { receivedAt: { lt: cutoff } }
    });
    if (count > 0) {
      console.log(`Cleaned up ${count} webhook log entries older than 30 days`);
    }
  } catch (e) {
    console.error('Webhook log cleanup error:', e);
  }
}, 60 * 60 * 1000);

// Helper function to verify webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    const cleanSignature = signature.startsWith('sha256=')
      ? signature.substring(7)
      : signature;

    if (cleanSignature.length !== 64) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(cleanSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}

// Validation schemas
const callbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State parameter is required')
});

// Webhook data schemas per event type (ASVS V5.2.6)
// Use .passthrough() to allow extra fields from Penny (suggestedCategory, confidence, etc.)
const extractedDataSchema = z.object({
  type: z.enum(['income', 'expense', 'debit', 'credit', 'payment', 'transfer', 'fee', 'interest']).optional(),
  amount: z.number().positive().max(999999999).optional(),
  currency: z.string().max(10).optional(),
  transactionDate: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  merchant: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
}).passthrough();

const webhookDataSchema = z.object({
  extractedData: extractedDataSchema.optional(),
  emailId: z.string().max(200).optional(),
  errorType: z.string().max(100).optional(),
  errorMessage: z.string().max(500).optional(),
}).passthrough().optional();

const webhookSchema = z.object({
  event: z.string().min(1).max(100),
  timestamp: z.string().min(1).max(50),
  accountId: z.string().min(1).max(200),
  externalUserId: z.string().min(1).max(200),
  data: webhookDataSchema,
});

// GET /api/gmail/auth — Generate OAuth authorization URL
router.get('/auth',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.userId!;
      const webhookUrl = req.query.webhookUrl as string;

      const { url, state } = await gmailService.generateAuthUrl(userId);

      res.json({
        success: true,
        data: {
          authUrl: url,
          state,
          webhookUrl
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/gmail/callback — Handle OAuth callback
router.post('/callback',
  authenticateToken,
  validateBody(callbackSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { code, state } = req.body;
      const webhookUrl = req.body.webhookUrl as string;

      const isValidState = await gmailService.validateOAuthState(state, userId);
      if (!isValidState) {
        return res.status(400).json({
          success: false,
          error: 'Invalid state parameter'
        });
      }

      const gmailAccount = await gmailService.handleOAuthCallback(
        code,
        state,
        userId,
        webhookUrl
      );

      res.json({
        success: true,
        data: gmailAccount,
        message: 'Gmail account connected successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect Gmail account'
      });
    }
  }
);

// GET /api/gmail/accounts
router.get('/accounts',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.userId!;
      const accounts = await gmailService.getUserGmailAccounts(userId);
      res.json({ success: true, data: accounts });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/gmail/accounts/:id/status
router.get('/accounts/:id/status',
  authenticateToken,
  validateParams(schemas.id),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.userId!;
      const accountId = req.params.id;
      const status = await gmailService.getAccountStatus(accountId, userId);

      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Account not found or status unavailable'
        });
      }

      res.json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/gmail/accounts/:id/health
router.get('/accounts/:id/health',
  authenticateToken,
  validateParams(schemas.id),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.userId!;
      const accountId = req.params.id;
      const health = await gmailService.checkAccountHealth(accountId, userId);

      res.json({ success: true, data: health });
    } catch (error) {
      if (error instanceof Error && error.message === 'Account not found') {
        return res.status(404).json({
          success: false,
          error: 'Account not found'
        });
      }
      next(error);
    }
  }
);

// POST /api/gmail/accounts/:id/start-monitoring
router.post('/accounts/:id/start-monitoring',
  authenticateToken,
  validateParams(schemas.id),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.userId!;
      const accountId = req.params.id;
      const success = await gmailService.startMonitoring(accountId, userId);

      if (!success) {
        return res.status(400).json({ success: false, error: 'Failed to start monitoring' });
      }

      res.json({ success: true, message: 'Monitoring started successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/gmail/accounts/:id/stop-monitoring
router.post('/accounts/:id/stop-monitoring',
  authenticateToken,
  validateParams(schemas.id),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.userId!;
      const accountId = req.params.id;
      const success = await gmailService.stopMonitoring(accountId, userId);

      if (!success) {
        return res.status(400).json({ success: false, error: 'Failed to stop monitoring' });
      }

      res.json({ success: true, message: 'Monitoring stopped successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/gmail/accounts/:id
router.delete('/accounts/:id',
  authenticateToken,
  validateParams(schemas.id),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.userId!;
      const accountId = req.params.id;
      const success = await gmailService.removeAccount(accountId, userId);

      if (!success) {
        return res.status(400).json({ success: false, error: 'Failed to remove account' });
      }

      res.json({ success: true, message: 'Gmail account removed successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/gmail/webhook — Receive webhooks from Penny
router.post('/webhook',
  validateBody(webhookSchema),
  async (req, res, next) => {
    // Use the raw body buffer captured by express.json verify callback (ASVS V11.1.1)
    const rawBody = (req as any).rawBody ? (req as any).rawBody.toString('utf8') : JSON.stringify(req.body);

    try {
      // Webhook replay protection: reject timestamps older than 15 minutes
      const webhookTimestamp = req.headers['x-webhook-timestamp'] as string || req.body.timestamp;
      if (webhookTimestamp) {
        const timestampAge = Date.now() - new Date(webhookTimestamp).getTime();
        if (timestampAge > 15 * 60 * 1000) {
          return res.status(401).json({
            success: false,
            error: 'Webhook timestamp too old'
          });
        }
      }

      // Verify webhook signature
      const receivedSignature = req.headers['x-webhook-signature'] as string;
      const webhookSecret = process.env.WEBHOOK_SECRET;

      if (!receivedSignature) {
        return res.status(401).json({ success: false, error: 'Missing webhook signature' });
      }

      if (!webhookSecret) {
        return res.status(500).json({ success: false, error: 'Webhook secret not configured' });
      }

      const isValidSignature = verifyWebhookSignature(rawBody, receivedSignature, webhookSecret);
      if (!isValidSignature) {
        await securityAudit.log('WEBHOOK_SIGNATURE_INVALID', { severity: 'WARN', req });
        return res.status(401).json({ success: false, error: 'Invalid webhook signature' });
      }

      // Idempotency check: DB-backed dedup using WebhookLog table
      const signatureKey = receivedSignature.startsWith('sha256=') ? receivedSignature.substring(7) : receivedSignature;
      const existingLog = await prisma.webhookLog.findUnique({
        where: { webhookId: signatureKey }
      });
      if (existingLog) {
        await securityAudit.log('WEBHOOK_REPLAY_DETECTED', { severity: 'WARN', req });
        return res.status(200).json({ success: true, message: 'Webhook already processed (duplicate)' });
      }

      // Structured logging: sanitize user-controlled values to prevent log injection
      const safeEvent = String(req.body.event || '').replace(/[\n\r\t]/g, '');
      console.log('Webhook received', JSON.stringify({ event: safeEvent, size: Buffer.byteLength(rawBody) }));

      // Log the webhook receipt before processing
      await prisma.webhookLog.create({
        data: {
          webhookId: signatureKey,
          pennyAccountId: req.body.accountId,
          eventType: req.body.event,
          status: 'processing',
          rawPayload: req.body,
        }
      });

      const result = await gmailService.processWebhook(req.body);

      // Update webhook log with result
      await prisma.webhookLog.update({
        where: { webhookId: signatureKey },
        data: {
          status: result.success ? 'processed' : 'failed',
          errorMessage: result.error || null,
          processedAt: new Date()
        }
      });

      if (!result.success) {
        // Map error codes to HTTP status codes (R2, R3, R4 fixes)
        const statusMap: Record<string, number> = {
          'ACCOUNT_NOT_FOUND': 404,
          'MISSING_FIELDS': 400,
          'INVALID_DATE': 400,
          'INVALID_AMOUNT': 400,
          'INTERNAL_ERROR': 500,
        };
        const httpStatus = (result.errorCode && statusMap[result.errorCode]) || 500;

        return res.status(httpStatus).json({
          success: false,
          error: result.error,
          errorCode: result.errorCode,
          timestamp: new Date().toISOString()
        });
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Webhook error:', error instanceof Error ? error.message : 'Unknown error');
      res.status(500).json({
        success: false,
        error: 'Failed to process webhook',
        timestamp: new Date().toISOString()
      });
    }
  }
);

export default router;
