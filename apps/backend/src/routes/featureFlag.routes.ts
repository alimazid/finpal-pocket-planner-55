import { Router } from 'express';
import { FeatureFlagService } from '../services/featureFlag.service.js';

const router = Router();
const featureFlagService = new FeatureFlagService();

// GET /feature-flags - Get all enabled feature flags for frontend
router.get('/', async (req, res, next) => {
  try {
    const flags = await featureFlagService.getEnabledFlags();

    res.json({
      success: true,
      data: flags
    });
  } catch (error) {
    next(error);
  }
});

// GET /feature-flags/admin - Get all feature flags (admin endpoint)
router.get('/admin', async (req, res, next) => {
  try {
    const flags = await featureFlagService.getAllFlags();

    res.json({
      success: true,
      data: flags
    });
  } catch (error) {
    next(error);
  }
});

// PUT /feature-flags/:key - Update a specific feature flag
router.put('/:key', async (req, res, next) => {
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

    res.json({
      success: true,
      data: flag
    });
  } catch (error) {
    next(error);
  }
});

// POST /feature-flags/bulk - Bulk update feature flags
router.post('/bulk', async (req, res, next) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        error: 'updates must be an array'
      });
    }

    // Validate updates format
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

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

export default router;