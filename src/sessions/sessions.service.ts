import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { ValidateOtpDto } from './dto/validate-otp.dto';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(teacherId: string) {
    return this.prisma.session.findMany({
      where: {
        class: {
          teacherId,
        },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            schedule: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(createSessionDto: CreateSessionDto, teacherId: string) {
    const { classId, duration, classDuration } = createSessionDto;

    // Verify the class belongs to the teacher
    const classExists = await this.prisma.class.findFirst({
      where: {
        id: classId,
        teacherId,
      },
    });

    if (!classExists) {
      throw new NotFoundException('Class not found or access denied');
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const sessionStartTime = new Date();
    // OTP duration = clock-in deadline (students must clock in within this time)
    // OTP expires after the clock-in deadline
    const clockInDeadline = new Date(sessionStartTime.getTime() + duration * 60 * 1000);
    const validUntil = clockInDeadline; // OTP expires when clock-in deadline passes

    const session = await this.prisma.session.create({
      data: {
        classId,
        otp,
        validUntil,
        clockInDeadline,
        classDuration,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            schedule: true,
          },
        },
      },
    });

    return session;
  }

  async validateOtp(validateOtpDto: ValidateOtpDto) {
    const { otp: rawOtp } = validateOtpDto;
    const currentTime = new Date();

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

    const session = await this.prisma.session.findFirst({
      where: {
        otp,
        // OTP is valid if validUntil hasn't passed
        validUntil: {
          gt: currentTime,
        },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
      },
    });

    if (!session) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Also check clock-in deadline for clock-in operations
    if (session.clockInDeadline && currentTime > session.clockInDeadline) {
      throw new BadRequestException('Clock-in deadline has passed. OTP is no longer valid for clock-in.');
    }

    return {
      valid: true,
      session,
    };
  }
}
