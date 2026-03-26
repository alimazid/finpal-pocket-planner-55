import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { ValidationError } from '../middleware/error.middleware.js';
import { emailService } from './email.service.js';

export class PasswordResetService {

  async requestPasswordReset(email: string): Promise<void> {
    // Always return success to prevent account enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Silently return - don't reveal if account exists (prevent enumeration)
      return;
    }
    if (!user.passwordHash) {
      // OAuth-only account — send a helpful email instead of silently failing
      console.log(`[PASSWORD_RESET] OAuth-only account, sending info email to: ${email}`);
      await emailService.sendOAuthAccountEmail(email);
      return;
    }

    // Rate limit: max 3 reset tokens per user per hour
    const recentTokens = await prisma.passwordResetToken.count({
      where: {
        userId: user.id,
        createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) }
      }
    });
    if (recentTokens >= 3) {
      // Silently return - don't reveal rate limiting
      return;
    }

    // Revoke any existing unused tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() } // Mark as used to invalidate
    });

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      }
    });

    // Send password reset email (fails silently to prevent enumeration)
    await emailService.sendPasswordResetEmail(email, rawToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!resetToken) {
      throw new ValidationError('Invalid or expired reset token');
    }

    if (resetToken.usedAt) {
      throw new ValidationError('Invalid or expired reset token');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Atomically: update password, mark token used, revoke all refresh tokens
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() }
      }),
      prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, isRevoked: false },
        data: { isRevoked: true }
      })
    ]);
  }
}
