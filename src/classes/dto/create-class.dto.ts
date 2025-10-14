import { IsString, MinLength, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({ example: 'Mathematics 101' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'Mathematics', required: false })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ example: 'Monday, Wednesday, Friday 9:00 AM - 10:30 AM', required: false })
  @IsString()
  @IsOptional()
  schedule?: string;

  @ApiProperty({ example: 'Introduction to Calculus', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 42.123456, description: 'Classroom latitude' })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: -84.123456, description: 'Classroom longitude' })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: 50, description: 'Location radius in meters (default: 50)' })
  @IsNumber()
  @IsOptional()
  @Min(10)
  @Max(200)
  locationRadius?: number;
}

