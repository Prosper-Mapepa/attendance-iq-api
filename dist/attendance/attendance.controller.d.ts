import { AttendanceService } from './attendance.service';
import { AntiProxyService } from './anti-proxy.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { ClockOutDto } from './dto/clock-out.dto';
interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        role: string;
    };
}
export declare class AttendanceController {
    private readonly attendanceService;
    private readonly antiProxyService;
    private readonly prisma;
    constructor(attendanceService: AttendanceService, antiProxyService: AntiProxyService, prisma: PrismaService);
    getAttendanceRecords(req: AuthenticatedRequest): Promise<({
        session: {
            class: {
                name: string;
                id: string;
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
        latitude: number | null;
        longitude: number | null;
        sessionId: string;
        studentId: string;
        timestamp: Date;
        clockInTime: Date | null;
        clockOutTime: Date | null;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        location: string | null;
        deviceFingerprint: string | null;
        userAgent: string | null;
        screenResolution: string | null;
        riskScore: number | null;
        isNewDevice: boolean;
    })[]>;
    markAttendance(markAttendanceDto: MarkAttendanceDto, req: AuthenticatedRequest): Promise<{
        message: string;
        data: {
            session: {
                class: {
                    name: string;
                    id: string;
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
            latitude: number | null;
            longitude: number | null;
            sessionId: string;
            studentId: string;
            timestamp: Date;
            clockInTime: Date | null;
            clockOutTime: Date | null;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            location: string | null;
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
    clockOut(clockOutDto: ClockOutDto, req: AuthenticatedRequest): Promise<{
        message: string;
        data: {
            session: {
                class: {
                    name: string;
                    id: string;
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
            latitude: number | null;
            longitude: number | null;
            sessionId: string;
            studentId: string;
            timestamp: Date;
            clockInTime: Date | null;
            clockOutTime: Date | null;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            location: string | null;
            deviceFingerprint: string | null;
            userAgent: string | null;
            screenResolution: string | null;
            riskScore: number | null;
            isNewDevice: boolean;
        };
        timeElapsed: number;
    }>;
    getSessionAttendance(sessionId: string, req: AuthenticatedRequest): Promise<{
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
                name: string;
                email: string;
                id: string;
            };
        } & {
            id: string;
            latitude: number | null;
            longitude: number | null;
            sessionId: string;
            studentId: string;
            timestamp: Date;
            clockInTime: Date | null;
            clockOutTime: Date | null;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            location: string | null;
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
    getSessionStats(sessionId: string, req: AuthenticatedRequest): Promise<{
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
    getFlaggedStudents(classId: string, req: AuthenticatedRequest): Promise<any[]>;
}
export {};
