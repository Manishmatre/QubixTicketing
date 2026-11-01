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

  public getBaseUrl(): string {
    if (process.env.APP_URL && process.env.APP_URL.startsWith('http')) {
      return process.env.APP_URL.replace(/\/+$/, '');
    }
    const raw = process.env.FRONTEND_URL || '';
    const first = raw.split(',')[0]?.trim();
    if (first && first.startsWith('http') && !first.includes('localhost')) {
      return first.replace(/\/+$/, '');
    }
    // Always default to live production domain to prevent localhost leakage in emails
    return 'https://ticketing.godspeedhomesales.com';
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const from = process.env.SMTP_FROM || 'Godspeed Home Sales <andrewfarley@godspeedhomesales.com>';

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
      console.log(`\n================== [GODSPEED OUTGOING EMAIL - TEST MODE] ==================`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Content:\n${options.text}`);
      console.log(`========================================================================\n`);
      return true;
    }
  }

  async sendOtpVerificationEmail(to: string, name: string, otp: string, token?: string): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const verifyUrl = token ? `${baseUrl}/verify-email?token=${token}&email=${encodeURIComponent(to)}` : `${baseUrl}/verify-email?email=${encodeURIComponent(to)}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #EAECF0; border-radius: 16px;">
        <div style="margin-bottom: 24px; text-align: center;">
          <h1 style="color: #0F172A; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">GODSPEED OPERATIONS</h1>
          <p style="color: #64748B; font-size: 13px; margin: 4px 0 0 0;">GodSpeed Home Sales • Operations & Task Desk</p>
        </div>
        <div style="background: #F8FAFC; border: 1px solid #EAECF0; padding: 28px; border-radius: 12px; margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: 800; color: #0F172A; margin: 0 0 8px 0; text-align: center;">Your Verification Code</h2>
          <p style="font-size: 14px; color: #334155; line-height: 1.5; margin: 0 0 20px 0; text-align: center;">
            Hi <strong>${name || 'there'}</strong>, here is your 6-digit confirmation code:
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #1D4ED8; background: #EFF6FF; padding: 18px 36px; border-radius: 14px; border: 2px dashed #3B82F6; font-family: 'Courier New', Courier, monospace;">
              ${otp}
            </div>
          </div>
          <p style="font-size: 13px; color: #64748B; margin: 0 0 16px 0; text-align: center;">
            Enter this 6-digit code on the verification screen. This security code expires in <strong>15 minutes</strong>.
          </p>
          <div style="text-align: center; padding-top: 16px; border-top: 1px solid #EAECF0;">
            <p style="font-size: 12px; color: #64748B; margin: 0 0 8px 0;">Or click below to verify automatically:</p>
            <a href="${verifyUrl}" style="background-color: #2563EB; color: #ffffff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; display: inline-block;">
              Verify Email Directly &rarr;
            </a>
          </div>
        </div>
        <p style="font-size: 11px; color: #94A3B8; text-align: center; margin: 0;">
          If you did not request access to Godspeed Operations Desk, please ignore this email.
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `[Godspeed Operations] ${otp} is your verification code`,
      text: `Hi ${name},\n\nYour 6-digit verification code is:\n\n    ${otp}\n\nEnter this 6-digit code on the verification screen to activate your account.\nThis code expires in 15 minutes.\n\nOr verify directly with one click:\n${verifyUrl}\n\n- The Godspeed Operations Team`,
      html,
    });
  }

  async sendVerificationEmail(to: string, name: string, token: string): Promise<boolean> {
    const fallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();
    return this.sendOtpVerificationEmail(to, name, fallbackOtp, token);
  }

  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #EAECF0; border-radius: 16px;">
        <div style="margin-bottom: 24px; text-align: center;">
          <h1 style="color: #0F172A; font-size: 22px; font-weight: 800; margin: 0;">GODSPEED OPERATIONS</h1>
          <p style="color: #64748B; font-size: 12px; margin: 4px 0 0 0;">Dedicated Operations & Task Management Desk</p>
        </div>
        <div style="background: #F8FAFC; border: 1px solid #EAECF0; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
          <h2 style="font-size: 16px; font-weight: 700; color: #0F172A; margin: 0 0 12px 0;">Reset your password</h2>
          <p style="font-size: 14px; color: #334155; line-height: 1.5; margin: 0 0 16px 0;">
            Hi ${name || 'there'},<br/>
            We received a request to reset your Godspeed Desk password. Click the button below to choose a new password.
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
      subject: 'Reset your Godspeed Operations Desk password',
      text: `Hi ${name},\nReset your password at: ${resetUrl}\n\n- The Godspeed Operations Team`,
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
    const baseUrl = this.getBaseUrl();
    const inviteUrl = `${baseUrl}/accept-invite?token=${token}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #EAECF0; border-radius: 16px;">
        <div style="margin-bottom: 24px; text-align: center;">
          <h1 style="color: #0F172A; font-size: 22px; font-weight: 800; margin: 0;">GODSPEED OPERATIONS</h1>
          <p style="color: #64748B; font-size: 12px; margin: 4px 0 0 0;">Dedicated Operations & Task Management Desk</p>
        </div>
        <div style="background: #F8FAFC; border: 1px solid #EAECF0; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
          <h2 style="font-size: 16px; font-weight: 700; color: #0F172A; margin: 0 0 12px 0;">You've been invited to join ${orgName}</h2>
          <p style="font-size: 14px; color: #334155; line-height: 1.5; margin: 0 0 16px 0;">
            <strong>${inviterName || 'An administrator'}</strong> has invited you to collaborate in the <strong>${orgName}</strong> workspace on Godspeed Desk with the role of <strong>${role}</strong>.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${inviteUrl}" style="background-color: #2563EB; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
              Accept Invitation & Join Team &rarr;
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
      subject: `You've been invited to join ${orgName} on Godspeed Desk`,
      text: `Hi,\nYou have been invited to join ${orgName} as ${role}. Accept your invitation at: ${inviteUrl}\n\n- The Godspeed Operations Team`,
      html,
    });
  }

  async sendWorkspaceAddedEmail(
    to: string,
    orgName: string,
    inviterName: string,
    role: string,
    userName: string
  ): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const loginUrl = `${baseUrl}/login`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #EAECF0; border-radius: 16px;">
        <div style="margin-bottom: 24px; text-align: center;">
          <h1 style="color: #0F172A; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">GODSPEED OPERATIONS</h1>
          <p style="color: #64748B; font-size: 13px; margin: 4px 0 0 0;">GodSpeed Home Sales • Operations & Task Desk</p>
        </div>
        <div style="background: #F8FAFC; border: 1px solid #EAECF0; padding: 28px; border-radius: 12px; margin-bottom: 24px;">
          <div style="display: inline-block; background: #EFF6FF; color: #2563EB; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 6px; margin-bottom: 12px; text-transform: uppercase;">
            Workspace Access Granted
          </div>
          <h2 style="font-size: 18px; font-weight: 800; color: #0F172A; margin: 0 0 12px 0;">
            You have been added to ${orgName}
          </h2>
          <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
            Hi <strong>${userName || 'there'}</strong>,<br/>
            <strong>${inviterName || 'Workspace Admin'}</strong> has added you to the <strong>${orgName}</strong> workspace with the role of <strong>${role}</strong>.
          </p>
          <div style="background: #ffffff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
            <p style="font-size: 13px; color: #475569; margin: 0; line-height: 1.5;">
              ✨ Log in to your Godspeed Operations account anytime using the direct link below.
            </p>
          </div>
          <div style="text-align: center; margin: 24px 0 16px 0;">
            <a href="${loginUrl}" style="background-color: #2563EB; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700; display: inline-block;">
              Access Workspace & Tickets &rarr;
            </a>
          </div>
          <p style="font-size: 12px; color: #64748B; text-align: center; margin: 0;">
            Direct link: <a href="${loginUrl}" style="color: #2563EB; word-break: break-all;">${loginUrl}</a>
          </p>
        </div>
        <p style="font-size: 11px; color: #94A3B8; text-align: center; margin: 0;">
          GodSpeed Home Sales • Operations & Task Desk
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `You have been added to ${orgName} on Godspeed Desk`,
      text: `Hi ${userName},\n\nYou have been added to ${orgName} on Godspeed Desk with the role of ${role}.\n\nAccess your workspace at: ${loginUrl}\n\n- The Godspeed Operations Team`,
      html,
    });
  }

  async sendTeamInvitationWithTempPassword(
    to: string,
    orgName: string,
    inviterName: string,
    role: string,
    tempPassword: string
  ): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const loginUrl = `${baseUrl}/login?email=${encodeURIComponent(to)}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #EAECF0; border-radius: 16px;">
        <div style="margin-bottom: 24px; text-align: center;">
          <h1 style="color: #0F172A; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">GODSPEED OPERATIONS</h1>
          <p style="color: #64748B; font-size: 13px; margin: 4px 0 0 0;">GodSpeed Home Sales • Operations & Task Desk</p>
        </div>
        <div style="background: #F8FAFC; border: 1px solid #EAECF0; padding: 28px; border-radius: 12px; margin-bottom: 24px;">
          <div style="display: inline-block; background: #EFF6FF; color: #2563EB; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 6px; margin-bottom: 12px; text-transform: uppercase;">
            Team Invitation & Login Credentials
          </div>
          <h2 style="font-size: 18px; font-weight: 800; color: #0F172A; margin: 0 0 12px 0;">
            You've been invited to join ${orgName}
          </h2>
          <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
            Hi there,<br/>
            <strong>${inviterName || 'A team administrator'}</strong> has invited you to collaborate in the <strong>${orgName}</strong> workspace as <strong>${role}</strong>.
          </p>

          <div style="background: #ffffff; border: 1.5px dashed #93C5FD; border-radius: 10px; padding: 18px; margin: 20px 0;">
            <p style="font-size: 11px; font-weight: 700; color: #1D4ED8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">
              Your Temporary Login Credentials:
            </p>
            <p style="font-size: 13px; color: #1E293B; margin: 0 0 6px 0;">
              <strong>Email:</strong> <span style="font-family: monospace; color: #0F172A;">${to}</span>
            </p>
            <p style="font-size: 13px; color: #1E293B; margin: 0;">
              <strong>Temporary Password:</strong> <span style="font-family: monospace; font-size: 15px; font-weight: 800; color: #1D4ED8; background: #EFF6FF; padding: 2px 8px; border-radius: 4px;">${tempPassword}</span>
            </p>
          </div>

          <div style="background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
            <p style="font-size: 12px; color: #92400E; margin: 0; line-height: 1.5;">
              🔒 <strong>Security Requirement:</strong> For your security, you will be prompted to set your personal permanent password immediately when you sign in.
            </p>
          </div>

          <div style="text-align: center; margin: 24px 0 16px 0;">
            <a href="${loginUrl}" style="background-color: #2563EB; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700; display: inline-block;">
              Sign In & Set Permanent Password &rarr;
            </a>
          </div>
          <p style="font-size: 12px; color: #64748B; text-align: center; margin: 0;">
            Direct login link: <a href="${loginUrl}" style="color: #2563EB; word-break: break-all;">${loginUrl}</a>
          </p>
        </div>
        <p style="font-size: 11px; color: #94A3B8; text-align: center; margin: 0;">
          GodSpeed Home Sales • Operations & Task Desk
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `You've been invited to join ${orgName} on Godspeed Desk (Temporary Credentials)`,
      text: `Hi,\n\nYou have been invited to join ${orgName} as ${role}.\n\nYour Temporary Login Credentials:\nEmail: ${to}\nTemporary Password: ${tempPassword}\n\nSign in to set your permanent password at:\n${loginUrl}\n\nFor your security, you will be prompted to choose a permanent password upon first login.\n\n- The Godspeed Operations Team`,
      html,
    });
  }
}

export const emailService = new EmailAdapter();

