import { Injectable, Logger } from '@nestjs/common';

// Lazy-load nodemailer so the app still starts without SMTP configured.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodemailer: typeof import('nodemailer') = require('nodemailer');

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly emailEnabled = process.env.EMAIL_ENABLED !== 'false';
  private readonly from = process.env.EMAIL_FROM ?? 'noreply@example.com';
  private readonly appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  private readonly smtpHost = process.env.SMTP_HOST?.trim();
  private readonly smtpPort = parseInt(process.env.SMTP_PORT ?? '587', 10);
  private readonly smtpSecure = process.env.SMTP_SECURE === 'true';
  private readonly smtpUser = process.env.SMTP_USER?.trim();
  private readonly smtpPass = process.env.SMTP_PASS?.trim();

  private isConfigured() {
    return this.emailEnabled && !!this.smtpHost;
  }

  private createTransport() {
    return nodemailer.createTransport({
      host: this.smtpHost,
      port: this.smtpPort,
      secure: this.smtpSecure,
      ...(this.smtpUser || this.smtpPass
        ? {
            auth: {
              user: this.smtpUser,
              pass: this.smtpPass,
            },
          }
        : {}),
    });
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.isConfigured()) {
      this.logger.warn(`[EMAIL NOT SENT — SMTP not configured]\nTo: ${to}\nSubject: ${subject}\n${html}`);
      return;
    }
    const transport = this.createTransport();
    await transport.sendMail({ from: this.from, to, subject, html });
  }

  async sendVerificationEmail(to: string, token: string) {
    const url = `${this.appUrl}/verifier-email?token=${token}`;
    await this.send(
      to,
      'Vérifiez votre adresse e-mail',
      `<p>Bienvenue ! Cliquez sur le lien ci-dessous pour confirmer votre adresse e-mail :</p>
       <p><a href="${url}">${url}</a></p>
       <p>Ce lien expire dans 24 heures.</p>`,
    );
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const url = `${this.appUrl}/reinitialiser-mot-de-passe?token=${token}`;
    await this.send(
      to,
      'Réinitialisation de votre mot de passe',
      `<p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :</p>
       <p><a href="${url}">${url}</a></p>
       <p>Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet e-mail.</p>`,
    );
  }

  async sendModerationNoticeEmail(to: string, subject: string, message: string) {
    await this.send(
      to,
      subject,
      `<p>${message}</p>
       <p>Si vous pensez qu'il s'agit d'une erreur, vous pourrez contacter l'équipe quand ce canal sera ouvert.</p>`,
    );
  }
}
