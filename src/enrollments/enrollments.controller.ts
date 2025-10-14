import { Controller, Get, Post, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Enrollments')
@Controller('enrollments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get('available')
  @ApiOperation({ summary: 'Get available classes for enrollment' })
  @ApiResponse({ status: 200, description: 'Available classes retrieved' })
  async getAvailableClasses(@Request() req: AuthenticatedRequest) {
    return this.enrollmentsService.getAvailableClasses(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get student enrollments' })
  @ApiResponse({ status: 200, description: 'Enrollments retrieved' })
  async getStudentEnrollments(@Request() req: AuthenticatedRequest) {
    return this.enrollmentsService.getStudentEnrollments(req.user.id);
  }

  @Post(':classId')
  @ApiOperation({ summary: 'Enroll in a class' })
  @ApiResponse({ status: 201, description: 'Successfully enrolled' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  @ApiResponse({ status: 409, description: 'Already enrolled' })
  async enrollInClass(@Param('classId') classId: string, @Request() req: AuthenticatedRequest) {
    return this.enrollmentsService.enrollInClass(req.user.id, classId);
  }

  @Delete(':classId')
  @ApiOperation({ summary: 'Unenroll from a class' })
  @ApiResponse({ status: 200, description: 'Successfully unenrolled' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async unenrollFromClass(@Param('classId') classId: string, @Request() req: AuthenticatedRequest) {
    return this.enrollmentsService.unenrollFromClass(req.user.id, classId);
  }
}
