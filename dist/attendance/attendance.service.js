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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const location_utils_1 = require("../common/utils/location.utils");
const anti_proxy_service_1 = require("./anti-proxy.service");
let AttendanceService = class AttendanceService {
    constructor(prisma, antiProxyService) {
        this.prisma = prisma;
        this.antiProxyService = antiProxyService;
    }
    async getAttendanceRecords(userId) {
        return this.prisma.attendance.findMany({
            where: {
                studentId: userId,
            },
            include: {
                session: {
                    include: {
                        class: {
                            select: {
                                id: true,
                                name: true,
                                subject: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                timestamp: 'desc',
            },
        });
    }
    async markAttendance(markAttendanceDto, userId) {
        const { otp, latitude, longitude, userAgent, screenResolution, deviceModel, osVersion, timezone, language, batteryLevel, isCharging, networkSSID, smsVerificationCode } = markAttendanceDto;
        const session = await this.prisma.session.findFirst({
            where: {
                otp,
                validUntil: {
                    gt: new Date(),
                },
            },
            include: {
                class: true,
            },
        });
        if (!session) {
            throw new common_1.BadRequestException('Invalid or expired OTP');
        }
        const enrollment = await this.prisma.enrollment.findUnique({
            where: {
                studentId_classId: {
                    studentId: userId,
                    classId: session.classId,
                },
            },
        });
        if (!enrollment) {
            throw new common_1.BadRequestException('You are not enrolled in this class');
        }
        const deviceFingerprint = this.antiProxyService.generateDeviceFingerprint({
            deviceModel,
            osVersion,
            userAgent,
            screenResolution,
            timezone,
            language,
            batteryLevel,
            isCharging,
            networkSSID,
        });
        const deviceValidation = await this.antiProxyService.validateDeviceFingerprint(userId, deviceFingerprint);
        const suspiciousAttempts = await this.antiProxyService.trackSuspiciousAttempt(userId, session.id, deviceValidation.riskScore, deviceFingerprint);
        if (suspiciousAttempts.attemptCount >= 3) {
            await this.antiProxyService.flagStudentForInstructor(userId, session.classId, suspiciousAttempts.reasons, deviceValidation.riskScore, suspiciousAttempts.attemptCount);
            throw new common_1.BadRequestException(`Attendance blocked. Multiple suspicious attempts detected. Your instructor has been notified for review.`);
        }
        if (suspiciousAttempts.attemptCount > 0) {
            console.log(`Warning: Suspicious attempt #${suspiciousAttempts.attemptCount} for student ${userId}. Risk Score: ${deviceValidation.riskScore}`);
        }
        const suspiciousActivity = await this.antiProxyService.detectSuspiciousActivity(userId);
        if (suspiciousActivity.isSuspicious && suspiciousActivity.riskLevel === 'high') {
            throw new common_1.BadRequestException(`Attendance blocked due to suspicious activity: ${suspiciousActivity.reasons.join(', ')}. Please contact your instructor.`);
        }
        if (session.class.latitude && session.class.longitude) {
            if (!latitude || !longitude) {
                throw new common_1.BadRequestException('Location permission required. Please enable location services to mark attendance.');
            }
            const isLocationValid = (0, location_utils_1.verifyLocation)(latitude, longitude, session.class.latitude, session.class.longitude, session.class.locationRadius || 50);
            if (!isLocationValid) {
                const R = 6371e3;
                const φ1 = (latitude * Math.PI) / 180;
                const φ2 = (session.class.latitude * Math.PI) / 180;
                const Δφ = ((session.class.latitude - latitude) * Math.PI) / 180;
                const Δλ = ((session.class.longitude - longitude) * Math.PI) / 180;
                const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;
                throw new common_1.BadRequestException(`Location verification failed. ${(0, location_utils_1.getLocationAccuracyMessage)(distance, session.class.locationRadius || 0)}`);
            }
        }
        const existingAttendance = await this.prisma.attendance.findFirst({
            where: {
                studentId: userId,
                sessionId: session.id,
            },
        });
        if (existingAttendance) {
            throw new common_1.BadRequestException('Attendance already marked for this session');
        }
        const attendance = await this.prisma.attendance.create({
            data: {
                studentId: userId,
                sessionId: session.id,
                timestamp: new Date(),
                deviceFingerprint: deviceFingerprint,
                latitude: latitude,
                longitude: longitude,
                userAgent: userAgent,
                screenResolution: screenResolution,
                riskScore: deviceValidation.riskScore,
                isNewDevice: deviceValidation.isNewDevice,
            },
            include: {
                session: {
                    include: {
                        class: {
                            select: {
                                id: true,
                                name: true,
                                subject: true,
                            },
                        },
                    },
                },
            },
        });
        return {
            message: 'Attendance marked successfully',
            data: attendance,
        };
    }
    async getSessionAttendance(sessionId, teacherId) {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                class: {
                    include: {
                        teacher: true,
                    },
                },
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        if (session.class.teacherId !== teacherId) {
            throw new common_1.ForbiddenException('You can only view attendance for your own classes');
        }
        const attendanceRecords = await this.prisma.attendance.findMany({
            where: { sessionId },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { timestamp: 'desc' },
        });
        return {
            session: {
                id: session.id,
                otp: session.otp,
                validUntil: session.validUntil,
                createdAt: session.createdAt,
                class: {
                    id: session.class.id,
                    name: session.class.name,
                    subject: session.class.subject,
                },
            },
            attendanceRecords,
            summary: {
                totalAttended: attendanceRecords.length,
                sessionCreated: session.createdAt,
                sessionValidUntil: session.validUntil,
            },
        };
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        anti_proxy_service_1.AntiProxyService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map