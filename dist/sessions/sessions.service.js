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
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let SessionsService = class SessionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(teacherId) {
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
    async create(createSessionDto, teacherId) {
        const { classId, duration } = createSessionDto;
        const classExists = await this.prisma.class.findFirst({
            where: {
                id: classId,
                teacherId,
            },
        });
        if (!classExists) {
            throw new common_1.NotFoundException('Class not found or access denied');
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const validUntil = new Date(Date.now() + duration * 60 * 1000);
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
    async validateOtp(validateOtpDto) {
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
            throw new common_1.BadRequestException('Invalid or expired OTP');
        }
        return {
            valid: true,
            session,
        };
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map