import { Router } from 'express';
import { GmailService } from '../services/gmail.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();
const gmailService = new GmailService();

// Helper function to verify webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    // Remove 'sha256=' prefix if present
    const cleanSignature = signature.startsWith('sha256=')
      ? signature.substring(7)
      : signature;

    // Validate signature length (SHA256 hex = 64 chars)
    if (cleanSignature.length !== 64) {
      return false;
    }

    // Use crypto.timingSafeEqual to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(cleanSignature, 'hex')
    );
  } catch (error) {
    // Invalid hex string or other crypto errors
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

// GET /api/gmail/auth - Generate OAuth authorization URL
router.get('/auth',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.userId!;
      const webhookUrl = req.query.webhookUrl as string;

      const { url, state } = gmailService.generateAuthUrl(userId);

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

// POST /api/gmail/callback - Handle OAuth callback
router.post('/callback',
  authenticateToken,
  validateBody(callbackSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { code, state } = req.body;
      const webhookUrl = req.body.webhookUrl as string;

      // Validate state parameter
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
      console.error('Gmail callback error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect Gmail account'
      });
    }
  }
);

// GET /api/gmail/accounts - List connected Gmail accounts
router.get('/accounts',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.userId!;
      const accounts = await gmailService.getUserGmailAccounts(userId);

      res.json({
        success: true,
        data: accounts
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/gmail/accounts/:id/status - Get account status from Penny
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

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/gmail/accounts/:id/start-monitoring - Start monitoring
router.post('/accounts/:id/start-monitoring',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.userId!;
      const accountId = req.params.id;

      const success = await gmailService.startMonitoring(accountId, userId);

      if (!success) {
        return res.status(400).json({
          success: false,
          error: 'Failed to start monitoring'
        });
      }

      res.json({
        success: true,
        message: 'Monitoring started successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/gmail/accounts/:id/stop-monitoring - Stop monitoring
router.post('/accounts/:id/stop-monitoring',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.userId!;
      const accountId = req.params.id;

      const success = await gmailService.stopMonitoring(accountId, userId);

      if (!success) {
        return res.status(400).json({
          success: false,
          error: 'Failed to stop monitoring'
        });
      }

      res.json({
        success: true,
        message: 'Monitoring stopped successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/gmail/accounts/:id - Remove Gmail account
router.delete('/accounts/:id',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.userId!;
      const accountId = req.params.id;

      const success = await gmailService.removeAccount(accountId, userId);

      if (!success) {
        return res.status(400).json({
          success: false,
          error: 'Failed to remove account'
        });
      }

      res.json({
        success: true,
        message: 'Gmail account removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Helper function to safely stringify and format objects
function formatPayloadForLogging(obj: any, maxDepth: number = 3): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    return `[Circular/Error: ${error}]`;
  }
}

// Helper function to analyze payload structure
function analyzePayload(payload: any): string {
  if (!payload || typeof payload !== 'object') return 'Invalid payload';

  const analysis = [];
  if (payload.event) analysis.push(`Event: ${payload.event}`);
  if (payload.accountId) analysis.push(`Account: ${payload.accountId}`);
  if (payload.externalUserId) analysis.push(`User: ${payload.externalUserId}`);
  if (payload.data) {
    const dataKeys = Object.keys(payload.data);
    analysis.push(`Data fields: ${dataKeys.length} (${dataKeys.join(', ')})`);

    // Analyze extractedData if present
    if (payload.data.extractedData) {
      const extracted = payload.data.extractedData;
      analysis.push(`└─ Transaction: ${extracted.type} $${extracted.amount} ${extracted.currency || 'USD'}`);
      if (extracted.description) analysis.push(`└─ Description: ${extracted.description.substring(0, 50)}${extracted.description.length > 50 ? '...' : ''}`);
    }
  }
  return analysis.join('\n│ ');
}

// POST /api/gmail/webhook - Receive webhooks from Penny
router.post('/webhook',
  validateBody(webhookSchema),
  async (req, res, next) => {
    const timestamp = new Date().toISOString();
    const rawBody = JSON.stringify(req.body);
    const payloadSize = Buffer.byteLength(rawBody, 'utf8');

    console.log(`\n🔔 WEBHOOK REQUEST RECEIVED [${timestamp}]`);
    console.log(`┌─────────────────────────────────────────────────────────┐`);
    console.log(`│ Method: POST /api/gmail/webhook                         │`);
    console.log(`│ Content-Length: ${payloadSize} bytes                            │`);
    console.log(`│ Headers:                                                │`);
    console.log(`│   Content-Type: ${(req.headers['content-type'] || 'none').padEnd(36)} │`);
    console.log(`│   User-Agent: ${(req.headers['user-agent'] || 'none').toString().substring(0, 41)} │`);
    console.log(`│   x-webhook-signature: ${(req.headers['x-webhook-signature'] || 'none').toString().substring(0, 20)}... │`);
    console.log(`│                                                         │`);
    console.log(`│ Payload Analysis:                                       │`);
    console.log(`│ ${analyzePayload(req.body).split('\n').join('\n│ ').padEnd(55)} │`);
    console.log(`└─────────────────────────────────────────────────────────┘`);

    console.log(`\n📋 COMPLETE PAYLOAD RECEIVED:`);
    console.log('┌──────────────────────────────────────────────────────────────────────┐');
    const formattedPayload = formatPayloadForLogging(req.body);
    formattedPayload.split('\n').forEach((line, index) => {
      const paddedLine = line.padEnd(68);
      console.log(`│ ${paddedLine} │`);
    });
    console.log('└──────────────────────────────────────────────────────────────────────┘');

    try {
      // Verify webhook signature using HMAC-SHA256
      const receivedSignature = req.headers['x-webhook-signature'] as string;
      const webhookSecret = process.env.WEBHOOK_SECRET;

      console.log(`🔐 Webhook Signature Validation:`);
      console.log(`   Signature Header: ${receivedSignature ? 'Present' : 'Missing'}`);
      console.log(`   Webhook Secret: ${webhookSecret ? 'Configured' : 'Missing'}`);

      if (!receivedSignature) {
        console.log(`❌ WEBHOOK REJECTED - No signature provided`);
        return res.status(401).json({
          success: false,
          error: 'Missing webhook signature'
        });
      }

      if (!webhookSecret) {
        console.log(`❌ WEBHOOK REJECTED - No webhook secret configured`);
        return res.status(500).json({
          success: false,
          error: 'Webhook secret not configured'
        });
      }

      const isValidSignature = verifyWebhookSignature(rawBody, receivedSignature, webhookSecret);
      console.log(`   Signature Valid: ${isValidSignature ? '✅ YES' : '❌ NO'}`);

      if (!isValidSignature) {
        console.log(`❌ WEBHOOK REJECTED - Invalid signature`);
        return res.status(401).json({
          success: false,
          error: 'Invalid webhook signature'
        });
      }

      console.log(`✅ WEBHOOK AUTHENTICATED - Processing...`);

      const processingResult = await gmailService.processWebhook(req.body);

      console.log(`\n✅ WEBHOOK PROCESSED SUCCESSFULLY`);
      console.log(`┌─────────────────────────────────────────────────────────┐`);
      console.log(`│ Event Type: ${req.body.event.padEnd(43)} │`);
      console.log(`│ Processing Status: Success                              │`);
      if (req.body.data?.extractedData) {
        const extracted = req.body.data.extractedData;
        console.log(`│ Transaction Created: ${extracted.type} $${extracted.amount} ${extracted.currency || 'USD'}      │`);
      }
      console.log(`│ Response Time: ${new Date().toISOString()}              │`);
      console.log(`└─────────────────────────────────────────────────────────┘\n`);

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        processedEvent: req.body.event,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('\n❌ WEBHOOK PROCESSING ERROR');
      console.error('┌─────────────────────────────────────────────────────────┐');
      console.error(`│ Event Type: ${req.body?.event || 'unknown'.padEnd(43)} │`);
      console.error(`│ Error: ${(error instanceof Error ? error.message : String(error)).substring(0, 50).padEnd(50)} │`);
      console.error(`│ Stack Trace:                                            │`);
      if (error instanceof Error && error.stack) {
        const stackLines = error.stack.split('\n').slice(0, 3);
        stackLines.forEach(line => {
          const trimmedLine = line.trim().substring(0, 55);
          console.error(`│   ${trimmedLine.padEnd(53)} │`);
        });
      }
      console.error(`│ Payload Event: ${req.body?.event || 'unknown'.padEnd(39)} │`);
      console.error(`│ Account ID: ${req.body?.accountId || 'unknown'.padEnd(42)} │`);
      console.error('└─────────────────────────────────────────────────────────┘\n');

      res.status(500).json({
        success: false,
        error: 'Failed to process webhook',
        event: req.body?.event || 'unknown',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// GET /api/gmail/test - Simple test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Gmail routes are working',
    timestamp: new Date().toISOString()
  });
});

export default router;