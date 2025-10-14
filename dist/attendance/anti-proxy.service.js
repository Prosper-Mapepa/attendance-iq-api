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
exports.AntiProxyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const crypto = require("crypto");
let AntiProxyService = class AntiProxyService {
    constructor(prisma) {
        this.prisma = prisma;
        this.smsVerifications = new Map();
        this.suspiciousAttempts = new Map();
    }
    extractAttemptCountFromNotes(notes) {
        if (!notes)
            return 0;
        const match = notes.match(/after (\d+) suspicious attempts?/i);
        if (match) {
            return parseInt(match[1], 10);
        }
        const fallbackMatch = notes.match(/(\d+) attempts?/i);
        if (fallbackMatch) {
            return parseInt(fallbackMatch[1], 10);
        }
        return 0;
    }
    generateDeviceFingerprint(deviceData) {
        const fingerprintData = {
            deviceModel: deviceData.deviceModel || 'unknown',
            osVersion: deviceData.osVersion || 'unknown',
            userAgent: deviceData.userAgent || 'unknown',
            screenResolution: deviceData.screenResolution || 'unknown',
            timezone: deviceData.timezone || 'unknown',
            language: deviceData.language || 'unknown',
        };
        const fingerprintString = JSON.stringify(fingerprintData);
        return crypto.createHash('sha256').update(fingerprintString).digest('hex');
    }
    async validateDeviceFingerprint(userId, deviceFingerprint) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                attendance: {
                    take: 10,
                    orderBy: { timestamp: 'desc' },
                    select: {
                        deviceFingerprint: true,
                        timestamp: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const isNewDevice = !user.attendance.some((record) => record.deviceFingerprint === deviceFingerprint);
        let riskScore = 0;
        if (isNewDevice) {
            riskScore += 30;
        }
        const recentFingerprints = user.attendance
            .filter((record) => record.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
            .map((record) => record.deviceFingerprint);
        const uniqueRecentFingerprints = new Set(recentFingerprints);
        if (uniqueRecentFingerprints.size > 2) {
            riskScore += 40;
        }
        const recentAttendanceCount = user.attendance.filter((record) => record.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;
        if (recentAttendanceCount > 5) {
            riskScore += 20;
        }
        const isValid = riskScore < 70;
        return {
            isValid,
            isNewDevice,
            riskScore: Math.min(riskScore, 100),
        };
    }
    async generateSMSVerification(studentId, sessionId, phoneNumber) {
        let studentPhone = phoneNumber;
        if (!studentPhone) {
            const student = await this.prisma.user.findUnique({
                where: { id: studentId },
                select: { email: true },
            });
            if (!student) {
                throw new common_1.BadRequestException('Student not found');
            }
            studentPhone = student.email;
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        this.smsVerifications.set(`${studentId}-${sessionId}`, {
            studentId,
            sessionId,
            code,
            expiresAt,
            attempts: 0,
        });
        console.log(`SMS sent to ${studentPhone}: Your AttendIQ verification code is ${code}`);
        return {
            code,
            expiresIn: 300,
        };
    }
    async verifySMSCode(studentId, sessionId, providedCode) {
        const key = `${studentId}-${sessionId}`;
        const verification = this.smsVerifications.get(key);
        if (!verification) {
            throw new common_1.BadRequestException('No verification code found');
        }
        if (verification.expiresAt < new Date()) {
            this.smsVerifications.delete(key);
            throw new common_1.BadRequestException('Verification code expired');
        }
        verification.attempts += 1;
        if (verification.attempts > 3) {
            this.smsVerifications.delete(key);
            throw new common_1.BadRequestException('Too many failed attempts');
        }
        const isValid = verification.code === providedCode;
        if (isValid) {
            this.smsVerifications.delete(key);
        }
        else {
            this.smsVerifications.set(key, verification);
        }
        return {
            isValid,
            attemptsRemaining: 3 - verification.attempts,
        };
    }
    async detectSuspiciousActivity(studentId) {
        const reasons = [];
        let riskScore = 0;
        const recentAttendance = await this.prisma.attendance.findMany({
            where: {
                studentId,
                timestamp: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
            },
            include: {
                session: {
                    include: {
                        class: true,
                    },
                },
            },
            orderBy: {
                timestamp: 'desc',
            },
        });
        const rapidAttendance = recentAttendance.filter((record, index) => {
            if (index === 0)
                return false;
            const timeDiff = record.timestamp.getTime() - recentAttendance[index - 1].timestamp.getTime();
            return timeDiff < 2 * 60 * 1000;
        });
        if (rapidAttendance.length > 0) {
            reasons.push('Multiple attendance marks in short time period');
            riskScore += 30;
        }
        const uniqueLocations = new Set(recentAttendance
            .map((record) => `${record.latitude},${record.longitude}`)
            .filter((loc) => loc !== 'undefined,undefined'));
        if (uniqueLocations.size > 3) {
            reasons.push('Attendance marked from multiple locations');
            riskScore += 25;
        }
        const attendanceHours = recentAttendance.map((record) => record.timestamp.getHours());
        const uniqueHours = new Set(attendanceHours);
        if (uniqueHours.size > 8) {
            reasons.push('Attendance marked at unusual hours');
            riskScore += 20;
        }
        let riskLevel = 'low';
        if (riskScore >= 50) {
            riskLevel = 'high';
        }
        else if (riskScore >= 25) {
            riskLevel = 'medium';
        }
        return {
            isSuspicious: riskScore >= 25,
            reasons,
            riskLevel,
        };
    }
    generatePhotoChallenge() {
        const gestures = [
            { gesture: 'fingers_3', instruction: 'Hold up 3 fingers' },
            { gesture: 'fingers_5', instruction: 'Hold up 5 fingers' },
            { gesture: 'thumbs_up', instruction: 'Give a thumbs up' },
            { gesture: 'peace_sign', instruction: 'Make a peace sign' },
            { gesture: 'ok_sign', instruction: 'Make an OK sign' },
        ];
        const randomGesture = gestures[Math.floor(Math.random() * gestures.length)];
        return {
            gesture: randomGesture.gesture,
            instruction: randomGesture.instruction,
            expiresIn: 60,
        };
    }
    async validatePhotoChallenge(studentId, gesture, photoData) {
        const isValid = Math.random() > 0.3;
        const confidence = Math.random() * 40 + 60;
        return {
            isValid,
            confidence,
        };
    }
    async trackSuspiciousAttempt(studentId, sessionId, riskScore, deviceFingerprint) {
        const key = `${studentId}-${sessionId}`;
        const now = new Date();
        const existingAttempts = this.suspiciousAttempts.get(key) || [];
        const reasons = [];
        if (riskScore > 20)
            reasons.push('New device detected');
        if (riskScore > 40)
            reasons.push('Multiple device usage');
        if (riskScore > 60)
            reasons.push('Suspicious location');
        if (riskScore > 80)
            reasons.push('High risk patterns');
        if (existingAttempts.length > 0) {
            reasons.push('Repeated suspicious attempts');
        }
        const newAttempt = {
            studentId,
            sessionId,
            riskScore,
            timestamp: now,
            deviceFingerprint: deviceFingerprint || '',
            reasons,
        };
        const updatedAttempts = [...existingAttempts, newAttempt].slice(-10);
        this.suspiciousAttempts.set(key, updatedAttempts);
        const totalRiskScore = Math.min(100, riskScore + (existingAttempts.length * 10));
        return {
            attemptCount: updatedAttempts.length,
            reasons,
        };
    }
    async flagStudentForInstructor(studentId, classId, reasons, riskScore, attemptCount = 1) {
        const student = await this.prisma.user.findUnique({
            where: { id: studentId },
            select: { name: true, email: true },
        });
        const classInfo = await this.prisma.class.findUnique({
            where: { id: classId },
            include: { teacher: { select: { name: true, email: true } } },
        });
        if (!student || !classInfo) {
            throw new Error('Student or class not found');
        }
        console.log(`🚨 FLAGGED STUDENT: ${student.name} (${student.email})`);
        console.log(`📚 Class: ${classInfo.name} (${classInfo.subject})`);
        console.log(`👨‍🏫 Instructor: ${classInfo.teacher.name} (${classInfo.teacher.email})`);
        console.log(`⚠️ Reasons: ${reasons.join(', ')}`);
        console.log(`📊 Risk Score: ${riskScore}`);
        console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
        try {
            await this.prisma.flaggedStudent.upsert({
                where: {
                    studentId_classId: {
                        studentId: studentId,
                        classId: classId,
                    },
                },
                update: {
                    reasons: reasons,
                    riskScore: riskScore,
                    flaggedAt: new Date(),
                    status: 'PENDING',
                    resolvedAt: null,
                    resolvedBy: null,
                    notes: `Updated: Student flagged after ${attemptCount} suspicious attempts. Activities: ${reasons.join(', ')}. Risk score: ${riskScore}.`,
                },
                create: {
                    studentId: studentId,
                    classId: classId,
                    reasons: reasons,
                    riskScore: riskScore,
                    status: 'PENDING',
                    notes: `Student flagged after ${attemptCount} suspicious attempts. Activities: ${reasons.join(', ')}. Risk score: ${riskScore}.`,
                },
            });
            console.log(`✅ Flag created in database for instructor review`);
        }
        catch (error) {
            console.error('Error creating flag record:', error);
            throw error;
        }
    }
    async getFlaggedStudents(classId) {
        const whereClause = classId ? { classId: classId } : {};
        const flaggedStudents = await this.prisma.flaggedStudent.findMany({
            where: whereClause,
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                class: {
                    select: {
                        id: true,
                        name: true,
                        subject: true,
                    },
                },
            },
            orderBy: {
                flaggedAt: 'desc',
            },
        });
        return flaggedStudents.map(flag => ({
            id: flag.id,
            studentId: flag.studentId,
            studentName: flag.student.name,
            studentEmail: flag.student.email,
            classId: flag.classId,
            className: flag.class.name,
            subject: flag.class.subject,
            reasons: flag.reasons,
            riskScore: flag.riskScore,
            attemptCount: this.extractAttemptCountFromNotes(flag.notes),
            flaggedAt: flag.flaggedAt,
            status: flag.status.toLowerCase(),
            resolvedAt: flag.resolvedAt,
            notes: flag.notes,
            isSuspicious: flag.reasons.length > 0,
            showDetails: false,
        }));
    }
    async getFlaggedStudentsByClasses(classIds) {
        const flaggedStudents = await this.prisma.flaggedStudent.findMany({
            where: {
                classId: {
                    in: classIds,
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
                class: {
                    select: {
                        id: true,
                        name: true,
                        subject: true,
                    },
                },
            },
            orderBy: {
                flaggedAt: 'desc',
            },
        });
        return flaggedStudents.map(flag => ({
            id: flag.id,
            studentId: flag.studentId,
            studentName: flag.student.name,
            studentEmail: flag.student.email,
            classId: flag.classId,
            className: flag.class.name,
            subject: flag.class.subject,
            reasons: flag.reasons,
            riskScore: flag.riskScore,
            attemptCount: this.extractAttemptCountFromNotes(flag.notes),
            flaggedAt: flag.flaggedAt,
            status: flag.status.toLowerCase(),
            resolvedAt: flag.resolvedAt,
            notes: flag.notes,
            isSuspicious: flag.reasons.length > 0,
            showDetails: false,
        }));
    }
};
exports.AntiProxyService = AntiProxyService;
exports.AntiProxyService = AntiProxyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AntiProxyService);
//# sourceMappingURL=anti-proxy.service.js.map