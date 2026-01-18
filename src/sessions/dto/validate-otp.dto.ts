import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateOtpDto {
  @ApiProperty({ example: '123456', description: 'OTP code (6 digits) or JSON string from QR code containing otp field' })
  @IsString()
  @IsNotEmpty()
  otp: string; // Can be plain OTP or JSON string - will be parsed in service
}

