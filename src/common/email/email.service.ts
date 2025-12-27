import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private isDevelopmentMode: boolean = false;
  private useSendGridApi: boolean = false;

  constructor(private configService: ConfigService) {
    // Initialize email transporter
    // Supports multiple providers: SMTP, SendGrid, AWS SES, etc.
    const emailProvider = this.configService.get<string>('EMAIL_PROVIDER', 'smtp');
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    
    // In development without email config, create a test transporter
    if (nodeEnv === 'development' && !this.configService.get<string>('SMTP_USER') && 
        !this.configService.get<string>('SENDGRID_API_KEY') && 
        !this.configService.get<string>('AWS_ACCESS_KEY_ID')) {
      // Create a test transporter that logs emails instead of sending
      this.transporter = nodemailer.createTransport({
        jsonTransport: true, // This will log the email instead of sending
      });
      this.isDevelopmentMode = true;
      console.log('📧 Email service initialized in development mode (emails will be logged)');
      return;
    }
    
    if (emailProvider === 'sendgrid') {
      // SendGrid API configuration (NOT SMTP - avoids Railway port blocking)
      const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
      if (!apiKey) {
        throw new Error('SENDGRID_API_KEY is required when EMAIL_PROVIDER=sendgrid');
      }
      // Use SendGrid API SDK (uses HTTPS, not SMTP ports)
      sgMail.setApiKey(apiKey);
      this.useSendGridApi = true;
      console.log('✅ SendGrid API SDK initialized (using HTTPS, not SMTP)');
    } else if (emailProvider === 'ses') {
      // AWS SES configuration
      // Note: For AWS SES, you'll need to install @aws-sdk/client-ses and use it differently
      // For now, we'll use SMTP with SES SMTP credentials
      const accessKey = this.configService.get<string>('AWS_ACCESS_KEY_ID');
      const secretKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
      if (!accessKey || !secretKey) {
        throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required when EMAIL_PROVIDER=ses');
      }
      // Use SES SMTP endpoint (recommended approach)
      const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
      this.transporter = nodemailer.createTransport({
        host: `email-smtp.${region}.amazonaws.com`,
        port: 587,
        secure: false,
        auth: {
          user: accessKey,
          pass: secretKey,
        },
        connectionTimeout: 60000, // 60 seconds
        socketTimeout: 60000, // 60 seconds
        greetingTimeout: 30000, // 30 seconds
      });
    } else {
      // Default SMTP configuration
      const smtpUser = this.configService.get<string>('SMTP_USER');
      const smtpPass = this.configService.get<string>('SMTP_PASS');
      if (!smtpUser || !smtpPass) {
        // In development, use test transporter
        if (nodeEnv === 'development') {
          this.transporter = nodemailer.createTransport({
            jsonTransport: true,
          });
          this.isDevelopmentMode = true;
          console.log('📧 Email service initialized in development mode (SMTP not configured, emails will be logged)');
          return;
        }
        throw new Error('SMTP_USER and SMTP_PASS are required for email service');
      }
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
        port: parseInt(this.configService.get<string>('SMTP_PORT', '587')),
        secure: this.configService.get<string>('SMTP_SECURE', 'false') === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 10000, // 10 seconds - reduced from 60s to fail faster
        socketTimeout: 10000, // 10 seconds
        greetingTimeout: 5000, // 5 seconds
        requireTLS: true,
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates
        },
        pool: true, // Use connection pooling
        maxConnections: 5,
        maxMessages: 100,
      });
    }
    
    // Verify connection on startup (only in production, and only for SMTP providers)
    if (nodeEnv === 'production' && !this.isDevelopmentMode && !this.useSendGridApi) {
      this.verifyConnection().catch((error) => {
        console.error('⚠️ Email service connection verification failed:', error.message);
        console.error('💡 Recommendation: Use SendGrid API (EMAIL_PROVIDER=sendgrid) for more reliable email delivery on Railway');
      });
    }
    
    if (this.useSendGridApi) {
      console.log(`📧 Email service initialized with provider: ${emailProvider} (using SendGrid API SDK)`);
    } else {
      console.log(`📧 Email service initialized with provider: ${emailProvider}`);
    }
  }

  private async verifyConnection(): Promise<void> {
    // Only verify SMTP connections, not SendGrid API
    if (this.useSendGridApi) {
      console.log('✅ SendGrid API SDK ready (no connection verification needed)');
      return;
    }
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified successfully');
    } catch (error: any) {
      console.error('❌ Email service connection verification failed:', error.message);
      if (error.code === 'ETIMEDOUT') {
        throw new Error('Email service connection timeout. Check your SMTP configuration or switch to SendGrid API (EMAIL_PROVIDER=sendgrid)');
      }
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, resetLink: string, userName?: string): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME', 'AttendIQ');
    const fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@attendiq.app');
    
    // Use SendGrid API SDK if configured
    if (this.useSendGridApi) {
      try {
        const msg = {
          to: email,
          from: `${appName} <${fromEmail}>`,
          subject: 'Reset Your Password - AttendIQ',
          html: this.getPasswordResetEmailTemplate(resetLink, userName || 'User'),
          text: this.getPasswordResetEmailText(resetLink, userName || 'User'),
        };
        
        await sgMail.send(msg);
        console.log(`✅ Password reset email sent to ${email} via SendGrid API`);
        return;
      } catch (error: any) {
        console.error('❌ Error sending password reset email via SendGrid API:', error);
        if (error.response) {
          console.error('SendGrid API error details:', {
            statusCode: error.response.statusCode,
            body: error.response.body,
            headers: error.response.headers,
          });
        }
        // Don't throw - security best practice
        return;
      }
    }
    
    // Fallback to SMTP (nodemailer) for other providers
    const mailOptions = {
      from: `"${appName}" <${fromEmail}>`,
      to: email,
      subject: 'Reset Your Password - AttendIQ',
      html: this.getPasswordResetEmailTemplate(resetLink, userName || 'User'),
      text: this.getPasswordResetEmailText(resetLink, userName || 'User'),
    };

    // Retry logic: try up to 3 times with exponential backoff
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const info = await this.transporter.sendMail(mailOptions);
        
        // If using jsonTransport (development mode), log the email
        if (this.isDevelopmentMode) {
          const emailData = JSON.parse(info.message);
          console.log('\n📧 [DEV] Password Reset Email:');
          console.log('To:', emailData.to);
          console.log('Subject:', emailData.subject);
          console.log('Reset Link:', resetLink);
          console.log('---\n');
        } else {
          console.log(`✅ Password reset email sent to ${email}`, info.messageId);
        }
        return; // Success, exit function
      } catch (error: any) {
        lastError = error;
        const isTimeout = error.code === 'ETIMEDOUT' || error.message?.includes('timeout');
        const isConnectionError = error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET';
        
        // Don't retry on auth errors or invalid recipient
        if (error.code === 'EAUTH' || error.code === 'EENVELOPE') {
          console.error('❌ Error sending password reset email (non-retryable):', error.message);
          break;
        }

        // If it's the last attempt or not a retryable error, log and break
        if (attempt === maxRetries || (!isTimeout && !isConnectionError)) {
          console.error(`❌ Error sending password reset email (attempt ${attempt}/${maxRetries}):`, error);
          console.error('Error details:', {
            code: error.code,
            command: error.command,
            message: error.message,
          });
          break;
        }

        // Wait before retrying (exponential backoff: 1s, 2s, 4s)
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.warn(`⚠️ Email send failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // If we get here, all retries failed
    console.error('❌ Failed to send password reset email after all retries');
    if (lastError?.code === 'ETIMEDOUT' || lastError?.message?.includes('timeout')) {
      console.error('💡 Fix: Connection timeout. Switch to SendGrid API (EMAIL_PROVIDER=sendgrid) for more reliable email delivery on Railway');
      console.error('💡 SendGrid setup: https://app.sendgrid.com/settings/api_keys');
    } else if (lastError?.code === 'ECONNREFUSED') {
      console.error('💡 Fix: Connection refused. Check your SMTP_HOST and SMTP_PORT settings');
    } else if (lastError?.code === 'EAUTH') {
      console.error('💡 Fix: Authentication failed. Check your SMTP_USER and SMTP_PASS credentials');
    }
    
    // Don't throw error to user - security best practice
    // Just log it for monitoring
    // In production, you might want to send to error tracking service (Sentry, etc.)
  }

  async sendEmailVerificationEmail(
    newEmail: string,
    verificationLink: string,
    userName?: string,
    oldEmail?: string,
  ): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME', 'AttendIQ');
    const fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@attendiq.app');
    
    // Use SendGrid API SDK if configured
    if (this.useSendGridApi) {
      try {
        const msg = {
          to: newEmail,
          from: `${appName} <${fromEmail}>`,
          subject: 'Verify Your New Email Address - AttendIQ',
          html: this.getEmailVerificationEmailTemplate(verificationLink, userName || 'User', oldEmail),
          text: this.getEmailVerificationEmailText(verificationLink, userName || 'User', oldEmail),
        };
        
        await sgMail.send(msg);
        console.log(`✅ Email verification email sent to ${newEmail} via SendGrid API`);

        // Also send notification to old email if provided
        if (oldEmail && oldEmail !== newEmail) {
          await this.sendEmailChangeNotificationEmail(oldEmail, newEmail, userName);
        }
        return;
      } catch (error: any) {
        console.error('❌ Error sending email verification email via SendGrid API:', error);
        if (error.response) {
          console.error('SendGrid API error details:', {
            statusCode: error.response.statusCode,
            body: error.response.body,
          });
        }
        throw new Error('Failed to send email verification. Please try again later.');
      }
    }
    
    // Fallback to SMTP (nodemailer) for other providers
    const mailOptions = {
      from: `"${appName}" <${fromEmail}>`,
      to: newEmail,
      subject: 'Verify Your New Email Address - AttendIQ',
      html: this.getEmailVerificationEmailTemplate(verificationLink, userName || 'User', oldEmail),
      text: this.getEmailVerificationEmailText(verificationLink, userName || 'User', oldEmail),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      if (this.isDevelopmentMode) {
        const emailData = JSON.parse(info.message);
        console.log('\n📧 [DEV] Email Verification Email:');
        console.log('To:', emailData.to);
        console.log('Subject:', emailData.subject);
        console.log('Verification Link:', verificationLink);
        console.log('---\n');
      } else {
        console.log(`✅ Email verification email sent to ${newEmail}`, info.messageId);
      }

      // Also send notification to old email if provided
      if (oldEmail && oldEmail !== newEmail) {
        await this.sendEmailChangeNotificationEmail(oldEmail, newEmail, userName);
      }
    } catch (error: any) {
      console.error('❌ Error sending email verification email:', error);
      console.error('Error details:', {
        to: newEmail,
        from: fromEmail,
        errorMessage: error.message,
        errorCode: error.code,
        errorResponse: error.response,
      });
      // Provide more helpful error message
      if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        throw new Error('Email service connection timeout. Please check your SMTP configuration and network connectivity. Consider using SendGrid API for more reliable email delivery.');
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Email service connection refused. Please check your SMTP host and port settings.');
      }
      throw error; // Re-throw for email verification since we need to know if it failed
    }
  }

  private getEmailVerificationEmailTemplate(verificationLink: string, userName: string, oldEmail?: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your New Email Address</title>
          <style>
            @media only screen and (max-width: 600px) {
              .email-container {
                width: 100% !important;
                padding: 10px !important;
              }
            }
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background-color: #f5f5f5;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              overflow: hidden;
            }
            .email-header {
              background-color: #8B0000;
              padding: 30px 20px;
              text-align: center;
            }
            .email-header h1 {
              color: #ffffff;
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .email-body {
              padding: 30px 20px;
            }
            .email-body p {
              color: #333333;
              font-size: 16px;
              line-height: 1.6;
              margin: 0 0 20px 0;
            }
            .verification-button {
              display: inline-block;
              padding: 14px 28px;
              background-color: #8B0000;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
              text-align: center;
            }
            .email-footer {
              padding: 20px;
              text-align: center;
              color: #666666;
              font-size: 12px;
              border-top: 1px solid #e0e0e0;
            }
            .warning-box {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .warning-box p {
              margin: 0;
              color: #856404;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <h1>Verify Your New Email</h1>
            </div>
            <div class="email-body">
              <p>Hi ${userName},</p>
              <p>You've requested to change your email address${oldEmail ? ` from <strong>${oldEmail}</strong>` : ''} to this email address.</p>
              <p>Please click the button below to verify your new email address:</p>
              <div style="text-align: center;">
                <a href="${verificationLink}" class="verification-button">Verify Email Address</a>
              </div>
              <p style="font-size: 14px; color: #666666;">Or copy and paste this link into your browser:</p>
              <p style="font-size: 12px; color: #999999; word-break: break-all;">${verificationLink}</p>
              <div class="warning-box">
                <p><strong>⚠️ Important:</strong> This verification link will expire in 24 hours. If you didn't request this change, please ignore this email and your email address will remain unchanged.</p>
              </div>
            </div>
            <div class="email-footer">
              <p>This is an automated message, please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} AttendIQ. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getEmailVerificationEmailText(verificationLink: string, userName: string, oldEmail?: string): string {
    return `
Hi ${userName},

You've requested to change your email address${oldEmail ? ` from ${oldEmail}` : ''} to this email address.

Please click the link below to verify your new email address:
${verificationLink}

This verification link will expire in 24 hours.

If you didn't request this change, please ignore this email and your email address will remain unchanged.

This is an automated message, please do not reply.
    `;
  }

  private async sendEmailChangeNotificationEmail(
    oldEmail: string,
    newEmail: string,
    userName?: string,
  ): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME', 'AttendIQ');
    const fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@attendiq.app');
    
    // Use SendGrid API SDK if configured
    if (this.useSendGridApi) {
      try {
        const msg = {
          to: oldEmail,
          from: `${appName} <${fromEmail}>`,
          subject: 'Email Change Request - AttendIQ',
          html: this.getEmailChangeNotificationTemplate(newEmail, userName || 'User'),
          text: this.getEmailChangeNotificationText(newEmail, userName || 'User'),
        };
        
        await sgMail.send(msg);
        console.log(`✅ Email change notification sent to ${oldEmail} via SendGrid API`);
        return;
      } catch (error) {
        console.error('❌ Error sending email change notification via SendGrid API:', error);
        // Don't throw - notification failure shouldn't block the process
        return;
      }
    }
    
    // Fallback to SMTP (nodemailer) for other providers
    const mailOptions = {
      from: `"${appName}" <${fromEmail}>`,
      to: oldEmail,
      subject: 'Email Change Request - AttendIQ',
      html: this.getEmailChangeNotificationTemplate(newEmail, userName || 'User'),
      text: this.getEmailChangeNotificationText(newEmail, userName || 'User'),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      if (this.isDevelopmentMode) {
        const emailData = JSON.parse(info.message);
        console.log('\n📧 [DEV] Email Change Notification Email:');
        console.log('To:', emailData.to);
        console.log('Subject:', emailData.subject);
        console.log('---\n');
      } else {
        console.log(`✅ Email change notification sent to ${oldEmail}`, info.messageId);
      }
    } catch (error) {
      console.error('❌ Error sending email change notification:', error);
      // Don't throw - notification failure shouldn't block the process
    }
  }

  private getEmailChangeNotificationTemplate(newEmail: string, userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Change Request</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background-color: #f5f5f5;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              padding: 30px 20px;
            }
            .warning-box {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .warning-box p {
              margin: 0;
              color: #856404;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <h2 style="color: #8B0000;">Email Change Request</h2>
            <p>Hi ${userName},</p>
            <p>We're notifying you that a request has been made to change your email address to <strong>${newEmail}</strong>.</p>
            <div class="warning-box">
              <p><strong>⚠️ Security Notice:</strong> If you didn't request this change, please contact support immediately and secure your account.</p>
            </div>
            <p>If you requested this change, no action is needed. The change will be completed once the new email address is verified.</p>
            <p style="color: #666666; font-size: 12px; margin-top: 30px;">This is an automated message, please do not reply.</p>
          </div>
        </body>
      </html>
    `;
  }

  private getEmailChangeNotificationText(newEmail: string, userName: string): string {
    return `
Hi ${userName},

We're notifying you that a request has been made to change your email address to ${newEmail}.

⚠️ Security Notice: If you didn't request this change, please contact support immediately and secure your account.

If you requested this change, no action is needed. The change will be completed once the new email address is verified.

This is an automated message, please do not reply.
    `;
  }

  private getPasswordResetEmailTemplate(resetLink: string, userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Reset Your Password</title>
          <style>
            @media only screen and (max-width: 600px) {
              .email-container {
                width: 100% !important;
                padding: 10px !important;
              }
              .email-content {
                padding: 30px 20px !important;
              }
              .email-header {
                padding: 25px 20px !important;
              }
              .email-title {
                font-size: 22px !important;
              }
              .email-heading {
                font-size: 20px !important;
              }
              .email-button {
                padding: 12px 24px !important;
                font-size: 16px !important;
                width: 100% !important;
                display: block !important;
              }
              .email-text {
                font-size: 15px !important;
              }
            }
          </style>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
            <tr>
              <td align="center" style="padding: 20px 10px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;" class="email-container">
                  <tr>
                    <td style="background-color: #8B0000; padding: 30px 20px; text-align: center;" class="email-header">
                      <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 600; line-height: 1.2;" class="email-title">Attend<span style="color: #FFD700;">IQ</span></h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;" class="email-content">
                      <h2 style="color: #1a1a1a; margin-top: 0; margin-bottom: 20px; font-size: 24px; font-weight: 600; line-height: 1.3;" class="email-heading">Reset Your Password</h2>
                      
                      <p style="color: #333; margin-bottom: 20px; font-size: 16px; line-height: 1.5;" class="email-text">Hello ${userName},</p>
                      
                      <p style="color: #333; margin-bottom: 30px; font-size: 16px; line-height: 1.5;" class="email-text">We received a request to reset your password for your AttendIQ account. Click the button below to reset your password:</p>
                      
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                        <tr>
                          <td align="center" style="padding: 0;">
                            <a href="${resetLink}" 
                               style="display: inline-block; background-color: #8B0000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; line-height: 1.5; -webkit-text-size-adjust: none; mso-hide: all;" class="email-button">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #666; font-size: 14px; margin-top: 30px; margin-bottom: 0; line-height: 1.5;" class="email-text">
                        Or <a href="${resetLink}" style="color: #8B0000; text-decoration: underline;">click here</a> to reset your password.
                      </p>
                      
                      <p style="color: #666; font-size: 14px; margin-top: 20px; margin-bottom: 0; line-height: 1.5;" class="email-text">
                        This link will expire in <strong>1 hour</strong>. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  private getPasswordResetEmailText(resetLink: string, userName: string): string {
    return `
Reset Your Password - AttendIQ

Hello ${userName},

We received a request to reset your password for your AttendIQ account.

Click the link below to reset your password:
${resetLink}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email or contact support if you have concerns.

This is an automated message. Please do not reply to this email.
    `.trim();
  }
}

