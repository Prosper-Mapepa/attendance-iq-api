import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;
    const passwordHash = await bcrypt.hash(password, 10);

    // Ensure qrCode is provided (generate if not provided)
    const qrCode = userData.qrCode || uuidv4();

    return this.prisma.user.create({
      data: {
        ...userData,
        role: userData.role as UserRole,
        qrCode,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        qrCode: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        qrCode: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        qrCode: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findOneWithPassword(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByQRCode(qrCode: string) {
    return this.prisma.user.findUnique({
      where: { qrCode },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        qrCode: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByResetToken(resetToken: string) {
    return this.prisma.user.findFirst({
      where: { 
        resetToken,
        resetTokenExpiry: {
          gt: new Date(), // Token not expired
        },
      },
    });
  }

  async updateResetToken(userId: string, resetToken: string, resetTokenExpiry: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
  }

  async updateEmailVerificationToken(
    userId: string,
    pendingEmail: string | null,
    verificationToken: string | null,
    verificationExpiry: Date | null,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        pendingEmail: pendingEmail || undefined,
        emailVerificationToken: verificationToken || undefined,
        emailVerificationExpiry: verificationExpiry || undefined,
      },
    });
  }

  async findByEmailVerificationToken(token: string) {
    return this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiry: {
          gt: new Date(), // Token not expired
        },
      },
    });
  }

  async verifyAndUpdateEmail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.pendingEmail || !user.emailVerificationToken) {
      throw new NotFoundException('No pending email change found');
    }

    // Check if new email is already taken
    const existingUser = await this.findByEmail(user.pendingEmail);
    if (existingUser && existingUser.id !== userId) {
      throw new NotFoundException('Email is already in use');
    }

    // Update email and clear verification fields
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        email: user.pendingEmail,
        pendingEmail: null,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        qrCode: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { password, ...updateData } = updateUserDto;
    const data: any = { ...updateData };

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        qrCode: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async remove(id: string) {
    const user = await this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        qrCode: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }
}

