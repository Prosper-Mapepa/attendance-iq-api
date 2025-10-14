import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MarkAttendanceDto {
  @ApiPropertyOptional({ example: 'uuid-qr-code' })
  @IsString()
  @IsOptional()
  qrCode?: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiPropertyOptional({ example: 'Room 101' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 42.123456 })
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: -84.123456 })
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: 'Mozilla/5.0...' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ example: '1920x1080' })
  @IsOptional()
  @IsString()
  screenResolution?: string;

  @ApiPropertyOptional({ example: 'iPhone 14 Pro' })
  @IsOptional()
  @IsString()
  deviceModel?: string;

  @ApiPropertyOptional({ example: 'iOS 17.0' })
  @IsOptional()
  @IsString()
  osVersion?: string;

  @ApiPropertyOptional({ example: 'America/New_York' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 'en-US' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: '95' })
  @IsOptional()
  batteryLevel?: number;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  isCharging?: boolean;

  @ApiPropertyOptional({ example: 'CMU-Student-WiFi' })
  @IsOptional()
  @IsString()
  networkSSID?: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  smsVerificationCode?: string;
}

