import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { verifyLocation, getLocationAccuracyMessage } from '../common/utils/location.utils';
import { AntiProxyService } from './anti-proxy.service';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private antiProxyService: AntiProxyService
  ) {}

  async getAttendanceRecords(userId: string) {
    // Get attendance records for the user (as a student)
    return this.prisma.attendance.findMany({
      where: {
        studentId: userId,
      },
      include: {
        session: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                subject: true,
              },
            },
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  async markAttendance(markAttendanceDto: MarkAttendanceDto, userId: string) {
    const { 
      otp, 
      latitude, 
      longitude, 
      userAgent, 
      screenResolution,
      deviceModel,
      osVersion,
      timezone,
      language,
      batteryLevel,
      isCharging,
      networkSSID,
      smsVerificationCode
    } = markAttendanceDto;

    // Find the session by OTP
    const session = await this.prisma.session.findFirst({
      where: {
        otp,
        validUntil: {
          gt: new Date(),
        },
      },
      include: {
        class: true,
      },
    });

    if (!session) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Check if student is enrolled in the class
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_classId: {
          studentId: userId,
          classId: session.classId,
        },
      },
    });

    if (!enrollment) {
      throw new BadRequestException('You are not enrolled in this class');
    }

    // Enhanced Anti-Proxy Security Checks
    
    // 1. Device Fingerprinting
    const deviceFingerprint = this.antiProxyService.generateDeviceFingerprint({
      deviceModel,
      osVersion,
      userAgent,
      screenResolution,
      timezone,
      language,
      batteryLevel,
      isCharging,
      networkSSID,
    });

    const deviceValidation = await this.antiProxyService.validateDeviceFingerprint(
      userId,
      deviceFingerprint
    );

    // 2. Track suspicious attempts and flag for instructor
    const suspiciousAttempts = await this.antiProxyService.trackSuspiciousAttempt(
      userId,
      session.id,
      deviceValidation.riskScore,
      deviceFingerprint
    );

    if (suspiciousAttempts.attemptCount >= 3) {
      // Flag student in instructor's dashboard instead of SMS verification
      await this.antiProxyService.flagStudentForInstructor(
        userId,
        session.classId,
        suspiciousAttempts.reasons,
        deviceValidation.riskScore,
        suspiciousAttempts.attemptCount
      );
      
      throw new BadRequestException(
        `Attendance blocked. Multiple suspicious attempts detected. Your instructor has been notified for review.`
      );
    }

    // For first 2 attempts, allow with warning
    if (suspiciousAttempts.attemptCount > 0) {
      console.log(`Warning: Suspicious attempt #${suspiciousAttempts.attemptCount} for student ${userId}. Risk Score: ${deviceValidation.riskScore}`);
    }

    // 3. Detect Suspicious Activity
    const suspiciousActivity = await this.antiProxyService.detectSuspiciousActivity(userId);
    
    if (suspiciousActivity.isSuspicious && suspiciousActivity.riskLevel === 'high') {
      throw new BadRequestException(
        `Attendance blocked due to suspicious activity: ${suspiciousActivity.reasons.join(', ')}. Please contact your instructor.`
      );
    }

    // Location verification (if class has location set)
    if (session.class.latitude && session.class.longitude) {
      if (!latitude || !longitude) {
        throw new BadRequestException('Location permission required. Please enable location services to mark attendance.');
      }

      const isLocationValid = verifyLocation(
        latitude,
        longitude,
        session.class.latitude,
        session.class.longitude,
        session.class.locationRadius || 50
      );

      if (!isLocationValid) {
        // Calculate actual distance using Haversine formula
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (latitude * Math.PI) / 180;
        const φ2 = (session.class.latitude * Math.PI) / 180;
        const Δφ = ((session.class.latitude - latitude) * Math.PI) / 180;
        const Δλ = ((session.class.longitude - longitude) * Math.PI) / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        throw new BadRequestException(
          `Location verification failed. ${getLocationAccuracyMessage(distance, session.class.locationRadius || 0)}`
        );
      }
    }

    // Check if attendance already marked for this session
    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        studentId: userId,
        sessionId: session.id,
      },
    });

    if (existingAttendance) {
      throw new BadRequestException('Attendance already marked for this session');
    }

    // Create attendance record with enhanced security data
    const attendance = await this.prisma.attendance.create({
      data: {
        studentId: userId,
        sessionId: session.id,
        timestamp: new Date(),
        deviceFingerprint: deviceFingerprint,
        latitude: latitude,
        longitude: longitude,
        userAgent: userAgent,
        screenResolution: screenResolution,
        riskScore: deviceValidation.riskScore,
        isNewDevice: deviceValidation.isNewDevice,
      },
      include: {
        session: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                subject: true,
              },
            },
          },
        },
      },
    });

    return {
      message: 'Attendance marked successfully',
      data: attendance,
    };
  }

  async getSessionAttendance(sessionId: string, teacherId: string) {
    // First, verify that the session belongs to a class taught by this teacher
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        class: {
          include: {
            teacher: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.class.teacherId !== teacherId) {
      throw new ForbiddenException('You can only view attendance for your own classes');
    }

    // Get all attendance records for this session
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: { sessionId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return {
      session: {
        id: session.id,
        otp: session.otp,
        validUntil: session.validUntil,
        createdAt: session.createdAt,
        class: {
          id: session.class.id,
          name: session.class.name,
          subject: session.class.subject,
        },
      },
      attendanceRecords,
      summary: {
        totalAttended: attendanceRecords.length,
        sessionCreated: session.createdAt,
        sessionValidUntil: session.validUntil,
      },
    };
  }
}
