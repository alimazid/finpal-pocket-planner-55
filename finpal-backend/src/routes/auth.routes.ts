import { Router } from 'express';
import { AuthService } from '../services/auth.service.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { schemas } from '../middleware/validation.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();
const authService = new AuthService();

// POST /auth/register
router.post('/register', 
  validateBody(schemas.createUser),
  async (req, res, next) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /auth/login
router.post('/login',
  validateBody(schemas.login),
  async (req, res, next) => {
    try {
      const result = await authService.login(req.body);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /auth/profile
router.get('/profile',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await authService.getProfile(req.userId!);
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /auth/profile
router.put('/profile',
  authenticateToken,
  validateBody(schemas.createUser.partial()),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await authService.updateProfile(req.userId!, req.body);
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;