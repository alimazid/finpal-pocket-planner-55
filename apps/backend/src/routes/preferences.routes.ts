import { Router } from 'express';
import { prisma } from '../config/database.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { schemas } from '../middleware/validation.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// GET /preferences
router.get('/',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const preferences = await prisma.userPreference.findUnique({
        where: { userId: req.userId! }
      });

      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /preferences
router.put('/',
  authenticateToken,
  validateBody(schemas.updatePreferences),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const preferences = await prisma.userPreference.upsert({
        where: { userId: req.userId! },
        update: {
          ...(req.body.language !== undefined && { language: req.body.language }),
          ...(req.body.periodType !== undefined && { periodType: req.body.periodType }),
          ...(req.body.specificDay !== undefined && { specificDay: req.body.specificDay }),
          ...(req.body.defaultCurrency !== undefined && { defaultCurrency: req.body.defaultCurrency }),
        },
        create: {
          userId: req.userId!,
          language: req.body.language || 'english',
          periodType: req.body.periodType || 'calendar_month',
          specificDay: req.body.specificDay || 1,
          defaultCurrency: req.body.defaultCurrency || 'DOP'
        }
      });

      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;