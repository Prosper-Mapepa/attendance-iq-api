import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({ example: 'class-math-101' })
  @IsString()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ example: 15, description: 'Session duration in minutes (5-15 minutes for security)' })
  @IsNumber()
  @Min(5)
  @Max(15)
  duration: number;
}

