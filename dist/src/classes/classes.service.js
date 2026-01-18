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
exports.ClassesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let ClassesService = class ClassesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createClassDto, teacherId) {
        return this.prisma.class.create({
            data: {
                ...createClassDto,
                teacherId: teacherId,
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
        });
    }
    async findAll(teacherId) {
        const where = teacherId ? { teacherId } : {};
        return this.prisma.class.findMany({
            where,
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                sessions: {
                    select: {
                        id: true,
                        otp: true,
                        validUntil: true,
                        createdAt: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });
    }
    async findOne(id, teacherId) {
        const where = { id };
        if (teacherId) {
            where.teacherId = teacherId;
        }
        const classData = await this.prisma.class.findFirst({
            where,
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                sessions: {
                    select: {
                        id: true,
                        otp: true,
                        validUntil: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!classData) {
            throw new common_1.NotFoundException(`Class with ID ${id} not found`);
        }
        return classData;
    }
    async update(id, updateClassDto, teacherId) {
        await this.findOne(id, teacherId);
        return this.prisma.class.update({
            where: { id },
            data: updateClassDto,
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }
    async remove(id, teacherId) {
        await this.findOne(id, teacherId);
        return this.prisma.class.delete({
            where: { id },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }
    async getClassDetails(id, teacherId) {
        const classItem = await this.prisma.class.findFirst({
            where: { id, teacherId },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (!classItem) {
            throw new common_1.NotFoundException('Class not found or access denied');
        }
        const sessions = await this.prisma.session.findMany({
            where: { classId: id },
            orderBy: { createdAt: 'desc' },
        });
        const attendanceRecords = await this.prisma.attendance.findMany({
            where: {
                session: {
                    classId: id,
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
                session: {
                    select: {
                        id: true,
                        otp: true,
                        createdAt: true,
                        validUntil: true,
                    },
                },
            },
            orderBy: { timestamp: 'desc' },
        });
        const enrolledStudents = await this.prisma.enrollment.findMany({
            where: { classId: id },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { enrolledAt: 'desc' },
        });
        const totalSessions = sessions.length;
        const totalAttendanceRecords = attendanceRecords.length;
        const totalEnrolledStudents = enrolledStudents.length;
        const averageAttendancePerSession = totalSessions > 0 ? totalAttendanceRecords / totalSessions : 0;
        const recentSessions = sessions.slice(0, 5).map(session => ({
            id: session.id,
            otp: session.otp,
            createdAt: session.createdAt,
            validUntil: session.validUntil,
            attendanceCount: attendanceRecords.filter(record => record.sessionId === session.id).length,
        }));
        const studentAttendanceStats = enrolledStudents.map(enrollment => {
            const studentAttendance = attendanceRecords.filter(record => record.studentId === enrollment.student.id);
            return {
                student: enrollment.student,
                totalAttendance: studentAttendance.length,
                attendanceRate: totalSessions > 0 ? (studentAttendance.length / totalSessions) * 100 : 0,
                lastAttendance: studentAttendance.length > 0 ? studentAttendance[0].timestamp : null,
            };
        });
        return {
            class: classItem,
            statistics: {
                totalSessions,
                totalAttendanceRecords,
                totalEnrolledStudents,
                averageAttendancePerSession: Math.round(averageAttendancePerSession * 100) / 100,
            },
            recentSessions,
            enrolledStudents: enrolledStudents.map(e => e.student),
            studentAttendanceStats,
            recentAttendanceRecords: attendanceRecords.slice(0, 10),
        };
    }
};
exports.ClassesService = ClassesService;
exports.ClassesService = ClassesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClassesService);
//# sourceMappingURL=classes.service.js.map