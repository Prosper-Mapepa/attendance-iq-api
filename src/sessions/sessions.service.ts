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
    let otp = rawOtp?.trim() || '';
    
    // Try to parse as JSON first (QR codes from web app contain JSON)
    try {
      const jsonData = JSON.parse(rawOtp);
      if (jsonData.otp && typeof jsonData.otp === 'string') {
        otp = jsonData.otp.trim();
      }
    } catch (e) {
      // Not JSON, try other formats
      if (rawOtp.includes('=')) {
        try {
          const urlParams = new URLSearchParams(rawOtp.split('?')[1] || '');
          const urlOtp = urlParams.get('otp') || urlParams.get('OTP');
          if (urlOtp) {
            otp = urlOtp.trim();
          }
        } catch (e) {
          // Ignore URL parsing errors
        }
      }
      
      // Extract 6-digit number if OTP is embedded in text
      const digitMatch = otp.match(/\d{6}/);
      if (digitMatch && digitMatch[0]) {
        otp = digitMatch[0];
      }
    }

    // Validate OTP format (should be 6 digits)
    if (!/^\d{6}$/.test(otp)) {
      throw new BadRequestException('Invalid OTP format. OTP must be a 6-digit number.');
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
