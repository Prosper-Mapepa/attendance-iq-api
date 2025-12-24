import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private transporter;
    private isDevelopmentMode;
    constructor(configService: ConfigService);
    sendPasswordResetEmail(email: string, resetLink: string, userName?: string): Promise<void>;
    sendEmailVerificationEmail(newEmail: string, verificationLink: string, userName?: string, oldEmail?: string): Promise<void>;
    private getEmailVerificationEmailTemplate;
    private getEmailVerificationEmailText;
    private sendEmailChangeNotificationEmail;
    private getEmailChangeNotificationTemplate;
    private getEmailChangeNotificationText;
    private getPasswordResetEmailTemplate;
    private getPasswordResetEmailText;
}
