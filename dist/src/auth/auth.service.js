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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const QRCode = require("qrcode");
const uuid_1 = require("uuid");
const users_service_1 = require("../users/users.service");
const email_service_1 = require("../common/email/email.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService, emailService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }
    async validateUser(email, password) {
        const user = await this.usersService.findByEmail(email);
        if (user && await bcrypt.compare(password, user.passwordHash)) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }
    async login(loginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                qrCode: user.qrCode,
            },
        };
    }
    async register(registerDto) {
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const qrCode = (0, uuid_1.v4)();
        const user = await this.usersService.create({
            ...registerDto,
            qrCode,
        });
        const payload = { email: user.email, sub: user.id, role: user.role };
        const access_token = this.jwtService.sign(payload);
        return {
            access_token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                qrCode: user.qrCode,
            },
        };
    }
    async generateQRCode(qrCode) {
        const qrCodeUrl = `${process.env.QR_CODE_BASE_URL || 'http://localhost:3000/student'}?qr=${qrCode}`;
        return QRCode.toDataURL(qrCodeUrl);
    }
    async getUserProfile(userId) {
        const user = await this.usersService.findOne(userId);
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            qrCode: user.qrCode,
        };
    }
    async forgotPassword(forgotPasswordDto) {
        const user = await this.usersService.findByEmail(forgotPasswordDto.email);
        if (!user) {
            return { message: 'If an account with that email exists, a password reset link has been sent.' };
        }
        const resetToken = (0, uuid_1.v4)();
        const resetTokenExpiry = new Date();
        resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);
        await this.usersService.updateResetToken(user.id, resetToken, resetTokenExpiry);
        const frontendUrl = process.env.FRONTEND_URL || process.env.WEB_URL || 'http://localhost:3000';
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
        const mobileAppUrl = process.env.MOBILE_APP_URL || 'attendiq://reset-password';
        const mobileDeepLink = `${mobileAppUrl}?token=${resetToken}`;
        try {
            await this.emailService.sendPasswordResetEmail(user.email, resetLink, user.name);
        }
        catch (error) {
            console.error('Failed to send password reset email:', error);
            if (process.env.NODE_ENV === 'development') {
                console.log(`[DEV] Password reset link for ${user.email}: ${resetLink}`);
            }
        }
        return {
            message: 'If an account with that email exists, a password reset link has been sent.',
        };
    }
    async resetPassword(resetPasswordDto) {
        const user = await this.usersService.findByResetToken(resetPasswordDto.token);
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const passwordHash = await bcrypt.hash(resetPasswordDto.newPassword, 10);
        await this.usersService.updatePassword(user.id, passwordHash);
        return { message: 'Password has been reset successfully' };
    }
    async changePassword(userId, changePasswordDto) {
        const user = await this.usersService.findOneWithPassword(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        const passwordHash = await bcrypt.hash(changePasswordDto.newPassword, 10);
        await this.usersService.updatePassword(userId, passwordHash);
        return { message: 'Password has been changed successfully' };
    }
    async changeEmail(userId, changeEmailDto) {
        const user = await this.usersService.findOneWithPassword(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isCurrentPasswordValid = await bcrypt.compare(changeEmailDto.currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        if (changeEmailDto.newEmail.toLowerCase() === user.email.toLowerCase()) {
            throw new common_1.BadRequestException('New email must be different from current email');
        }
        const existingUser = await this.usersService.findByEmail(changeEmailDto.newEmail);
        if (existingUser) {
            throw new common_1.ConflictException('Email is already in use');
        }
        const verificationToken = (0, uuid_1.v4)();
        const verificationExpiry = new Date();
        verificationExpiry.setHours(verificationExpiry.getHours() + 24);
        await this.usersService.updateEmailVerificationToken(userId, changeEmailDto.newEmail.toLowerCase(), verificationToken, verificationExpiry);
        const frontendUrl = process.env.FRONTEND_URL || process.env.WEB_URL || 'http://localhost:3000';
        const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
        try {
            await this.emailService.sendEmailVerificationEmail(changeEmailDto.newEmail.toLowerCase(), verificationLink, user.name, user.email);
        }
        catch (error) {
            console.error('Failed to send email verification email:', error);
            console.error('Email change error details:', {
                userId,
                newEmail: changeEmailDto.newEmail,
                oldEmail: user.email,
                errorMessage: error.message,
                errorCode: error.code,
            });
            await this.usersService.updateEmailVerificationToken(userId, null, null, null);
            throw new common_1.BadRequestException(error.message || 'Failed to send verification email. Please check your email configuration and try again.');
        }
        return {
            message: 'Verification email has been sent to your new email address. Please check your inbox and click the verification link.',
        };
    }
    async verifyEmail(verifyEmailDto) {
        const user = await this.usersService.findByEmailVerificationToken(verifyEmailDto.token);
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired verification token');
        }
        const updatedUser = await this.usersService.verifyAndUpdateEmail(user.id);
        return {
            message: 'Email has been successfully updated',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                qrCode: updatedUser.qrCode,
            },
        };
    }
    async deleteAccount(userId) {
        await this.usersService.remove(userId);
        return {
            message: 'Account has been successfully deleted',
        };
    }
    async createProductionAdmin() {
        const adminEmail = 'mapepaprosper76@gmail.com';
        const adminPassword = 'BreAkThr0ugHinGOD@0140x!@!';
        const adminName = 'System Administrator';
        const existingAdmin = await this.usersService.findByEmail(adminEmail);
        if (existingAdmin) {
            if (existingAdmin.role !== 'ADMIN') {
                await this.usersService.update(existingAdmin.id, { role: 'ADMIN' });
                return {
                    message: 'Admin user already existed, role updated to ADMIN',
                    user: {
                        id: existingAdmin.id,
                        email: existingAdmin.email,
                        role: 'ADMIN',
                    },
                };
            }
            return {
                message: 'Admin user already exists',
                user: {
                    id: existingAdmin.id,
                    email: existingAdmin.email,
                    role: existingAdmin.role,
                },
            };
        }
        const qrCode = (0, uuid_1.v4)();
        const admin = await this.usersService.create({
            name: adminName,
            email: adminEmail,
            password: adminPassword,
            role: 'ADMIN',
            qrCode,
        });
        return {
            message: 'Production admin user created successfully',
            user: {
                id: admin.id,
                email: admin.email,
                role: admin.role,
            },
            credentials: {
                email: adminEmail,
                password: adminPassword,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map