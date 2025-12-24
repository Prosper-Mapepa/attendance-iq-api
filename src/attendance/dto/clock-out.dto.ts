import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClockOutDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiPropertyOptional({ example: 42.123456 })
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: -84.123456 })
  @IsOptional()
  longitude?: number;
}

