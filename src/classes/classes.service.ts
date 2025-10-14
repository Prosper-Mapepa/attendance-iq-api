import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async create(createClassDto: CreateClassDto, teacherId: string) {
    return this.prisma.class.create({
      data: {
        ...createClassDto,
        teacherId: teacherId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(teacherId?: string) {
    const where = teacherId ? { teacherId } : {};
    
    return this.prisma.class.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sessions: {
          select: {
            id: true,
            otp: true,
            validUntil: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async findOne(id: string, teacherId?: string) {
    const where: any = { id };
    if (teacherId) {
      where.teacherId = teacherId;
    }

    const classData = await this.prisma.class.findFirst({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sessions: {
          select: {
            id: true,
            otp: true,
            validUntil: true,
            createdAt: true,
          },
        },
      },
    });

    if (!classData) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    return classData;
  }

  async update(id: string, updateClassDto: UpdateClassDto, teacherId: string) {
    // Check if class exists and belongs to teacher
    await this.findOne(id, teacherId);

    return this.prisma.class.update({
      where: { id },
      data: updateClassDto,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string, teacherId: string) {
    // Check if class exists and belongs to teacher
    await this.findOne(id, teacherId);

    return this.prisma.class.delete({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getClassDetails(id: string, teacherId: string) {
    // Get class with teacher info
    const classItem = await this.prisma.class.findFirst({
      where: { id, teacherId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!classItem) {
      throw new NotFoundException('Class not found or access denied');
    }

    // Get all sessions for this class
    const sessions = await this.prisma.session.findMany({
      where: { classId: id },
      orderBy: { createdAt: 'desc' },
    });

    // Get all attendance records for this class
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: {
        session: {
          classId: id,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        session: {
          select: {
            id: true,
            otp: true,
            createdAt: true,
            validUntil: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Get enrolled students
    const enrolledStudents = await this.prisma.enrollment.findMany({
      where: { classId: id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    // Calculate statistics
    const totalSessions = sessions.length;
    const totalAttendanceRecords = attendanceRecords.length;
    const totalEnrolledStudents = enrolledStudents.length;
    
    // Calculate average attendance per session
    const averageAttendancePerSession = totalSessions > 0 ? totalAttendanceRecords / totalSessions : 0;
    
    // Get recent sessions (last 5)
    const recentSessions = sessions.slice(0, 5).map(session => ({
      id: session.id,
      otp: session.otp,
      createdAt: session.createdAt,
      validUntil: session.validUntil,
      attendanceCount: attendanceRecords.filter(record => record.sessionId === session.id).length,
    }));

    // Get attendance by student
    const studentAttendanceStats = enrolledStudents.map(enrollment => {
      const studentAttendance = attendanceRecords.filter(record => record.studentId === enrollment.student.id);
      return {
        student: enrollment.student,
        totalAttendance: studentAttendance.length,
        attendanceRate: totalSessions > 0 ? (studentAttendance.length / totalSessions) * 100 : 0,
        lastAttendance: studentAttendance.length > 0 ? studentAttendance[0].timestamp : null,
      };
    });

    return {
      class: classItem,
      statistics: {
        totalSessions,
        totalAttendanceRecords,
        totalEnrolledStudents,
        averageAttendancePerSession: Math.round(averageAttendancePerSession * 100) / 100,
      },
      recentSessions,
      enrolledStudents: enrolledStudents.map(e => e.student),
      studentAttendanceStats,
      recentAttendanceRecords: attendanceRecords.slice(0, 10), // Last 10 attendance records
    };
  }
}

