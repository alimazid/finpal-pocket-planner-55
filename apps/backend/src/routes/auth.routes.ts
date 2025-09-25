import { Router } from 'express';
import { AuthService } from '../services/auth.service.js';
import { GoogleAuthService } from '../services/googleAuth.service.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { schemas } from '../middleware/validation.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();
const authService = new AuthService();
const googleAuthService = new GoogleAuthService();

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

// POST /auth/google - Handle Google OAuth login
router.post('/google',
  async (req, res, next) => {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          success: false,
          error: 'Google ID token is required'
        });
      }

      const result = await googleAuthService.loginWithGoogle(idToken);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /auth/google/url - Generate Google OAuth URL
router.get('/google/url',
  async (req, res, next) => {
    try {
      const { state } = req.query;
      const authUrl = googleAuthService.generateAuthUrl(state as string);

      res.json({
        success: true,
        data: { authUrl }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /auth/google/callback - Handle OAuth callback (optional)
router.get('/google/callback',
  async (req, res, next) => {
    try {
      const { code, state } = req.query;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Authorization code is required'
        });
      }

      const googleUser = await googleAuthService.exchangeCodeForTokens(code as string);

      // In a real app, you might redirect to frontend with a token
      res.json({
        success: true,
        message: 'OAuth callback received',
        data: { user: googleUser }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Simple test route for debugging
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Auth routes are working' });
});

export default router;