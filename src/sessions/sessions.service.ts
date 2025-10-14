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
    const { classId, duration } = createSessionDto;

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
    const validUntil = new Date(Date.now() + duration * 60 * 1000); // duration in minutes

    const session = await this.prisma.session.create({
      data: {
        classId,
        otp,
        validUntil,
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
