import { PrismaService } from '../common/prisma/prisma.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { AntiProxyService } from './anti-proxy.service';
export declare class AttendanceService {
    private prisma;
    private antiProxyService;
    constructor(prisma: PrismaService, antiProxyService: AntiProxyService);
    getAttendanceRecords(userId: string): Promise<({
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
        };
    } & {
        id: string;
        latitude: number | null;
        longitude: number | null;
        sessionId: string;
        studentId: string;
        timestamp: Date;
        location: string | null;
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
            };
        } & {
            id: string;
            latitude: number | null;
            longitude: number | null;
            sessionId: string;
            studentId: string;
            timestamp: Date;
            location: string | null;
            deviceFingerprint: string | null;
            userAgent: string | null;
            screenResolution: string | null;
            riskScore: number | null;
            isNewDevice: boolean;
        };
    }>;
    getSessionAttendance(sessionId: string, teacherId: string): Promise<{
        session: {
            id: string;
            otp: string;
            validUntil: Date;
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
            location: string | null;
            deviceFingerprint: string | null;
            userAgent: string | null;
            screenResolution: string | null;
            riskScore: number | null;
            isNewDevice: boolean;
        })[];
        summary: {
            totalAttended: number;
            sessionCreated: Date;
            sessionValidUntil: Date;
        };
    }>;
}
