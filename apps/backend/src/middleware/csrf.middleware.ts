import { Request, Response, NextFunction } from 'express';

/**
 * CSRF protection via Origin header verification.
 * Blocks state-changing requests from untrusted origins when using SameSite=None cookies.
 */
export function csrfProtection(allowedOrigins: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only check state-changing methods
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      return next();
    }

    // Skip CSRF check for webhook endpoints (they use HMAC signatures)
    if (req.path.startsWith('/api/gmail/webhook')) {
      return next();
    }

    const origin = req.headers.origin;
    const referer = req.headers.referer;

    // If Origin header is present, verify it
    if (origin) {
      if (allowedOrigins.includes(origin)) {
        return next();
      }
      return res.status(403).json({
        success: false,
        error: 'CSRF validation failed: untrusted origin'
      });
    }

    // Fall back to Referer header check
    if (referer) {
      try {
        const refererOrigin = new URL(referer).origin;
        if (allowedOrigins.includes(refererOrigin)) {
          return next();
        }
      } catch {
        // Invalid referer URL
      }
      return res.status(403).json({
        success: false,
        error: 'CSRF validation failed: untrusted referer'
      });
    }

    // No Origin or Referer — allow same-origin requests (browser doesn't send Origin for same-origin)
    // This is safe because CORS blocks cross-origin requests without Origin header
    next();
  };
}
