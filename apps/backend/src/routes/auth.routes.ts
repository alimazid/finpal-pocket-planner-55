import { Router, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { GoogleAuthService } from '../services/googleAuth.service.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { schemas } from '../middleware/validation.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();
const authService = new AuthService();
const googleAuthService = new GoogleAuthService();

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', { path: '/', secure: true, sameSite: 'none' });
  res.clearCookie('refresh_token', { path: '/api/auth', secure: true, sameSite: 'none' });
}

// POST /auth/register
router.post('/register',
  validateBody(schemas.createUser),
  async (req, res, next) => {
    try {
      const result = await authService.register(req.body);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.status(201).json({
        success: true,
        data: {
          user: result.user,
        }
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
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.json({
        success: true,
        data: {
          user: result.user,
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /auth/logout
router.post('/logout',
  async (req, res, next) => {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (refreshToken) {
        await authService.revokeRefreshToken(refreshToken);
      }
      clearAuthCookies(res);
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// POST /auth/refresh
router.post('/refresh',
  async (req, res, next) => {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token required'
        });
      }

      const result = await authService.refreshAccessToken(refreshToken);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.json({
        success: true,
        data: {}
      });
    } catch (error) {
      clearAuthCookies(res);
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
  validateBody(schemas.updateProfile),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await authService.updateProfile(req.userId!, req.body, req.body.currentPassword);
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /auth/profile
router.delete('/profile',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      await authService.deleteUser(req.userId!);
      clearAuthCookies(res);
      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /auth/google — Handle Google OAuth login
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
      // Generate refresh token for the Google-auth user
      const refreshToken = await authService.generateRefreshToken(result.user.id);
      setAuthCookies(res, result.token, refreshToken);

      res.json({
        success: true,
        data: {
          user: result.user,
          isNewUser: result.isNewUser,
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /auth/google/url — Generate Google OAuth URL
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

// GET /auth/google/callback — Handle OAuth callback
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
      const result = await googleAuthService.loginWithGoogleUserInfo(googleUser);
      const refreshToken = await authService.generateRefreshToken(result.user.id);
      setAuthCookies(res, result.token, refreshToken);

      res.json({
        success: true,
        data: {
          user: result.user,
          isNewUser: result.isNewUser,
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
