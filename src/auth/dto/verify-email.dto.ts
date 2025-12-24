import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ example: 'abc123def456...' })
  @IsString()
  @MinLength(1, { message: 'Verification token is required' })
  token: string;
}

