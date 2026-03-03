import { Router } from 'express';
import express from 'express';
import { FeatureFlagService } from '../services/featureFlag.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateBody, validateParams } from '../middleware/validation.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/database.js';
import { z } from 'zod';

const router = Router();
const featureFlagService = new FeatureFlagService();

// Validation schemas
const flagKeySchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid flag key format')
});

const updateFlagSchema = z.object({
  isEnabled: z.boolean()
});

const bulkUpdateSchema = z.object({
  updates: z.array(z.object({
    key: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_.-]+$/),
    isEnabled: z.boolean()
  })).min(1).max(50)
});

// Simple admin check middleware
const requireAdmin = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
  if (adminEmails.length === 0) {
    // If no admin emails configured, deny all admin access
    return res.status(403).json({ success: false, error: 'Admin access not configured' });
  }
  // req.userId is set by authenticateToken
  const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { email: true } });
  if (!user || !adminEmails.includes(user.email)) {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

// GET /feature-flags — Get all enabled feature flags for frontend (public)
router.get('/', async (req, res, next) => {
  try {
    const flags = await featureFlagService.getEnabledFlags();
    res.json({ success: true, data: flags });
  } catch (error) {
    next(error);
  }
});

// GET /feature-flags/admin — Get all feature flags (admin only)
router.get('/admin', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const flags = await featureFlagService.getAllFlags();
    res.json({ success: true, data: flags });
  } catch (error) {
    next(error);
  }
});

// PUT /feature-flags/:key — Update a specific feature flag (admin only)
router.put('/:key', authenticateToken, requireAdmin, validateParams(flagKeySchema), validateBody(updateFlagSchema), async (req, res, next) => {
  try {
    const { key } = req.params;
    const { isEnabled } = req.body;
    const flag = await featureFlagService.updateFlag(key, isEnabled);
    res.json({ success: true, data: flag });
  } catch (error) {
    next(error);
  }
});

// POST /feature-flags/bulk — Bulk update feature flags (admin only)
router.post('/bulk', authenticateToken, requireAdmin, validateBody(bulkUpdateSchema), async (req, res, next) => {
  try {
    const { updates } = req.body;
    const results = await featureFlagService.bulkUpdateFlags(updates);
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

export default router;
