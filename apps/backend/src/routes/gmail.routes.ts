import { Router } from 'express';
import { GmailService } from '../services/gmail.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();
const gmailService = new GmailService();

// Webhook idempotency: track processed signatures to prevent duplicate transactions
const processedWebhooks = new Map<string, number>(); // signature -> timestamp
const WEBHOOK_DEDUP_WINDOW = 10 * 60 * 1000; // 10 minutes

// Clean up old entries periodically
setInterval(() => {
  const cutoff = Date.now() - WEBHOOK_DEDUP_WINDOW;
  for (const [sig, ts] of processedWebhooks) {
    if (ts < cutoff) processedWebhooks.delete(sig);
  }
}, 60 * 1000);

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

const webhookSchema = z.object({
  event: z.string(),
  timestamp: z.string(),
  accountId: z.string(),
  externalUserId: z.string(),
  data: z.any().optional()
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

// POST /api/gmail/accounts/:id/start-monitoring
router.post('/accounts/:id/start-monitoring',
  authenticateToken,
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
    const rawBody = JSON.stringify(req.body);

    try {
      // Webhook replay protection: reject timestamps older than 5 minutes
      const webhookTimestamp = req.headers['x-webhook-timestamp'] as string || req.body.timestamp;
      if (webhookTimestamp) {
        const timestampAge = Date.now() - new Date(webhookTimestamp).getTime();
        if (timestampAge > 5 * 60 * 1000) {
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
        return res.status(401).json({ success: false, error: 'Invalid webhook signature' });
      }

      // Idempotency check: reject duplicate webhooks by signature
      const signatureKey = receivedSignature.startsWith('sha256=') ? receivedSignature.substring(7) : receivedSignature;
      if (processedWebhooks.has(signatureKey)) {
        return res.status(200).json({ success: true, message: 'Webhook already processed (duplicate)' });
      }
      processedWebhooks.set(signatureKey, Date.now());

      // Structured logging: sanitize user-controlled values to prevent log injection
      const safeEvent = String(req.body.event || '').replace(/[\n\r\t]/g, '');
      const safeAccountId = String(req.body.accountId || '').replace(/[\n\r\t]/g, '');
      console.log('Webhook received', JSON.stringify({ event: safeEvent, accountId: safeAccountId, size: Buffer.byteLength(rawBody) }));

      await gmailService.processWebhook(req.body);

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        processedEvent: req.body.event,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Webhook error', JSON.stringify({ event: String(req.body?.event || '').replace(/[\n\r\t]/g, ''), error: error instanceof Error ? error.message : 'Unknown error' }));
      res.status(500).json({
        success: false,
        error: 'Failed to process webhook',
        event: req.body?.event || 'unknown',
        timestamp: new Date().toISOString()
      });
    }
  }
);

export default router;
