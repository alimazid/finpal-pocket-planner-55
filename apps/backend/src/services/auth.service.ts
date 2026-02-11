import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import { prisma } from '../config/database.js';
import { CreateUserDto, LoginDto, User } from '../types/index.js';
import { UnauthorizedError, ValidationError } from '../middleware/error.middleware.js';

// Per-account login attempt tracking (M-3)
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export class AuthService {

  private checkAccountLockout(email: string): void {
    const attempts = loginAttempts.get(email);
    if (attempts && attempts.lockedUntil > Date.now()) {
      const remainingMs = attempts.lockedUntil - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new UnauthorizedError(`Account temporarily locked. Try again in ${remainingMin} minutes`);
    }
  }

  private recordFailedLogin(email: string): void {
    const attempts = loginAttempts.get(email) || { count: 0, lockedUntil: 0 };
    attempts.count++;
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      attempts.lockedUntil = Date.now() + LOCKOUT_DURATION;
      attempts.count = 0;
    }
    loginAttempts.set(email, attempts);
  }

  private clearLoginAttempts(email: string): void {
    loginAttempts.delete(email);
  }

  async register(userData: CreateUserDto): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(userData.password, 12);

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        name: userData.name,
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

    await prisma.userPreference.create({
      data: {
        userId: user.id,
        language: 'spanish',
        periodType: 'calendar_month',
      }
    });

    const accessToken = this.generateToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  async login(loginData: LoginDto): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    // Check per-account lockout before processing
    this.checkAccountLockout(loginData.email);

    const user = await prisma.user.findUnique({
      where: { email: loginData.email }
    });

    if (!user || !user.passwordHash) {
      this.recordFailedLogin(loginData.email);
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(loginData.password, user.passwordHash);
    if (!isValidPassword) {
      this.recordFailedLogin(loginData.email);
      throw new UnauthorizedError('Invalid email or password');
    }

    // Clear attempts on successful login
    this.clearLoginAttempts(loginData.email);

    const accessToken = this.generateToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    const { passwordHash, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  async getProfile(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateData: Partial<CreateUserDto>, currentPassword?: string): Promise<User> {
    const updatePayload: any = {};

    if (updateData.name !== undefined) {
      updatePayload.name = updateData.name;
    }

    if (updateData.email !== undefined) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updateData.email,
          id: { not: userId }
        }
      });

      if (existingUser) {
        throw new ValidationError('Email is already taken');
      }

      updatePayload.email = updateData.email;
    }

    if (updateData.password !== undefined) {
      if (!currentPassword) {
        throw new ValidationError('Current password is required to change password');
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.passwordHash) {
        throw new ValidationError('Cannot change password for this account');
      }

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        throw new ValidationError('Current password is incorrect');
      }

      updatePayload.passwordHash = await bcrypt.hash(updateData.password, 12);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updatePayload,
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

    // Revoke all existing sessions when password is changed
    if (updateData.password !== undefined) {
      await this.revokeAllUserTokens(userId);
    }

    return user;
  }

  generateToken(user: { id: string; email: string }): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: '15m'
      }
    );
  }

  verifyToken(token: string): { userId: string; email: string } {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ['HS256'] }) as any;
      return {
        userId: decoded.userId,
        email: decoded.email
      };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  async generateRefreshToken(userId: string, deviceInfo?: string): Promise<string> {
    const rawToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        deviceInfo,
      }
    });

    return rawToken;
  }

  async refreshAccessToken(rawToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      if (storedToken && !storedToken.isRevoked) {
        // Token expired — revoke it
        await prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: { isRevoked: true }
        });
      }
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Revoke old token (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true }
    });

    // Issue new pair
    const accessToken = this.generateToken(storedToken.user);
    const newRefreshToken = await this.generateRefreshToken(storedToken.userId, storedToken.deviceInfo ?? undefined);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await prisma.refreshToken.updateMany({
      where: { tokenHash, isRevoked: false },
      data: { isRevoked: true }
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true }
    });
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete linked Gmail accounts from Penny first
    const gmailAccounts = await prisma.gmailAccount.findMany({
      where: { userId }
    });

    const pennyApiUrl = process.env.PENNY_API_URL;
    const pennyApiKey = process.env.PENNY_API_KEY;

    if (pennyApiUrl && pennyApiKey) {
      for (const account of gmailAccounts) {
        try {
          await axios.delete(
            `${pennyApiUrl}/api/external/accounts/${account.pennyAccountId}`,
            {
              headers: { 'X-API-Key': pennyApiKey },
              timeout: 10000
            }
          );
        } catch (error) {
          // Log but continue — don't block user deletion
          console.error(`Failed to remove Gmail account ${account.id} from Penny:`, error);
        }
      }
    }

    // Revoke all refresh tokens
    await this.revokeAllUserTokens(userId);

    // Delete user — cascading delete handles related records
    await prisma.user.delete({ where: { id: userId } });
  }
}
