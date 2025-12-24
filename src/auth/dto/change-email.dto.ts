import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeEmailDto {
  @ApiProperty({ example: 'newemail@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  newEmail: string;

  @ApiProperty({ example: 'CurrentSecurePassword123!' })
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  currentPassword: string;
}

