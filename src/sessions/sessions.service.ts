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
    const { otp } = validateOtpDto;

    const session = await this.prisma.session.findFirst({
      where: {
        otp,
        validUntil: {
          gt: new Date(),
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

    return {
      valid: true,
      session,
    };
  }
}
