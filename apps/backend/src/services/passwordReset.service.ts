import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { ValidationError } from '../middleware/error.middleware.js';

export class PasswordResetService {

  async requestPasswordReset(email: string): Promise<void> {
    // Always return success to prevent account enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      // Silently return - don't reveal if email exists or is OAuth-only
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

    // In production, send email with reset link containing rawToken
    // For now, log it in development only
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Password reset token for ${email}: ${rawToken}`);
    }

    // TODO: Integrate email sending service (SendGrid, etc.)
    // await emailService.sendPasswordResetEmail(email, rawToken);
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
