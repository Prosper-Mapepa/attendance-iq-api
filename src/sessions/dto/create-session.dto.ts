import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({ example: 'class-math-101' })
  @IsString()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ example: 10, description: 'OTP duration in minutes (also serves as clock-in deadline - students must clock in within this time)' })
  @IsNumber()
  @Min(1)
  @Max(30)
  duration: number;

  @ApiProperty({ example: 90, description: 'Total class duration in minutes' })
  @IsNumber()
  @Min(15)
  @Max(240)
  classDuration: number;
}

