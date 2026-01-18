import { PrismaService } from '../common/prisma/prisma.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { AntiProxyService } from './anti-proxy.service';
export declare class AttendanceService {
    private prisma;
    private antiProxyService;
    constructor(prisma: PrismaService, antiProxyService: AntiProxyService);
    getAttendanceRecords(userId: string): Promise<({
        session: {
            class: {
                id: string;
                name: string;
                subject: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            classId: string;
            otp: string;
            validUntil: Date;
            clockInDeadline: Date;
            classDuration: number;
        };
    } & {
        id: string;
        sessionId: string;
        studentId: string;
        timestamp: Date;
        clockInTime: Date | null;
        clockOutTime: Date | null;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        location: string | null;
        latitude: number | null;
        longitude: number | null;
        deviceFingerprint: string | null;
        userAgent: string | null;
        screenResolution: string | null;
        riskScore: number | null;
        isNewDevice: boolean;
    })[]>;
    markAttendance(markAttendanceDto: MarkAttendanceDto, userId: string): Promise<{
        message: string;
        data: {
            session: {
                class: {
                    id: string;
                    name: string;
                    subject: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                classId: string;
                otp: string;
                validUntil: Date;
                clockInDeadline: Date;
                classDuration: number;
            };
        } & {
            id: string;
            sessionId: string;
            studentId: string;
            timestamp: Date;
            clockInTime: Date | null;
            clockOutTime: Date | null;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            location: string | null;
            latitude: number | null;
            longitude: number | null;
            deviceFingerprint: string | null;
            userAgent: string | null;
            screenResolution: string | null;
            riskScore: number | null;
            isNewDevice: boolean;
        };
        isClockedIn: boolean;
        sessionEndTime: string;
        session: {
            id: string;
            class: {
                name: string;
                subject: string;
            };
        };
    }>;
    clockOut(clockOutDto: ClockOutDto, userId: string): Promise<{
        message: string;
        data: {
            session: {
                class: {
                    id: string;
                    name: string;
                    subject: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                classId: string;
                otp: string;
                validUntil: Date;
                clockInDeadline: Date;
                classDuration: number;
            };
        } & {
            id: string;
            sessionId: string;
            studentId: string;
            timestamp: Date;
            clockInTime: Date | null;
            clockOutTime: Date | null;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            location: string | null;
            latitude: number | null;
            longitude: number | null;
            deviceFingerprint: string | null;
            userAgent: string | null;
            screenResolution: string | null;
            riskScore: number | null;
            isNewDevice: boolean;
        };
        timeElapsed: number;
    }>;
    getSessionAttendance(sessionId: string, teacherId: string): Promise<{
        session: {
            id: string;
            otp: string;
            validUntil: Date;
            clockInDeadline: Date;
            classDuration: number;
            createdAt: Date;
            class: {
                id: string;
                name: string;
                subject: string;
            };
        };
        attendanceRecords: ({
            student: {
                id: string;
                name: string;
                email: string;
            };
        } & {
            id: string;
            sessionId: string;
            studentId: string;
            timestamp: Date;
            clockInTime: Date | null;
            clockOutTime: Date | null;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            location: string | null;
            latitude: number | null;
            longitude: number | null;
            deviceFingerprint: string | null;
            userAgent: string | null;
            screenResolution: string | null;
            riskScore: number | null;
            isNewDevice: boolean;
        })[];
        summary: {
            totalAttended: number;
            clockedInCount: number;
            completedCount: number;
            sessionCreated: Date;
            sessionValidUntil: Date;
            clockInDeadline: Date;
        };
    }>;
    getSessionStats(sessionId: string, teacherId: string): Promise<{
        sessionId: string;
        clockedInCount: number;
        completedCount: number;
        totalCount: number;
        clockInDeadline: Date;
        clockInDeadlinePassed: boolean;
        classDuration: number;
        createdAt: Date;
        validUntil: Date;
    }>;
    getSessionStatsForStudent(sessionId: string, userId: string): Promise<{
        sessionId: string;
        clockedInCount: number;
        completedCount: number;
        totalCount: number;
        clockInDeadline: Date;
        clockInDeadlinePassed: boolean;
        classDuration: number;
        createdAt: Date;
        validUntil: Date;
    }>;
}
