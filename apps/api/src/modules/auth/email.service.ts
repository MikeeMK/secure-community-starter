import { Injectable, Logger } from '@nestjs/common';

// Lazy-load nodemailer so the app still starts without SMTP configured.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodemailer: typeof import('nodemailer') = require('nodemailer');

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly from = process.env.EMAIL_FROM ?? 'noreply@example.com';
  private readonly appUrl = process.env.APP_URL ?? 'http://localhost:3000';

  private isConfigured() {
    return !!process.env.SMTP_HOST;
  }

  private createTransport() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
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
}
