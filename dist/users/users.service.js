"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const bcrypt = require("bcryptjs");
const uuid_1 = require("uuid");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createUserDto) {
        const { password, ...userData } = createUserDto;
        const passwordHash = await bcrypt.hash(password, 10);
        const qrCode = userData.qrCode || (0, uuid_1.v4)();
        return this.prisma.user.create({
            data: {
                ...userData,
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
    async findOne(id) {
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
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
    async findOneWithPassword(id) {
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
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    async findByQRCode(qrCode) {
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
    async findByResetToken(resetToken) {
        return this.prisma.user.findFirst({
            where: {
                resetToken,
                resetTokenExpiry: {
                    gt: new Date(),
                },
            },
        });
    }
    async updateResetToken(userId, resetToken, resetTokenExpiry) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });
    }
    async updatePassword(userId, passwordHash) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
    }
    async updateEmailVerificationToken(userId, pendingEmail, verificationToken, verificationExpiry) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                pendingEmail: pendingEmail || undefined,
                emailVerificationToken: verificationToken || undefined,
                emailVerificationExpiry: verificationExpiry || undefined,
            },
        });
    }
    async findByEmailVerificationToken(token) {
        return this.prisma.user.findFirst({
            where: {
                emailVerificationToken: token,
                emailVerificationExpiry: {
                    gt: new Date(),
                },
            },
        });
    }
    async verifyAndUpdateEmail(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.pendingEmail || !user.emailVerificationToken) {
            throw new common_1.NotFoundException('No pending email change found');
        }
        const existingUser = await this.findByEmail(user.pendingEmail);
        if (existingUser && existingUser.id !== userId) {
            throw new common_1.NotFoundException('Email is already in use');
        }
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
    async update(id, updateUserDto) {
        const { password, ...updateData } = updateUserDto;
        const data = { ...updateData };
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
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
    async remove(id) {
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
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map