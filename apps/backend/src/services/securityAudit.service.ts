import { Request } from 'express';
import { prisma } from '../config/database.js';

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'REGISTER'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_COMPLETE'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_DELETED'
  | 'TOKEN_REFRESH'
  | 'TOKEN_REFRESH_FAILED'
  | 'GOOGLE_AUTH_SUCCESS'
  | 'GOOGLE_AUTH_FAILED'
  | 'GMAIL_ACCOUNT_CONNECTED'
  | 'GMAIL_ACCOUNT_REMOVED'
  | 'WEBHOOK_SIGNATURE_INVALID'
  | 'WEBHOOK_REPLAY_DETECTED'
  | 'CSRF_VIOLATION'
  | 'RATE_LIMIT_EXCEEDED';

export type SecuritySeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export class SecurityAuditService {
  private static instance: SecurityAuditService;

  static getInstance(): SecurityAuditService {
    if (!this.instance) {
      this.instance = new SecurityAuditService();
    }
    return this.instance;
  }

  async log(
    eventType: SecurityEventType,
    options: {
      userId?: string;
      severity?: SecuritySeverity;
      req?: Request;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<void> {
    try {
      const { userId, severity = 'INFO', req, metadata } = options;

      await prisma.securityEvent.create({
        data: {
          eventType,
          userId: userId || null,
          severity,
          ipAddress: req ? this.getClientIp(req) : null,
          userAgent: req ? (req.headers['user-agent'] || null) : null,
          metadata: metadata ? (metadata as any) : undefined,
        }
      });
    } catch (error) {
      // Never let audit logging break the application
      console.error('Security audit log failed:', error instanceof Error ? error.message : error);
    }
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}

export const securityAudit = SecurityAuditService.getInstance();
