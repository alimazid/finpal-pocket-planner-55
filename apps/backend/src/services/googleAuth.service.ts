import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { prisma } from '../config/database.js';
import { User } from '../types/index.js';
import { UnauthorizedError, ValidationError } from '../middleware/error.middleware.js';

export interface GoogleAuthResult {
  user: User;
  token: string;
  isNewUser: boolean;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  verified_email: boolean;
}

export class GoogleAuthService {
  private oauth2Client: OAuth2Client;

  constructor() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
    }

    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_AUTH_REDIRECT_URI
    );
  }

  /**
   * Verify Google ID token and extract user information
   */
  async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedError('Invalid Google token payload');
      }

      if (!payload.email) {
        throw new ValidationError('Email not provided by Google');
      }

      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        verified_email: payload.email_verified || false,
      };
    } catch (error) {
      console.error('Google token verification failed:', error);
      throw new UnauthorizedError('Invalid Google token');
    }
  }

  /**
   * Login or register user with Google account
   */
  async loginWithGoogle(idToken: string): Promise<GoogleAuthResult> {
    const googleUser = await this.verifyIdToken(idToken);
    return await this.loginWithGoogleUserInfo(googleUser);
  }

  /**
   * Login or register user with Google user info (common logic)
   */
  async loginWithGoogleUserInfo(googleUser: GoogleUserInfo): Promise<GoogleAuthResult> {
    if (!googleUser.verified_email) {
      throw new ValidationError('Google email is not verified');
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    let isNewUser = false;

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split('@')[0],
          emailVerified: new Date(),
          image: googleUser.picture,
          // passwordHash is null for OAuth users
        },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      // Create default preferences for new user
      await prisma.userPreference.create({
        data: {
          userId: user.id,
          language: 'spanish',
          periodType: 'calendar_month',
        }
      });

      isNewUser = true;
    } else {
      // Update existing user with Google info if needed
      const updateData: any = {};

      if (!user.emailVerified) {
        updateData.emailVerified = new Date();
      }

      if (!user.image && googleUser.picture) {
        updateData.image = googleUser.picture;
      }

      if (!user.name && googleUser.name) {
        updateData.name = googleUser.name;
      }

      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
          select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true,
            image: true,
            createdAt: true,
            updatedAt: true,
          }
        });
      }
    }

    // Store or update Google account info
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: googleUser.id,
        },
      },
      update: {
        // Update access info if needed
      },
      create: {
        userId: user.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId: googleUser.id,
      },
    });

    // Generate JWT token (reusing existing auth service logic)
    const { AuthService } = await import('./auth.service.js');
    const authService = new AuthService();
    const token = (authService as any).generateToken(user);

    return {
      user,
      token,
      isNewUser,
    };
  }

  /**
   * Generate Google OAuth authorization URL
   */
  generateAuthUrl(state?: string): string {
    const scopes = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state,
      prompt: 'select_account',
    });
  }

  /**
   * Exchange authorization code for tokens (for server-side OAuth flow)
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleUserInfo> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      if (!tokens.id_token) {
        throw new UnauthorizedError('No ID token received from Google');
      }

      return await this.verifyIdToken(tokens.id_token);
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new UnauthorizedError('Failed to exchange authorization code');
    }
  }
}