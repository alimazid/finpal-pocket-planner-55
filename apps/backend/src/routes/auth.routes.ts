import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { GoogleAuthService } from '../services/googleAuth.service.js';
import { PasswordResetService } from '../services/passwordReset.service.js';
import { validateBody, validateQuery } from '../middleware/validation.middleware.js';
import { schemas } from '../middleware/validation.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/database.js';
import { securityAudit } from '../services/securityAudit.service.js';

const router = Router();
const authService = new AuthService();
const googleAuthService = new GoogleAuthService();
const passwordResetService = new PasswordResetService();

const isProduction = process.env.NODE_ENV === 'production';

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', { path: '/', secure: isProduction, sameSite: 'lax' });
  res.clearCookie('refresh_token', { path: '/api/auth', secure: isProduction, sameSite: 'lax' });
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
      await securityAudit.log('LOGOUT', { req });
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

// DELETE /auth/profile (requires current password for re-authentication)
router.delete('/profile',
  authenticateToken,
  validateBody(z.object({ currentPassword: z.string().min(1) })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { currentPassword } = req.body;

      // Re-authenticate before destructive action
      const user = await prisma.user.findUnique({ where: { id: req.userId! } });
      if (!user || !user.passwordHash) {
        return res.status(400).json({ success: false, error: 'Cannot verify password for this account' });
      }

      const bcrypt = await import('bcryptjs');
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Current password is incorrect' });
      }

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
  validateBody(z.object({ idToken: z.string().min(1) })),
  async (req, res, next) => {
    try {
      const { idToken } = req.body;
      const result = await googleAuthService.loginWithGoogle(idToken);
      // Generate refresh token for the Google-auth user
      const refreshToken = await authService.generateRefreshToken(result.user.id);
      setAuthCookies(res, result.token, refreshToken);

      await securityAudit.log('GOOGLE_AUTH_SUCCESS', { userId: result.user.id, req });

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

// GET /auth/google/url — Generate Google OAuth URL with server-side CSRF state
router.get('/google/url',
  async (req, res, next) => {
    try {
      const { url, state } = googleAuthService.generateAuthUrl();

      res.json({
        success: true,
        data: { authUrl: url, state }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /auth/google/callback — Handle OAuth callback
router.get('/google/callback',
  validateQuery(z.object({
    code: z.string().min(1),
    state: z.string().min(1).optional()
  })),
  async (req, res, next) => {
    try {
      const { code, state } = req.query;

      // Validate OAuth CSRF state token (ASVS V3.5)
      if (state && !googleAuthService.validateOAuthState(state as string)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired OAuth state parameter'
        });
      }

      const googleUser = await googleAuthService.exchangeCodeForTokens(code as string);
      const result = await googleAuthService.loginWithGoogleUserInfo(googleUser);
      const refreshToken = await authService.generateRefreshToken(result.user.id);
      setAuthCookies(res, result.token, refreshToken);

      await securityAudit.log('GOOGLE_AUTH_SUCCESS', { userId: result.user.id, req });

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

// POST /auth/forgot-password
router.post('/forgot-password',
  validateBody(z.object({
    email: z.string().email()
  })),
  async (req, res, next) => {
    try {
      await passwordResetService.requestPasswordReset(req.body.email);
      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /auth/reset-password
router.post('/reset-password',
  validateBody(z.object({
    token: z.string().min(1),
    password: z.string().min(12).max(128)
  })),
  async (req, res, next) => {
    try {
      await passwordResetService.resetPassword(req.body.token, req.body.password);
      res.json({
        success: true,
        message: 'Password has been reset successfully. Please log in with your new password.'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
