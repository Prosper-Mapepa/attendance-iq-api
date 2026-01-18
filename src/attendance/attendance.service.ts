import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { ClockOutDto } from './dto/clock-out.dto';
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

    // Check if clock-in deadline has passed
    const currentTime = new Date();
    if (session.clockInDeadline && currentTime > session.clockInDeadline) {
      throw new BadRequestException('Clock-in deadline has passed. You can no longer clock in for this session.');
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

    // Enhanced device validation with location and credential sharing detection
    const deviceValidation = await this.antiProxyService.validateDeviceFingerprint(
      userId,
      deviceFingerprint,
      latitude,
      longitude
    );

    // 2. Track suspicious attempts and flag for instructor with precise reasons
    const suspiciousAttempts = await this.antiProxyService.trackSuspiciousAttempt(
      userId,
      session.id,
      deviceValidation.riskScore,
      deviceFingerprint,
      deviceValidation.reasons
    );

    // More aggressive blocking for credential sharing (2 attempts instead of 3)
    const isCredentialSharing = suspiciousAttempts.reasons.some(r => 
      r.includes('Credential sharing') || 
      r.includes('Same device used by') ||
      r.includes('Possible credential sharing')
    );

    // Block immediately if credential sharing is detected (reduced sensitivity)
    // Only block if risk score is very high (60+) and multiple students using same device
    if (isCredentialSharing && deviceValidation.riskScore >= 60) {
      await this.antiProxyService.flagStudentForInstructor(
        userId,
        session.classId,
        suspiciousAttempts.reasons,
        deviceValidation.riskScore,
        suspiciousAttempts.attemptCount
      );
      
      throw new BadRequestException(
        `Attendance blocked. Credential sharing detected. Your instructor has been notified.`
      );
    }

    // Block after 3 attempts with high risk score (reduced sensitivity)
    if (suspiciousAttempts.attemptCount >= 3 && deviceValidation.riskScore >= 50) {
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

    // Block after 5 attempts regardless of risk score (increased from 3 to reduce false positives)
    if (suspiciousAttempts.attemptCount >= 5) {
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

    // For first attempt, log warning
    if (suspiciousAttempts.attemptCount > 0) {
      console.log(`Warning: Suspicious attempt #${suspiciousAttempts.attemptCount} for student ${userId}. Risk Score: ${deviceValidation.riskScore}. Reasons: ${suspiciousAttempts.reasons.join(', ')}`);
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
        session.class.locationRadius || 30 // Default: 30 feet (stored in feet now)
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
          `Location verification failed. ${getLocationAccuracyMessage(distance, session.class.locationRadius || 30)}`
        );
      }
    }

    // Check if attendance already exists for this session
    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        studentId: userId,
        sessionId: session.id,
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

    if (existingAttendance) {
      // If already clocked in, return the existing record with session info
      if (existingAttendance.status === 'CLOCKED_IN') {
        // Use session from the query result
        const existingSession = existingAttendance.session || session;
        
        // Calculate class end time based on class duration
        const classEndTime = new Date(existingSession.createdAt.getTime() + existingSession.classDuration * 60 * 1000);
        
        return {
          message: 'You are already clocked in. Please wait for class to end to clock out.',
          data: existingAttendance,
          isClockedIn: true,
          sessionEndTime: classEndTime.toISOString(),
          session: {
            id: existingSession.id,
            class: {
              name: existingSession.class.name,
              subject: existingSession.class.subject,
            },
          },
        };
      }
      // If already clocked out, don't allow clocking in again
      throw new BadRequestException('Attendance already completed for this session');
    }

    const clockInTime = new Date();
    // Create attendance record with clock in (CLOCKED_IN status)
    const attendance = await this.prisma.attendance.create({
      data: {
        studentId: userId,
        sessionId: session.id,
        timestamp: clockInTime,
        clockInTime: clockInTime,
        status: 'CLOCKED_IN',
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

    // Calculate class end time based on class duration (class starts when session is created)
    // Class end time = session.createdAt + classDuration (in minutes)
    const classEndTime = new Date(session.createdAt.getTime() + session.classDuration * 60 * 1000);

    return {
      message: 'Clock in successful! Please wait for class to end before clocking out.',
      data: attendance,
      isClockedIn: true,
      sessionEndTime: classEndTime.toISOString(),
      session: {
        id: session.id,
        class: {
          name: session.class.name,
          subject: session.class.subject,
        },
      },
    };
  }

  async clockOut(clockOutDto: ClockOutDto, userId: string) {
    const { otp, latitude, longitude } = clockOutDto;

    // Find the session by OTP
    const session = await this.prisma.session.findFirst({
      where: {
        otp,
      },
      include: {
        class: true,
      },
    });

    if (!session) {
      throw new BadRequestException('Invalid OTP');
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

    // Find existing attendance record
    const attendance = await this.prisma.attendance.findFirst({
      where: {
        studentId: userId,
        sessionId: session.id,
      },
    });

    if (!attendance) {
      throw new BadRequestException('You must clock in before clocking out');
    }

    if (attendance.status === 'CLOCKED_OUT' || attendance.status === 'COMPLETED') {
      throw new BadRequestException('You have already clocked out for this session');
    }

    const now = new Date();
    const clockInTime = attendance.clockInTime || attendance.timestamp;
    const timeElapsed = (now.getTime() - clockInTime.getTime()) / 1000 / 60; // minutes

    // Calculate class end time based on class duration (class starts when session is created)
    const classEndTime = new Date(session.createdAt.getTime() + session.classDuration * 60 * 1000);
    
    // Calculate minimum duration (80% of class duration)
    const minimumDuration = session.classDuration * 0.8; // 80% of class duration
    const classEnded = now >= classEndTime;

    // Validate clock out timing - allow clock out after 80% of class duration OR when class ends
    if (!classEnded && timeElapsed < minimumDuration) {
      const remainingMinutes = Math.ceil(minimumDuration - timeElapsed);
      throw new BadRequestException(
        `You cannot clock out yet. Please wait ${remainingMinutes} more minute(s) or until class ends.`
      );
    }

    // Location verification (if class has location set)
    if (session.class.latitude && session.class.longitude) {
      if (!latitude || !longitude) {
        throw new BadRequestException('Location permission required for clock out.');
      }

      const isLocationValid = verifyLocation(
        latitude,
        longitude,
        session.class.latitude,
        session.class.longitude,
        session.class.locationRadius || 30 // Default: 30 feet (stored in feet now)
      );

      if (!isLocationValid) {
        const R = 6371e3;
        const φ1 = (latitude * Math.PI) / 180;
        const φ2 = (session.class.latitude * Math.PI) / 180;
        const Δφ = ((session.class.latitude - latitude) * Math.PI) / 180;
        const Δλ = ((session.class.longitude - longitude) * Math.PI) / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        throw new BadRequestException(
          `Location verification failed. ${getLocationAccuracyMessage(distance, session.class.locationRadius || 30)}`
        );
      }
    }

    // Update attendance with clock out
    const updatedAttendance = await this.prisma.attendance.update({
      where: {
        id: attendance.id,
      },
      data: {
        clockOutTime: now,
        status: classEnded ? 'COMPLETED' : 'CLOCKED_OUT',
        latitude: latitude || attendance.latitude,
        longitude: longitude || attendance.longitude,
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
      message: 'Clock out successful! Your attendance has been recorded.',
      data: updatedAttendance,
      timeElapsed: Math.round(timeElapsed),
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

    // Count clocked-in students (not yet clocked out)
    const clockedInCount = attendanceRecords.filter(
      record => record.status === 'CLOCKED_IN' || (record.clockInTime && !record.clockOutTime)
    ).length;

    return {
      session: {
        id: session.id,
        otp: session.otp,
        validUntil: session.validUntil,
        clockInDeadline: session.clockInDeadline,
        classDuration: session.classDuration,
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
        clockedInCount,
        completedCount: attendanceRecords.filter(r => r.status === 'COMPLETED').length,
        sessionCreated: session.createdAt,
        sessionValidUntil: session.validUntil,
        clockInDeadline: session.clockInDeadline,
      },
    };
  }

  async getSessionStats(sessionId: string, teacherId: string) {
    // Verify session belongs to teacher
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        class: {
          select: {
            teacherId: true,
          },
        },
        attendance: {
          select: {
            id: true,
            status: true,
            clockInTime: true,
            clockOutTime: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.class.teacherId !== teacherId) {
      throw new ForbiddenException('You can only view stats for your own classes');
    }

    const now = new Date();
    const clockedInCount = session.attendance.filter(
      record => record.status === 'CLOCKED_IN' || (record.clockInTime && !record.clockOutTime)
    ).length;
    const completedCount = session.attendance.filter(r => r.status === 'COMPLETED').length;
    const totalCount = session.attendance.length;

    return {
      sessionId: session.id,
      clockedInCount,
      completedCount,
      totalCount,
      clockInDeadline: session.clockInDeadline,
      clockInDeadlinePassed: session.clockInDeadline ? now > session.clockInDeadline : false,
      classDuration: session.classDuration,
      createdAt: session.createdAt,
      validUntil: session.validUntil,
    };
  }

  async getSessionStatsForStudent(sessionId: string, userId: string) {
    // Verify student is enrolled in the class for this session
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        class: {
          select: {
            id: true,
          },
        },
        attendance: {
          select: {
            id: true,
            status: true,
            clockInTime: true,
            clockOutTime: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Check if student is enrolled
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_classId: {
          studentId: userId,
          classId: session.classId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this class');
    }

    const now = new Date();
    const clockedInCount = session.attendance.filter(
      record => record.status === 'CLOCKED_IN' || (record.clockInTime && !record.clockOutTime)
    ).length;
    const completedCount = session.attendance.filter(r => r.status === 'COMPLETED').length;
    const totalCount = session.attendance.length;

    return {
      sessionId: session.id,
      clockedInCount,
      completedCount,
      totalCount,
      clockInDeadline: session.clockInDeadline,
      clockInDeadlinePassed: session.clockInDeadline ? now > session.clockInDeadline : false,
      classDuration: session.classDuration,
      createdAt: session.createdAt,
      validUntil: session.validUntil,
    };
  }
}
