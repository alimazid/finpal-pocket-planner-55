import { Router } from 'express';
import express from 'express';
import { FeatureFlagService } from '../services/featureFlag.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/database.js';

const router = Router();
const featureFlagService = new FeatureFlagService();

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
router.put('/:key', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { key } = req.params;
    const { isEnabled } = req.body;

    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isEnabled must be a boolean value'
      });
    }

    const flag = await featureFlagService.updateFlag(key, isEnabled);
    res.json({ success: true, data: flag });
  } catch (error) {
    next(error);
  }
});

// POST /feature-flags/bulk — Bulk update feature flags (admin only)
router.post('/bulk', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        error: 'updates must be an array'
      });
    }

    const isValidFormat = updates.every(update =>
      typeof update === 'object' &&
      typeof update.key === 'string' &&
      typeof update.isEnabled === 'boolean'
    );

    if (!isValidFormat) {
      return res.status(400).json({
        success: false,
        error: 'Each update must have key (string) and isEnabled (boolean) properties'
      });
    }

    const results = await featureFlagService.bulkUpdateFlags(updates);
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

export default router;
