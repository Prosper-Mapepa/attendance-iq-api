import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as crypto from 'crypto';

interface DeviceFingerprint {
  deviceModel?: string;
  osVersion?: string;
  userAgent?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  batteryLevel?: number;
  isCharging?: boolean;
  networkSSID?: string;
}

interface SMSVerification {
  studentId: string;
  sessionId: string;
  code: string;
  expiresAt: Date;
  attempts: number;
}

interface SuspiciousAttempt {
  studentId: string;
  sessionId: string;
  riskScore: number;
  timestamp: Date;
  deviceFingerprint: string;
  reasons: string[];
}

interface SuspiciousAttemptResult {
  attemptCount: number;
  reasons: string[];
}

@Injectable()
export class AntiProxyService {
  private smsVerifications = new Map<string, SMSVerification>();
  private suspiciousAttempts = new Map<string, SuspiciousAttempt[]>();

  constructor(private prisma: PrismaService) {}

  /**
   * Extract attempt count from notes string
   */
  private extractAttemptCountFromNotes(notes: string | null): number {
    if (!notes) return 0;
    
    // Look for pattern like "after X suspicious attempts"
    const match = notes.match(/after (\d+) suspicious attempts?/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    
    // Fallback: look for "X attempts" pattern
    const fallbackMatch = notes.match(/(\d+) attempts?/i);
    if (fallbackMatch) {
      return parseInt(fallbackMatch[1], 10);
    }
    
    return 0;
  }

  /**
   * Generate a unique device fingerprint hash
   */
  generateDeviceFingerprint(deviceData: DeviceFingerprint): string {
    const fingerprintData = {
      deviceModel: deviceData.deviceModel || 'unknown',
      osVersion: deviceData.osVersion || 'unknown',
      userAgent: deviceData.userAgent || 'unknown',
      screenResolution: deviceData.screenResolution || 'unknown',
      timezone: deviceData.timezone || 'unknown',
      language: deviceData.language || 'unknown',
    };

    const fingerprintString = JSON.stringify(fingerprintData);
    return crypto.createHash('sha256').update(fingerprintString).digest('hex');
  }

  /**
   * Check if device fingerprint matches previous records
   * Enhanced with credential sharing detection
   */
  async validateDeviceFingerprint(
    userId: string,
    deviceFingerprint: string,
    latitude?: number,
    longitude?: number
  ): Promise<{ isValid: boolean; isNewDevice: boolean; riskScore: number; reasons: string[] }> {
    const reasons: string[] = [];
    
    // Get user's previous device fingerprints
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        attendance: {
          take: 20,
          orderBy: { timestamp: 'desc' },
          select: {
            deviceFingerprint: true,
            timestamp: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if this is a new device
    const isNewDevice = !user.attendance.some(
      (record) => record.deviceFingerprint === deviceFingerprint
    );

    // CREDENTIAL SHARING DETECTION: Check if same device is used by multiple students
    const sameDeviceUsers = await this.prisma.attendance.findMany({
      where: {
        deviceFingerprint: deviceFingerprint,
        studentId: { not: userId }, // Different students using same device
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Within last hour
        },
      },
      select: {
        studentId: true,
        timestamp: true,
      },
      distinct: ['studentId'],
    });

    // Calculate risk score (0-100, higher = more risky)
    let riskScore = 0;

    // Device-related checks
    if (isNewDevice) {
      riskScore += 25; // New device is moderately risky
      reasons.push('New device detected');
    }

    // CREDENTIAL SHARING: Same device used by multiple students (high risk)
    if (sameDeviceUsers.length > 0) {
      riskScore += 50; // Very high risk - likely credential sharing
      reasons.push(`Same device used by ${sameDeviceUsers.length} other student(s) recently - Possible credential sharing`);
    }

    // Check for rapid device changes (multiple devices in short time)
    const recentFingerprints = user.attendance
      .filter(
        (record) =>
          record.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      )
      .map((record) => record.deviceFingerprint);

    const uniqueRecentFingerprints = new Set(recentFingerprints);
    if (uniqueRecentFingerprints.size > 3) {
      riskScore += 35; // Multiple devices in short period
      reasons.push(`Using ${uniqueRecentFingerprints.size} different devices in 7 days`);
    } else if (uniqueRecentFingerprints.size > 2 && !isNewDevice) {
      riskScore += 20; // Moderate device switching
    }

    // Check for simultaneous clock-ins from different locations (credential sharing indicator)
    if (latitude && longitude) {
      const recentAttendance = user.attendance.filter(
        (record) =>
          record.timestamp > new Date(Date.now() - 30 * 60 * 1000) && // Last 30 minutes
          record.latitude &&
          record.longitude
      );

      if (recentAttendance.length > 0) {
        // Calculate distance between current and previous locations
        const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
          const R = 6371e3; // Earth's radius in meters
          const φ1 = lat1 * Math.PI / 180;
          const φ2 = lat2 * Math.PI / 180;
          const Δφ = (lat2 - lat1) * Math.PI / 180;
          const Δλ = (lon2 - lon1) * Math.PI / 180;

          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

          return R * c; // Distance in meters
        };

        const latestAttendance = recentAttendance[0];
        if (latestAttendance.latitude && latestAttendance.longitude) {
          const distance = calculateDistance(
            latitude,
            longitude,
            latestAttendance.latitude,
            latestAttendance.longitude
          );

          // If student "moved" more than 500 meters in less than 5 minutes, it's suspicious
          const timeDiff = Date.now() - latestAttendance.timestamp.getTime();
          if (distance > 500 && timeDiff < 5 * 60 * 1000) {
            riskScore += 40;
            reasons.push(`Impossible location change: ${Math.round(distance)}m in ${Math.round(timeDiff/1000)}s - Possible credential sharing`);
          } else if (distance > 1000 && timeDiff < 10 * 60 * 1000) {
            riskScore += 25;
            reasons.push(`Rapid location change: ${Math.round(distance)}m`);
          }
        }
      }
    }

    // Check for attendance patterns
    const recentAttendanceCount = user.attendance.filter(
      (record) =>
        record.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    ).length;

    if (recentAttendanceCount > 6) {
      riskScore += 15; // Too many attendance marks in short time
      reasons.push(`Unusual activity: ${recentAttendanceCount} clock-ins in 24 hours`);
    }

    // Check for pattern where user consistently uses different devices (credential sharing pattern)
    if (uniqueRecentFingerprints.size >= 3 && user.attendance.length >= 5) {
      const deviceFrequency = new Map<string, number>();
      recentFingerprints.forEach(fp => {
        deviceFrequency.set(fp, (deviceFrequency.get(fp) || 0) + 1);
      });
      
      // If no device is used more than twice, it's suspicious
      const maxUsage = Math.max(...Array.from(deviceFrequency.values()));
      if (maxUsage <= 2 && uniqueRecentFingerprints.size >= 3) {
        riskScore += 30;
        reasons.push('Device switching pattern suggests credential sharing');
      }
    }

    const isValid = riskScore < 60; // Lowered threshold for stricter validation

    return {
      isValid,
      isNewDevice,
      riskScore: Math.min(riskScore, 100),
      reasons: reasons.length > 0 ? reasons : [],
    };
  }

  /**
   * Generate and send SMS verification code
   */
  async generateSMSVerification(
    studentId: string,
    sessionId: string,
    phoneNumber?: string
  ): Promise<{ code: string; expiresIn: number }> {
    // Get student's phone number if not provided
    let studentPhone = phoneNumber;
    if (!studentPhone) {
      const student = await this.prisma.user.findUnique({
        where: { id: studentId },
        select: { email: true }, // In real implementation, add phone field
      });

      if (!student) {
        throw new BadRequestException('Student not found');
      }

      // For demo purposes, use email as phone (in real app, add phone field)
      studentPhone = student.email;
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store verification with 5-minute expiration
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    this.smsVerifications.set(`${studentId}-${sessionId}`, {
      studentId,
      sessionId,
      code,
      expiresAt,
      attempts: 0,
    });

    // In a real implementation, send SMS here
    console.log(`SMS sent to ${studentPhone}: Your AttendIQ verification code is ${code}`);

    return {
      code,
      expiresIn: 300, // 5 minutes
    };
  }

  /**
   * Verify SMS code
   */
  async verifySMSCode(
    studentId: string,
    sessionId: string,
    providedCode: string
  ): Promise<{ isValid: boolean; attemptsRemaining: number }> {
    const key = `${studentId}-${sessionId}`;
    const verification = this.smsVerifications.get(key);

    if (!verification) {
      throw new BadRequestException('No verification code found');
    }

    if (verification.expiresAt < new Date()) {
      this.smsVerifications.delete(key);
      throw new BadRequestException('Verification code expired');
    }

    verification.attempts += 1;

    if (verification.attempts > 3) {
      this.smsVerifications.delete(key);
      throw new BadRequestException('Too many failed attempts');
    }

    const isValid = verification.code === providedCode;

    if (isValid) {
      this.smsVerifications.delete(key);
    } else {
      this.smsVerifications.set(key, verification);
    }

    return {
      isValid,
      attemptsRemaining: 3 - verification.attempts,
    };
  }

  /**
   * Check for suspicious attendance patterns
   */
  async detectSuspiciousActivity(studentId: string): Promise<{
    isSuspicious: boolean;
    reasons: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Get recent attendance records
    const recentAttendance = await this.prisma.attendance.findMany({
      where: {
        studentId,
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        session: {
          include: {
            class: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Check for multiple attendance marks in short time
    const rapidAttendance = recentAttendance.filter((record, index) => {
      if (index === 0) return false;
      const timeDiff = record.timestamp.getTime() - recentAttendance[index - 1].timestamp.getTime();
      return timeDiff < 2 * 60 * 1000; // Less than 2 minutes apart
    });

    if (rapidAttendance.length > 0) {
      reasons.push('Multiple attendance marks in short time period');
      riskScore += 30;
    }

    // Check for attendance from different locations
    const uniqueLocations = new Set(
      recentAttendance
        .map((record) => `${record.latitude},${record.longitude}`)
        .filter((loc) => loc !== 'undefined,undefined')
    );

    if (uniqueLocations.size > 3) {
      reasons.push('Attendance marked from multiple locations');
      riskScore += 25;
    }

    // Check for unusual timing patterns
    const attendanceHours = recentAttendance.map((record) => record.timestamp.getHours());
    const uniqueHours = new Set(attendanceHours);

    if (uniqueHours.size > 8) {
      reasons.push('Attendance marked at unusual hours');
      riskScore += 20;
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (riskScore >= 50) {
      riskLevel = 'high';
    } else if (riskScore >= 25) {
      riskLevel = 'medium';
    }

    return {
      isSuspicious: riskScore >= 25,
      reasons,
      riskLevel,
    };
  }

  /**
   * Generate live photo verification challenge
   */
  generatePhotoChallenge(): {
    gesture: string;
    instruction: string;
    expiresIn: number;
  } {
    const gestures = [
      { gesture: 'fingers_3', instruction: 'Hold up 3 fingers' },
      { gesture: 'fingers_5', instruction: 'Hold up 5 fingers' },
      { gesture: 'thumbs_up', instruction: 'Give a thumbs up' },
      { gesture: 'peace_sign', instruction: 'Make a peace sign' },
      { gesture: 'ok_sign', instruction: 'Make an OK sign' },
    ];

    const randomGesture = gestures[Math.floor(Math.random() * gestures.length)];

    return {
      gesture: randomGesture.gesture,
      instruction: randomGesture.instruction,
      expiresIn: 60, // 1 minute to complete
    };
  }

  /**
   * Validate live photo verification
   */
  async validatePhotoChallenge(
    studentId: string,
    gesture: string,
    photoData: string // Base64 encoded photo
  ): Promise<{ isValid: boolean; confidence: number }> {
    // In a real implementation, this would use AI/ML to:
    // 1. Detect if the photo shows a real person (not a photo of a photo)
    // 2. Verify the requested gesture is present
    // 3. Check if the face matches the student's registered photo
    // 4. Ensure the photo was taken recently (not a saved photo)

    // For demo purposes, simulate validation
    const isValid = Math.random() > 0.3; // 70% success rate for demo
    const confidence = Math.random() * 40 + 60; // 60-100% confidence

    return {
      isValid,
      confidence,
    };
  }

  /**
   * Track suspicious attendance attempts
   * Enhanced with precise flagging
   */
  async trackSuspiciousAttempt(
    studentId: string,
    sessionId: string,
    riskScore: number,
    deviceFingerprint?: string,
    validationReasons?: string[]
  ): Promise<SuspiciousAttemptResult> {
    const key = `${studentId}-${sessionId}`;
    const now = new Date();
    
    // Get existing attempts for this student-session combination
    const existingAttempts = this.suspiciousAttempts.get(key) || [];
    
    // Generate precise reasons based on risk score, validation reasons, and patterns
    const reasons: string[] = [];
    
    // Use validation reasons if provided (more precise)
    if (validationReasons && validationReasons.length > 0) {
      reasons.push(...validationReasons);
    } else {
      // Fallback to risk-score based reasons (less precise)
      if (riskScore >= 50) {
        reasons.push('Credential sharing detected');
      } else if (riskScore >= 40) {
        reasons.push('Same device used by multiple students');
      } else if (riskScore >= 30) {
        reasons.push('Multiple device usage detected');
      } else if (riskScore >= 25) {
        reasons.push('New device detected');
      }
    }
    
    // Add attempt-specific reasons
    if (existingAttempts.length >= 1) {
      reasons.push('Repeated suspicious attempts');
    }
    
    // Check for credential sharing pattern: same device used for multiple students in same session
    if (deviceFingerprint) {
      const simultaneousUsers = await this.prisma.attendance.findMany({
        where: {
          deviceFingerprint: deviceFingerprint,
          sessionId: sessionId,
          studentId: { not: studentId },
          timestamp: {
            gte: new Date(Date.now() - 10 * 60 * 1000), // Within last 10 minutes
          },
        },
        select: {
          studentId: true,
        },
        distinct: ['studentId'],
      });

      if (simultaneousUsers.length > 0 && !reasons.some(r => r.includes('Credential sharing'))) {
        reasons.push(`Credential sharing: Same device used by ${simultaneousUsers.length + 1} student(s) in this session`);
      }
    }
    
    // Create new attempt record
    const newAttempt: SuspiciousAttempt = {
      studentId,
      sessionId,
      riskScore,
      timestamp: now,
      deviceFingerprint: deviceFingerprint || '',
      reasons: [...new Set(reasons)], // Remove duplicates
    };
    
    // Add to attempts (keep only last 10 attempts for better tracking)
    const updatedAttempts = [...existingAttempts, newAttempt].slice(-10);
    this.suspiciousAttempts.set(key, updatedAttempts);
    
    // Calculate total risk score based on all attempts
    const totalRiskScore = Math.min(100, riskScore + (existingAttempts.length * 8));
    
    return {
      attemptCount: updatedAttempts.length,
      reasons: [...new Set(reasons)], // Return unique reasons
    };
  }

  /**
   * Flag student for instructor review
   */
  async flagStudentForInstructor(
    studentId: string,
    classId: string,
    reasons: string[],
    riskScore: number,
    attemptCount: number = 1
  ): Promise<void> {
    // Get student and class information
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: { name: true, email: true },
    });

    const classInfo = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { teacher: { select: { name: true, email: true } } },
    });

    if (!student || !classInfo) {
      throw new Error('Student or class not found');
    }

    // Log the flag for instructor dashboard
    console.log(`🚨 FLAGGED STUDENT: ${student.name} (${student.email})`);
    console.log(`📚 Class: ${classInfo.name} (${classInfo.subject})`);
    console.log(`👨‍🏫 Instructor: ${classInfo.teacher.name} (${classInfo.teacher.email})`);
    console.log(`⚠️ Reasons: ${reasons.join(', ')}`);
    console.log(`📊 Risk Score: ${riskScore}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    
    // Create a flag record in database
    try {
      await this.prisma.flaggedStudent.upsert({
        where: {
          studentId_classId: {
            studentId: studentId,
            classId: classId,
          },
        },
        update: {
          reasons: reasons,
          riskScore: riskScore,
          flaggedAt: new Date(),
          status: 'PENDING',
          resolvedAt: null,
          resolvedBy: null,
          notes: `Updated: Student flagged after ${attemptCount} suspicious attempts. Activities: ${reasons.join(', ')}. Risk score: ${riskScore}.`,
        },
        create: {
          studentId: studentId,
          classId: classId,
          reasons: reasons,
          riskScore: riskScore,
          status: 'PENDING',
          notes: `Student flagged after ${attemptCount} suspicious attempts. Activities: ${reasons.join(', ')}. Risk score: ${riskScore}.`,
        },
      });
      
      console.log(`✅ Flag created in database for instructor review`);
    } catch (error) {
      console.error('Error creating flag record:', error);
      throw error;
    }
  }

  /**
   * Get flagged students for instructor dashboard
   */
  async getFlaggedStudents(classId?: string): Promise<any[]> {
    const whereClause = classId ? { classId: classId } : {};
    
    const flaggedStudents = await this.prisma.flaggedStudent.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
      },
      orderBy: {
        flaggedAt: 'desc',
      },
    });

    return flaggedStudents.map(flag => ({
      id: flag.id,
      studentId: flag.studentId,
      studentName: flag.student.name,
      studentEmail: flag.student.email,
      classId: flag.classId,
      className: flag.class.name,
      subject: flag.class.subject,
      reasons: flag.reasons,
      riskScore: flag.riskScore,
      attemptCount: this.extractAttemptCountFromNotes(flag.notes), // Extract actual attempt count from notes
      flaggedAt: flag.flaggedAt,
      status: flag.status.toLowerCase(),
      resolvedAt: flag.resolvedAt,
      notes: flag.notes,
      isSuspicious: flag.reasons.length > 0, // True if there are suspicious activities
      showDetails: false, // Default to collapsed state
    }));
  }

  /**
   * Get flagged students filtered by multiple class IDs (for instructor-specific view)
   */
  async getFlaggedStudentsByClasses(classIds: string[]): Promise<any[]> {
    const flaggedStudents = await this.prisma.flaggedStudent.findMany({
      where: {
        classId: {
          in: classIds,
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
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
      },
      orderBy: {
        flaggedAt: 'desc',
      },
    });

    return flaggedStudents.map(flag => ({
      id: flag.id,
      studentId: flag.studentId,
      studentName: flag.student.name,
      studentEmail: flag.student.email,
      classId: flag.classId,
      className: flag.class.name,
      subject: flag.class.subject,
      reasons: flag.reasons,
      riskScore: flag.riskScore,
      attemptCount: this.extractAttemptCountFromNotes(flag.notes), // Extract actual attempt count from notes
      flaggedAt: flag.flaggedAt,
      status: flag.status.toLowerCase(),
      resolvedAt: flag.resolvedAt,
      notes: flag.notes,
      isSuspicious: flag.reasons.length > 0, // True if there are suspicious activities
      showDetails: false, // Default to collapsed state
    }));
  }
}
