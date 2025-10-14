import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async enrollInClass(studentId: string, classId: string) {
    // Check if class exists
    const classExists = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { teacher: { select: { id: true, name: true, email: true } } },
    });

    if (!classExists) {
      throw new NotFoundException('Class not found');
    }

    // Check if already enrolled
    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_classId: {
          studentId,
          classId,
        },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('Already enrolled in this class');
    }

    // Create enrollment
    const enrollment = await this.prisma.enrollment.create({
      data: {
        studentId,
        classId,
      },
      include: {
        class: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return enrollment;
  }

  async getStudentEnrollments(studentId: string) {
    return this.prisma.enrollment.findMany({
      where: { studentId },
      include: {
        class: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async unenrollFromClass(studentId: string, classId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_classId: {
          studentId,
          classId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    await this.prisma.enrollment.delete({
      where: { id: enrollment.id },
    });

    return { message: 'Successfully unenrolled from class' };
  }

  async getAvailableClasses(studentId: string) {
    // Get classes that the student is not enrolled in
    const enrolledClassIds = await this.prisma.enrollment.findMany({
      where: { studentId },
      select: { classId: true },
    });

    const enrolledIds = enrolledClassIds.map(e => e.classId);

    return this.prisma.class.findMany({
      where: {
        id: {
          notIn: enrolledIds,
        },
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
      orderBy: { createdAt: 'desc' },
    });
  }
}
