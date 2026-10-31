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
    const from = process.env.SMTP_FROM || 'QubixDesk <arionextech@gmail.com>';

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

  async sendVerificationEmail(to: string, name: string, token: string): Promise<boolean> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #EAECF0; rounded: 16px;">
        <div style="margin-bottom: 24px; text-align: center;">
          <h1 style="color: #0F172A; font-size: 22px; font-weight: 800; margin: 0;">QUBIXDESK</h1>
          <p style="color: #64748B; font-size: 12px; margin: 4px 0 0 0;">Work Smarter. Track Better. Deliver Faster.</p>
        </div>
        <div style="background: #F8FAFC; border: 1px solid #EAECF0; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
          <h2 style="font-size: 16px; font-weight: 700; color: #0F172A; margin: 0 0 12px 0;">Verify your email address</h2>
          <p style="font-size: 14px; color: #334155; line-height: 1.5; margin: 0 0 16px 0;">
            Hi ${name || 'there'},<br/>
            Welcome to QubixDesk. Please confirm that this is your email address to activate your account and start collaborating with your team.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${verifyUrl}" style="background-color: #2563EB; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="font-size: 12px; color: #64748B; margin: 0;">
            If the button above does not work, copy and paste this link into your browser:<br/>
            <a href="${verifyUrl}" style="color: #2563EB; word-break: break-all;">${verifyUrl}</a>
          </p>
        </div>
        <p style="font-size: 11px; color: #94A3B8; text-align: center; margin: 0;">
          This link will expire in 24 hours. If you did not create a QubixDesk account, you can safely ignore this email.
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'Verify your email address - QubixDesk',
      text: `Hi ${name},\nPlease verify your email by visiting: ${verifyUrl}`,
      html,
    });
  }

  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<boolean> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #EAECF0; rounded: 16px;">
        <div style="margin-bottom: 24px; text-align: center;">
          <h1 style="color: #0F172A; font-size: 22px; font-weight: 800; margin: 0;">QUBIXDESK</h1>
          <p style="color: #64748B; font-size: 12px; margin: 4px 0 0 0;">Work Smarter. Track Better. Deliver Faster.</p>
        </div>
        <div style="background: #F8FAFC; border: 1px solid #EAECF0; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
          <h2 style="font-size: 16px; font-weight: 700; color: #0F172A; margin: 0 0 12px 0;">Reset your password</h2>
          <p style="font-size: 14px; color: #334155; line-height: 1.5; margin: 0 0 16px 0;">
            Hi ${name || 'there'},<br/>
            We received a request to reset your QubixDesk account password. Click the button below to choose a new password.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #2563EB; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 12px; color: #64748B; margin: 0;">
            If the button does not work, use this link directly:<br/>
            <a href="${resetUrl}" style="color: #2563EB; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
        <p style="font-size: 11px; color: #94A3B8; text-align: center; margin: 0;">
          This reset link will expire in 1 hour. If you did not request a password reset, your account is secure and no action is required.
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'Reset your QubixDesk password',
      text: `Hi ${name},\nReset your password at: ${resetUrl}`,
      html,
    });
  }

  async sendTeamInvitationEmail(
    to: string,
    orgName: string,
    inviterName: string,
    role: string,
    token: string
  ): Promise<boolean> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteUrl = `${frontendUrl}/accept-invite?token=${token}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #EAECF0; rounded: 16px;">
        <div style="margin-bottom: 24px; text-align: center;">
          <h1 style="color: #0F172A; font-size: 22px; font-weight: 800; margin: 0;">QUBIXDESK</h1>
          <p style="color: #64748B; font-size: 12px; margin: 4px 0 0 0;">Work Smarter. Track Better. Deliver Faster.</p>
        </div>
        <div style="background: #F8FAFC; border: 1px solid #EAECF0; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
          <h2 style="font-size: 16px; font-weight: 700; color: #0F172A; margin: 0 0 12px 0;">You've been invited to join ${orgName}</h2>
          <p style="font-size: 14px; color: #334155; line-height: 1.5; margin: 0 0 16px 0;">
            <strong>${inviterName || 'A teammate'}</strong> has invited you to collaborate in the <strong>${orgName}</strong> workspace on QubixDesk with the role of <strong>${role}</strong>.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${inviteUrl}" style="background-color: #2563EB; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
              Accept Invitation & Join Team
            </a>
          </div>
          <p style="font-size: 12px; color: #64748B; margin: 0;">
            Direct link: <a href="${inviteUrl}" style="color: #2563EB; word-break: break-all;">${inviteUrl}</a>
          </p>
        </div>
        <p style="font-size: 11px; color: #94A3B8; text-align: center; margin: 0;">
          This invitation will expire in 7 days.
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `You've been invited to join ${orgName} on QubixDesk`,
      text: `Hi,\nYou have been invited to join ${orgName} as ${role}. Accept your invitation at: ${inviteUrl}`,
      html,
    });
  }
}

export const emailService = new EmailAdapter();

