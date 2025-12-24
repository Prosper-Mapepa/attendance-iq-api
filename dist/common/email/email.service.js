"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
let EmailService = class EmailService {
    constructor(configService) {
        this.configService = configService;
        this.isDevelopmentMode = false;
        const emailProvider = this.configService.get('EMAIL_PROVIDER', 'smtp');
        const nodeEnv = this.configService.get('NODE_ENV', 'development');
        if (nodeEnv === 'development' && !this.configService.get('SMTP_USER') &&
            !this.configService.get('SENDGRID_API_KEY') &&
            !this.configService.get('AWS_ACCESS_KEY_ID')) {
            this.transporter = nodemailer.createTransport({
                jsonTransport: true,
            });
            this.isDevelopmentMode = true;
            console.log('📧 Email service initialized in development mode (emails will be logged)');
            return;
        }
        if (emailProvider === 'sendgrid') {
            const apiKey = this.configService.get('SENDGRID_API_KEY');
            if (!apiKey) {
                throw new Error('SENDGRID_API_KEY is required when EMAIL_PROVIDER=sendgrid');
            }
            this.transporter = nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: 'apikey',
                    pass: apiKey,
                },
            });
        }
        else if (emailProvider === 'ses') {
            const accessKey = this.configService.get('AWS_ACCESS_KEY_ID');
            const secretKey = this.configService.get('AWS_SECRET_ACCESS_KEY');
            if (!accessKey || !secretKey) {
                throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required when EMAIL_PROVIDER=ses');
            }
            const region = this.configService.get('AWS_REGION', 'us-east-1');
            this.transporter = nodemailer.createTransport({
                host: `email-smtp.${region}.amazonaws.com`,
                port: 587,
                secure: false,
                auth: {
                    user: accessKey,
                    pass: secretKey,
                },
            });
        }
        else {
            const smtpUser = this.configService.get('SMTP_USER');
            const smtpPass = this.configService.get('SMTP_PASS');
            if (!smtpUser || !smtpPass) {
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
                host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
                port: parseInt(this.configService.get('SMTP_PORT', '587')),
                secure: this.configService.get('SMTP_SECURE', 'false') === 'true',
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });
        }
        console.log(`📧 Email service initialized with provider: ${emailProvider}`);
    }
    async sendPasswordResetEmail(email, resetLink, userName) {
        const appName = this.configService.get('APP_NAME', 'AttendIQ');
        const fromEmail = this.configService.get('EMAIL_FROM', 'noreply@attendiq.app');
        const mailOptions = {
            from: `"${appName}" <${fromEmail}>`,
            to: email,
            subject: 'Reset Your Password - AttendIQ',
            html: this.getPasswordResetEmailTemplate(resetLink, userName || 'User'),
            text: this.getPasswordResetEmailText(resetLink, userName || 'User'),
        };
        try {
            const info = await this.transporter.sendMail(mailOptions);
            if (this.isDevelopmentMode) {
                const emailData = JSON.parse(info.message);
                console.log('\n📧 [DEV] Password Reset Email:');
                console.log('To:', emailData.to);
                console.log('Subject:', emailData.subject);
                console.log('Reset Link:', resetLink);
                console.log('---\n');
            }
            else {
                console.log(`✅ Password reset email sent to ${email}`, info.messageId);
            }
        }
        catch (error) {
            console.error('❌ Error sending password reset email:', error);
        }
    }
    async sendEmailVerificationEmail(newEmail, verificationLink, userName, oldEmail) {
        const appName = this.configService.get('APP_NAME', 'AttendIQ');
        const fromEmail = this.configService.get('EMAIL_FROM', 'noreply@attendiq.app');
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
            }
            else {
                console.log(`✅ Email verification email sent to ${newEmail}`, info.messageId);
            }
            if (oldEmail && oldEmail !== newEmail) {
                await this.sendEmailChangeNotificationEmail(oldEmail, newEmail, userName);
            }
        }
        catch (error) {
            console.error('❌ Error sending email verification email:', error);
            console.error('Error details:', {
                to: newEmail,
                from: fromEmail,
                errorMessage: error.message,
                errorCode: error.code,
                errorResponse: error.response,
            });
            throw error;
        }
    }
    getEmailVerificationEmailTemplate(verificationLink, userName, oldEmail) {
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
    getEmailVerificationEmailText(verificationLink, userName, oldEmail) {
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
    async sendEmailChangeNotificationEmail(oldEmail, newEmail, userName) {
        const appName = this.configService.get('APP_NAME', 'AttendIQ');
        const fromEmail = this.configService.get('EMAIL_FROM', 'noreply@attendiq.app');
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
            }
            else {
                console.log(`✅ Email change notification sent to ${oldEmail}`, info.messageId);
            }
        }
        catch (error) {
            console.error('❌ Error sending email change notification:', error);
        }
    }
    getEmailChangeNotificationTemplate(newEmail, userName) {
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
    getEmailChangeNotificationText(newEmail, userName) {
        return `
Hi ${userName},

We're notifying you that a request has been made to change your email address to ${newEmail}.

⚠️ Security Notice: If you didn't request this change, please contact support immediately and secure your account.

If you requested this change, no action is needed. The change will be completed once the new email address is verified.

This is an automated message, please do not reply.
    `;
    }
    getPasswordResetEmailTemplate(resetLink, userName) {
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
    getPasswordResetEmailText(resetLink, userName) {
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
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map