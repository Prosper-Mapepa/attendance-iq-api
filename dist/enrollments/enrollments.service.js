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
exports.EnrollmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let EnrollmentsService = class EnrollmentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async enrollInClass(studentId, classId) {
        const classExists = await this.prisma.class.findUnique({
            where: { id: classId },
            include: { teacher: { select: { id: true, name: true, email: true } } },
        });
        if (!classExists) {
            throw new common_1.NotFoundException('Class not found');
        }
        const existingEnrollment = await this.prisma.enrollment.findUnique({
            where: {
                studentId_classId: {
                    studentId,
                    classId,
                },
            },
        });
        if (existingEnrollment) {
            throw new common_1.ConflictException('Already enrolled in this class');
        }
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
    async getStudentEnrollments(studentId) {
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
    async unenrollFromClass(studentId, classId) {
        const enrollment = await this.prisma.enrollment.findUnique({
            where: {
                studentId_classId: {
                    studentId,
                    classId,
                },
            },
        });
        if (!enrollment) {
            throw new common_1.NotFoundException('Enrollment not found');
        }
        await this.prisma.enrollment.delete({
            where: { id: enrollment.id },
        });
        return { message: 'Successfully unenrolled from class' };
    }
    async getAvailableClasses(studentId) {
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
};
exports.EnrollmentsService = EnrollmentsService;
exports.EnrollmentsService = EnrollmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EnrollmentsService);
//# sourceMappingURL=enrollments.service.js.map