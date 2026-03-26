import { Resend } from 'resend';

// Reset password page URL. For mobile dev: points to pocketpenny.site/reset-password web page.
// Production app will use the same web page (which can also deep-link into the app).
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://pocketpenny.site';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@pocketpenny.site';
const IS_DEV = process.env.NODE_ENV !== 'production';

export class EmailService {
  private resend: Resend | null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const base = FRONTEND_URL.endsWith('/') ? FRONTEND_URL.slice(0, -1) : FRONTEND_URL;
    const resetLink = `${base}/reset-password?token=${token}`;

    if (IS_DEV && !this.resend) {
      console.log(`[DEV] Password reset email for ${email}`);
      console.log(`[DEV] Reset link: ${resetLink}`);
      return;
    }

    if (!this.resend) {
      console.warn('[EMAIL] RESEND_API_KEY not configured — skipping email send');
      return;
    }

    try {
      await this.resend.emails.send({
        from: `Pocket Penny <${FROM_EMAIL}>`,
        to: email,
        subject: 'Restablecer tu contraseña - Pocket Penny',
        html: this.buildPasswordResetHtml(resetLink),
      });
    } catch (error) {
      // Fail silently — don't reveal whether the email was sent
      console.error('[EMAIL] Failed to send password reset email:', error);
    }
  }

  async sendOAuthAccountEmail(email: string): Promise<void> {
    if (!this.resend) {
      console.log(`[DEV] OAuth account info email for: ${email}`);
      return;
    }
    try {
      await this.resend.emails.send({
        from: `Pocket Penny <${FROM_EMAIL}>`,
        to: email,
        subject: 'Información sobre tu cuenta - Pocket Penny',
        html: this.buildOAuthAccountHtml(),
      });
    } catch (error) {
      console.error('[EMAIL] Failed to send OAuth account email:', error);
    }
  }

  private buildOAuthAccountHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:32px 32px 24px;text-align:center;">
          <h1 style="margin:0 0 8px;font-size:22px;color:#18181b;">Información sobre tu cuenta</h1>
          <p style="margin:0;color:#71717a;font-size:14px;">Pocket Penny</p>
        </td></tr>
        <tr><td style="padding:0 32px 32px;">
          <p style="color:#3f3f46;font-size:15px;line-height:1.6;">
            Tu cuenta de Pocket Penny está vinculada a <strong>Google</strong>.
            No tienes una contraseña tradicional configurada.
          </p>
          <p style="color:#3f3f46;font-size:15px;line-height:1.6;">
            Para iniciar sesión, usa el botón <strong>"Continuar con Google"</strong> en la pantalla de acceso.
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#fafafa;border-top:1px solid #e4e4e7;">
          <p style="margin:0;color:#a1a1aa;font-size:12px;text-align:center;">&copy; Pocket Penny</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
  }

  private buildPasswordResetHtml(resetLink: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:32px 32px 24px;text-align:center;">
          <h1 style="margin:0 0 8px;font-size:22px;color:#18181b;">Restablecer Contraseña</h1>
          <p style="margin:0;color:#71717a;font-size:14px;">Pocket Penny</p>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <p style="color:#3f3f46;font-size:15px;line-height:1.6;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta.
            Haz clic en el botón de abajo para crear una nueva contraseña.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:16px 0;">
              <a href="${resetLink}"
                 style="display:inline-block;padding:12px 32px;background:#18181b;color:#ffffff;
                        text-decoration:none;border-radius:6px;font-size:15px;font-weight:500;">
                Restablecer Contraseña
              </a>
            </td></tr>
          </table>
          <p style="color:#71717a;font-size:13px;line-height:1.5;">
            Este enlace expira en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo.
          </p>
          <p style="color:#a1a1aa;font-size:12px;margin-top:16px;word-break:break-all;">
            ${resetLink}
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#fafafa;border-top:1px solid #e4e4e7;">
          <p style="margin:0;color:#a1a1aa;font-size:12px;text-align:center;">
            &copy; Pocket Penny
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
  }
}

export const emailService = new EmailService();
