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
      otp: rawOtp, 
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

    // Extract OTP from various formats (handles JSON from QR codes, plain OTP, etc.)
    // This robust extraction handles multiple formats to prevent intermittent failures
    let otp = rawOtp?.trim() || '';
    let extractedOtp: string | null = null;
    
    // Method 1: Try to parse as JSON first (QR codes from web app contain JSON)
    try {
      const jsonData = JSON.parse(rawOtp);
      if (jsonData.otp && typeof jsonData.otp === 'string') {
        extractedOtp = jsonData.otp.trim();
      } else if (typeof jsonData === 'string' && /^\d{6}$/.test(jsonData)) {
        // Sometimes the JSON itself is just the OTP string
        extractedOtp = jsonData.trim();
      }
    } catch (e) {
      // Not valid JSON, continue to other methods
    }
    
    // Method 2: Handle URL format like "attendance?otp=123456" or "otp=123456"
    if (!extractedOtp && rawOtp.includes('=')) {
      try {
        // Try as full URL
        if (rawOtp.includes('?')) {
          const urlParams = new URLSearchParams(rawOtp.split('?')[1] || '');
          extractedOtp = urlParams.get('otp') || urlParams.get('OTP') || null;
        } else {
          // Try as query string directly
          const urlParams = new URLSearchParams(rawOtp);
          extractedOtp = urlParams.get('otp') || urlParams.get('OTP') || null;
        }
        if (extractedOtp) {
          extractedOtp = extractedOtp.trim();
        }
      } catch (e) {
        // Ignore URL parsing errors
      }
    }
    
    // Method 3: Extract 6-digit number from anywhere in the string (most robust fallback)
    if (!extractedOtp) {
      const digitMatch = rawOtp.match(/\d{6}/);
      if (digitMatch && digitMatch[0] && /^\d{6}$/.test(digitMatch[0])) {
        extractedOtp = digitMatch[0];
      }
    }
    
    // Method 4: If rawOtp is already a 6-digit number, use it directly
    if (!extractedOtp && /^\d{6}$/.test(rawOtp)) {
      extractedOtp = rawOtp.trim();
    }
    
    // Use extracted OTP if found, otherwise use original (for validation error message)
    otp = extractedOtp || otp;

    // Validate OTP format (should be 6 digits)
    if (!/^\d{6}$/.test(otp)) {
      throw new BadRequestException(`Invalid OTP format. OTP must be a 6-digit number. Received: ${rawOtp?.substring(0, 50)}`);
    }

    // Find the session by OTP
    const currentTime = new Date();
    const session = await this.prisma.session.findFirst({
      where: {
        otp,
        // OTP must be valid (validUntil not passed)
        validUntil: {
          gt: currentTime,
        },
      },
      include: {
        class: true,
      },
    });

    if (!session) {
      throw new BadRequestException('Invalid or expired OTP. Please check the QR code and try again.');
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

    // ANTI-PROXY BLOCKING DISABLED - All blocking checks commented out
    // Log warnings only, but allow attendance to proceed
    
    // Log suspicious activity for monitoring (but don't block)
    if (suspiciousAttempts.attemptCount > 0) {
      console.log(`Info: Suspicious activity detected for student ${userId}. Risk Score: ${deviceValidation.riskScore}. Reasons: ${suspiciousAttempts.reasons.join(', ')}. Attempt #${suspiciousAttempts.attemptCount}. Allowing attendance.`);
    }

    // Detect Suspicious Activity (log only, don't block)
    const suspiciousActivity = await this.antiProxyService.detectSuspiciousActivity(userId);
    
    if (suspiciousActivity.isSuspicious) {
      console.log(`Info: Suspicious activity patterns detected for student ${userId}. Reasons: ${suspiciousActivity.reasons.join(', ')}. Risk Level: ${suspiciousActivity.riskLevel}. Allowing attendance.`);
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
        session.class.locationRadius || 30, // Default: 30 feet (stored in feet now)
        userAgent, // Pass userAgent to detect Android devices
        osVersion  // Pass osVersion to detect Android devices
      );

      if (!isLocationValid) {
        // Calculate actual distance using Haversine formula
        const R = 6371e3; // Earth's radius in meters
        const phi1 = (latitude * Math.PI) / 180;
        const phi2 = (session.class.latitude * Math.PI) / 180;
        const deltaPhi = ((session.class.latitude - latitude) * Math.PI) / 180;
        const deltaLambda = ((session.class.longitude - longitude) * Math.PI) / 180;
        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
          Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        throw new BadRequestException(
          `Location verification failed. ${getLocationAccuracyMessage(distance, session.class.locationRadius || 30, userAgent, osVersion)}`
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

    // Return response with only necessary fields to avoid serialization issues
    return {
      message: 'Clock in successful! Please wait for class to end before clocking out.',
      data: {
        id: attendance.id,
        studentId: attendance.studentId,
        sessionId: attendance.sessionId,
        status: attendance.status,
        timestamp: attendance.timestamp,
        clockInTime: attendance.clockInTime,
        clockOutTime: attendance.clockOutTime,
        latitude: attendance.latitude,
        longitude: attendance.longitude,
        session: attendance.session ? {
          id: attendance.session.id,
          class: attendance.session.class ? {
            id: attendance.session.class.id,
            name: attendance.session.class.name,
            subject: attendance.session.class.subject,
          } : null,
        } : null,
      },
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
    const { otp: rawOtp, latitude, longitude, userAgent, osVersion } = clockOutDto;

    // Extract OTP from various formats (handles JSON from QR codes, plain OTP, etc.)
    // This robust extraction handles multiple formats to prevent intermittent failures
    let otp = rawOtp?.trim() || '';
    let extractedOtp: string | null = null;
    
    // Method 1: Try to parse as JSON first (QR codes from web app contain JSON)
    try {
      const jsonData = JSON.parse(rawOtp);
      if (jsonData.otp && typeof jsonData.otp === 'string') {
        extractedOtp = jsonData.otp.trim();
      } else if (typeof jsonData === 'string' && /^\d{6}$/.test(jsonData)) {
        // Sometimes the JSON itself is just the OTP string
        extractedOtp = jsonData.trim();
      }
    } catch (e) {
      // Not valid JSON, continue to other methods
    }
    
    // Method 2: Handle URL format like "attendance?otp=123456" or "otp=123456"
    if (!extractedOtp && rawOtp.includes('=')) {
      try {
        // Try as full URL
        if (rawOtp.includes('?')) {
          const urlParams = new URLSearchParams(rawOtp.split('?')[1] || '');
          extractedOtp = urlParams.get('otp') || urlParams.get('OTP') || null;
        } else {
          // Try as query string directly
          const urlParams = new URLSearchParams(rawOtp);
          extractedOtp = urlParams.get('otp') || urlParams.get('OTP') || null;
        }
        if (extractedOtp) {
          extractedOtp = extractedOtp.trim();
        }
      } catch (e) {
        // Ignore URL parsing errors
      }
    }
    
    // Method 3: Extract 6-digit number from anywhere in the string (most robust fallback)
    if (!extractedOtp) {
      const digitMatch = rawOtp.match(/\d{6}/);
      if (digitMatch && digitMatch[0] && /^\d{6}$/.test(digitMatch[0])) {
        extractedOtp = digitMatch[0];
      }
    }
    
    // Method 4: If rawOtp is already a 6-digit number, use it directly
    if (!extractedOtp && /^\d{6}$/.test(rawOtp)) {
      extractedOtp = rawOtp.trim();
    }
    
    // Use extracted OTP if found, otherwise use original (for validation error message)
    otp = extractedOtp || otp;

    // Validate OTP format (should be 6 digits)
    if (!/^\d{6}$/.test(otp)) {
      throw new BadRequestException(`Invalid OTP format. OTP must be a 6-digit number. Received: ${rawOtp?.substring(0, 50)}`);
    }

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
        session.class.locationRadius || 30, // Default: 30 feet (stored in feet now)
        userAgent, // Pass userAgent to detect Android devices
        osVersion  // Pass osVersion to detect Android devices
      );

      if (!isLocationValid) {
        const R = 6371e3;
        const phi1 = (latitude * Math.PI) / 180;
        const phi2 = (session.class.latitude * Math.PI) / 180;
        const deltaPhi = ((session.class.latitude - latitude) * Math.PI) / 180;
        const deltaLambda = ((session.class.longitude - longitude) * Math.PI) / 180;
        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
          Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        throw new BadRequestException(
          `Location verification failed. ${getLocationAccuracyMessage(distance, session.class.locationRadius || 30, userAgent, osVersion)}`
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
