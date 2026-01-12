import { Controller, Post, Body, Get, Param, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('qr/:qrCode')
  @ApiOperation({ summary: 'Generate QR code' })
  @ApiResponse({ status: 200, description: 'QR code generated' })
  async generateQRCode(@Param('qrCode') qrCode: string) {
    const qrCodeDataUrl = await this.authService.generateQRCode(qrCode);
    return { qrCode: qrCodeDataUrl };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    // Get full user details from database
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
    const user = await this.authService.getUserProfile(userId);
    return user;
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Post('change-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request email change for authenticated user' })
  @ApiResponse({ status: 200, description: 'Verification email sent to new address' })
  @ApiResponse({ status: 400, description: 'Invalid current password or email already in use' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changeEmail(@Request() req, @Body() changeEmailDto: ChangeEmailDto) {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
    return this.authService.changeEmail(userId, changeEmailDto);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email change with token' })
  @ApiResponse({ status: 200, description: 'Email verified and updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired verification token' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('delete-account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete authenticated user account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAccount(@Request() req) {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
    return this.authService.deleteAccount(userId);
  }

  @Post('create-admin')
  @ApiOperation({ summary: 'Create production admin user (one-time use)' })
  @ApiResponse({ status: 201, description: 'Admin user created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid secret or admin already exists' })
  async createAdmin(@Body() body: { secret: string }) {
    // Simple secret check for one-time use
    const expectedSecret = process.env.ADMIN_CREATE_SECRET || 'create-admin-2025';
    if (body.secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid secret');
    }
    return this.authService.createProductionAdmin();
  }
}

