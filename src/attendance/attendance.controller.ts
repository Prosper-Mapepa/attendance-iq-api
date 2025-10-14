import { Controller, Post, Body, Get, UseGuards, Request, Param } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AntiProxyService } from './anti-proxy.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly antiProxyService: AntiProxyService,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  async getAttendanceRecords(@Request() req: AuthenticatedRequest) {
    return this.attendanceService.getAttendanceRecords(req.user.id);
  }

  @Post('mark')
  async markAttendance(@Body() markAttendanceDto: MarkAttendanceDto, @Request() req: AuthenticatedRequest) {
    return this.attendanceService.markAttendance(markAttendanceDto, req.user.id);
  }

  @Get('session/:sessionId')
  async getSessionAttendance(@Param('sessionId') sessionId: string, @Request() req: AuthenticatedRequest) {
    return this.attendanceService.getSessionAttendance(sessionId, req.user.id);
  }

  @Get('flagged-students/:classId?')
  async getFlaggedStudents(
    @Param('classId') classId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    // Only teachers can view flagged students
    if (req.user.role !== 'TEACHER') {
      throw new Error('Only teachers can view flagged students');
    }
    
    // Get all classes taught by this instructor
    const instructorClasses = await this.prisma.class.findMany({
      where: {
        teacherId: req.user.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (instructorClasses.length === 0) {
      return []; // No classes taught by this instructor
    }

    const instructorClassIds = instructorClasses.map(cls => cls.id);
    
    // If specific classId is provided, verify the teacher owns this class
    if (classId && classId !== 'all') {
      if (!instructorClassIds.includes(classId)) {
        throw new Error('Class not found or access denied');
      }
      // Return flagged students for the specific class only
      return this.antiProxyService.getFlaggedStudentsByClasses([classId]);
    }
    
    // Return flagged students for all classes taught by this instructor
    return this.antiProxyService.getFlaggedStudentsByClasses(instructorClassIds);
  }
}
