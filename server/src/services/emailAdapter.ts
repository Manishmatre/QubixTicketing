import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export class EmailAdapter {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
      });
      this.isConfigured = true;
      console.log('[EmailService] SMTP transporter configured for real email delivery.');
    } else {
      console.log('[EmailService] Running in Mock/Development Mode. Outgoing emails will be logged safely to server console.');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const from = process.env.SMTP_FROM || 'QubixDesk Notification <noreply@qubixdesk.io>';

    if (this.isConfigured && this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html || options.text,
        });
        console.log(`[EmailService] Delivered email to ${options.to} - "${options.subject}"`);
        return true;
      } catch (err: any) {
        console.error(`[EmailService] Failed to send email via SMTP: ${err.message}`);
        return false;
      }
    } else {
      // Mock mode logging
      console.log(`\n================== [QUBIXDESK OUTGOING EMAIL - TEST MODE] ==================`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Content:\n${options.text}`);
      console.log(`========================================================================\n`);
      return true;
    }
  }
}

export const emailService = new EmailAdapter();

