import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { EmailService } from '../common/email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
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

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Generate QR code
    const qrCode = uuidv4();

    // Create user
    const user = await this.usersService.create({
      ...registerDto,
      qrCode,
    });

    // Generate JWT token
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

  async generateQRCode(qrCode: string): Promise<string> {
    const qrCodeUrl = `${process.env.QR_CODE_BASE_URL || 'http://localhost:3000/student'}?qr=${qrCode}`;
    return QRCode.toDataURL(qrCodeUrl);
  }

  async getUserProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      qrCode: user.qrCode,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token expires in 1 hour

    // Save reset token to user
    await this.usersService.updateResetToken(user.id, resetToken, resetTokenExpiry);

    // Generate reset link
    // Use web URL that works on both web and mobile
    // Web page will handle deep linking to mobile app if installed
    const frontendUrl = process.env.FRONTEND_URL || process.env.WEB_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    // Also generate mobile deep link for reference (web page will use this)
    const mobileAppUrl = process.env.MOBILE_APP_URL || 'attendiq://reset-password';
    const mobileDeepLink = `${mobileAppUrl}?token=${resetToken}`;
    
    // Send email with reset link
    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetLink, user.name);
    } catch (error) {
      // Log error but don't reveal to user (security best practice)
      console.error('Failed to send password reset email:', error);
      // In development, log the link for testing
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] Password reset link for ${user.email}: ${resetLink}`);
      }
      // Don't throw - security best practice (don't reveal if email exists)
    }

    return { 
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    // Find user by reset token (this already checks expiration in the query)
    const user = await this.usersService.findByResetToken(resetPasswordDto.token);
    
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    // Update password and clear reset token
    await this.usersService.updatePassword(user.id, passwordHash);

    return { message: 'Password has been reset successfully' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    // Get user from database with password hash
    const user = await this.usersService.findOneWithPassword(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Update password
    await this.usersService.updatePassword(userId, passwordHash);

    return { message: 'Password has been changed successfully' };
  }

  async changeEmail(userId: string, changeEmailDto: ChangeEmailDto) {
    // Get user with password hash
    const user = await this.usersService.findOneWithPassword(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changeEmailDto.currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check if new email is the same as current email
    if (changeEmailDto.newEmail.toLowerCase() === user.email.toLowerCase()) {
      throw new BadRequestException('New email must be different from current email');
    }

    // Check if new email is already in use
    const existingUser = await this.usersService.findByEmail(changeEmailDto.newEmail);
    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    // Generate verification token
    const verificationToken = uuidv4();
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24); // Token expires in 24 hours

    // Save pending email and verification token
    await this.usersService.updateEmailVerificationToken(
      userId,
      changeEmailDto.newEmail.toLowerCase(),
      verificationToken,
      verificationExpiry,
    );

    // Generate verification link
    const frontendUrl = process.env.FRONTEND_URL || process.env.WEB_URL || 'http://localhost:3000';
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

    // Send verification email to new address
    try {
      await this.emailService.sendEmailVerificationEmail(
        changeEmailDto.newEmail.toLowerCase(),
        verificationLink,
        user.name,
        user.email,
      );
    } catch (error) {
      console.error('Failed to send email verification email:', error);
      console.error('Email change error details:', {
        userId,
        newEmail: changeEmailDto.newEmail,
        oldEmail: user.email,
        errorMessage: error.message,
        errorCode: error.code,
      });
      // Clear the pending email if email sending fails
      await this.usersService.updateEmailVerificationToken(userId, null, null, null);
      throw new BadRequestException(
        error.message || 'Failed to send verification email. Please check your email configuration and try again.'
      );
    }

    return {
      message: 'Verification email has been sent to your new email address. Please check your inbox and click the verification link.',
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    // Find user by verification token
    const user = await this.usersService.findByEmailVerificationToken(verifyEmailDto.token);
    
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Verify and update email
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

  async deleteAccount(userId: string) {
    // Delete the user account (this will cascade delete related records)
    await this.usersService.remove(userId);
    
    return {
      message: 'Account has been successfully deleted',
    };
  }

  async createProductionAdmin() {
    const adminEmail = 'mapepaprosper76@gmail.com';
    const adminPassword = 'BreAkThr0ugHinGOD@0140x!@!';
    const adminName = 'System Administrator';

    // Check if admin already exists
    const existingAdmin = await this.usersService.findByEmail(adminEmail);

    if (existingAdmin) {
      // Update to ADMIN role if not already
      if (existingAdmin.role !== 'ADMIN') {
        await this.usersService.update(existingAdmin.id, { role: 'ADMIN' } as any);
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

    // Create admin user
    const qrCode = uuidv4();
    const admin = await this.usersService.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'ADMIN',
      qrCode,
    } as any);

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
}

